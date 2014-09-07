'use strict';

var when = require('when');
var Store = require('src/store');
var Policy = require('src/policy');
var Backbone = require('backbone');
var DeleteStrategy = require('src/strategies/delete');

describe("Delete Strategy", function () {
  beforeEach(function () {
    this.store = new Store();
    this.sinon.stub(this.store, 'invalidate').returns(when.resolve());

    this.policy = new Policy();
    this.key = 'key';
    this.sinon.stub(this.policy, 'getKey').returns(this.key);

    this.Model = Backbone.Model.extend({ url: this.key });
    this.model = new this.Model();
    this.sinon.spy(this.model, 'sync');

    this.options = {
      success: this.sinon.stub(),
      error: this.sinon.stub()
    };

    this.strategy = new DeleteStrategy({
      store: this.store,
      policy: this.policy
    });

    this.execution = this.strategy.execute(this.model, this.options);
  });

  it("returns the sync deferred", function () {
    expect(this.execution).to.equal(this.ajaxResponse);
  });

  it("invalidates the cache", function () {
    expect(this.store.invalidate).to.have.been.calledOnce
      .and.calledWith(this.key);
  });
});
