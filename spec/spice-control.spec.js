'use strict';

var Backbone = require('backbone');
var Spice = require('./support/spice');
var SpiceControl = require('./support/spice-control');

describe("SpiceControl", function () {
  var spec;

  beforeEach(function () {
    spec = this;
    this.spiceControl = new SpiceControl();
    this.modelUrl = 'theUrl';
    this.Model = Backbone.Model.extend({ url: this.modelUrl });
    this.sinon.stub(this.localStorage, 'setItem');
    this.serverResponse = { myResponse: true };
    this.storedResponse = JSON.stringify({ data: this.serverResponse });
    this.expectedEvent = 'cache:update:' + this.modelUrl;
  });

  describe("construction", function () {
    beforeEach(function () {
      this.backend = this.sinon.stub();
      this.options = {
        backend: this.backend
      };
      this.initializeSpy = this.sinon.spy(SpiceControl.prototype, 'initialize');
      this.spiceControl = new SpiceControl(this.options);
    });

    it("should create a SpiceControl", function () {
      expect(this.spiceControl).to.be.instanceOf(SpiceControl);
    });

    it("should assign the provided backend", function () {
      expect(this.spiceControl.backend).to.equal(this.backend);
    });

    it("should call initialize with the provided options", function () {
      expect(this.initializeSpy).to.have.been.calledOnce
        .and.calledOn(this.spiceControl)
        .and.calledWith(this.options);
    });
  });

  describe("generateKey", function () {
    beforeEach(function () {
      this.model = new this.Model();
      this.key = this.spiceControl.generateKey(this.model);
    });

    it("should return the result of the url, by default", function () {
      expect(this.key).to.equal(this.modelUrl);
    });
  });

  describe("storeResponse", function () {
    beforeEach(function () {
      this.sinon.spy(this.spiceControl, 'trigger');
      this.spiceControl.storeResponse(this.modelUrl, this.serverResponse);
    });

    it("writes to the cache", function () {
      expect(this.localStorage.setItem).to.have.been
        .calledWith(this.modelUrl, this.storedResponse);
    });

    it("triggers a cache:update:[key] event with the response", function () {
      expect(this.spiceControl.trigger).to.have.been
        .calledWith(this.expectedEvent, this.serverResponse);
    });
  });

  describe("invalidate", function () {
    beforeEach(function () {
      this.Model = Backbone.Model.extend({
        url: function () {
          return spec.modelUrl;
        }
      });
      this.model = new this.Model();

      this.spiceControl = new SpiceControl();
      this.sinon.spy(this.spiceControl, 'generateKey');
      this.sinon.stub(this.localStorage, 'removeItem');

      this.method = 'read';
      this.spiceControl.invalidate(this.model, this.method);
    });

    it("calls generateKey with the provided method", function () {
      expect(this.spiceControl.generateKey).to.have.been.calledOnce
        .and.calledWith(this.model, this.method);
    });

    it("removes the key returned from generateKey from the backend", function () {
      expect(this.localStorage.removeItem).to.have.been.calledOnce
        .and.calledWith(this.modelUrl);
    });
  });

  describe("sync", function () {
    beforeEach(function () {
      spec = this;
      this.model = new this.Model();

      this.ajax = Spice.deferred();
      this.syncResponse = this.ajax.promise.then(function () {
        spec.ajaxOptions.success(spec.serverResponse);
      });
      this.sinon.stub(Backbone, 'ajax', function (options) {
        spec.ajaxOptions = options;
        return spec.syncResponse;
      });

      this.success = this.sinon.stub();
      this.options = { success: this.success };
      this.placeholder = JSON.stringify({ placeholder: true });
      this.sinon.spy(this.spiceControl, 'storeResponse');
      this.sinon.spy(this.model, 'sync');
    });

    describe("with method create", function () {
      beforeEach(function () {
        this.sinon.spy(this.spiceControl, 'onCreate');
        this.sinon.stub(this.localStorage, 'getItem').returns(this.storedResponse);
        this.syncReturn = this.spiceControl.sync('create', this.model, this.options);
      });

      it("calls onCreate with the model and the options", function () {
        expect(this.spiceControl.onCreate).to.have.been.calledOnce
          .and.calledWith(this.model, this.options);
      });

      it("calls the underlying model's sync with the same arguments", function () {
        expect(this.model.sync).to.have.been.calledOnce
          .and.calledWith('create', this.model, this.options);
      });

      it("writes to the cache when the response returns", function (done) {
        this.ajax.resolve();
        this.syncReturn.then(function () {
          expect(spec.spiceControl.storeResponse).to.have.been.calledOnce
            .and.calledWith(spec.modelUrl, spec.serverResponse);
          done();
        });
      });
    });

    describe("with method read", function () {
      beforeEach(function () {
        spec = this;
        this.sinon.spy(this.spiceControl, 'onRead');
      });

      it("calls onRead with the model and the options", function () {
        this.spiceControl.sync('read', this.model, this.options);
        expect(this.spiceControl.onRead).to.have.been.calledOnce
          .and.calledWith(this.model, this.options);
      });

      it("reads the key from the cache", function () {
        this.sinon.stub(this.localStorage, 'getItem').returns(null);
        this.spiceControl.sync('read', this.model, this.options);
        expect(this.localStorage.getItem).to.have.been.calledOnce
          .and.calledWith(this.spiceControl.generateKey(this.model, 'read'));
      });

      describe("on a cache miss", function () {
        beforeEach(function () {
          this.sinon.stub(this.localStorage, 'getItem').returns(null);
          this.syncReturn = this.spiceControl.sync('read', this.model, this.options);
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
              expect(spec.spiceControl.storeResponse).to.have.been.calledOnce
                .and.calledWith(spec.modelUrl, spec.serverResponse);
              done();
            });
          });
        });
      });

      describe("on a cache hit", function () {
        describe("when the cache contains data", function () {
          beforeEach(function () {
            this.sinon.stub(this.localStorage, 'getItem')
              .withArgs(this.modelUrl).returns(this.storedResponse);
            this.cacheHitRead = this.spiceControl.sync('read', this.model, this.options);
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
            this.sinon.stub(this.localStorage, 'getItem')
              .withArgs(this.modelUrl).returns(this.placeholder);
            this.cacheHitRead = this.spiceControl.sync('read', this.model, this.options);
          });

          it("does not call the provided success method", function () {
            expect(this.success).not.to.have.been.called;
          });

          it("calls the success method when the promise resolves", function (done) {
            this.spiceControl.trigger(this.expectedEvent, this.serverResponse);
            this.cacheHitRead.then(function () {
              expect(spec.success).to.have.been.calledOnce
                .and.calledWith(spec.serverResponse);
              done();
            });
          });
        });
      });
    });
  });
});