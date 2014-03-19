/* jshint undef:true */
/* global QUnit, describe, it, expect, before, after, fail, throws */
/* global LGTM */

describe('LGTM.helpers.(un)register', function() {
  after(function() {
    LGTM.helpers.unregister('isBob');
  });

  it('allow registering a custom helper for use in the builder DSL', function() {
    QUnit.expect(0);

    LGTM.helpers.register('isBob', function(message) {
      this.using(function(value){ return value === 'Bob'; }, message);
    });

    // this would throw if the above didn't work, hence expect(0)
    LGTM.validator().validates('name').isBob("You must be Bob.").build();
  });

  it('fails when delegating to using() without a message', function() {
    LGTM.helpers.register('isBob', function(message) {
      this.using(function(value){ return value === 'Bob'; } /* note I don't pass message here */);
    });

    throws(function() {
      LGTM.validator().validates('name').isBob("You must be Bob.").build();
    }, 'using() should have thrown an exception');
  });

  it('unregistering makes the helper unavailable to the builder DSL', function() {
    LGTM.helpers.register('isBob', function(message) {
      this.using(function(value){ return value === 'Bob'; }, message);
    });

    LGTM.helpers.unregister('isBob');

    throws(function() {
      LGTM.validator().validates('name').isBob("You must be Bob.").build();
    }, "unregister() makes the helper unavailable");
  });
});
