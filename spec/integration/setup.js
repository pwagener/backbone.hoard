'use strict';

// loaded by karma to include fakeServer
var sinon = window.sinon;
delete window.sinon;
var chai = require('chai');
var sinonChai = require('sinon-chai');
var chaiAsPromised = require('chai-as-promised');
var Backbone = require('backbone');
Backbone.$ = require('jquery');
var Hoard = require('src/bundle/backbone.hoard.bundle');

// load specs
require('./fetch.int-spec');

window.expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);

beforeEach(function () {
  Hoard.backend.clear();
  this.server = sinon.fakeServer.create();
  this.server.autoRespond = true;
  this.sinon = sinon.sandbox.create();
});

afterEach(function () {
  this.server.restore();
  this.sinon.restore();
});
