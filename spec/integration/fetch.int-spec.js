'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var Hoard = require('src/backbone.hoard');

describe("Fetching", function () {
  beforeEach(function () {
    this.control = new Hoard.Control();
    this.Model = Backbone.Model.extend({
      url: function () {
        return '/value-plus-one/' + this.get('value');
      },
      sync: this.control.getModelSync()
    });

    this.endpoint = /\/value-plus-one\/(.+)/;
    this.server.respondWith('GET', this.endpoint, function (xhr) {
      this.storeRequest(xhr);
      var value = +xhr.url.match(this.endpoint)[1];
      var newValue = value + 1;

      if (isNaN(newValue)) {
        xhr.respond(400, { 'Content-Type': 'application/json' }, JSON.stringify({ value: 'Feed me numbers' }));
      } else {
        xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ value: newValue }));
      }
    }.bind(this));
  });

  describe("multiple times from the same url", function () {
    beforeEach(function () {
      this.m1 = new this.Model({ value: 1 });
      this.m2 = new this.Model({ value: 1 });
    });

    describe("synchronously", function () {
      beforeEach(function () {
        this.m1Promise = this.m1.fetch();
        this.m2Promise = this.m2.fetch();
        return Promise.all([this.m1Promise, this.m2Promise]);
      });

      it("populates all the models with the response", function () {
        expect(this.m1.get('value')).to.equal(2);
        expect(this.m2.get('value')).to.equal(2);
      });

      it("only calls the server once", function () {
        expect(this.requests['GET:/value-plus-one/1']).to.have.length(1);
      });

      it("doesn't call the server again on subsequent calls", function () {
        var m3 = new this.Model({ value: 1 });
        return m3.fetch().then(function () {
          expect(m3.get('value')).to.equal(2);
          expect(this.requests['GET:/value-plus-one/1']).to.have.length(1);
        }.bind(this));
      });

      it("populates the cache", function () {
        expect(localStorage.getItem('/value-plus-one/1')).to.equal(JSON.stringify({ value: 2 }));
      });
    });

    describe("asynchronously", function () {
      beforeEach(function () {
        var d1 = Hoard.defer();
        var d2 = Hoard.defer();

        _.defer(function () {
          this.m1Promise = this.m1.fetch();
          d1.resolve();
        }.bind(this));

        _.defer(function () {
          this.m2Promise = this.m2.fetch();
          d2.resolve();
        }.bind(this));

        return Promise.all([d1.prmoise, d2.promise]).then(function () {
          return Promise.all([this.m1Promise, this.m2Promise]);
        }.bind(this));
      });

      it("populates the models with the response", function () {
        expect(this.m1.get('value')).to.equal(2);
        expect(this.m2.get('value')).to.equal(2);
      });

      it("only calls the server once", function () {
        expect(this.requests['GET:/value-plus-one/1']).to.have.length(1);
      });
    });
  });

  describe("when the request fails", function () {
    beforeEach(function () {
      this.notANumber = 'not-a-number';
      this.m1 = new this.Model({ value: this.notANumber });
      this.m2 = new this.Model({ value: this.notANumber });
      return this.m1.fetch().catch(function () {
        return this.m2.fetch();
      }.bind(this)).catch(function () {});
    });

    it("does not populate the models", function () {
      expect(this.m1.get('value')).to.equal(this.notANumber);
      expect(this.m2.get('value')).to.equal(this.notANumber);
    });

    it("makes multiple calls to the server", function () {
      expect(this.requests['GET:/value-plus-one/not-a-number']).to.have.length(2);
    });
  });

  describe("when the cached value has expired", function () {
    beforeEach(function () {
      this.key = '/value-plus-one/1';
      this.control.store.set(this.key, { value: 'super-value' });
      this.control.store.metaStore.set(this.key, { expires: Date.now() - 1000 });
      this.m1 = new this.Model({ value: 1 });
      return this.m1.fetch();
    });

    it("sets it's value to the server response", function () {
      expect(this.m1.get('value')).to.equal(2);
    });

    it("sets the cache to the new value", function () {
      return expect(this.control.store.get(this.key)).to.eventually.eql({ value: 2 });
    });
  });
});