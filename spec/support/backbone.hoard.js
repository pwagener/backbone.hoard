'use strict';

var when = require('when');
var Hoard = require('src/backbone.hoard');

var LocalStorage = require('node-localstorage').LocalStorage;
var nodeLocalStorage = new LocalStorage('./scratch-storage');
nodeLocalStorage.clear();

module.exports = Hoard.initialize({
  backend: nodeLocalStorage,
  deferred: when.defer
});
