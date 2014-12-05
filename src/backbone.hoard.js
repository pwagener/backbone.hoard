'use strict';

var Backbone = require('backbone');

module.exports = {
  Promise: function () {
    throw new TypeError('An ES6-compliant Promise implementation must be provided');
  },

  sync: Backbone.sync,

  Events: Backbone.Events,

  extend: Backbone.Model.extend,

  defer: function () {
    var deferred = {};
    deferred.promise = new this.Promise(function (resolve, reject) {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    return deferred;
  },

  // A utility method to execute a callback
  // And pass through the failure
  rejectCallback: function (callback) {
    return function (failure) {
      var value = callback(failure);
      return Hoard.Promise.reject(value);
    }
  }
};
