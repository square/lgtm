import resolve from './support/resolve.js';
import { ObjectValidator, helpers } from './lgtm.js';
import { deepEqual, fail, strictEqual } from 'assert';

let { present } = helpers.core;

let object;
let validator;

describe('ObjectValidator', function() {
  beforeEach(() => {
    object = {};
    validator = new ObjectValidator();
  });

  it('calls back when given a callback', (done) => {
    let returnValue = validator.validate(object, (err, result) => {
      strictEqual(result.valid, true);
      done();
    });
    strictEqual(returnValue, undefined);
  });

  it('returns a promise when no callback is given', () => {
    let returnValue = validator.validate(object);
    return returnValue.then(result => strictEqual(result.valid, true));
  });

  it('can validate a specific list of attributes', () => {
    validator.addValidation('firstName', present, 'Missing first name!');
    validator.addValidation('lastName', present, 'Missing last name!');

    return validator.validate(object).then(result => {
      deepEqual(
        result,
        {
          valid: false,
          errors: {
            firstName: ['Missing first name!'],
            lastName: ['Missing last name!']
          }
        }
      );

      return validator.validate(object, 'firstName').then(result => {
        deepEqual(
          result,
          {
            valid: false,
            errors: {
              firstName: ['Missing first name!']
            }
          }
        );
      });
    });
  });

  it('returns a hash of empty error arrays when valid', () => {
    validator.addValidation('firstName', present, 'Missing first name!');
    validator.addValidation('lastName', present, 'Missing last name!');

    return validator.validate({ firstName: 'Bah', lastName: 'Humbug' }).then(result => {
      deepEqual(
        result,
        {
          valid: true,
          errors: {
            firstName: [],
            lastName: []
          }
        }
      );
    });
  });

  it('passes the validation function the value, key, object, and options being validated', () => {
    let options = { transaction: {} };

    object.firstName = 'Han';

    validator.addValidation('firstName', function(value, key, obj, opts) {
      strictEqual(arguments.length, 4, 'passes four arguments');
      strictEqual(value, 'Han', '1st argument is value');
      strictEqual(key, 'firstName', '2nd argument is key');
      strictEqual(obj, object, '3rd argument is object');
      strictEqual(opts, options, '4th argument is options');
    });

    return validator.validate(object, options);
  });

  it('passes the validation function empty options by default', () => {
    validator.addValidation('firstName', function(value, key, obj, opts) {
      strictEqual(arguments.length, 4, 'passes four arguments');
      deepEqual(opts, {}, '4th argument is empty options');
    });

    return validator.validate(object);
  });

  it('validates as valid when validating attributes with no registered validations', () => {
    return validator.validate(object, 'iDoNotExist').then(result => {
      deepEqual(result, { valid: true, errors: {} });
    });
  });

  it('allows registering dependencies between attributes', () => {
    // always invalid, easy to test
    validator.addValidation('spouseName', (() => false), 'No name is good enough.');
    validator.addDependentsFor('maritalStatus', 'spouseName');

    return validator.validate(object, 'maritalStatus').then(result => {
      deepEqual(
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

  it('can provide a list of all attributes it is interested in', () => {
    validator.addValidation('street1', (() => false), 'Whatever.');
    validator.addValidation('street2', (() => false), 'Whatever.');
    validator.addDependentsFor('mobile', 'street1', 'street2');

    deepEqual(validator.attributes().sort(), ['mobile', 'street1', 'street2']);
  });

  it('passes exceptions thrown by validations as the first argument to the callback', () => {
    validator.addValidation('firstName', () => { throw new Error('OH NO!'); });

    return validator.validate(object, (err, result) => {
      strictEqual(err.message, 'OH NO!', 'passes the thrown error through');
      strictEqual(result, undefined);
    });
  });

  it('passes exceptions through as a rejected promise', () => {
    validator.addValidation('firstName', () => { throw new Error('OH NO!'); });

    return validator.validate(object).then(
      () => {
        fail('this function should not have been called');
      },
      (err) => {
        strictEqual(err.message, 'OH NO!', 'passes the thrown error through');
      }
    );
  });

  context('with validations that return immediately', () => {
    beforeEach(() => {
      validator.addValidation('firstName',
        (firstName => firstName === 'Han'),
        `Sorry, your first name isn't Han.`);
      validator.addValidation('lastName',
        (lastName => lastName === 'Solo'),
        `Sorry, your last name isn't Solo.`);
    });

    itValidatesAsExpected();
  });

  context('with validations that return eventually', function() {
    beforeEach(() => {
      validator.addValidation('firstName',
        (firstName => resolve(firstName === 'Han')),
        `Sorry, your first name isn't Han.`);
      validator.addValidation('lastName',
        (lastName => resolve(lastName === 'Solo')),
        `Sorry, your last name isn't Solo.`);
    });

    itValidatesAsExpected();
  });
});

function itValidatesAsExpected() {
  it('resolves the promise correctly', () => {
    return validator.validate(object);
  });

  it('yields the validation results correctly', () => {
    object.lastName = 'Solo';
    return validator.validate(object).then((result) => {
      deepEqual(
        result,
        {
          valid: false,
          errors: {
            firstName: [`Sorry, your first name isn't Han.`],
            lastName: []
          }
        }
      );
    });
  });
}
