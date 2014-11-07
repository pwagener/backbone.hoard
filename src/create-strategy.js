'use strict';

var PositiveWriteStrategy = require('./positive-write-strategy');

module.exports = PositiveWriteStrategy.extend({
  _method: 'create',

  // In standard REST APIs, the id is not available until the response returns.
  // Therefore, use the response when determining how to cache.
  cacheOptions: {
    generateKeyFromResponse: true
  }
});
