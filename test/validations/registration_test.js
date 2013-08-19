var validator   = LGTM.validator;
var validations = LGTM.validations;

QUnit.module('validations.(un)register');

test('can add and remove a predicate from the builder', function() {
  var builder = validator();
  ok(!builder.isEven, 'precondition: predicate is not there yet');

  validations.register('isEven', function(value){ return value % 2 === 0; });
  ok(builder.isEven, 'predicate is added to the builder');

  validations.unregister('isEven');
  ok(!builder.isEven, 'postcondition: predicate is removed after unregister');
});
