'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');
var MetaStore = require('./meta-store');
var StoreHelpers = require('./store-helpers');

var mergeOptions = ['backend', 'metaStoreClass'];

var Store = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions));
  _.defaults(this, {
    backend: Hoard.backend,
    metaStoreClass: MetaStore
  });
  this.metaStore = new this.metaStoreClass(mergeOptions);
  this.initialize.apply(this, arguments);
};

_.extend(Store.prototype, Hoard.Events, {
  initialize: function () {},

  set: function (key, item, meta, options) {
    var storedItem = JSON.stringify(item);
    var metaWithSize = _.extend({ size: storedItem.length }, meta);
    var itemPromise = this._setItem(key, storedItem);
    var metaPromise = this.metaStore.set(key, metaWithSize, options);
    var setPromise = Hoard.Promise.all([itemPromise, metaPromise]);
    return setPromise.then(undefined, _.bind(this.onSetError, this, key, options));
  },

  get: StoreHelpers.proxyGetItem,

  invalidate: function (key, options) {
    this.backend.removeItem(key);
    return this.metaStore.invalidate(key, options);
  },

  invalidateAll: function () {
    var dataPromise = this.getAllMetadata().then(function (metadata) {
      _.each(_.keys(metadata), function (key) {
        this.backend.removeItem(key);
      }, this);
    }.bind(this));

    var metaPromise = this.metaStore.invalidateAll();

    return Hoard.Promise.all([dataPromise, metaPromise]);
  },

  getAllMetadata: function (options) {
    return this.metaStore.getAll(options);
  },

  onSetError: function (key, options) {
    return this.invalidate(key, options).then(function () {
      return Hoard.Promise.reject();
    });
  },

  _setItem: StoreHelpers.proxySetItem
});

Store.extend = Hoard.extend;

module.exports = Store;
