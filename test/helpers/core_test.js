var core  = LGTM.helpers.core;

QUnit.module('helpers.core');

test('present', function() {
  ok(core.present(0), 'returns true for numbers');
  ok(core.present([0]), 'returns true for arrays');
  ok(core.present({}), 'returns true for objects');
  ok(core.present('HEY!'), 'returns true for non-empty strings');
  ok(core.present(new Date()), 'returns true for dates');
  ok(!core.present(''), 'returns false for empty strings');
  ok(!core.present(' '),'returns false for whitespace strings');
  ok(!core.present(null), 'returns false for null');
  ok(!core.present(undefined), 'returns false for undefined');
});

test('checkEmail', function() {
  ok(core.checkEmail('test@squareup.com'), 'returns true for correct email');
  ok(!core.checkEmail('paypal'), 'returns false for missing @');
  ok(!core.checkEmail('anything@paypal'), 'returns false for missing . in domain part');
  ok(!core.checkEmail('!$23@screwedup'), 'returns false for invalid characters');
  ok(!core.checkEmail(''), 'returns false for empty string');
});

test('checkMinLength', function() {
  ok(core.checkMinLength(5)('12345'), 'returns true for 5-characters long strength calling with 5');
  ok(!core.checkMinLength(6)('12345'), 'returns false for 5-characters long strength calling with 6');
  ok(!core.checkMinLength(5)(''), 'returns false for empty string');
  ok(!core.checkMinLength(5)(undefined), 'returns false for undefined');
  ok(!core.checkMinLength(5)(null), 'returns false for null');

  throws(
    function(){ core.checkMinLength()('something'); },
    'not specifying a min length throws an error'
  );
});

test('checkMaxLength', function() {
  ok(core.checkMaxLength(5)('12345'), 'returns true for 5-characters long strength calling with 5');
  ok(core.checkMaxLength(5)(''), 'returns true for empty string');
  ok(!core.checkMaxLength(4)('12345'), 'returns false for 5-characters long strength calling with 4');
  ok(!core.checkMaxLength(5)(undefined), 'returns false for undefined');
  ok(!core.checkMaxLength(5)(null), 'returns false for null');

  throws(
    function(){ core.checkMaxLength()('something'); },
    'not specifying a max length throws an error'
  );
});
