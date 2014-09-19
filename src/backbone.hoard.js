'use strict';

var _ = require('underscore');
var Backbone = require('backbone');

var mergeOptions = ['Promise', 'backend'];

module.exports = {
  initialize: function (options) {
    _.extend(this, _.pick(options, mergeOptions));
    if (!this.Promise) {
      throw new TypeError("An ES6-compliant Promise implementaion must be provided");
    }
    return this;
  },

  Events: Backbone.Events,

  extend: Backbone.Model.extend,

  defer: function () {
    var deferred = {};
    deferred.promise = new this.Promise(function (resolve, reject) {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    return deferred;
  }
};
