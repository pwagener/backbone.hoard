'use strict';

var Backbone = require('backbone');
var Policy = require('src/policy');

describe("Policy", function () {

  describe("getKey", function () {
    beforeEach(function () {
      this.Model = Backbone.Model.extend({ url: 'url' });
      this.model = new this.Model();
      this.policy = new Policy();
      this.key = this.policy.getKey(this.model);
    });

    it("should return the result of the url, by default", function () {
      expect(this.key).to.equal(this.model.url);
    });
  });

  describe("getMetadata", function () {
    describe("cache expiration", function () {
      beforeEach(function () {
        this.clock = this.sinon.useFakeTimers(5);
      });

      afterEach(function () {
        this.clock.restore();
      });

      it("sets expiration based on the expires property", function () {
        var policy = new Policy({ expires: 1234 });
        expect(policy.getMetadata()).to.eql({ expires: 1234 });
      });

      it("overrides the expires property with the options", function () {
        var policy = new Policy({ expires: 1234 });
        var meta = policy.getMetadata('key', 'response', { expires: 1 });
        expect(meta).to.eql({ expires: 1 });
      });

      it("uses the timeToLive property to calculate expires", function () {
        var policy = new Policy({ timeToLive: 10 });
        var meta = policy.getMetadata();
        expect(meta).to.eql({ expires: 15 });
      });

      it("overrides the expires property with the options", function () {
        var policy = new Policy({ timeToLive: 10 });
        var meta = policy.getMetadata('key', 'response', { timeToLive: 5});
        expect(meta).to.eql({ expires: 10 });
      });

      it("prefers expires to timeToLive", function () {
        var policy = new Policy({ expires: 100, timeToLive: 10 });
        var meta = policy.getMetadata();
        expect(meta).to.eql({ expires: 100 });
      });
    });
  });
});
