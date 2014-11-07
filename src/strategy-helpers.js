'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');

var getStoreActionResponse = function (options) {
  return function () {
    if (options.onStoreAction) {
      options.onStoreAction();
    }
  }
};

var storeResponse = function (context, key, response, options) {
  var meta = context.policy.getMetadata(key, response, options);
  var onStoreComplete = getStoreActionResponse(options);
  context.store.set(key, response, meta).then(onStoreComplete, onStoreComplete);
};

var invalidateResponse = function (context, key, response, options) {
  var onStoreComplete = getStoreActionResponse(options);
  context.store.invalidate(key).then(onStoreComplete, onStoreComplete);
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

// Convenience methods for strategies
var helpers = {
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
  }
};

module.exports = helpers;