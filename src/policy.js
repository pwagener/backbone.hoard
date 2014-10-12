'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');

var mergeOptions = ['expires', 'timeToLive'];

var Policy = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions));
  this.initialize.apply(this, arguments);
};

_.extend(Policy.prototype, Hoard.Events, {
  initialize: function () {},

  // default to 5 minutes
  timeToLive: 5 * 60 * 1000,

  getKey: function (model, method) {
    return _.result(model, 'url');
  },

  getMetadata: function (key, response, options) {
    var meta = {};
    var expires = this.expires;
    if (this.timeToLive != null && expires == null) {
      expires = Date.now() + this.timeToLive;
    }
    if (expires != null) {
      meta.expires = expires;
    }
    return meta;
  },

  shouldEvictItem: function (meta) {
    return meta.expires != null && meta.expires < Date.now();
  }
});

Policy.extend = Hoard.extend;

module.exports = Policy;
