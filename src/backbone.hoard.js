'use strict';

var _ = require('underscore');
var Store = require('src/store');
var Policy = require('src/policy');
var Control = require('src/control');

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

    this.Store = Store.initialize(this);
    this.Policy = Policy.initialize(this);
    this.Control = Control.initialize(this);
    return this;
  }
};
