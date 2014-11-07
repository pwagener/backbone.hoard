'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');
var Strategy = require('./strategy');
var StrategyHelpers = require('./strategy-helpers');

// The `Read` Strategy keeps a hash, `this.placeholders` of cache keys for which it is currently retrieving data.
// Only one request, the 'live' request, for a given key will actually go through to retrieve the data from its source,
// be it a cache hit (read from storage), or a cache miss (read from the server).
// The remaining requests, the 'placeholder' requests', will receive the data once the live request responds.
var Read = Strategy.extend({
  initialize: function (options) {
    this.placeholders = {};
  },

  execute: function (model, options) {
    var key = this.policy.getKey(model, 'read');

    // If a placeholder is hit, then a request has already been made for this key
    // Resolve when that request has returned
    if (this.placeholders[key]) {
      return this._onPlaceholderHit(key, options);
    } else {
      // If a placeholder is not found, then check the store for that key
      // If the key is found in
      var executionPromise = this.store.get(key).then(
        _.bind(this.onCacheHit, this, key, model, options),
        _.bind(this.onCacheMiss, this, key, model, options)
      );

      // This is the first access, add a placeholder to signify that this key is in the process of being fetched
      // `accesses` refers to the number of current live requests for this key
      // `promise` will be resolved with the key's data if the retrieval is successful,
      // or rejected with an error otherwise
      this.placeholders[key] = {
        accesses: 1,
        promise: executionPromise
      };

      return executionPromise;
    }
  },

  // On a cache hit, first check to see if the cached item should be evicted (e.g. the cache has expired).
  // If the item should be evicted, do so, and proceed as a cache miss.
  // Otherwise, remove this request from the placeholder access and resolve the promise with the cached item
  onCacheHit: function (key, model, options, cachedItem) {
    return this.store.getMetadata(key, options).then(_.bind(function (meta) {
      if (this.policy.shouldEvictItem(meta)) {
        return this.store.invalidate(key).then(_.bind(function () {
          return this.onCacheMiss(key, model, options);
        }, this));
      } else {
        this._decreasePlaceholderAccess(key);
        if (options.success) {
          options.success(cachedItem);
        }
        return cachedItem;
      }
    }, this));
  },

  // On a cache miss, fetch the data using `Hoard.sync` and cache it on success/invalidate on failure.
  // Clears it's placeholder access only after storing or invalidating the response
  onCacheMiss: function (key, model, options) {
    var onStoreAction = _.bind(this._decreasePlaceholderAccess, this, key);
    var cacheOptions = _.extend({ onStoreAction: onStoreAction }, options);
    var onSuccess = this._wrapSuccessWithCache('read', model, cacheOptions);
    var onError = this._wrapErrorWithInvalidate('read', model, cacheOptions);
    var deferred = Hoard.defer();

    options.success = this._responseHandler(deferred.resolve, onSuccess);
    options.error = this._responseHandler(deferred.reject, onError);
    Hoard.sync('read', model, options);
    return deferred.promise;
  },

  // On a placeholder hit, wait for the live request to go through,
  // then resolve or reject with the response from the live request
  _onPlaceholderHit: function (key, options) {
    var deferred = Hoard.defer();
    var onSuccess = this._responseHandler(deferred.resolve, options.success, key);
    var onError = this._responseHandler(deferred.reject, options.error, key);

    this.placeholders[key].accesses += 1;
    this.placeholders[key].promise.then(onSuccess, onError);
    return deferred.promise;
  },

  // A convenience method for creating handlers for cache misses and placeholder hits
  _responseHandler: function (promiseFactory, originalHandler, key) {
    return _.bind(function (response) {
      if (originalHandler) {
        originalHandler(response);
      }
      if (key) {
        this._decreasePlaceholderAccess(key);
      }
      promiseFactory(response);
    }, this);
  },

  // A convenience method for decrementing the count for a placeholder
  // and deleting the placeholder if nothing is currently accessing it
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