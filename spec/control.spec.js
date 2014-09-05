'use strict';

var Backbone = require('backbone');
var Hoard = require('./support/backbone.hoard');
var Control = require('src/control');

describe("Hoard.Control", function () {
  var spec;

  beforeEach(function () {
    spec = this;
    this.cacheControl = new Control();
    this.modelUrl = 'theUrl';
    this.Model = Backbone.Model.extend({ url: this.modelUrl });
    this.sinon.stub(this.localStorage, 'setItem');
    this.serverResponse = { myResponse: true };
    this.storedResponse = JSON.stringify({ data: this.serverResponse, meta: {} });
    this.expectedEvent = 'cache:success:' + this.modelUrl;
    this.expectedErrorEvent = 'cache:error:' + this.modelUrl;
  });

  describe("construction", function () {
    beforeEach(function () {
      this.backend = this.sinon.stub();
      this.options = {
        backend: this.backend
      };
      this.initializeSpy = this.sinon.spy(Control.prototype, 'initialize');
      this.cacheControl = new Control(this.options);
    });

    it("should create a CacheControl", function () {
      expect(this.cacheControl).to.be.instanceOf(Control);
    });

    xit("should assign the provided backend", function () {
      expect(this.cacheControl.backend).to.equal(this.backend);
    });

    it("should call initialize with the provided options", function () {
      expect(this.initializeSpy).to.have.been.calledOnce
        .and.calledOn(this.cacheControl)
        .and.calledWith(this.options);
    });
  });

  xdescribe("getCacheKey", function () {
    beforeEach(function () {
      this.model = new this.Model();
      this.key = this.cacheControl.getCacheKey(this.model);
    });

    it("should return the result of the url, by default", function () {
      expect(this.key).to.equal(this.modelUrl);
    });
  });

  describe("storeResponse", function () {
    beforeEach(function () {
      this.sinon.spy(this.cacheControl, 'trigger');
      this.cacheControl.storeResponse(this.modelUrl, this.serverResponse, {});
    });

    it("writes to the cache", function () {
      expect(this.localStorage.setItem).to.have.been
        .calledWith(this.modelUrl, this.storedResponse);
    });

    it("triggers a cache:success:[key] event with the response", function () {
      expect(this.cacheControl.trigger).to.have.been
        .calledWith(this.expectedEvent, this.serverResponse);
    });
  });

  xdescribe("invalidateCache", function () {
    beforeEach(function () {
      this.Model = Backbone.Model.extend({
        url: function () {
          return spec.modelUrl;
        }
      });
      this.model = new this.Model();

      this.cacheControl = new Control();
      this.sinon.stub(this.localStorage, 'removeItem');

      this.cacheControl.invalidateCache(this.cacheControl.getCacheKey(this.model));
    });

    it("removes the key returned from getCacheKey from the backend", function () {
      expect(this.localStorage.removeItem).to.have.been.calledOnce
        .and.calledWith(this.modelUrl);
    });
  });

  xdescribe("getMetadata", function () {
    describe("cache expiration", function () {
      beforeEach(function () {
        this.clock = this.sinon.useFakeTimers(5);
      });

      afterEach(function () {
        this.clock.restore();
      });

      it("sets expiration based on the expires property", function () {
        var cacheControl = new Control({ expires: 1234 });
        expect(cacheControl.getMetadata()).to.eql({ expires: 1234 });
      });

      it("overrides the expires property with the options", function () {
        var cacheControl = new Control({ expires: 1234 });
        var meta = cacheControl.getMetadata('key', 'response', { expires: 1 });
        expect(meta).to.eql({ expires: 1 });
      });

      it("uses the timeToLive property to calculate expires", function () {
        var cacheControl = new Control({ timeToLive: 10 });
        var meta = cacheControl.getMetadata();
        expect(meta).to.eql({ expires: 15 });
      });

      it("overrides the expires property with the options", function () {
        var cacheControl = new Control({ timeToLive: 10 });
        var meta = cacheControl.getMetadata('key', 'response', { timeToLive: 5});
        expect(meta).to.eql({ expires: 10 });
      });

      it("prefers expires to timeToLive", function () {
        var cacheControl = new Control({ expires: 100, timeToLive: 10 });
        var meta = cacheControl.getMetadata();
        expect(meta).to.eql({ expires: 100 });
      });
    });
  });

  describe("sync", function () {
    beforeEach(function () {
      spec = this;
      this.model = new this.Model();

      this.ajax = Hoard.deferred();
      this.sinon.stub(Backbone, 'ajax', function (options) {
        spec.syncResponse = spec.ajax.promise.then(function () {
          options.success(spec.serverResponse);
        }, function () {
          options.error(spec.serverResponse);
        });
        return spec.syncResponse;
      });

      this.success = this.sinon.stub();
      this.error = this.sinon.stub();
      this.options = {
        success: this.success,
        error: this.error
      };
      this.placeholder = JSON.stringify({ placeholder: true });
      this.sinon.spy(this.cacheControl, 'storeResponse');
      this.store = this.cacheControl.store;
      this.sinon.spy(this.store, 'invalidate');
      this.sinon.spy(this.model, 'sync');
    });

    describe("with method create", function () {
      beforeEach(function () {
        this.sinon.spy(this.cacheControl, 'onCreate');
        this.sinon.stub(this.localStorage, 'getItem').returns(this.storedResponse);
        this.syncReturn = this.cacheControl.sync('create', this.model, this.options);
      });

      it("calls onCreate with the model and the options", function () {
        expect(this.cacheControl.onCreate).to.have.been.calledOnce
          .and.calledWith(this.model, this.options);
      });

      it("calls the underlying model's sync with the same arguments", function () {
        expect(this.model.sync).to.have.been.calledOnce
          .and.calledWith('create', this.model, this.options);
      });

      it("writes to the cache when the response returns", function (done) {
        this.ajax.resolve();
        this.syncReturn.then(function () {
          expect(spec.cacheControl.storeResponse).to.have.been.calledOnce
            .and.calledWith(spec.modelUrl, spec.serverResponse);
          done();
        });
      });
    });

    describe("with method update", function () {
      beforeEach(function () {
        this.sinon.spy(this.cacheControl, 'onUpdate');
        this.sinon.stub(this.localStorage, 'getItem').returns(this.storedResponse);
        this.syncReturn = this.cacheControl.sync('update', this.model, this.options);
      });

      it("calls onUpdate with the model and the options", function () {
        expect(this.cacheControl.onUpdate).to.have.been.calledOnce
          .and.calledWith(this.model, this.options);
      });

      it("calls the underlying model's sync with the same arguments", function () {
        expect(this.model.sync).to.have.been.calledOnce
          .and.calledWith('update', this.model, this.options);
      });

      it("writes to the cache when the response returns", function (done) {
        this.ajax.resolve();
        this.syncReturn.then(function () {
          expect(spec.cacheControl.storeResponse).to.have.been.calledOnce
            .and.calledWith(spec.modelUrl, spec.serverResponse);
          done();
        });
      });
    });

    describe("with method patch", function () {
      beforeEach(function () {
        this.sinon.spy(this.cacheControl, 'onPatch');
        this.sinon.stub(this.localStorage, 'getItem').returns(this.storedResponse);
        this.syncReturn = this.cacheControl.sync('patch', this.model, this.options);
      });

      it("calls onPatch with the model and the options", function () {
        expect(this.cacheControl.onPatch).to.have.been.calledOnce
          .and.calledWith(this.model, this.options);
      });

      it("calls the underlying model's sync with the same arguments", function () {
        expect(this.model.sync).to.have.been.calledOnce
          .and.calledWith('patch', this.model, this.options);
      });

      it("writes to the cache when the response returns", function (done) {
        this.ajax.resolve();
        this.syncReturn.then(function () {
          expect(spec.cacheControl.storeResponse).to.have.been.calledOnce
            .and.calledWith(spec.modelUrl, spec.serverResponse);
          done();
        });
      });
    });

    describe("with method read", function () {
      beforeEach(function () {
        spec = this;
        this.sinon.spy(this.cacheControl, 'onRead');
      });

      it("calls onRead with the model and the options", function () {
        this.cacheControl.sync('read', this.model, this.options);
        expect(this.cacheControl.onRead).to.have.been.calledOnce
          .and.calledWith(this.model, this.options);
      });

      it("reads the key from the cache", function () {
        this.sinon.stub(this.localStorage, 'getItem').returns(null);
        this.cacheControl.sync('read', this.model, this.options);
        expect(this.localStorage.getItem).to.have.been.calledOnce
          .and.calledWith(this.modelUrl);
      });

      describe("on a cache miss", function () {
        beforeEach(function () {
          this.sinon.stub(this.localStorage, 'getItem').returns(null);
          this.syncReturn = this.cacheControl.sync('read', this.model, this.options);
        });

        it("calls the underlying model's sync with the same arguments", function () {
          expect(this.model.sync).to.have.been.calledOnce
            .and.calledWith('read', this.model, this.options);
        });

        it("inserts a placeholder entry for the key", function () {
          expect(this.localStorage.setItem).to.have.been
            .calledWith(this.modelUrl, this.placeholder);
        });

        describe("when the sync resolves", function () {
          beforeEach(function () {
            this.ajax.resolve();
          });

          it("calls the provided success method", function (done) {
            this.syncResponse.then(function () {
              expect(spec.success).to.have.been.calledOnce
                .and.calledWith(spec.serverResponse);
              done();
            });
          });

          it("writes to the cache when the response returns", function (done) {
            this.ajax.resolve();
            this.syncReturn.then(function () {
              expect(spec.cacheControl.storeResponse).to.have.been.calledOnce
                .and.calledWith(spec.modelUrl, spec.serverResponse);
              done();
            });
          });
        });

        describe("when the sync rejects", function () {
          beforeEach(function () {
            this.sinon.spy(this.cacheControl, 'trigger');
            this.ajax.reject();
          });

          it("triggers a cache:error:[key] event", function (done) {
            spec = this;
            this.syncReturn.then(function () {
              expect(spec.cacheControl.trigger).to.have.been.calledOnce
                .and.calledWith(spec.expectedErrorEvent);
              done();
            });
          });

          it("invalidates the cache", function (done) {
            this.syncReturn.then(function () {
              expect(spec.store.invalidate).to.have.been.calledOnce
                .and.calledWith(spec.modelUrl);
              done();
            });
          });
        });
      });

      describe("cache expiration", function () {
        beforeEach(function () {
          this.storedResponse = JSON.stringify({
            meta: { expires: Date.now() - 10000 },
            data: {}
          });
          this.sinon.stub(this.localStorage, 'getItem').withArgs(this.modelUrl)
            .returns(this.storedResponse);
          this.sinon.stub(this.localStorage, 'removeItem');
          this.cacheExpire = this.cacheControl.sync('read', this.model, this.options);
        });

        it("evicts the cache item", function () {
          expect(this.localStorage.removeItem).to.have.been.calledOnce
            .and.calledWith(this.modelUrl);
        });

        it("returns the result of the underlying model's read", function () {
          this.modelSync = this.model.sync('read', this.model, this.options);
          expect(this.cacheExpire).to.eql(this.modelSync);
        });
      });

      describe("on a cache hit", function () {
        describe("when the cache contains data", function () {
          beforeEach(function () {
            this.sinon.stub(this.localStorage, 'getItem').withArgs(this.modelUrl)
              .returns(this.storedResponse);
            this.cacheHitRead = this.cacheControl.sync('read', this.model, this.options);
          });

          it("calls the provided success function with the response", function (done) {
            this.cacheHitRead.then(function () {
              expect(spec.success).to.have.been.calledOnce
                .and.calledWith(spec.serverResponse);
              done();
            });
          });
        });

        describe("when the cache contains a placeholder", function () {
          beforeEach(function () {
            this.sinon.stub(this.localStorage, 'getItem').withArgs(this.modelUrl)
              .returns(this.placeholder);
            this.cacheHitRead = this.cacheControl.sync('read', this.model, this.options);
          });

          it("does not call the provided success method", function () {
            expect(this.success).not.to.have.been.called;
          });

          it("calls the success method when the promise resolves", function (done) {
            this.cacheControl.trigger(this.expectedEvent, this.serverResponse);
            this.cacheHitRead.then(function () {
              expect(spec.success).to.have.been.calledOnce
                .and.calledWith(spec.serverResponse);
              done();
            });
          });

          it("calls the error method when the promise rejects", function (done) {
            this.cacheControl.trigger(this.expectedErrorEvent);
            this.cacheHitRead.then(function () {
              expect(spec.error).to.have.been.calledOnce;
              done();
            });
          });
        });
      });
    });

    describe("with method delete", function () {
      beforeEach(function () {
        this.sinon.spy(this.cacheControl, 'onDelete');
        this.cacheControl.sync('delete', this.model, this.options);
      });

      it("calls onDelete", function () {
        expect(this.cacheControl.onDelete).to.have.been.calledOnce
          .and.calledWith(this.model, this.options);
      });

      it("invalidates the cache", function () {
        expect(this.store.invalidate).to.have.been.calledOnce
          .and.calledWith(this.modelUrl);
      });

      it("calls sync on the model", function () {
        expect(this.model.sync).to.have.been.calledOnce
          .and.calledWith('delete', this.model, this.options);
      });
    });
  });
});