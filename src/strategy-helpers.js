'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');

var storeAction = function (method, options, response) {
  var callback = options[method] || function () { return response };
  return function () {
    return callback(response);
  }
};

var storeResponse = function (context, key, response, options) {
  var meta = context.policy.getMetadata(key, response, options);
  context.store.set(key, response, meta).then(storeAction('onStoreSuccess', options, response),
    storeAction('onStoreError', options, response));
};

var invalidateResponse = function (context, key, response, options) {
  context.store.invalidate(key).then(storeAction('onStoreSuccess', options, response),
    storeAction('onStoreError', options, response));
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