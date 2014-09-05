'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var HoardConfig;

var mergeOptions = ['cacheStoreClass', 'expires', 'timeToLive'];

var CacheControl = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions), {
    cacheStoreClass: HoardConfig.CacheStore
  });
  this.cacheStore = new this.cacheStoreClass(options);
  this.initialize.apply(this, arguments);
};

var methodHandlers = {
  'create': 'onCreate',
  'update': 'onUpdate',
  'patch': 'onPatch',
  'delete': 'onDelete',
  'read': 'onRead'
};

_.extend(CacheControl.prototype, Backbone.Events, {
  initialize: function () {},

  getCacheKey: function (model, method) {
    return _.result(model, 'url');
  },

  getCacheSuccessEvent: function (key) {
    return 'cache:success:' + key;
  },

  getCacheErrorEvent: function (key) {
    return 'cache:error:' + key;
  },

  sync: function (method, model, options) {
    var handlerName = methodHandlers[method];
    return this[handlerName](model, options);
  },

  onRead: function (model, options) {
    var key = this.getCacheKey(model, 'read');
    var cachedItem = this.cacheStore.get(key);
    var guardedItem = this.enforceCacheLifetime(key, cachedItem);

    if (guardedItem === null) {
      return this.onReadCacheMiss(key, model, options);
    } else if (guardedItem.placeholder) {
      return this.onReadCachePlaceholderHit(key, options);
    } else {
      return this.onReadCacheHit(guardedItem, options);
    }
  },

  enforceCacheLifetime: function (key, cacheItem) {
    if (cacheItem == null) {
      return null;
    }

    var meta = cacheItem.meta || {};
    if (meta.expires != null && meta.expires < Date.now()) {
      this.cacheStore.invalidate(key);
      return null;
    } else {
      return cacheItem;
    }
  },

  onReadCacheMiss: function (key, model, options) {
    this.cacheStore.set(key, { placeholder: true });
    options.error = this.wrapErrorWithInvalidate(key, model, options);
    options.success = this.wrapSuccessWithCache(key, model, options);
    return model.sync('read', model, options);
  },

  onReadCachePlaceholderHit: function (key, options) {
    var deferred = HoardConfig.deferred();
    var successEvent = this.getCacheSuccessEvent(key);
    var errorEvent = this.getCacheErrorEvent(key);

    var onSuccess = function (response) {
      if (options.success) {
        options.success(response);
      }
      this.off(errorEvent, onError);
      HoardConfig.resolveDeferred(deferred, response);
    };

    var onError = function (response) {
      if (options.error) {
        options.error(response);
      }
      this.off(successEvent, onSuccess);
      HoardConfig.resolveDeferred(deferred, response);
    };

    this.once(successEvent, onSuccess);
    this.once(errorEvent, onError);
    return deferred.promise;
  },

  onReadCacheHit: function (item, options) {
    var deferred = HoardConfig.deferred();
    HoardConfig.resolveDeferred(deferred, item);
    return deferred.promise.then(function (item) {
      var itemData = item.data;
      if (options.success) {
        options.success(itemData);
      }
      return itemData;
    });
  },

  wrapSuccessWithCache: function (key, model, options) {
    var self = this;
    return _.wrap(options.success, function (onSuccess, response) {
      if (onSuccess) {
        onSuccess(response);
      }
      self.storeResponse(key, response, options);
    });
  },

  wrapErrorWithInvalidate: function (key, model, options) {
    var self = this;
    return _.wrap(options.error, function (onError, response) {
      if (onError) {
        onError(response);
      }
      self.cacheStore.invalidate(key);
      self.trigger(self.getCacheErrorEvent(key));
    });
  },

  storeResponse: function (key, response, options) {
    var meta = this.getMetadata(key, response, options);
    var entry = { data: response, meta: meta };
    this.cacheStore.set(key, entry);
    this.trigger(this.getCacheSuccessEvent(key), response);
  },

  getMetadata: function (key, response, options) {
    options = options || {};
    var meta = {};
    var expires = options.expires || this.expires;
    var ttl = options.timeToLive || this.timeToLive;
    if (ttl != null && expires == null) {
      expires = Date.now() + ttl;
    }
    if (expires != null) {
      meta.expires = expires;
    }

    return meta;
  },

  onCreate: function (model, options) {
    return this.cacheSuccess('create', model, options);
  },

  onUpdate: function (model, options) {
    return this.cacheSuccess('update', model, options);
  },

  onPatch: function (model, options) {
    return this.cacheSuccess('patch', model, options);
  },

  cacheSuccess: function (method, model, options) {
    var key = this.getCacheKey(model, method);
    options.success = this.wrapSuccessWithCache(key, model, options);
    return model.sync(method, model, options);
  },

  onDelete: function (model, options) {
    var key = this.getCacheKey(model, 'delete');
    this.cacheStore.invalidate(key);
    return model.sync('delete', model, options);
  }
});

CacheControl.extend = Backbone.Model.extend;

module.exports = {
  initialize: function (config) {
    HoardConfig = config;
    return CacheControl;
  }
};