'use strict';

var Hoard = require('./backbone.hoard');
var Strategy = require('./strategy');

var Delete = Strategy.extend({
  execute: function (model, options) {
    var key = this.policy.getKey(model, 'delete');
    this.store.invalidate(key);
    return Hoard.sync('delete', model, options);
  }
});

module.exports = Delete;