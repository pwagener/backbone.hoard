'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');

var mergeOptions = ['expires', 'timeToLive'];

// A Policy determines key generation and cache eviction
var Policy = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions));
  this.initialize.apply(this, arguments);
};

_.extend(Policy.prototype, Hoard.Events, {
  initialize: function () {},

  // How long, in milliseconds, should a cached item be considered 'fresh'?
  // Superceded by the `expires` option, which determines at what time the cache item becomes stale
  timeToLive: 5 * 60 * 1000,

  // Generate a key for the given model
  // The key will be used to determine uniqueness in the store
  getKey: function (model, method) {
    return _.result(model, 'url');
  },

  // Generate metadata
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

  // Return true if the item associated with the given metadata should be evicted.
  // Return false otherwise.
  shouldEvictItem: function (meta) {
    return meta.expires != null && meta.expires < Date.now();
  }
});

Policy.extend = Hoard.extend;

module.exports = Policy;
