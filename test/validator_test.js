/* jshint undef:true */
/* global QUnit, throws, start, stop */
/* global describe, context, it, lazy, expect, before, after, fail */
/* global LGTM */
/* global resolve */

var validator       = LGTM.validator;
var ObjectValidator = LGTM.ObjectValidator;

describe('validator', function() {
  context('with a basic `required` validation', function() {
    before(function() {
      this.validator = validator()
        .validates('name')
          .required('You must provide a name.')
        .build();
    });

    it('provides an easy way to build a validator', function() {
      QUnit.expect(2);

      this.validator.validate({}).then(function(result) {
        start();
        expect(result.valid).to.be.false();
        expect(result.errors).to.eql({ name: ['You must provide a name.'] });
      });
      stop();
    });

    it('returns an ObjectValidator', function() {
      expect(this.validator instanceof ObjectValidator).to.be.true();
    });
  });

  describe('#paramCoreValidators', function() {
    before(function() {
      this.validator = validator()
        .validates('theString')
          .minLength(5, 'too short')
        .build();
    });

    it('performs validation with specified param in mind', function() {
      QUnit.expect(1);

      this.validator.validate({ theString: '1234' }).then(function(result) {
        start();
        expect(result).to.eql({
          valid: false,
          errors: {
            theString: ['too short']
          }
        });
      });
      stop();
    });
  });

  describe('#using', function() {
    before(function() {
      this.validator = validator()
        .validates('password')
          .using('password', 'passwordConfirmation',
                 function(password, passwordConfirmation) {
                   return password === passwordConfirmation;
                 }, 'Passwords must match.')
        .build();
    });

    it('passes declared dependencies', function() {
      QUnit.expect(1);

      this.validator.validate({ password: 'abc123', passwordConfirmation: 'abc123' }).then(function(result) {
        start();
        expect(result).to.eql({
          valid: true,
          errors: {
            password: []
          }
        }, 'dependent values are passed in');
      });
      stop();
    });

    it('causes dependent attributes to be validated, even when not specified explicitly', function() {
      QUnit.expect(2);

      // we're leaving out "password" but it gets validated anyway because it
      // depends on "passwordConfirmation"
      this.validator.validate({ password: 'abc123' }, 'passwordConfirmation').then(function(result) {
        start();
        expect(result).to.eql({
          valid: false,
          errors: {
            password: ["Passwords must match."],
            passwordConfirmation: []
          }
        });
      });
      stop();

      this.validator.validate({ password: 'abc123', passwordConfirmation: 'abc123' }, 'passwordConfirmation').then(function(result) {
        start();
        expect(result).to.eql({
          valid: true,
          errors: {
            password: [],
            passwordConfirmation: []
          }
        }, 'returns empty error messages for dependent attributes as well');
      });
      stop();
    });
  });

  describe('validator#when', function() {
    lazy('object', function(){ return {}; });

    before(function() {
      this.validator =
        validator()
          .validates('age')
            .when(function(age){ return age % 2 === 0; })
              .using(function(age){ return age > 12; }, "You must be at least 13 years old.")
          .validates('name')
            .required("You must provide a name.")
          .build();
    });

    it('allows conditionally running validations', function() {
      QUnit.expect(2);

      var self = this;

      self.object.age = 10; // even numbered ages are validated

      self.validator.validate(self.object).then(function(result) {
        start();
        expect(result).to.eql({
          valid: false,
          errors: {
            name: ["You must provide a name."],
            age:  ["You must be at least 13 years old."]
          }
        }, 'validations matching their when clause are run');

        self.object.age = 7; // odd numbered ages aren't validated

        self.validator.validate(self.object).then(function(result) {
          start();
          expect(result).to.eql({
            valid: false,
            errors: {
              name: ["You must provide a name."],
              age: []
            }
          }, 'validations not matching their clause are not run');
        });
        stop();
      });

      stop();
    });

    it('allows conditionals that return promises', function() {
      QUnit.expect(2);

      var self = this;

      self.validator =
        validator()
          .validates('name')
            .when(function(name){ return resolve(name.length % 2 !== 0); })
              .using(function(name){ return name === 'Han'; }, "Your name is not Han!")
          .build();

      self.object.name = 'Brian'; // odd length names are validated

      self.validator.validate(self.object).then(function(result) {
        start();
        expect(result).to.eql({
          valid: false,
          errors: {
            name: ["Your name is not Han!"]
          }
        });

        self.object.name = 'Fred'; // even length names are not validated

        self.validator.validate(self.object).then(function(result) {
          start();
          expect(result).to.eql({
            valid: true,
            errors: {
              name: []
            }
          }, 'promise conditions are respected');
        });
        stop();
      });
      stop();
    });

    it('passes declared dependencies', function() {
      QUnit.expect(5);

      var object = {
        name : 'Brian',
        age  : 30
      };

      var v =
        validator()
          .validates('name')
            .when('name', 'age', 'unset', function(name, age, unset, key, obj) {
              expect(name).to.equal('Brian');
              expect(age).to.equal(30);
              expect(unset).to.be.undefined();
              expect(key).to.equal('name');
              expect(obj).to.equal(object);
              return false;
            })
            .required("You must enter a name.")
          .build();

      v.validate(object).then(function(result) {
        start();
      });

      stop();
    });

    it('causes dependent attributes to be validated, even when not specified explicitly', function() {
      QUnit.expect(3);

      var v =
        validator()
          .validates('name')
            .when('age', function(){ return true; })
              .required('You must enter a name.')
          .build();

      // we leave out "name" but it is validated anyway because it depends on "age"
      v.validate({}, 'age').then(function(result) {
        start();
        expect(result).to.eql({
          valid: false,
          errors: {
            age: [],
            name: ['You must enter a name.']
          }
        });
      });
      stop();


      v =
        validator()
          .validates('name')
            .when('age', function(){ return true; })
              .required('You must enter a name.')
          .validates('age')
            .when('isBorn', function(isBorn){ return isBorn; })
              .required('You must have an age if you have been born.')
          .build();

      // we leave out "name" and "age" but they are validated anyway because they
      // both depend on "isBorn", either directly or transitively
      v.validate({ isBorn: true }, 'isBorn').then(function(result) {
        start();
        expect(result).to.eql({
          valid: false,
          errors: {
            isBorn: [],
            name: ['You must enter a name.'],
            age: ['You must have an age if you have been born.']
          }
        });
      });
      stop();

      v.validate({ isBorn: true, name: "Winnie the Pooh", age: 10 }, 'isBorn').then(function(result) {
        start();
        expect(result).to.eql({
          valid: true,
          errors: {
            isBorn: [],
            name: [],
            age: []
          }
        }, 'returns empty error messages for dependent attributes as well');
      });
      stop();
    });

    it('used with #using specifying attributes in both', function() {
      var v = validator()
            .validates('passwordConfirmation')
              .when('password', function(password){ return password && password.length > 0; })
              .using('password', 'passwordConfirmation', function(password, passwordConfirmation) {
                return password === passwordConfirmation;
              }, 'Passwords must match!')
            .build();

      v.validate({ password: 'letmein' }, 'password').then(function(result) {
        start();
        expect(result).to.eql({
          valid: false,
          errors: {
            password: [],
            passwordConfirmation: ['Passwords must match!']
          }
        }, 'returns the correct results for all attributes');
      });
      stop();
    });

    it('is used by #optional to prevent subsequent validations from firing when a value is absent', function() {
      var v = validator()
            .validates('email')
              .optional()
              .email('That is no email!')
            .build();

      v.validate({ email: ' ' }).then(function(result) {
        start();
        expect(result).to.eql({
          valid: true,
          errors: {
            email: []
          }
        }, 'accepts missing values as valid');
      });
      stop();
    });

    it('may be used multiple times', function() {
      var shouldValidate;
      var v = validator()
            .validates('email')
              .optional() // this is a .when() call internally
              .when(function(email) { return shouldValidate; })
              .email('That is no email!')
            .build();

      // start off with the first .when() returning false, the second true
      shouldValidate = true;
      v.validate({ email: '' }).then(function(result) {
        expect(result).to.eql({
          valid: true,
          errors: {
            email: []
          }
        }, 'subsequent .when() calls do not clobber previous ones');

        // now make the first .when() return true, the second false
        shouldValidate = false;
        v.validate({ email: 'I am not an email' }).then(function(result) {
          expect(result).to.eql({
            valid: true,
            errors: {
              email: []
            }
          }, 'does not validate if any .when() call returns falsy');

          // now they should both return true, triggering validation
          shouldValidate = true;
          v.validate({ email: 'I am not an email' }).then(function(result) {
            expect(result).to.eql({
              valid: false,
              errors: {
                email: ['That is no email!']
              }
            }, 'validates as normal when all .when() calls return truthy');
            start();
          });
        });
      });
      stop();
    });

    it('only affects .using() calls after it in the chain', function() {
      var v = validator()
            .validates('password')
              .using(function(password){ return password === 'zanzabar'; }, 'Nope!')
              .when(function(){ return false; })
            .build();

      v.validate({ email: '' }).then(function(result) {
        start();
        expect(result).to.eql({
          valid: false,
          errors: {
            password: ['Nope!']
          }
        }, 'validates without any conditions added after the .using() call');
      });
      stop();
    });
  });

  describe('#and', function() {
    it('is an alias for #when', function() {
      QUnit.expect(1);

      var v = validator()
            .validates('name')
              .when(function(name){ return true; })
              .and(function(name){ return false; })
              .required('You must enter a name!')
            .build();

      v.validate({ name: null }).then(function(result) {
        start();
        expect(result).to.eql({
          valid: true,
          errors: {
            name: []
          }
        }, 'skips validating when .and() callback returns false');
      });
      stop();
    });
  });
});
