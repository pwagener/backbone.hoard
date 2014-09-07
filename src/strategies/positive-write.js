'use strict';

var Strategy = require('src/strategy');
var StrategyHelpers = require('src/strategies/helpers');

module.exports = Strategy.extend({
  execute: function (model, options) {
    return this._cacheSuccess(this._method, model, options);
  },

  _cacheSuccess: StrategyHelpers.proxyCacheSuccess
});
