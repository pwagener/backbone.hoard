'use strict';

var PositiveWriteStrategy = require('src/strategies/positive-write');

module.exports = PositiveWriteStrategy.extend({ _method: 'update' });
