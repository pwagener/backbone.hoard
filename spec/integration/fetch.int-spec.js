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

    this.requests = {};
    this.endpoint = /\/value-plus-one\/(.+)/;
    this.server.respondWith('GET', this.endpoint, function (xhr) {
      var urlRequests = this.requests[xhr.url] || [];
      urlRequests.push(xhr);
      this.requests[xhr.url] = urlRequests;
      var value = +xhr.url.match(this.endpoint)[1];
      var newValue = value + 1;
      xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ value: newValue }));
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
        expect(this.requests['/value-plus-one/1']).to.have.length(1);
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
        expect(this.requests['/value-plus-one/1']).to.have.length(1);
      });
    });
  });
});