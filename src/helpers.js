'use strict';

var _ = require('underscore');

module.exports = {
  executeCallback: function (callback) {
    if (callback) {
      return callback.apply(null, _.rest(arguments));
    }
  }
};