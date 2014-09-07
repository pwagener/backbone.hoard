'use strict';

var Backbone = require('backbone');
var when = require('when');
var Store = require('src/store');
var Policy = require('src/policy');
var CreateStrategy = require('src/strategies/create');
var UpdateStrategy = require('src/strategies/update');
var PatchStrategy = require('src/strategies/patch');

describe("Positive write strategies", function () {
  beforeEach(function () {
    this.store = new Store();

    this.policy = new Policy();
    this.metadata = {};
    this.key = 'key';
    this.serverResponse = { myResponse: true };
    this.sinon.stub(this.policy, 'getKey').returns(this.key);
    this.sinon.stub(this.policy, 'getMetadata').returns(this.metadata);

    this.storedResponse = { data: this.serverResponse, meta: this.metadata };
    this.sinon.stub(this.store, 'get').returns(when.resolve(this.storedResponse));
    this.sinon.spy(this.store, 'set');

    this.Model = Backbone.Model.extend({ url: this.key });
    this.model = new this.Model();
    this.sinon.spy(this.model, 'sync');

    this.options = {
      success: this.sinon.stub(),
      error: this.sinon.stub()
    };
  });

  describe("Create", function () {
    beforeEach(function () {
      this.strategy = new CreateStrategy({
        store: this.store,
        policy: this.policy
      });
      this.execution = this.strategy.execute(this.model, this.options);
    });

    it("returns the sync deferred", function () {
      expect(this.execution).to.equal(this.ajaxResponse);
    });

    it("always calls the underlying model's sync with the same arguments", function () {
      expect(this.model.sync).to.have.been.calledOnce
        .and.calledWith('create', this.model, this.options);
    });

    it("writes to the cache when the response returns", function (done) {
      var spec = this;
      this.ajax.resolve(this.serverResponse);
      this.ajaxResponse.then(function () {
        expect(spec.store.set).to.have.been.calledOnce
          .and.calledWith(spec.key, spec.storedResponse);
        done();
      });
    });
  });

  describe("Update", function () {
    beforeEach(function () {
      this.strategy = new UpdateStrategy({
        store: this.store,
        policy: this.policy
      });
      this.execution = this.strategy.execute(this.model, this.options);
    });

    it("returns the sync deferred", function () {
      expect(this.execution).to.equal(this.ajaxResponse);
    });

    it("always calls the underlying model's sync with the same arguments", function () {
      expect(this.model.sync).to.have.been.calledOnce
        .and.calledWith('update', this.model, this.options);
    });

    it("writes to the cache when the response returns", function (done) {
      var spec = this;
      this.ajax.resolve(this.serverResponse);
      this.ajaxResponse.then(function () {
        expect(spec.store.set).to.have.been.calledOnce
          .and.calledWith(spec.key, spec.storedResponse);
        done();
      });
    });
  });

  describe("Patch", function () {
    beforeEach(function () {
      this.strategy = new PatchStrategy({
        store: this.store,
        policy: this.policy
      });
      this.execution = this.strategy.execute(this.model, this.options);
    });

    it("returns the sync deferred", function () {
      expect(this.execution).to.equal(this.ajaxResponse);
    });

    it("always calls the underlying model's sync with the same arguments", function () {
      expect(this.model.sync).to.have.been.calledOnce
        .and.calledWith('patch', this.model, this.options);
    });

    it("writes to the cache when the response returns", function (done) {
      var spec = this;
      this.ajax.resolve(this.serverResponse);
      this.ajaxResponse.then(function () {
        expect(spec.store.set).to.have.been.calledOnce
          .and.calledWith(spec.key, spec.storedResponse);
        done();
      });
    });
  });
});