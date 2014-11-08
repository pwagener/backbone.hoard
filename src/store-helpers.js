'use strict';

var Hoard = require('./backbone.hoard');

// Convenience methods for stores
module.exports = {
  proxySetItem: function (key, value) {
    try {
      this.backend.setItem(key, value);
      return Hoard.Promise.resolve();
    } catch (e) {
      return Hoard.Promise.reject(e);
    }
  },

  proxyGetItem: function (key, options) {
    var storedValue = JSON.parse(this.backend.getItem(key));
    if (storedValue !== null) {
      return Hoard.Promise.resolve(storedValue);
    } else {
      return Hoard.Promise.reject();
    }
  }
};
