'use strict';

var when = require('when');
var Hoard = require('src/backbone.hoard');

module.exports = Hoard.initialize({ deferred: when.defer });
