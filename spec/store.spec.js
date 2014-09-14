'use strict';

var when = require('when');
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

    this.key = 'key';
    this.value = { myValue: true };
    this.stringValue = JSON.stringify(this.value);
  });

  describe("set", function () {
    describe("when it succeeds", function () {
      beforeEach(function () {
        this.result = this.store.set(this.key, this.value);
      });

      it("stores the provided value in JSON form", function () {
        expect(this.store.backend.setItem).to.have.been.calledOnce
          .and.calledWith(this.key, this.stringValue);
      });

      it("resolves the returned promise", function (done) {
        this.result.then(function (storedResult) {
          done();
        });
      });
    });

    describe("when it fails", function () {
      beforeEach(function () {
        this.store.backend.setItem.withArgs(this.key, this.stringValue).throws();
        this.result = this.store.set(this.key, this.value);
      });

      it("rejects the returnd promise", function (done) {
        this.result.then(function () {}, function () { done(); });
      });
    });
  });

  describe("get", function () {
    describe("when it succeeds", function () {
      beforeEach(function () {
        this.store.backend.getItem.withArgs(this.key).returns(this.stringValue);
        this.result = this.store.get(this.key);
      });

      it("resolves the returned promise with the stored value", function (done) {
        var spec = this;
        this.result.then(function (returnedResult) {
          expect(returnedResult).to.eql(spec.value);
          done();
        });
      });
    });

    describe("when it fails", function () {
      beforeEach(function () {
        this.store.backend.getItem.withArgs(this.key).returns(null);
        this.result = this.store.get(this.key);
      });

      it("rejects the returnd promise", function (done) {
        this.result.then(function () {}, function () { done(); });
      });
    });
  });

  describe("invalidate", function () {
    beforeEach(function () {
      this.result = this.store.invalidate(this.key);
    });

    it("removes the item from the cache", function () {
      expect(this.store.backend.removeItem).to.have.been.calledOnce
        .and.calledWith(this.key);
    });

    it("resolves the returned promise", function (done) {
      this.result.then(function () { done(); });
    });
  });
});