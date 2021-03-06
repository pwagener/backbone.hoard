'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');
var Strategy = require('./strategy');
var StrategyHelpers = require('./strategy-helpers');

// A strategy for caching a successful response. Subclasses declare a sync method to adhere use
module.exports = Strategy.extend({
  // Cache the response.
  // If cacheOptions.generateKeyFromResponse is true,
  // cache using the key from the response, rather than the request
  execute: function (model, options) {
    var cacheOptions = _.extend({}, options, _.result(this, 'cacheOptions'));
    options.success = this._wrapSuccessWithCache(this._method, model, cacheOptions);
    return Hoard.sync(this._method, model, options);
  },

  cacheOptions: {},

  _wrapSuccessWithCache: StrategyHelpers.proxyWrapSuccessWithCache
});
