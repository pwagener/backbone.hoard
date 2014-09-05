'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var Hoard;

var mergeOptions = ['backend'];

var CacheStore = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions), {
    backend: Hoard.backend
  });
  this.initialize.apply(this, arguments);
};

_.extend(CacheStore.prototype, Backbone.Events, {
  initialize: function () {},

  set: function (key, value, options) {
    var valueToStore = JSON.stringify(value)
    this.backend.setItem(key, valueToStore);
    return valueToStore;
  },

  get: function (key, options) {
    return JSON.parse(this.backend.getItem(key));
  },

  invalidate: function (key) {
    this.backend.removeItem(key);
    return null;
  }
});

Store.extend = Backbone.Model.extend;

module.exports = {
  initialize: function (options) {
    Hoard = options;
    return CacheStore;
  }
};