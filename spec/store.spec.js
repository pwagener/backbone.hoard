'use strict';

var _ = require('underscore');
var Hoard = require('src/backbone.hoard');
var Store = require('src/store');

describe("Store", function () {
  beforeEach(function () {
    Hoard.backend = {
      setItem: this.sinon.stub(),
      getItem: this.sinon.stub(),
      removeItem: this.sinon.stub()
    };

    this.store = new Store();
    this.sinon.stub(this.store.metaStore, 'set');
    this.sinon.stub(this.store.metaStore, 'invalidate').returns(Hoard.Promise.resolve());

    this.key = 'key';
    this.value = { myValue: true };
    this.meta = { myMeta: true };
    this.options = {};
    this.stringValue = JSON.stringify(this.value);
  });

  describe("set", function () {
    describe("when it succeeds", function () {
      beforeEach(function () {
        this.store.metaStore.set.withArgs(this.key, this.meta, this.options)
          .returns(Hoard.Promise.resolve());
        this.result = this.store.set(this.key, this.value, this.meta, this.options);
      });

      it("stores the provided value in JSON form", function () {
        expect(this.store.backend.setItem).to.have
          .been.calledWith(this.key, this.stringValue);
      });

      it("stores the provided metadata with the size of the stored item", function () {
        var expectedMeta = _.extend({ size: this.stringValue.length }, this.meta);
        expect(this.store.metaStore.set).to.have.been.calledOnce
          .and.calledWith(this.key, expectedMeta, this.options);
      });

      it("returns a resovled promise", function () {
        return expect(this.result).to.have.been.fulfilled;
      });
    });

    describe("when it fails to store the item", function () {
      beforeEach(function () {
        this.sinon.stub(this.store, 'invalidate').returns(Hoard.Promise.resolve());
        this.store.metaStore.set.returns(Hoard.Promise.resolve());
        this.store.backend.setItem.withArgs(this.key, this.stringValue).throws();
        this.result = this.store.set(this.key, this.value, this.meta, this.options);
      });

      it("invalidates the key", function (done) {
        var spec = this;
        this.result.catch(function () {
          expect(spec.store.invalidate).to.have.been.calledOnce
            .and.calledWith(spec.key, spec.options);
          done();
        });
      });

      it("returns a rejected promise", function () {
        return expect(this.result).to.have.been.rejected;
      });
    });
  });

  describe("when the meta store fails to store the metadata", function () {
    beforeEach(function () {
      this.sinon.stub(this.store, 'invalidate').returns(Hoard.Promise.resolve());
      this.store.metaStore.set.returns(Hoard.Promise.reject());
      this.result = this.store.set(this.key, this.value, this.meta, this.options);
    });

    it("invalidates the key", function () {
      return this.result.catch(function () {
        expect(this.store.invalidate).to.have.been.calledOnce
          .and.calledWith(this.key, this.options);
      }.bind(this));
    });

    it("returns a rejected promise", function () {
      return expect(this.result).to.have.been.rejected;
    });
  });

  describe("get", function () {
    describe("when it succeeds", function () {
      beforeEach(function () {
        this.store.backend.getItem.withArgs(this.key).returns(this.stringValue);
        this.result = this.store.get(this.key);
      });

      it("resolves the returned promise with the stored value", function () {
        return expect(this.result).to.eventually.eql(this.value);
      });
    });

    describe("when it fails", function () {
      beforeEach(function () {
        this.store.backend.getItem.withArgs(this.key).returns(null);
        this.result = this.store.get(this.key);
      });

      it("rejects the returnd promise", function () {
        return expect(this.result).to.have.been.rejected;
      });
    });
  });

  describe("invalidate", function () {
    beforeEach(function () {
      this.result = this.store.invalidate(this.key, this.options);
    });

    it("removes the item from the cache", function () {
      expect(this.store.backend.removeItem).to.have.been.calledOnce
        .and.calledWith(this.key);
    });

    it("invalidates the meta store entry for the key", function () {
      expect(this.store.metaStore.invalidate).to.have.been.calledOnce
        .and.calledWith(this.key, this.options);
    });

    it("returns a resolved promise", function () {
      return expect(this.result).to.have.been.fulfilled;
    });
  });

  describe("invalidateAll", function () {
    beforeEach(function () {
      var metaDataPromise = Hoard.Promise.resolve({ key1: 'true', key2: 'true' });
      this.sinon.stub(this.store.metaStore, 'getAll').returns(metaDataPromise);
      this.sinon.stub(this.store.metaStore, 'invalidateAll').returns(Hoard.Promise.resolve());
      this.result = this.store.invalidateAll();
    });

    it("removes each item present in the metadata", function (done) {
      this.result.then(function () {
        expect(this.store.backend.removeItem).to.have.been.calledWith('key1')
          .and.calledWith('key2');
        done();
      }.bind(this));
    });

    it("invalidates all metadata", function () {
      expect(this.store.metaStore.invalidateAll).to.have.been.calledOnce;
    });
  });

  describe("getAllMetadata", function () {
    beforeEach(function () {
      this.allMeta = { allMeta: true };
      this.sinon.stub(this.store.metaStore, 'getAll')
        .returns(Hoard.Promise.resolve(this.allMeta));
      this.result = this.store.getAllMetadata(this.options);
    });

    it("returns all metadata from the meta store", function () {
      return expect(this.result).to.eventually.eql(this.allMeta);
    });
  });
});