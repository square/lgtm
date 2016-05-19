import { validator } from '../lgtm';
import { throws } from 'assert';

describe('#17 | Ensure `required` calls without a message fail', () => {
  it('throws when calling `required` without a message', () => {
    throws(() => {
      validator()
        .validates('password')
          .required()
        .build();
    }, /expected a message but got: undefined/);
  });
});
