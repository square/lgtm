const LGTM = require('../lgtm');
const assert = require('assert');

describe('#8 | Dependent validations cause duplicate errors', function() {
  it('does not duplicate "Passwords must match"', function() {
    var validator =
      LGTM.validator()
        .validates('password')
          .required('Please input a password')
        .validates('passwordConfirm')
          .when('password', function(password) { return password !== undefined; })
            .required('Please confirm your password')
            .using(function(confirm, attr, form) { return confirm === form.password; }, 'Passwords must match')
        .build();

    var form = {
      'password': 'asdf',
      'passwordConfirm': undefined
    };

    return validator.validate(form).then(function(result) {
      assert.ok(!result.valid, 'it should not be valid');
      assert.deepEqual(Object.keys(result.errors).sort(), ['password', 'passwordConfirm']);
      assert.deepEqual(result.errors['password'], []);
      assert.deepEqual(result.errors['passwordConfirm'], ['Please confirm your password', 'Passwords must match']);
    });
  });
});
