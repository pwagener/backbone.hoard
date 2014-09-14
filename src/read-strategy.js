'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');
var Strategy = require('./strategy');
var StrategyHelpers = require('./strategy-helpers');

var promiseWrapResponse = function (method, promise) {
  return function (response) {
    return promise.then(function () {
      return method(response);
    });
  };
};

var Read = Strategy.extend({
  execute: function (model, options) {
    var key = this.policy.getKey(model, 'read');
    return this.store.get(key).then(
      _.bind(this.onCacheHit, this, key, model, options),
      _.bind(this.onCacheMiss, this, key, model, options)
    );
  },

  onCacheHit: function (key, model, options, cachedItem) {
      if (this.policy.shouldEvictItem(cachedItem)) {
        return this.store.invalidate(key).then(_.bind(function () {
            return this.onCacheMiss(key, model, options);
          }, this));
      } else if (cachedItem.placeholder) {
        return this._onPlaceholderHit(key, options);
      } else {
        return this._onFullCacheHit(cachedItem, options);
      }
  },

  onCacheMiss: function (key, model, options) {
    var setPromise = this.store.set(key, { placeholder: true });
    var success = this._wrapSuccessWithCache('read', model, options);
    var error = this._wrapErrorWithInvalidate('read', model, options);
    options.success = promiseWrapResponse(success, setPromise);
    options.error = promiseWrapResponse(error, setPromise);
    return model.sync('read', model, options);
  },

  _onPlaceholderHit: function (key, options) {
    var deferred = Hoard.deferred();
    var successEvent = StrategyHelpers.getCacheSuccessEvent(key);
    var errorEvent = StrategyHelpers.getCacheErrorEvent(key);

    var onSuccess = function (response) {
      if (options.success) {
        options.success(response);
      }
      this.off(errorEvent, onError);
      deferred.resolve(response);
    };

    var onError = function (response) {
      if (options.error) {
        options.error(response);
      }
      this.off(successEvent, onSuccess);
      deferred.reject(response);
    };

    this.once(successEvent, onSuccess);
    this.once(errorEvent, onError);
    return deferred.promise;
  },

  _onFullCacheHit: function (item, options) {
      var itemData = item.data;
      if (options.success) {
        options.success(itemData);
      }
      return itemData;
  },

  _wrapSuccessWithCache: StrategyHelpers.proxyWrapSuccessWithCache,
  _wrapErrorWithInvalidate: StrategyHelpers.proxyWrapErrorWithInvalidate
});

module.exports = Read;