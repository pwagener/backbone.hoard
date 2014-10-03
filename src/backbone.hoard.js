'use strict';

var _ = require('underscore');
var Backbone = require('backbone');

module.exports = {
  Promise: function () {
    throw new TypeError("An ES6-compliant Promise implementationi must be provided");
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
