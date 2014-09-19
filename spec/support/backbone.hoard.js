'use strict';

var Promise = require('es6-promise').Promise;
var Hoard = require('src/backbone.hoard');

module.exports = Hoard.initialize({ Promise: Promise });
