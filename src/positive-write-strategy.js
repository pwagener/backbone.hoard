'use strict';

var Strategy = require('./strategy');
var StrategyHelpers = require('./strategy-helpers');

module.exports = Strategy.extend({
  execute: function (model, options) {
    return this._cacheSuccess(this._method, model, options);
  },

  _cacheSuccess: StrategyHelpers.proxyCacheSuccess
});
