'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var SpiceConfig;

var mergeOptions = ['backend'];

var SpiceControl = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions));
  this.initialize.apply(this, arguments);
};

var methodHandlers = {
  create: 'onCreate',
  read: 'onRead',
  update: 'onUpdate',
  delete: 'onDestroy'
};

_.extend(SpiceControl.prototype, Backbone.Events, {
  initialize: function () {},

  generateKey: function (model, method) {
    return _.result(model, 'url');
  },

  getCacheEventKey: function (key) {
    return 'cache:update:' + key;
  },

  invalidate: function (model, method) {
    this.backend.removeItem(this.generateKey(model, method));
  },

  sync: function (method, model, options) {
    var handlerName = methodHandlers[method];
    return this[handlerName](model, options);
  },

  onCreate: function (model, options) {
    //store response
  },

  onRead: function (model, options) {
    var key = this.generateKey(model, 'read');
    var item = JSON.parse(this.backend.getItem(key));

    if (item === null) {
      return this.onReadCacheMiss(key, model, options);
    } else if (item.placeholder) {
      return this.onReadCachePlaceholderHit(key, options);
    } else {
      return this.onReadCacheHit(item, options);
    }
  },

  onReadCacheMiss: function (key, model, options) {
    this.backend.setItem(key, JSON.stringify({ placeholder: true }));
    options.success = this.getCacheMissOnSuccess(key, model, options);
    return model.sync('read', model, options);
  },

  onReadCachePlaceholderHit: function (key, options) {
    var deferred = SpiceConfig.deferred();
    this.once(this.getCacheEventKey(key), function (response) {
      if (options.success) {
        options.success(response);
      }
      SpiceConfig.resolveDeferred(deferred, response);
    });
    return deferred.promise;
  },

  onReadCacheHit: function (item, options) {
    var deferred = SpiceConfig.deferred();
    SpiceConfig.resolveDeferred(deferred, item);
    return deferred.promise.then(function (item) {
      var itemData = item.data;
      if (options.success) {
        options.success(itemData);
      }
      return itemData;
    });
  },

  getCacheMissOnSuccess: function (key, model, options) {
    var self = this;
    return _.wrap(options.success, function (onSuccess, response) {
      if (onSuccess) {
        onSuccess(response);
      }
      self.storeResponse(key, response);
    });
  },

  storeResponse: function (key, response) {
    var entry = { data: response };
    this.backend.setItem(key, JSON.stringify(entry));
    this.trigger(this.getCacheEventKey(key), response);
  },

  onUpdate: function () {
    //store response
  },

  onDestroy: function () {
    //invalidate
  }
});

SpiceControl.extend = Backbone.Model.extend;

module.exports = {
  initialize: function (config) {
    SpiceConfig = config;
    SpiceControl.prototype.backend = SpiceConfig.backend;
    return SpiceControl;
  }
};