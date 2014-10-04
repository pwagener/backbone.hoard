'use strict';

var Hoard = require('src/backbone.hoard');
var Store = require('src/store');
var Policy = require('src/policy');
var Backbone = require('backbone');
var ReadStrategy = require('src/read-strategy');
var Helpers = require('src/strategy-helpers');

describe("Read Strategy", function () {
  beforeEach(function () {
    this.store = new Store();

    this.policy = new Policy();
    this.key = 'key';
    this.sinon.stub(this.policy, 'getKey').returns(this.key);

    this.Model = Backbone.Model.extend({ url: this.key });
    this.model = new this.Model();

    this.options = {
      success: this.sinon.stub(),
      error: this.sinon.stub()
    };

    this.strategy = new ReadStrategy({
      store: this.store,
      policy: this.policy
    });
  });

  describe("on a cache miss", function () {
    beforeEach(function () {
      this.clock = this.sinon.useFakeTimers(0);

      this.cacheResponse = Hoard.Promise.reject();
      this.sinon.stub(this.store, 'get').returns(this.cacheResponse);

      this.setPromise = Hoard.Promise.resolve();
      this.sinon.stub(this.store, 'set').returns(this.setPromise);
      this.sinon.stub(this.store, 'invalidate');

      this.metadata = { myMeta: true};
      this.serverResponse = { myResponse: true };
      this.sinon.stub(this.policy, 'getMetadata').returns(this.metadata);

      this.execution = this.strategy.execute(this.model, this.options);
    });

    afterEach(function () {
      this.clock.restore();
    });

    it("returns a promise that resolves when the get and sync resolve", function () {
      this.ajax.resolve(this.serverResponse);
      return expect(this.execution).to.have.been.fulfilled;
    });

    it("writes a placeholder", function () {
      return this.cacheResponse.catch(function () {
        expect(this.strategy.placeholders[this.key]).to.eql({ expires: 8000 });
      }.bind(this));
    });

    it("writes to the cache on a successful sync", function (done) {
      this.ajax.resolve(this.serverResponse);
      this.strategy.on(Helpers.getSyncSuccessEvent(this.key), function () {
        expect(this.store.set).to.have.been.calledOnce
          .and.calledWith(this.key, this.serverResponse, this.metadata);
        done();
      }.bind(this));
    });

    it("invalidates the cache on a failed sync", function (done) {
      this.ajax.reject(this.serverResponse);
      this.strategy.on(Helpers.getSyncErrorEvent(this.key), function () {
        expect(this.store.invalidate).to.have.been.calledOnce
          .and.calledWith(this.key);
        done();
      }.bind(this));
    });
  });

  describe("on an expired cache hit", function () {
    beforeEach(function () {
      this.getPromise = Hoard.Promise.resolve();
      this.sinon.stub(this.store, 'get').returns(this.getPromise);
      this.sinon.stub(this.policy, 'shouldEvictItem').returns(true);
      this.invalidated = Hoard.Promise.resolve();
      this.sinon.stub(this.store, 'invalidate').returns(this.invalidated);
      var cacheMissed = this.cacheMissed = Hoard.defer();
      this.sinon.stub(this.strategy, 'onCacheMiss', function () {
        cacheMissed.resolve();
        return cacheMissed.promise;
      });
      this.execution = this.strategy.execute(this.model, this.options);
    });

    it("invalidates the cache", function () {
      return this.getPromise.then(function () {
        expect(this.store.invalidate).to.have.been.calledOnce
          .and.calledWith(this.key);
      }.bind(this));
    });

    it("acts as a cache miss", function () {
      return this.cacheMissed.promise.then(function () {
        expect(this.strategy.onCacheMiss).to.have.been.calledOnce
          .and.calledWith(this.key, this.model, this.options);
      }.bind(this));
    });
  });

  describe("on a placeholder cache hit", function () {
    beforeEach(function () {
      this.strategy.placeholders[this.key] = { expires: +Infinity };
      this.getPromise = Hoard.Promise.reject();
      this.sinon.stub(this.store, 'get').returns(this.getPromise);
      this.serverResponse = { myResponse: true };
      this.execution = this.strategy.execute(this.model, this.options);
    });

    it("calls options.success on a successful cache event", function () {
      this.getPromise.catch(function () {
        this.strategy.trigger(Helpers.getSyncSuccessEvent(this.key), this.serverResponse);
      }.bind(this));
      return this.execution.then(function () {
        expect(this.options.success).to.have.been.calledOnce
          .and.calledWith(this.serverResponse);
      }.bind(this));
    });

    it("calls options.error on an error cache event", function () {
      this.getPromise.catch(function () {
        this.strategy.trigger(Helpers.getSyncErrorEvent(this.key), this.serverResponse);
      }.bind(this));
      return this.execution.then(undefined, function () {
        expect(this.options.error).to.have.been.calledOnce
          .and.calledWith(this.serverResponse);
      }.bind(this));
    });
  });

  describe("on a cache hit", function () {
    beforeEach(function () {
      this.cacheItem = { };
      this.sinon.stub(this.store, 'get').returns(Hoard.Promise.resolve(this.cacheItem));
      this.sinon.stub(this.policy, 'shouldEvictItem').returns(false);
      this.execution = this.strategy.execute(this.model, this.options);
    });

    it("calls options.success with the retreived item", function () {
      return this.execution.then(function () {
        expect(this.options.success).to.have.been.calledOnce
          .and.calledWith(this.cacheItem);
      }.bind(this));
    });
  });
});
