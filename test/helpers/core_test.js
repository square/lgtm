const LGTM = require('../../dist/commonjs/lgtm');
const core  = LGTM.helpers.core;
const assert = require('assert');

describe('helpers.core', function() {
  it('present', function() {
    assert.ok(core.present(0), 'returns true for numbers');
    assert.ok(core.present([0]), 'returns true for arrays');
    assert.ok(core.present({}), 'returns true for objects');
    assert.ok(core.present('HEY!'), 'returns true for non-empty strings');
    assert.ok(core.present(new Date()), 'returns true for dates');
    assert.ok(!core.present(''), 'returns false for empty strings');
    assert.ok(!core.present(' '),'returns false for whitespace strings');
    assert.ok(!core.present(null), 'returns false for null');
    assert.ok(!core.present(undefined), 'returns false for undefined');
  });

  it('checkEmail', function() {
    assert.ok(core.checkEmail()('test@squareup.com'), 'returns true for correct email');
    assert.ok(!core.checkEmail()('paypal'), 'returns false for missing @');
    assert.ok(!core.checkEmail()('anything@paypal'), 'returns false for missing . in domain part');
    assert.ok(!core.checkEmail()('!$23@screwedup'), 'returns false for invalid characters');
    assert.ok(!core.checkEmail()(''), 'returns false for empty string');
    assert.ok(core.checkEmail()('mañana@squareup.com'), 'returns true for emails with characters in extended ASCII range');
    assert.ok(!core.checkEmail({ strictCharacters: true })('mañana@squareup.com'), 'returns false for emails with characters in extended ASCII range when strictCharacters == true');
  });

  it('checkMinLength', function() {
    assert.ok(core.checkMinLength(5)('12345'), 'returns true for 5-characters long strength calling with 5');
    assert.ok(!core.checkMinLength(6)('12345'), 'returns false for 5-characters long strength calling with 6');
    assert.ok(!core.checkMinLength(5)(''), 'returns false for empty string');
    assert.ok(!core.checkMinLength(5)(undefined), 'returns false for undefined');
    assert.ok(!core.checkMinLength(5)(null), 'returns false for null');

    assert.throws(
      function(){ core.checkMinLength()('something'); },
      'not specifying a min length throws an error'
    );
  });

  it('checkMaxLength', function() {
    assert.ok(core.checkMaxLength(5)('12345'), 'returns true for 5-characters long strength calling with 5');
    assert.ok(core.checkMaxLength(5)(''), 'returns true for empty string');
    assert.ok(!core.checkMaxLength(4)('12345'), 'returns false for 5-characters long strength calling with 4');
    assert.ok(!core.checkMaxLength(5)(undefined), 'returns false for undefined');
    assert.ok(!core.checkMaxLength(5)(null), 'returns false for null');

    assert.throws(
      function(){ core.checkMaxLength()('something'); },
      'not specifying a max length throws an error'
    );
  });
});
