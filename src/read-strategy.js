'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');
var Strategy = require('./strategy');
var StrategyHelpers = require('./strategy-helpers');

var Read = Strategy.extend({
  initialize: function (options) {
    this.placeholders = {};
  },

  execute: function (model, options) {
    var key = this.policy.getKey(model, 'read');

    if (this.placeholders[key]) {
      return this._onPlaceholderHit(key, options);
    } else {
      var executionPromise = this.store.get(key).then(
        _.bind(this.onCacheHit, this, key, model, options),
        _.bind(this.onCacheMiss, this, key, model, options)
      );

      this.placeholders[key] = {
        accesses: 1,
        promise: executionPromise
      };

      return executionPromise;
    }
  },

  onCacheHit: function (key, model, options, cachedItem) {
    return this.store.getMetadata(key, options).then(_.bind(function (meta) {
      if (this.policy.shouldEvictItem(meta)) {
        return this.store.invalidate(key).then(_.bind(function () {
          return this.onCacheMiss(key, model, options);
        }, this));
      } else {
        this._decreasePlaceholderAccess(key);
        return this._onFullCacheHit(cachedItem, options);
      }
    }, this));
  },

  onCacheMiss: function (key, model, options) {
    var deferred = Hoard.defer();

    var cacheOptions = _.extend({
      onStoreActionComplete: _.bind(this._decreasePlaceholderAccess, this, key)
    }, options);

    var onSuccess = this._wrapSuccessWithCache('read', model, cacheOptions);
    options.success = _.bind(function (response) {
      onSuccess.apply(null, arguments);
      deferred.resolve(response);
    }, this);

    var onError = this._wrapErrorWithInvalidate('read', model, cacheOptions);
    options.error = _.bind(function (response) {
      onError.apply(null, arguments);
      deferred.reject(response);
    }, this);

    Hoard.sync('read', model, options);
    return deferred.promise;
  },

  _onPlaceholderHit: function (key, options) {
    var deferred = Hoard.defer();
    this.placeholders[key].accesses += 1;

    var onSuccess = _.bind(function (response) {
      if (options.success) {
        options.success(response);
      }
      this._decreasePlaceholderAccess(key);
      deferred.resolve(response);
    }, this);

    var onError = _.bind(function (response) {
      if (options.error) {
        options.error(response);
      }
      this._decreasePlaceholderAccess(key);
      deferred.reject(response);
    }, this);

    this.placeholders[key].promise.then(onSuccess, onError);
    return deferred.promise;
  },

  _onFullCacheHit: function (item, options) {
      var itemData = item;
      if (options.success) {
        options.success(itemData);
      }
      return itemData;
  },

  _decreasePlaceholderAccess: function (key) {
    this.placeholders[key].accesses -= 1;
    if (!this.placeholders[key].accesses) {
      delete this.placeholders[key];
    }
  },

  _wrapSuccessWithCache: StrategyHelpers.proxyWrapSuccessWithCache,
  _wrapErrorWithInvalidate: StrategyHelpers.proxyWrapErrorWithInvalidate
});

module.exports = Read;