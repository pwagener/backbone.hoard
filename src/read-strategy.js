'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');
var Strategy = require('./strategy');
var StrategyHelpers = require('./strategy-helpers');

var placeholderInvalidateWrap = function (key, fn) {
  return function () {
    delete this.placeholders[key];
    fn();
  };
};

var Read = Strategy.extend({
  initialize: function (options) {
    this.placeholders = {};
  },

  placeholderTimeToLive: 8 * 1000,

  execute: function (model, options) {
    var key = this.policy.getKey(model, 'read');

    return this.store.get(key).then(
      _.bind(this.onCacheHit, this, key, model, options),
      _.bind(this.onCacheMiss, this, key, model, options)
    );
  },

  onCacheHit: function (key, model, options, cachedItem) {
    return this.store.getMetadata(key, options).then(_.bind(function (meta) {
      if (this.policy.shouldEvictItem(meta)) {
        return this.store.invalidate(key).then(_.bind(function () {
          return this.onCacheMiss(key, model, options);
        }, this));
      } else {
        return this._onFullCacheHit(cachedItem, options);
      }
    }, this));
  },

  onCacheMiss: function (key, model, options) {
    if (this.placeholders[key]) {
      if (Date.now() > this.placeholders[key].expires) {
        delete this.placeholders[key];
      } else {
        return this._onPlaceholderHit(key, options);
      }
    }

    var onSuccess = this._wrapSuccessWithCache('read', model, options);
    options.success = _.bind(function () {
      delete this.placeholders[key];
      onSuccess.apply(null, arguments);
    }, this);

    var onError = this._wrapErrorWithInvalidate('read', model, options);
    options.error = _.bind(function () {
      delete this.placeholders[key];
      onError.apply(null, arguments);
    }, this);

    this.placeholders[key] = { expires: Date.now() + this.placeholderTimeToLive };
    return Hoard.sync('read', model, options);
  },

  _onPlaceholderHit: function (key, options) {
    var deferred = Hoard.defer();
    var successEvent = StrategyHelpers.getSyncSuccessEvent(key);
    var errorEvent = StrategyHelpers.getSyncErrorEvent(key);

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
      var itemData = item;
      if (options.success) {
        options.success(itemData);
      }
      return itemData;
  },

  _wrapSuccessWithCache: StrategyHelpers.proxyWrapSuccessWithCache,
  _wrapErrorWithInvalidate: StrategyHelpers.proxyWrapErrorWithInvalidate
});

module.exports = Read;