'use strict';

var when = require('when');
var Spice = require('src/spice');

var LocalStorage = require('node-localstorage').LocalStorage;
var nodeLocalStorage = new LocalStorage('./scratch-storage');
nodeLocalStorage.clear();

module.exports = Spice.initialize({
  backend: nodeLocalStorage,
  deferred: when.defer
});
