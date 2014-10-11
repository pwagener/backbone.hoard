'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');

var mergeOptions = ['store', 'policy'];

var Strategy = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions));
  this.initialize.apply(this, arguments);
};

_.extend(Strategy.prototype, Hoard.Events, {
  initialize: function () {},

  execute: function (model, options) {
    throw new Error("Strategy#execute must be implemented");
  }
});

Strategy.extend = Hoard.extend;

module.exports = Strategy;
