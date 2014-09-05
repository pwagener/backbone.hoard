'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var Hoard;

var mergeOptions = ['storeClass', 'policyClass'];

var Control = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions), {
    storeClass: Hoard.Store,
    policyClass: Hoard.Policy
  });
  this.store = new this.storeClass(options);
  var optionsWithStore = _.extend({}, options, { store: this.store });
  this.policy = new this.policyClass(optionsWithStore);
  this.initialize.apply(this, arguments);
};

var methodHandlers = {
  'create': 'onCreate',
  'update': 'onUpdate',
  'patch': 'onPatch',
  'delete': 'onDelete',
  'read': 'onRead'
};

_.extend(Control.prototype, Backbone.Events, {
  initialize: function () {},

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
    var key = this.policy.getKey(model, 'read');
    var cachedItem = this.store.get(key);
    var guardedItem = this.policy.enforceCacheLifetime(key, cachedItem);

    if (guardedItem === null) {
      return this.onReadCacheMiss(key, model, options);
    } else if (guardedItem.placeholder) {
      return this.onReadCachePlaceholderHit(key, options);
    } else {
      return this.onReadCacheHit(guardedItem, options);
    }
  },

  onReadCacheMiss: function (key, model, options) {
    this.store.set(key, { placeholder: true });
    options.error = this.wrapErrorWithInvalidate(key, model, options);
    options.success = this.wrapSuccessWithCache(key, model, options);
    return model.sync('read', model, options);
  },

  onReadCachePlaceholderHit: function (key, options) {
    var deferred = Hoard.deferred();
    var successEvent = this.getCacheSuccessEvent(key);
    var errorEvent = this.getCacheErrorEvent(key);

    var onSuccess = function (response) {
      if (options.success) {
        options.success(response);
      }
      this.off(errorEvent, onError);
      Hoard.resolveDeferred(deferred, response);
    };

    var onError = function (response) {
      if (options.error) {
        options.error(response);
      }
      this.off(successEvent, onSuccess);
      Hoard.resolveDeferred(deferred, response);
    };

    this.once(successEvent, onSuccess);
    this.once(errorEvent, onError);
    return deferred.promise;
  },

  onReadCacheHit: function (item, options) {
    var deferred = Hoard.deferred();
    Hoard.resolveDeferred(deferred, item);
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
      self.store.invalidate(key);
      self.trigger(self.getCacheErrorEvent(key));
    });
  },

  storeResponse: function (key, response, options) {
    var meta = this.policy.getMetadata(key, response, options);
    var entry = { data: response, meta: meta };
    this.store.set(key, entry);
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
    var key = this.policy.getKey(model, method);
    options.success = this.wrapSuccessWithCache(key, model, options);
    return model.sync(method, model, options);
  },

  onDelete: function (model, options) {
    var key = this.policy.getKey(model, 'delete');
    this.store.invalidate(key);
    return model.sync('delete', model, options);
  }
});

Control.extend = Backbone.Model.extend;

module.exports = {
  initialize: function (config) {
    Hoard = config;
    return Control;
  }
};