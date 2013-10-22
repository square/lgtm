QUnit.module("LGTM.helpers.(un)register", {
  teardown: function() {
    LGTM.helpers.unregister('isBob');
  }
});

test("allow registering a custom helper for use in the builder DSL", function() {
  expect(0);

  LGTM.helpers.register('isBob', function(message) {
    this.using(function(value){ return value === 'Bob'; }, message);
  });

  // this would throw if the above didn't work, hence expect(0)
  LGTM.validator().validates('name').isBob("You must be Bob.").build();
});

test("fails when delegating to using() without a message", function() {
  LGTM.helpers.register('isBob', function(message) {
    this.using(function(value){ return value === 'Bob'; } /* note I don't pass message here */);
  });

  throws(function() {
    LGTM.validator().validates('name').isBob("You must be Bob.").build();
  }, "using() throws when not given a message");
});

test("unregistering makes the helper unavailable to the builder DSL", function() {
  LGTM.helpers.register('isBob', function(message) {
    this.using(function(value){ return value === 'Bob'; }, message);
  });

  LGTM.helpers.unregister('isBob');

  throws(function() {
    LGTM.validator().validates('name').isBob("You must be Bob.").build();
  }, "unregister() makes the helper unavailable");
});
