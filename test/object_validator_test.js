const LGTM = require('./lgtm');
const ObjectValidator = LGTM.ObjectValidator;
const core = LGTM.helpers.core;
const assert = require('assert');

var object;
var validator;

describe('ObjectValidator', function() {
  beforeEach(function() {
    object = {};
    validator = new ObjectValidator();
  });

  it('calls back when given a callback', function(done) {
    const returnValue = validator.validate(object, function(err, result) {
      assert.strictEqual(result.valid, true);
      done();
    });
    assert.strictEqual(returnValue, undefined);
  });

  it('returns a promise when no callback is given', function(done) {
    const returnValue = validator.validate(object);
    returnValue.then(function(result) {
      assert.strictEqual(result.valid, true);
      done();
    });
  });

  it('can validate a specific list of attributes', function(done) {
    validator.addValidation('firstName', core.present, "Missing first name!");
    validator.addValidation('lastName', core.present, "Missing last name!");

    validator.validate(object).then(function(result) {
      assert.deepEqual(
        result,
        {
          valid: false,
          errors: {
            firstName: ["Missing first name!"],
            lastName: ["Missing last name!"]
          }
        }
      );

      validator.validate(object, 'firstName').then(function (result) {
        assert.deepEqual(
          result,
          {
            valid: false,
            errors: {
              firstName: ["Missing first name!"]
            }
          }
        );
        done();
      });
    });
  });

  it('returns a hash of empty error arrays when valid', function(done) {
    validator.addValidation('firstName', core.present, 'Missing first name!');
    validator.addValidation('lastName', core.present, 'Missing last name!');

    validator.validate({ firstName: 'Bah', lastName: 'Humbug' }).then(function(result) {
      assert.deepEqual(
        result,
        {
          valid: true,
          errors: {
            firstName: [],
            lastName: []
          }
        }
      );
      done();
    });
  });

  it('passes the validation function the value, key, and object being validated', function() {
    object.firstName = 'Han';

    validator.addValidation('firstName', function(value, key, obj) {
      assert.strictEqual(arguments.length, 3, 'passes three arguments');
      assert.strictEqual(value, 'Han', '1st argument is value');
      assert.strictEqual(key, 'firstName', '2nd argument is key');
      assert.strictEqual(obj, object, '3rd argument is object');
    });

    return validator.validate(object);
  });

  it('validates as valid when validating attributes with no registered validations', function() {
    return validator.validate(object, 'iDoNotExist').then(function(result) {
      assert.deepEqual(result, { valid: true, errors: {} });
    });
  });

  it('allows registering dependencies between attributes', function() {
    // always invalid, easy to test
    validator.addValidation('spouseName', function(){ return false; }, 'No name is good enough.');
    validator.addDependentsFor('maritalStatus', 'spouseName');

    return validator.validate(object, 'maritalStatus').then(function(result) {
      assert.deepEqual(
        result,
        {
          valid: false,
          errors: {
            maritalStatus: [],
            spouseName: ['No name is good enough.']
          }
        }
      );
    });
  });

  it('can provide a list of all attributes it is interested in', function() {
    validator.addValidation('street1', function(){ return false; }, 'Whatever.');
    validator.addValidation('street2', function(){ return false; }, 'Whatever.');
    validator.addDependentsFor('mobile', 'street1', 'street2');

    assert.deepEqual(validator.attributes().sort(), ['mobile', 'street1', 'street2']);
  });

  it('passes exceptions thrown by validations as the first argument to the callback', function() {
    validator.addValidation('firstName', function(){ throw new Error('OH NO!'); });

    return validator.validate(object, function(err, result) {
      assert.strictEqual(err.message, 'OH NO!', 'passes the thrown error through');
      assert.strictEqual(result, undefined);
    });
  });

  it('passes exceptions through as a rejected promise', function() {
    validator.addValidation('firstName', function(){ throw new Error('OH NO!'); });

    return validator.validate(object).then(
      function() {
        assert.fail('this function should not have been called');
      },
      function(err) {
        assert.strictEqual(err.message, 'OH NO!', 'passes the thrown error through');
      }
    );
  });

  context('with validations that return immediately', function() {
    beforeEach(function() {
      validator.addValidation('firstName',
        function(firstName){ return firstName === 'Han'; },
        "Sorry, your first name isn't Han.");
      validator.addValidation('lastName',
        function(lastName){ return lastName === 'Solo'; },
        "Sorry, your last name isn't Solo.");
    });

    itValidatesAsExpected();
  });

  context('with validations that return eventually', function() {
    beforeEach(function() {
      validator.addValidation('firstName',
        function(firstName){ return resolve(firstName === 'Han'); },
        "Sorry, your first name isn't Han.");
      validator.addValidation('lastName',
        function(lastName){ return resolve(lastName === 'Solo'); },
        "Sorry, your last name isn't Solo.");
    });

    itValidatesAsExpected();
  });
});

function itValidatesAsExpected() {
  it('resolves the promise correctly', function() {
    var called = false;
    return validator.validate(object).then(function(result) {
      called = true;
    });
    assert.ok(!called);
  });

  it('yields the validation results correctly', function() {
    object.lastName = 'Solo';
    return validator.validate(object).then(function(result) {
      assert.deepEqual(
        result,
        {
          valid: false,
          errors: {
            firstName: ["Sorry, your first name isn't Han."],
            lastName: []
          }
        }
      );
    });
  });
}

