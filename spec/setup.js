'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Spice = require('./support/spice');

global.expect = chai.expect;
chai.use(sinonChai);

beforeEach(function () {
  this.sinon = sinon.sandbox.create();
  this.localStorage = Spice.backend;
});

afterEach(function () {
  this.sinon.restore();
  this.localStorage.clear();
});