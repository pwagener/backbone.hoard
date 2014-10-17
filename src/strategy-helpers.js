'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');

var getSyncSuccessEvent = function (key) {
  return 'sync:success:' + key;
};

var getSyncErrorEvent = function (key) {
  return 'sync:error:' + key;
};

var storeResponse = function (context, key, response, options) {
  var meta = context.policy.getMetadata(key, response, options);
  context.store.set(key, response, meta);
  context.trigger(getSyncSuccessEvent(key), response);
};

var invalidateResponse = function (context, key, response, options) {
  context.store.invalidate(key);
  context.trigger(getSyncErrorEvent(key));
};

var wrapMethod = function (context, method, model, options) {
  var key = context.policy.getKey(model, method);
  return _.wrap(options[options.targetMethod], function (targetMethod, response) {
    if (targetMethod) {
      targetMethod(response);
    }
    if (options.generateKeyFromResponse) {
      key = context.policy.getKey(model, method);
    }
    if (options.responseHandler) {
      options.responseHandler(context, key, response, options);
    }
  });
};

var helpers = {
  getSyncSuccessEvent: getSyncSuccessEvent,

  getSyncErrorEvent: getSyncErrorEvent,

  proxyWrapSuccessWithCache: function (method, model, options) {
    return wrapMethod(this, method, model, _.extend({
      targetMethod: 'success',
      responseHandler: storeResponse
    }, options));
  },

  proxyWrapErrorWithInvalidate: function (method, model, options) {
    return wrapMethod(this, method, model, _.extend({
      targetMethod: 'error',
      responseHandler: invalidateResponse
    }, options));
  },

  proxyCacheSuccess: function (method, model, options) {
    options.success = helpers.proxyWrapSuccessWithCache(this, method, model, options);
    return Hoard.sync(method, model, options);
  }
};

module.exports = helpers;