const LGTM = require('./lgtm');
const assert = require('assert');

describe('LGTM.helpers.(un)register', function() {
  afterEach(function() {
    LGTM.helpers.unregister('isBob');
  });

  it('allow registering a custom helper for use in the builder DSL', function() {
    LGTM.helpers.register('isBob', function(message) {
      this.using(function(value){ return value === 'Bob'; }, message);
    });

    // this would throw if the above didn't work
    LGTM.validator().validates('name').isBob("You must be Bob.").build();
  });

  it('unregistering makes the helper unavailable to the builder DSL', function() {
    LGTM.helpers.register('isBob', function(message) {
      this.using(function(value){ return value === 'Bob'; }, message);
    });

    LGTM.helpers.unregister('isBob');

    assert.throws(function() {
      LGTM.validator().validates('name').isBob("You must be Bob.").build();
    }, "unregister() makes the helper unavailable");
  });
});
