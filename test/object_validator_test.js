var ObjectValidator = LGTM.ObjectValidator;
var core            = LGTM.helpers.core;

QUnit.module('ObjectValidator', {
  setup: function() {
    this.object    = {};
    this.validator = new ObjectValidator();
  }
});

test('calls back when given a callback', function() {
  expect(2);

  var returnValue = this.validator.validate(this.object, function(err, result) {
    start();
    ok(result.valid, 'properly returns results');
  });
  ok(!returnValue, 'has no return value');
  stop();
});

test('returns a promise when no callback is given', function() {
  expect(1);

  var returnValue = this.validator.validate(this.object);
  returnValue.then(function(result) {
    start();
    ok(result.valid, 'properly returns results');
  });
  stop();
});

test('can validate a specific list of attributes', function() {
  expect(2);

  this.validator.addValidation('firstName', core.present, "Missing first name!");
  this.validator.addValidation('lastName', core.present, "Missing last name!");

  this.validator.validate(this.object).then(function(result) {
    start();
    deepEqual(result, {
      valid: false,
      errors: {
        firstName: ["Missing first name!"],
        lastName: ["Missing last name!"]
      }
    });
  });
  stop();

  this.validator.validate(this.object, 'firstName').then(function(result) {
    start();
    deepEqual(result, {
      valid: false,
      errors: {
        firstName: ["Missing first name!"]
      }
    });
  });
  stop();
});

test('returns a hash of empty error arrays when valid', function() {
  expect(1);

  this.validator.addValidation('firstName', core.present, 'Missing first name!');
  this.validator.addValidation('lastName', core.present, 'Missing last name!');

  this.validator.validate({ firstName: 'Bah', lastName: 'Humbug' }).then(function(result) {
    start();
    deepEqual(result, {
      valid: true,
      errors: {
        firstName: [],
        lastName: []
      }
    });
  });
  stop();
});

test('passes the validation function the value, key, and object being validated', function() {
  expect(4);

  var object = this.object;
  object.firstName = 'Han';

  this.validator.addValidation('firstName', function(value, key, obj) {
    start();
    strictEqual(arguments.length, 3, 'passes three arguments');
    strictEqual(value, 'Han',       '1st argument is value');
    strictEqual(key,   'firstName', '2nd argument is key');
    strictEqual(obj,   object, '3rd argument is object');
  });

  this.validator.validate(object);
  stop();
});

test('validates as valid when validating attributes with no registered validations', function() {
  expect(1);

  this.validator.validate(this.object, 'iDoNotExist').then(function(result) {
    start();
    deepEqual(result, { valid: true, errors: {} });
  });
  stop();
});

test('allows registering dependencies between attributes', function() {
  expect(1);

  // always invalid, easy to test
  this.validator.addValidation('spouseName', function(){ return false; }, 'No name is good enough.');
  this.validator.addDependentsFor('maritalStatus', 'spouseName');

  this.validator.validate(this.object, 'maritalStatus').then(function(result) {
    start();
    deepEqual(result, {
      valid: false,
      errors: {
        maritalStatus: [],
        spouseName: ['No name is good enough.']
      }
    });
  });
  stop();
});

test('can provide a list of all attributes it is interested in', function() {
  this.validator.addValidation('street1', function(){ return false; }, 'Whatever.');
  this.validator.addValidation('street2', function(){ return false; }, 'Whatever.');
  this.validator.addDependentsFor('mobile', 'street1', 'street2');

  deepEqual(this.validator.attributes().sort(), ['mobile', 'street1', 'street2']);
});

test('passes exceptions thrown by validations as the first argument to the callback', function() {
  expect(2);

  this.validator.addValidation('firstName', function(){ throw new Error("OH NO!"); });

  this.validator.validate(this.object, function(err, result) {
    start();
    equal(err.message, "OH NO!", "passes the thrown error through");
    ok(!result, "does not send any result");
  });
  stop();
});

test('passes exceptions through as a rejected promise', function() {
  expect(1);

  this.validator.addValidation('firstName', function(){ throw new Error("OH NO!"); });

  this.validator.validate(this.object).then(
    function() {
      start();
      ok(false, 'this function should not have been called');
    },
    function(err) {
      start();
      equal(err.message, "OH NO!", "passes the thrown error through");
    }
  );
  stop();
});

function testValidatesAsExpected() {
  test('resolves the promise correctly', function() {
    expect(1);

    var called = false;
    this.validator.validate(this.object).then(function(result) {
      called = true;
      start();
    });
    ok(!called, 'the promise is not resolved synchronously');
    stop();
  });

  test('yields the validation results correctly', function() {
    expect(1);

    this.object.lastName = 'Solo';
    this.validator.validate(this.object).then(function(result) {
      deepEqual(result, {
        valid: false,
        errors: {
          firstName: ["Sorry, your first name isn't Han."],
          lastName: []
        }
      });
      start();
    });
    stop();
  });
}

QUnit.module('ObjectValidator with validations that return immediately', {
  setup: function() {
    this.object    = {};
    this.validator = new ObjectValidator();

    this.validator.addValidation('firstName',
      function(firstName){ return firstName === 'Han'; },
      "Sorry, your first name isn't Han.");
    this.validator.addValidation('lastName',
      function(lastName){ return lastName === 'Solo'; },
      "Sorry, your last name isn't Solo.");
  }
});

testValidatesAsExpected();

QUnit.module('ObjectValidator with validations that return eventually', {
  setup: function() {
    this.object    = {};
    this.validator = new ObjectValidator();

    this.validator.addValidation('firstName',
      function(firstName){ return resolve(firstName === 'Han'); },
      "Sorry, your first name isn't Han.");
    this.validator.addValidation('lastName',
      function(lastName){ return resolve(lastName === 'Solo'); },
      "Sorry, your last name isn't Solo.");
  }
});

testValidatesAsExpected();
