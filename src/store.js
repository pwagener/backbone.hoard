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
    this.backend.setItem(key, JSON.stringify(value));
  },

  get: function (key, options) {
    return JSON.parse(this.backend.getItem(key));
  },

  invalidate: function (key) {
    this.backend.removeItem(key);
  }
});

module.exports = {
  initialize: function (options) {
    Hoard = options;
    return CacheStore;
  }
};