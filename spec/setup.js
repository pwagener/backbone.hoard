'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Backbone = require('backbone');
var Hoard = require('./support/backbone.hoard');

global.expect = chai.expect;
chai.use(sinonChai);

var stubAjax = function (spec) {
  var ajax = Hoard.defer();
  var ajaxResponse = Hoard.defer();

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
  stubAjax(this);
});

afterEach(function () {
  this.sinon.restore();
});