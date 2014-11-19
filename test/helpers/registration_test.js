const LGTM = require('../../dist/lgtm');
const validator   = LGTM.validator;
const validations = LGTM.helpers;
const assert = require('assert');

describe('helpers.(un)register', function() {
  it('can add and remove a helper from the builder', function() {
    const builder = validator();
    assert.strictEqual(builder.isEven, undefined, 'precondition: helper is not there yet');

    validations.register('isEven', function() {
      this.using(function(value) {
        return value % 2 === 0;
      });
    });

    assert.notStrictEqual(builder.isEven, undefined, 'helper is added to the builder');

    validations.unregister('isEven');
    assert.strictEqual(builder.isEven, undefined, 'postcondition: helper is removed after unregister');
  });
});
