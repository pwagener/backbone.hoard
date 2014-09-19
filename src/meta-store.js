'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');
var StoreHelpers = require('./store-helpers');

var mergeOptions = ['backend', 'key'];

var MetaStore = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions));
  _.defaults(this, { backend: Hoard.backend });
  this.initialize.apply(this, arguments);
};


_.extend(MetaStore.prototype, Hoard.Events, {
  initialize: function () {},

  key: 'backbone.hoard.metastore',

  set: function (key, meta, options) {
    var allMetadata = this._get();
    allMetadata[key] = meta;
    return this._set(this.key, allMetadata);
  },

  getAll: function (options) {
    return Hoard.Promise.resolve(this._get());
  },

  invalidate: function (key, options) {
    var allMetadata = this._get();
    delete allMetadata[key];
    this._set(this.key, allMetadata);
    return Hoard.Promise.resolve();
  },

  _get: function () {
    return JSON.parse(this.backend.getItem(this.key)) || {};
  },

  _set: function (key, meta) {
    return this._setItem(key, JSON.stringify(meta));
  },

  _setItem: StoreHelpers.proxySetItem
});

MetaStore.extend = Hoard.extend;
module.exports = MetaStore;
