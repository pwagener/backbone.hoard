'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var Hoard;

var mergeOptions = ['expires', 'timeToLive'];

var Policy = function (options) {
  _.extend(this, _.pick(options, mergeOptions));
  this.initialize.apply(this, options);
};

_.extend(Policy.prototype, Backbone.Events, {
  initialize: function () {},

  getKey: function (model, method) {
    return _.result(model, 'url');
  },

  getMetadata: function (key, response, options) {
    options = options || {};
    var meta = {};
    var expires = options.expires || this.expires;
    var ttl = options.timeToLive || this.timeToLive;
    if (ttl != null && expires == null) {
      expires = Date.now() + ttl;
    }
    if (expires != null) {
      meta.expires = expires;
    }

    return meta;
  },

  shouldEvictItem: function (cacheItem) {
    if (cacheItem == null) {
      return false;
    }

    var meta = cacheItem.meta || {};
    if (meta.expires != null && meta.expires < Date.now()) {
      return true;
    } else {
      return false;
    }
  }
});

Policy.extend = Backbone.Model.extend;

module.exports = {
  initialize: function (options) {
    Hoard = options;
    return Policy;
  }
};