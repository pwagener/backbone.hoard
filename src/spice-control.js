'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var SpiceConfig;

var mergeOptions = ['store', 'backend'];

var SpiceControl = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions));
  this.initialize.apply(this, arguments);
};

_.extend(SpiceControl.prototype, {
  initialize: function () {},

  generateKey: function (method) {
    return _.result(this.store, 'url');
  },

  invalidate: function (method) {
    this.backend.removeItem(this.generateKey(method));
  }
});

SpiceControl.extend = Backbone.Model.extend;

module.exports = {
  initialize: function (config) {
    SpiceConfig = config;
    SpiceControl.prototype.backend = SpiceConfig.backend;
    return SpiceControl;
  }
};