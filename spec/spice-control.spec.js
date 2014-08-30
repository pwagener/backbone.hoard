'use strict';

var Backbone = require('backbone');
var SpiceControl = require('./support/spice-control');

describe("SpiceControl", function () {
  describe("construction", function () {
    beforeEach(function () {
      this.store = new Backbone.Model();
      this.backend = this.sinon.stub();
      this.options = {
        store: this.store,
        backend: this.backend
      };
      this.initializeSpy = this.sinon.spy(SpiceControl.prototype, 'initialize');
      this.spiceControl = new SpiceControl(this.options);
    });

    it("should create a SpiceControl", function () {
      expect(this.spiceControl).to.be.instanceOf(SpiceControl);
    });

    it("should assign the provided store", function () {
      expect(this.spiceControl.store).to.equal(this.store);
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
      this.Model = Backbone.Model.extend({
        url: 'theUrl'
      });

      this.spiceControl = new SpiceControl({ store: new this.Model() });
      this.key = this.spiceControl.generateKey();
    });

    it("should return the result of the url, by default", function () {
      expect(this.key).to.equal('theUrl');
    });
  });

  describe("invalidate", function () {
    beforeEach(function () {
      this.Model = Backbone.Model.extend({
        url: function () {
          return 'theUrl';
        }
      });

      this.spiceControl = new SpiceControl({ store: new this.Model() });
      this.sinon.spy(this.spiceControl, 'generateKey');
      this.sinon.stub(this.localStorage, 'removeItem');

      this.method = 'read';
      this.spiceControl.invalidate(this.method);
    });

    it("calls generateKey with the provided method", function () {
      expect(this.spiceControl.generateKey).to.have.been.calledOnce
        .and.calledWith(this.method);
    });

    it("removes the key returned from generateKey from the backend", function () {
      expect(this.localStorage.removeItem).to.have.been.calledOnce
        .and.calledWith('theUrl');
    });
  });
});