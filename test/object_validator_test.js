/* jshint undef:true */
/* global QUnit, throws, start, stop */
/* global describe, context, it, lazy, expect, before, after, fail */
/* global LGTM, RSVP */

var ObjectValidator = LGTM.ObjectValidator;
var core            = LGTM.helpers.core;

describe('ObjectValidator', function() {
  lazy('object', function(){ return {}; });
  lazy('validator', function(){ return new ObjectValidator(); });

  it('calls back when given a callback', function() {
    QUnit.expect(2);

    var returnValue = this.validator.validate(this.object, function(err, result) {
      start();
      expect(result.valid).to.be.true();
    });
    expect(returnValue).to.be.undefined();
    stop();
  });

  it('returns a promise when no callback is given', function() {
    QUnit.expect(1);

    var returnValue = this.validator.validate(this.object);
    returnValue.then(function(result) {
      start();
      expect(result.valid).to.be.true();
    });
    stop();
  });

  it('can validate a specific list of attributes', function() {
    QUnit.expect(2);

    this.validator.addValidation('firstName', core.present, "Missing first name!");
    this.validator.addValidation('lastName', core.present, "Missing last name!");

    this.validator.validate(this.object).then(function(result) {
      start();
      expect(result).to.eql({
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
      expect(result).to.eql({
        valid: false,
        errors: {
          firstName: ["Missing first name!"]
        }
      });
    });
    stop();
  });

  it('returns a hash of empty error arrays when valid', function() {
    QUnit.expect(1);

    this.validator.addValidation('firstName', core.present, 'Missing first name!');
    this.validator.addValidation('lastName', core.present, 'Missing last name!');

    this.validator.validate({ firstName: 'Bah', lastName: 'Humbug' }).then(function(result) {
      start();
      expect(result).to.eql({
        valid: true,
        errors: {
          firstName: [],
          lastName: []
        }
      });
    });
    stop();
  });

  it('passes the validation function the value, key, and object being validated', function() {
    QUnit.expect(4);

    var object = this.object;
    object.firstName = 'Han';

    this.validator.addValidation('firstName', function(value, key, obj) {
      start();
      expect(arguments.length).to.equal(3, 'passes three arguments');
      expect(value).to.equal('Han', '1st argument is value');
      expect(key).to.equal('firstName', '2nd argument is key');
      expect(obj).to.equal(object, '3rd argument is object');
    });

    this.validator.validate(object);
    stop();
  });

  it('validates as valid when validating attributes with no registered validations', function() {
    QUnit.expect(1);

    this.validator.validate(this.object, 'iDoNotExist').then(function(result) {
      start();
      expect(result).to.eql({ valid: true, errors: {} });
    });
    stop();
  });

  it('allows registering dependencies between attributes', function() {
    QUnit.expect(1);

    // always invalid, easy to test
    this.validator.addValidation('spouseName', function(){ return false; }, 'No name is good enough.');
    this.validator.addDependentsFor('maritalStatus', 'spouseName');

    this.validator.validate(this.object, 'maritalStatus').then(function(result) {
      start();
      expect(result).to.eql({
        valid: false,
        errors: {
          maritalStatus: [],
          spouseName: ['No name is good enough.']
        }
      });
    });
    stop();
  });

  it('can provide a list of all attributes it is interested in', function() {
    this.validator.addValidation('street1', function(){ return false; }, 'Whatever.');
    this.validator.addValidation('street2', function(){ return false; }, 'Whatever.');
    this.validator.addDependentsFor('mobile', 'street1', 'street2');

    expect(this.validator.attributes().sort()).to.eql(['mobile', 'street1', 'street2']);
  });

  it('passes exceptions thrown by validations as the first argument to the callback', function() {
    QUnit.expect(2);

    this.validator.addValidation('firstName', function(){ throw new Error('OH NO!'); });

    this.validator.validate(this.object, function(err, result) {
      start();
      expect(err.message).to.equal('OH NO!', 'passes the thrown error through');
      expect(result).not.to.be.defined();
    });
    stop();
  });

  it('passes exceptions through as a rejected promise', function() {
    QUnit.expect(1);

    this.validator.addValidation('firstName', function(){ throw new Error('OH NO!'); });

    this.validator.validate(this.object).then(
      function() {
        start();
        fail('this function should not have been called');
      },
      function(err) {
        start();
        expect(err.message).to.equal('OH NO!', 'passes the thrown error through');
      }
    );
    stop();
  });

  context('with validations that return immediately', function() {
    before(function() {
      this.validator.addValidation('firstName',
        function(firstName){ return firstName === 'Han'; },
        "Sorry, your first name isn't Han.");
      this.validator.addValidation('lastName',
        function(lastName){ return lastName === 'Solo'; },
        "Sorry, your last name isn't Solo.");
    });

    itValidatesAsExpected();
  });

  context('with validations that return eventually', function() {
    before(function() {
      this.validator.addValidation('firstName',
        function(firstName){ return resolve(firstName === 'Han'); },
        "Sorry, your first name isn't Han.");
      this.validator.addValidation('lastName',
        function(lastName){ return resolve(lastName === 'Solo'); },
        "Sorry, your last name isn't Solo.");
    });

    itValidatesAsExpected();
  });
});

function itValidatesAsExpected() {
  it('resolves the promise correctly', function() {
    QUnit.expect(1);

    var called = false;
    this.validator.validate(this.object).then(function(result) {
      called = true;
      start();
    });
    expect(called).to.be.false();
    stop();
  });

  it('yields the validation results correctly', function() {
    QUnit.expect(1);

    this.object.lastName = 'Solo';
    this.validator.validate(this.object).then(function(result) {
      expect(result).to.eql({
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

