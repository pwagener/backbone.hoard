'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');
var MetaStore = require('./meta-store');
var StoreHelpers = require('./store-helpers');

var mergeOptions = ['backend', 'metaStoreClass'];

// Adapt a common interface to a desired storage mechanism (e.g. localStorage, sessionStorage)
// The interface is asynchronous, to support the use of asynchronous backends (e.g. IndexedDB)
var Store = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions));
  _.defaults(this, {
    backend: Hoard.backend,
    metaStoreClass: MetaStore
  });
  this.metaStore = new this.metaStoreClass(options);
  this.initialize.apply(this, arguments);
};

_.extend(Store.prototype, Hoard.Events, {
  initialize: function () {},

  // Store an item and its metadata, handling errors with `onSetError`
  set: function (key, item, meta, options) {
    var storedItem = JSON.stringify(item);
    var metaWithSize = _.extend({ size: storedItem.length }, meta);
    var itemPromise = this._setItem(key, storedItem);
    var metaPromise = this.metaStore.set(key, metaWithSize, options);
    var setPromise = Hoard.Promise.all([itemPromise, metaPromise]);
    return setPromise.then(undefined, _.bind(this.onSetError, this, key, options));
  },

  // Retrieve an item from the cache
  // Returns a promise that resolves with the found cache item
  // or rejects if an item is not found in the cache
  get: StoreHelpers.proxyGetItem,

  // Remove an item and its metadata from the cache
  invalidate: function (key, options) {
    this.backend.removeItem(key);
    return this.metaStore.invalidate(key, options);
  },

  // Remove all items listed by store metadata then remove all metadata.
  invalidateAll: function () {
    var dataPromise = this.getAllMetadata().then(function (metadata) {
      _.each(_.keys(metadata), function (key) {
        this.backend.removeItem(key);
      }, this);
    }.bind(this));

    var metaPromise = this.metaStore.invalidateAll();

    return Hoard.Promise.all([dataPromise, metaPromise]);
  },

  // Get the metadata associated with the given key
  getMetadata: function (key, options) {
    return this.metaStore.get(key, options);
  },

  // Get all the metadata
  getAllMetadata: function (options) {
    return this.metaStore.getAll(options);
  },

  // SUBJECT TO CHANGE
  // Invalidate the entire cache
  // In the future, the Policy will decide how to respond to a Store set error
  onSetError: function (key, options) {
    return this.invalidateAll().then(function () {
      return Hoard.Promise.reject();
    });
  },

  _setItem: StoreHelpers.proxySetItem
});

Store.extend = Hoard.extend;

module.exports = Store;
