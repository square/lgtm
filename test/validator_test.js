var validator       = LGTM.validator;
var ObjectValidator = LGTM.ObjectValidator;

QUnit.module('validator', {
  setup: function() {
    this.validator =
      validator()
        .validates('name')
          .required("You must provide a name.")
        .build();
  }
});

test('provides an easy way to build a validator', function() {
  expect(2);

  this.validator.validate({}).then(function(result) {
    start();
    ok(!result.valid, 'result is invalid');
    deepEqual(result.errors, { name: ["You must provide a name."] });
  });
  stop();
});

test('returns an ObjectValidator', function() {
  ok(this.validator instanceof ObjectValidator);
});

QUnit.module('validator#paramCoreValidators', {
  setup: function() {
    this.validator =
      validator()
        .validates('theString')
          .minLength(5, 'too short')
        .build();
  }
});

test('performs validation with specified param in mind', function() {
  expect(1);
  this.validator.validate({ theString: '1234' }).then(function(result) {
    start();
    deepEqual(result, {
      valid: false,
      errors: {
        theString: ['too short']
      }
    });
  });
  stop();
});

QUnit.module('validator#using', {
  setup: function() {
    this.validator =
      validator()
        .validates('password')
          .using('password', 'passwordConfirmation', function(password, passwordConfirmation){ return password === passwordConfirmation; }, "Passwords must match.")
        .build();
  }
});

test('passes declared dependencies', function() {
  expect(1);

  this.validator.validate({ password: 'abc123', passwordConfirmation: 'abc123' }).then(function(result) {
    start();
    deepEqual(result, {
      valid: true,
      errors: {
        password: []
      }
    }, 'dependent values are passed in');
  });
  stop();
});

test('causes dependent attributes to be validated, even when not specified explicitly', function() {
  expect(2);

  // we're leaving out "password" but it gets validated anyway because it
  // depends on "passwordConfirmation"
  this.validator.validate({ password: 'abc123' }, 'passwordConfirmation').then(function(result) {
    start();
    deepEqual(result, {
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
    deepEqual(result, {
      valid: true,
      errors: {
        password: [],
        passwordConfirmation: []
      }
    }, 'returns empty error messages for dependent attributes as well');
  });
  stop();
});

QUnit.module('validator#when', {
  setup: function() {
    this.object = {};

    this.validator =
      validator()
        .validates('age')
          .when(function(age){ return age % 2 === 0; })
            .using(function(age){ return age > 12; }, "You must be at least 13 years old.")
        .validates('name')
          .required("You must provide a name.")
        .build();
  }
});

test('allows conditionally running validations', function() {
  expect(2);

  var self = this;

  self.object.age = 10; // even numbered ages are validated

  self.validator.validate(self.object).then(function(result) {
    start();
    deepEqual(result, {
      valid: false,
      errors: {
        name: ["You must provide a name."],
        age:  ["You must be at least 13 years old."]
      }
    }, 'validations matching their when clause are run');

    self.object.age = 7; // odd numbered ages aren't validated

    self.validator.validate(self.object).then(function(result) {
      start();
      deepEqual(result, {
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

test('allows conditionals that return promises', function() {
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
    deepEqual(result, {
      valid: false,
      errors: {
        name: ["Your name is not Han!"]
      }
    });

    self.object.name = 'Fred'; // even length names are not validated

    self.validator.validate(self.object).then(function(result) {
      start();
      deepEqual(result, {
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

test('passes declared dependencies', function() {
  expect(5);

  var object = {
    name : 'Brian',
    age  : 30
  };

  var v =
    validator()
      .validates('name')
        .when('name', 'age', 'unset', function(name, age, unset, key, obj) {
          strictEqual(name, 'Brian');
          strictEqual(age, 30);
          strictEqual(unset, undefined);
          strictEqual(key, 'name');
          strictEqual(obj, object);
          return false;
        })
        .required("You must enter a name.")
      .build();

  v.validate(object).then(function(result) {
    start();
  });

  stop();
});

test('causes dependent attributes to be validated, even when not specified explicitly', function() {
  expect(3);

  var v =
    validator()
      .validates('name')
        .when('age', function(){ return true; })
          .required("You must enter a name.")
      .build();

  // we leave out "name" but it is validated anyway because it depends on "age"
  v.validate({}, 'age').then(function(result) {
    start();
    deepEqual(result, {
      valid: false,
      errors: {
        age: [],
        name: ["You must enter a name."]
      }
    });
  });
  stop();


  v =
    validator()
      .validates('name')
        .when('age', function(){ return true; })
          .required("You must enter a name.")
      .validates('age')
        .when('isBorn', function(isBorn){ return isBorn; })
          .required("You must have an age if you've been born.")
      .build();

  // we leave out "name" and "age" but they are validated anyway because they
  // both depend on "isBorn", either directly or transitively
  v.validate({ isBorn: true }, 'isBorn').then(function(result) {
    start();
    deepEqual(result, {
      valid: false,
      errors: {
        isBorn: [],
        name: ["You must enter a name."],
        age: ["You must have an age if you've been born."]
      }
    });
  });
  stop();

  v.validate({ isBorn: true, name: "Winnie the Pooh", age: 10 }, 'isBorn').then(function(result) {
    start();
    deepEqual(result, {
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

test('used with #using specifying attributes in both', function() {
  var v = validator()
        .validates('passwordConfirmation')
          .when('password', function(password){ return password && password.length > 0; })
          .using('password', 'passwordConfirmation', function(password, passwordConfirmation) {
            return password === passwordConfirmation;
          }, "Passwords must match!")
        .build();

  v.validate({ password: 'letmein' }, 'password').then(function(result) {
    start();
    deepEqual(result, {
      valid: false,
      errors: {
        password: [],
        passwordConfirmation: ["Passwords must match!"]
      }
    }, 'returns the correct results for all attributes');
  });
  stop();
});

test('is used by #optional to prevent subsequent validations from firing when a value is absent', function() {
  var v = validator()
        .validates('email')
          .optional()
          .email("That's no email!")
        .build();

  v.validate({ email: ' ' }).then(function(result) {
    start();
    deepEqual(result, {
      valid: true,
      errors: {
        email: []
      }
    }, 'accepts missing values as valid');
  });
  stop();
});
