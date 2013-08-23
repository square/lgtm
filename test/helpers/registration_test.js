var validator   = LGTM.validator;
var validations = LGTM.helpers;

QUnit.module('helpers.(un)register');

test('can add and remove a helper from the builder', function() {
  var builder = validator();
  ok(!builder.isEven, 'precondition: helper is not there yet');

  validations.register('isEven', function() {
    this.using(function(value) {
      return value % 2 === 0;
    });
  });

  ok(builder.isEven, 'helper is added to the builder');

  validations.unregister('isEven');
  ok(!builder.isEven, 'postcondition: helper is removed after unregister');
});
