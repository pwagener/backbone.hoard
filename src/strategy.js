'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');

var mergeOptions = ['store', 'policy'];

// A Strategy is tied to a particular sync method on a Control
// The execute method will be called by the Control with the model and options being synced.
// It is abstract by default, and it's implementations get access to the Store and Policy
// provided by the Controller
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
