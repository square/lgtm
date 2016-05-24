import resolve from './support/resolve.js';
import { validator as buildValidator, ObjectValidator } from './lgtm';
import { deepEqual, ok, strictEqual } from 'assert';

let validator;

describe('validator', () => {
  context('with a basic `required` validation', () => {
    beforeEach(() => {
      validator = buildValidator()
        .validates('name')
          .required('You must provide a name.')
        .build();
    });

    it('provides an easy way to build a validator', () => {
      return validator.validate({}).then(result => {
        ok(!result.valid);
        deepEqual(result.errors, { name: ['You must provide a name.'] });
      });
    });

    it('returns an ObjectValidator', () => {
      ok(validator instanceof ObjectValidator);
    });
  });

  describe('#paramCoreValidators', () => {
    beforeEach(() => {
      validator = buildValidator()
        .validates('theString')
          .minLength(5, 'too short')
        .build();
    });

    it('performs validation with specified param in mind', () => {
      return validator.validate({ theString: '1234' }).then(result => {
        deepEqual(
          result,
          {
            valid: false,
            errors: {
              theString: ['too short']
            }
          }
        );
      });
    });
  });

  describe('#using', () => {
    beforeEach(() => {
      validator = buildValidator()
        .validates('password')
          .using('password', 'passwordConfirmation',
            ((password, passwordConfirmation) => password === passwordConfirmation),
            'Passwords must match.')
        .build();
    });

    it('passes declared dependencies', () => {
      return validator.validate({ password: 'abc123', passwordConfirmation: 'abc123' }).then(result => {
        deepEqual(
          result,
          {
            valid: true,
            errors: {
              password: []
            }
          },
          'dependent values are passed in'
        );
      });
    });

    it('causes dependent attributes to be validated, even when not specified explicitly', () => {
      // we're leaving out "password" but it gets validated anyway because it
      // depends on "passwordConfirmation"
      return validator.validate({ password: 'abc123' }, 'passwordConfirmation').then(result => {
        deepEqual(
          result,
          {
            valid: false,
            errors: {
              password: ["Passwords must match."],
              passwordConfirmation: []
            }
          }
        );

        return validator.validate({ password: 'abc123', passwordConfirmation: 'abc123' }, 'passwordConfirmation').then(result => {
          deepEqual(
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
        });
      });
    });
  });

  describe('validator#when', () => {
    let object;
    let validator;

    beforeEach(() => {
      object = {};
      validator =
        buildValidator()
          .validates('age')
            .when(age => age % 2 === 0)
              .using((age => age > 12), "You must be at least 13 years old.")
          .validates('name')
            .required("You must provide a name.")
          .build();
    });

    it('allows conditionally running validations', () => {
      object.age = 10; // even numbered ages are validated

      return validator.validate(object).then(result => {
        deepEqual(
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

        return validator.validate(object).then(result => {
          deepEqual(
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
        });
      });
    });

    it('allows conditionally running validations based on options', () => {
      let object = {
        name: null
      };

      let v =
        buildValidator()
          .validates('name')
            .when('name', function (value, attr, object, options) {
                return !options.nameOptional;
              })
              .required("You must enter a name.")
          .build();

        return v.validate(object).then(result => {
          deepEqual(
            result,
            {
              valid:  false,
              errors: {
                name: ["You must enter a name."]
              }
            }
          );

          return v.validate(object, { nameOptional: true }).then(result => {
            deepEqual(
              result,
              {
                  valid: true,
                  errors: {
                      name: []
                  }
              },
              'options conditions are respected'
            );
          });
        });
    });

    it('allows conditionals that return promises', () => {
      validator =
        buildValidator()
          .validates('name')
            .when(name => resolve(name.length % 2 !== 0))
              .using((name => name === 'Han'), "Your name is not Han!")
          .build();

      object.name = 'Brian'; // odd length names are validated

      return validator.validate(object).then(result => {
        deepEqual(
          result,
          {
            valid: false,
            errors: {
              name: ["Your name is not Han!"]
            }
          }
        );

        object.name = 'Fred'; // even length names are not validated

        return validator.validate(object).then(result => {
          deepEqual(
            result,
            {
              valid: true,
              errors: {
                name: []
              }
            },
            'promise conditions are respected'
          );
        });
      });
    });

    it('passes declared dependencies', () => {
      let object = {
        name : 'Brian',
        age  : 30
      };

      let v =
        buildValidator()
          .validates('name')
            .when('name', 'age', 'unset', (name, age, unset, key, obj) => {
              strictEqual(name, 'Brian');
              strictEqual(age, 30);
              strictEqual(unset, undefined);
              strictEqual(key, 'name');
              strictEqual(obj, object);
              return false;
            })
            .required("You must enter a name.")
          .build();

      return v.validate(object);
    });

    it('causes dependent attributes to be validated, even when not specified explicitly', () => {
      let v =
        buildValidator()
          .validates('name')
            .when('age', () => true)
              .required('You must enter a name.')
          .build();

      // we leave out "name" but it is validated anyway because it depends on "age"
      return v.validate({}, 'age').then(result => {
        deepEqual(
          result,
          {
            valid: false,
            errors: {
              age: [],
              name: ['You must enter a name.']
            }
          }
        );

        let v =
          buildValidator()
            .validates('name')
              .when('age', () => true)
                .required('You must enter a name.')
            .validates('age')
              .when('isBorn', isBorn => isBorn)
                .required('You must have an age if you have been born.')
            .build();

        // we leave out "name" and "age" but they are validated anyway because they
        // both depend on "isBorn", either directly or transitively
        return v.validate({ isBorn: true }, 'isBorn').then(result => {
          deepEqual(
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

          return v.validate({ isBorn: true, name: "Winnie the Pooh", age: 10 }, 'isBorn').then(result => {
            deepEqual(
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

    it('used with #using specifying attributes in both', () => {
      let v = buildValidator()
            .validates('passwordConfirmation')
              .when('password', password => password && password.length > 0)
              .using('password', 'passwordConfirmation',
                ((password, passwordConfirmation) => password === passwordConfirmation),
                'Passwords must match!')
            .build();

      return v.validate({ password: 'letmein' }, 'password').then(result => {
        deepEqual(
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

    it('is used by #optional to prevent subsequent validations from firing when a value is absent', () => {
      let v = buildValidator()
            .validates('email')
              .optional()
              .email('That is no email!')
            .build();

      return v.validate({ email: ' ' }).then(result => {
        deepEqual(
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

    it('may be used multiple times', () => {
      let shouldValidate;
      let v = buildValidator()
            .validates('email')
              .optional() // this is a .when() call internally
              .when(email => shouldValidate) // eslint-disable-line no-unused-vars
              .email('That is no email!', { strictCharacters: true })
            .build();

      // start off with the first .when() returning false, the second true
      shouldValidate = true;
      return v.validate({ email: '' }).then(result => {
        deepEqual(
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
        return v.validate({ email: 'I am not an email' }).then(result => {
          deepEqual(
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
          return v.validate({ email: 'mañana@squareup.com' }).then(result => {
            deepEqual(
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

    it('only affects .using() calls after it in the chain', () => {
      let v = buildValidator()
            .validates('password')
              .using((password => password === 'zanzabar'), 'Nope!')
              .when(() => false)
            .build();

      return v.validate({ email: '' }).then(result => {
        deepEqual(
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

  describe('#and', () => {
    it('is an alias for #when', () => {
      let v = buildValidator()
            .validates('name')
              .when(() => true)
              .and(() => false)
              .required('You must enter a name!')
            .build();

      return v.validate({ name: null }).then(result => {
        deepEqual(
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
