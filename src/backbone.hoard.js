'use strict';

var _ = require('underscore');
var Backbone = require('backbone');

module.exports = {
  initialize: function (options) {
    _.extend(this, options);

    if (!this.deferred) {
      throw new TypeError("A 'deferred' property of type " +
        "() -> { promise: A+ thenable } must be provided");
    }
    return this;
  },

  Events: Backbone.Events,

  extend: Backbone.Model.extend
};
