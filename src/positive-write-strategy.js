'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');
var Strategy = require('./strategy');
var StrategyHelpers = require('./strategy-helpers');

module.exports = Strategy.extend({
  execute: function (model, options) {
    var cacheOptions = _.extend({}, options, _.result(this, 'cacheOptions'));
    options.success = this._wrapSuccessWithCache(this._method, model, cacheOptions);
    return Hoard.sync(this._method, model, options);
  },

  cacheOptions: {},

  _wrapSuccessWithCache: StrategyHelpers.proxyWrapSuccessWithCache
});
