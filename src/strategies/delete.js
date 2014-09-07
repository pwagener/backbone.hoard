'use strict';

var Strategy = require('src/strategy');

var Delete = Strategy.extend({
  execute: function (model, options) {
    var key = this.policy.getKey(model, 'delete');
    this.store.invalidate(key);
    return model.sync('delete', model, options);
  }
});

module.exports = Delete;