const LGTM = require('../dist/lgtm');
const buildValidator = LGTM.validator;
const ObjectValidator = LGTM.ObjectValidator;
const assert = require('assert');

var validator;

describe('validator', function() {
  context('with a basic `required` validation', function() {
    beforeEach(function() {
      validator = buildValidator()
        .validates('name')
          .required('You must provide a name.')
        .build();
    });

    it('provides an easy way to build a validator', function(done) {
      validator.validate({}).then(function(result) {
        assert.ok(!result.valid);
        assert.deepEqual(result.errors, { name: ['You must provide a name.'] });
        done();
      });
    });

    it('returns an ObjectValidator', function() {
      assert.ok(validator instanceof ObjectValidator);
    });
  });

  describe('#paramCoreValidators', function() {
    beforeEach(function() {
      validator = buildValidator()
        .validates('theString')
          .minLength(5, 'too short')
        .build();
    });

    it('performs validation with specified param in mind', function(done) {
      validator.validate({ theString: '1234' }).then(function(result) {
        assert.deepEqual(
          result,
          {
            valid: false,
            errors: {
              theString: ['too short']
            }
          }
        );
        done();
      });
    });
  });

  describe('#using', function() {
    beforeEach(function() {
      validator = buildValidator()
        .validates('password')
          .using('password', 'passwordConfirmation',
                 function(password, passwordConfirmation) {
                   return password === passwordConfirmation;
                 }, 'Passwords must match.')
        .build();
    });

    it('passes declared dependencies', function(done) {
      validator.validate({ password: 'abc123', passwordConfirmation: 'abc123' }).then(function(result) {
        assert.deepEqual(
          result,
          {
            valid: true,
            errors: {
              password: []
            }
          },
          'dependent values are passed in'
        );
        done();
      });
    });

    it('causes dependent attributes to be validated, even when not specified explicitly', function(done) {
      // we're leaving out "password" but it gets validated anyway because it
      // depends on "passwordConfirmation"
      validator.validate({ password: 'abc123' }, 'passwordConfirmation').then(function(result) {
        assert.deepEqual(
          result,
          {
            valid: false,
            errors: {
              password: ["Passwords must match."],
              passwordConfirmation: []
            }
          }
        );

        validator.validate({ password: 'abc123', passwordConfirmation: 'abc123' }, 'passwordConfirmation').then(function(result) {
          assert.deepEqual(
            result,
            {
              valid: true,
              errors: {
                password: [],
                passwordConfirmation: []
              }
            },
            'returns empty error messages for dependent attributes as well'
          );

          done();
        });
      });
    });
  });

  describe('validator#when', function() {
    var object;
    var validator;

    beforeEach(function() {
      object = {};
      validator =
        buildValidator()
          .validates('age')
            .when(function(age){ return age % 2 === 0; })
              .using(function(age){ return age > 12; }, "You must be at least 13 years old.")
          .validates('name')
            .required("You must provide a name.")
          .build();
    });

    it('allows conditionally running validations', function(done) {
      object.age = 10; // even numbered ages are validated

      validator.validate(object).then(function(result) {
        assert.deepEqual(
          result,
          {
            valid: false,
            errors: {
              name: ["You must provide a name."],
              age:  ["You must be at least 13 years old."]
            }
          },
          'validations matching their when clause are run'
        );

        object.age = 7; // odd numbered ages aren't validated

        validator.validate(object).then(function(result) {
          assert.deepEqual(
            result,
            {
              valid: false,
              errors: {
                name: ["You must provide a name."],
                age: []
              }
            },
            'validations not matching their clause are not run'
          );

          done();
        });
      });
    });

    it('allows conditionals that return promises', function(done) {
      validator =
        buildValidator()
          .validates('name')
            .when(function(name){ return resolve(name.length % 2 !== 0); })
              .using(function(name){ return name === 'Han'; }, "Your name is not Han!")
          .build();

      object.name = 'Brian'; // odd length names are validated

      validator.validate(object).then(function(result) {
        assert.deepEqual(
          result,
          {
            valid: false,
            errors: {
              name: ["Your name is not Han!"]
            }
          }
        );

        object.name = 'Fred'; // even length names are not validated

        validator.validate(object).then(function(result) {
          assert.deepEqual(
            result,
            {
              valid: true,
              errors: {
                name: []
              }
            },
            'promise conditions are respected'
          );
          done();
        });
      });
    });

    it('passes declared dependencies', function() {
      var object = {
        name : 'Brian',
        age  : 30
      };

      var v =
        buildValidator()
          .validates('name')
            .when('name', 'age', 'unset', function(name, age, unset, key, obj) {
              assert.strictEqual(name, 'Brian');
              assert.strictEqual(age, 30);
              assert.strictEqual(unset, undefined);
              assert.strictEqual(key, 'name');
              assert.strictEqual(obj, object);
              return false;
            })
            .required("You must enter a name.")
          .build();

      return v.validate(object).then(function(result) {
      });
    });

    it('causes dependent attributes to be validated, even when not specified explicitly', function() {
      var v =
        buildValidator()
          .validates('name')
            .when('age', function(){ return true; })
              .required('You must enter a name.')
          .build();

      // we leave out "name" but it is validated anyway because it depends on "age"
      return v.validate({}, 'age').then(function(result) {
        assert.deepEqual(
          result,
          {
            valid: false,
            errors: {
              age: [],
              name: ['You must enter a name.']
            }
          }
        );

        v =
          buildValidator()
            .validates('name')
              .when('age', function(){ return true; })
                .required('You must enter a name.')
            .validates('age')
              .when('isBorn', function(isBorn){ return isBorn; })
                .required('You must have an age if you have been born.')
            .build();

        // we leave out "name" and "age" but they are validated anyway because they
        // both depend on "isBorn", either directly or transitively
        return v.validate({ isBorn: true }, 'isBorn').then(function(result) {
          assert.deepEqual(
            result,
            {
              valid: false,
              errors: {
                isBorn: [],
                name: ['You must enter a name.'],
                age: ['You must have an age if you have been born.']
              }
            }
          );

          return v.validate({ isBorn: true, name: "Winnie the Pooh", age: 10 }, 'isBorn').then(function(result) {
            assert.deepEqual(
              result,
              {
                valid: true,
                errors: {
                  isBorn: [],
                  name: [],
                  age: []
                }
              },
              'returns empty error messages for dependent attributes as well'
            );
          });
        });
      });
    });

    it('used with #using specifying attributes in both', function() {
      var v = buildValidator()
            .validates('passwordConfirmation')
              .when('password', function(password){ return password && password.length > 0; })
              .using('password', 'passwordConfirmation', function(password, passwordConfirmation) {
                return password === passwordConfirmation;
              }, 'Passwords must match!')
            .build();

      return v.validate({ password: 'letmein' }, 'password').then(function(result) {
        assert.deepEqual(
          result,
          {
            valid: false,
            errors: {
              password: [],
              passwordConfirmation: ['Passwords must match!']
            }
          },
          'returns the correct results for all attributes'
        );
      });
    });

    it('is used by #optional to prevent subsequent validations from firing when a value is absent', function() {
      var v = buildValidator()
            .validates('email')
              .optional()
              .email('That is no email!')
            .build();

      return v.validate({ email: ' ' }).then(function(result) {
        assert.deepEqual(
          result,
          {
            valid: true,
            errors: {
              email: []
            }
          },
          'accepts missing values as valid'
        );
      });
    });

    it('may be used multiple times', function() {
      var shouldValidate;
      var v = buildValidator()
            .validates('email')
              .optional() // this is a .when() call internally
              .when(function(email) { return shouldValidate; })
              .email('That is no email!', { strictCharacters: true })
            .build();

      // start off with the first .when() returning false, the second true
      shouldValidate = true;
      return v.validate({ email: '' }).then(function(result) {
        assert.deepEqual(
          result,
          {
            valid: true,
            errors: {
              email: []
            }
          },
          'subsequent .when() calls do not clobber previous ones'
        );

        // now make the first .when() return true, the second false
        shouldValidate = false;
        return v.validate({ email: 'I am not an email' }).then(function(result) {
          assert.deepEqual(
            result,
            {
              valid: true,
              errors: {
                email: []
              }
            },
            'does not validate if any .when() call returns falsy'
          );

          // now they should both return true, triggering validation
          shouldValidate = true;
          return v.validate({ email: 'mañana@squareup.com' }).then(function(result) {
            assert.deepEqual(
              result,
              {
                valid: false,
                errors: {
                  email: ['That is no email!']
                }
              },
              'validates as normal when all .when() calls return truthy'
            );
          });
        });
      });
    });

    it('only affects .using() calls after it in the chain', function() {
      var v = buildValidator()
            .validates('password')
              .using(function(password){ return password === 'zanzabar'; }, 'Nope!')
              .when(function(){ return false; })
            .build();

      return v.validate({ email: '' }).then(function(result) {
        assert.deepEqual(
          result,
          {
            valid: false,
            errors: {
              password: ['Nope!']
            }
          },
          'validates without any conditions added after the .using() call'
        );
      });
    });
  });

  describe('#and', function() {
    it('is an alias for #when', function() {
      var v = buildValidator()
            .validates('name')
              .when(function(name){ return true; })
              .and(function(name){ return false; })
              .required('You must enter a name!')
            .build();

      return v.validate({ name: null }).then(function(result) {
        assert.deepEqual(
          result,
          {
            valid: true,
            errors: {
              name: []
            }
          },
          'skips validating when .and() callback returns false'
        );
      });
    });
  });
});
