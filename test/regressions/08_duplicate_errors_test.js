import { validator } from '../lgtm';
import { deepEqual, ok } from 'assert';

describe('#8 | Dependent validations cause duplicate errors', () => {
  it('does not duplicate "Passwords must match"', () => {
    let v =
      validator()
        .validates('password')
          .required('Please input a password')
        .validates('passwordConfirm')
          .when('password', password => password !== undefined)
            .required('Please confirm your password')
            .using(((confirm, attr, form) => confirm === form.password), 'Passwords must match')
        .build();

    let form = {
      'password': 'asdf',
      'passwordConfirm': undefined
    };

    return v.validate(form).then(result => {
      ok(!result.valid, 'it should not be valid');
      deepEqual(Object.keys(result.errors).sort(), ['password', 'passwordConfirm']);
      deepEqual(result.errors['password'], []);
      deepEqual(result.errors['passwordConfirm'], ['Please confirm your password', 'Passwords must match']);
    });
  });
});
