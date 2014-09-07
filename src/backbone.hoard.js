'use strict';

var _ = require('underscore');

module.exports = {
  initialize: function (options) {
    _.extend(this, options);

    if (!this.backend) {
      throw new TypeError("A 'backend' property matching the localStorage api must be provided");
    }

    if (!this.deferred) {
      throw new TypeError("A 'deferred' property of type " +
        "() -> { promise: A+ thenable } must be provided");
    }
    return this;
  }
};
