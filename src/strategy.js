'use strict';

var _ = require('underscore');
var Backbone = require('backbone');

var mergeOptions = ['store', 'policy'];

var Strategy = function (options) {
  _.extend(this, _.pick(options, mergeOptions));
  this.initialize.apply(this, arguments);
};

_.extend(Strategy.prototype, Backbone.Events, {
  initialize: function () {},

  execute: function (model, options) {
    return model.sync(method, model, options);
  }
});

Strategy.extend = Backbone.Model.extend;

module.exports = Strategy;
