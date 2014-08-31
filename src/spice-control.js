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

_.extend(SpiceControl.prototype, {
  initialize: function () {},

  generateKey: function (model, method) {
    return _.result(model, 'url');
  },

  invalidate: function (model, method) {
    this.backend.removeItem(this.generateKey(model, method));
  },

  sync: function (method, model, options) {
    var handlerName = methodHandlers[method];
    return this[handlerName](model, options);
  },

  onCreate: function (model, options) {
  },

  onRead: function (model, options) {
    var key = this.generateKey(model, 'read');
    var item = this.backend.getItem(key);
    if (item === null) {
      this.backend.setItem(key, JSON.stringify({ placeholder: true }));
      options.success = this.getCacheMissOnSuccess(key, model, options);
      return model.sync('read', model, options);
    }
  },

  getCacheMissOnSuccess: function (key, model, options) {
    var backend = this.backend;
    return _.wrap(options.success, function (onSuccess, response) {
      backend.setItem(key, JSON.stringify(response));
      if (onSuccess) {
        onSuccess.apply(this, _.rest(arguments));
      }
    });
  },

  onUpdate: function () {
  },

  onDestroy: function () {
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