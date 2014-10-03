'use strict';

var Backbone = require('backbone');

var Promise = function (callback) {
  var deferred = Backbone.$.Deferred();
  callback(deferred.resolve, deferred.reject);
  return deferred.promise();
};

Promise.all = function (promises) {
  return Backbone.$.when.apply(null, promises);
};

Promise.resolve = function (value) {
  var deferred = Backbone.$.Deferred();
  deferred.resolve(value);
  return deferred.promise();
};

Promise.reject = function (value) {
  var deferred = Backbone.$.Deferred();
  deferred.reject(value);
  return deferred.promise();
};

module.exports = Promise;
