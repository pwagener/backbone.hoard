'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Backbone = require('backbone');
var Hoard = require('./support/backbone.hoard');

global.expect = chai.expect;
chai.use(sinonChai);

var stubAjax = function (spec) {
  var ajax = Hoard.deferred();
  var ajaxResponse = Hoard.deferred();

  spec.ajax = ajax;
  spec.ajaxResponse = ajaxResponse.promise;

  spec.sinon.stub(Backbone, 'ajax', function (options) {
    ajax.promise.then(function (serverResponse) {
      options.success(serverResponse);
    }, function (serverError) {
      options.error(serverError);
    }).then(function () {
      ajaxResponse.resolve();
    });

    return ajaxResponse.promise;
  });
};

beforeEach(function () {
  this.sinon = sinon.sandbox.create();
  this.localStorage = Hoard.backend;
  this.sinon.stub(this.localStorage, 'setItem');
  this.sinon.stub(this.localStorage, 'getItem');
  this.sinon.stub(this.localStorage, 'removeItem');
  stubAjax(this);
});

afterEach(function () {
  this.sinon.restore();
  this.localStorage.clear();
});