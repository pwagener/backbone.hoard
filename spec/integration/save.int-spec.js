'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var Hoard = require('src/backbone.hoard');

describe("Saving", function () {
  beforeEach(function () {
    this.control = new Hoard.Control();
    this.urlRoot = '/models';
    this.Model = Backbone.Model.extend({
      urlRoot: this.urlRoot,
      sync: this.control.getModelSync()
    });
  });

  describe("for the first time", function () {
    beforeEach(function () {
      this.server.respondWith('POST', this.urlRoot, function (xhr) {
        this.storeRequest(xhr);
        var model = JSON.parse(xhr.requestBody);
        _.extend(model, { id: model.value });
        xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify(model));
      }.bind(this));

      this.server.respondWith('GET', '/models/1', function (xhr) {
        this.storeRequest(xhr);
        xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ id: -1, value: -1 }));
      }.bind(this));

      this.model = new this.Model({ value: 1 });

      return this.model.save();
    });

    it("populates the model with the response", function () {
      expect(this.model.get('id')).to.equal(1);
      expect(this.model.get('value')).to.equal(1);
    });

    it("populates the cache", function () {
      expect(JSON.parse(localStorage.getItem('/models/1'))).to.eql({ id: 1, value: 1 });
    });

    it("allows future fetches to read from the cache", function () {
      var model2 = new this.Model({ id: 1 });
      return model2.fetch().then(function () {
        expect(model2.get('id')).to.equal(1);
        expect(model2.get('value')).to.equal(1);
        expect(this.requests['GET:/models/1']).to.be.undefined;
      }.bind(this));
    });
  });
});