'use strict';

var _ = require('underscore');
var CacheStore = require('src/cache-store');
var CacheControl = require('src/cache-control');

module.exports = {
  resolveDeferred: function (deferred, value) {
    return deferred.resolve(value);
  },

  rejectDeferred: function (deferred, error) {
    return deferred.reject(error);
  },

  initialize: function (options) {
    _.extend(this, options);

    if (!this.backend) {
      throw new TypeError("A 'backend' property matching the localStorage api must be provided");
    }

    if (!this.deferred) {
      throw new TypeError("A 'deferred' property of type " +
        "() -> { promise: A+ thenable } must be provided");
    }

    this.CacheStore = CacheStore.initialize(this);
    this.CacheControl = CacheControl.initialize(this);
    return this;
  }
};
