'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var HoardConfig;

var mergeOptions = ['backend'];

var CacheControl = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions));
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

  invalidateCache: function (key) {
    this.backend.removeItem(key);
  },

  sync: function (method, model, options) {
    var handlerName = methodHandlers[method];
    return this[handlerName](model, options);
  },

  onRead: function (model, options) {
    var key = this.getCacheKey(model, 'read');
    var item = JSON.parse(this.backend.getItem(key));

    if (item === null) {
      return this.onReadCacheMiss(key, model, options);
    } else if (item.placeholder) {
      return this.onReadCachePlaceholderHit(key, options);
    } else {
      return this.onReadCacheHit(item, options);
    }
  },

  onReadCacheMiss: function (key, model, options) {
    this.backend.setItem(key, JSON.stringify({ placeholder: true }));
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
      self.storeResponse(key, response);
    });
  },

  wrapErrorWithInvalidate: function (key, model, options) {
    var self = this;
    return _.wrap(options.error, function (onError, response) {
      if (onError) {
        onError(response);
      }
      self.invalidateCache(key);
      self.trigger(self.getCacheErrorEvent(key));
    });
  },

  storeResponse: function (key, response) {
    var entry = { data: response };
    this.backend.setItem(key, JSON.stringify(entry));
    this.trigger(this.getCacheSuccessEvent(key), response);
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
    this.invalidateCache(key);
    return model.sync('delete', model, options);
  }
});

CacheControl.extend = Backbone.Model.extend;

module.exports = {
  initialize: function (config) {
    HoardConfig = config;
    CacheControl.prototype.backend = HoardConfig.backend;
    return CacheControl;
  }
};