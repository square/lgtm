import { helpers as validations, validator } from '../lgtm';
import { notStrictEqual, strictEqual } from 'assert';

describe('helpers.(un)register', () => {
  it('can add and remove a helper from the builder', () => {
    const builder = validator();
    strictEqual(builder.isEven, undefined, 'precondition: helper is not there yet');

    validations.register('isEven', function() {
      this.using(value => value % 2 === 0);
    });

    notStrictEqual(builder.isEven, undefined, 'helper is added to the builder');

    validations.unregister('isEven');
    strictEqual(builder.isEven, undefined, 'postcondition: helper is removed after unregister');
  });
});
