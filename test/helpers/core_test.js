import { checkEmail, checkMaxLength, checkMinLength, present } from '../../src/lgtm/helpers/core.js';
import { ok, throws } from 'assert';

describe('helpers.core', () => {
  it('present', () => {
    ok(present(0), 'returns true for numbers');
    ok(present([0]), 'returns true for arrays');
    ok(present({}), 'returns true for objects');
    ok(present('HEY!'), 'returns true for non-empty strings');
    ok(present(new Date()), 'returns true for dates');
    ok(!present(''), 'returns false for empty strings');
    ok(!present(' '),'returns false for whitespace strings');
    ok(!present(null), 'returns false for null');
    ok(!present(undefined), 'returns false for undefined');
  });

  it('checkEmail', () => {
    ok(checkEmail()('test@squareup.com'), 'returns true for correct email');
    ok(!checkEmail()('paypal'), 'returns false for missing @');
    ok(!checkEmail()('anything@paypal'), 'returns false for missing . in domain part');
    ok(!checkEmail()('!$23@screwedup'), 'returns false for invalid characters');
    ok(!checkEmail()(''), 'returns false for empty string');
    ok(checkEmail()('mañana@squareup.com'), 'returns true for emails with characters in extended ASCII range');
    ok(!checkEmail({ strictCharacters: true })('mañana@squareup.com'), 'returns false for emails with characters in extended ASCII range when strictCharacters == true');
  });

  it('checkMinLength', () => {
    ok(checkMinLength(5)('12345'), 'returns true for 5-characters long strength calling with 5');
    ok(!checkMinLength(6)('12345'), 'returns false for 5-characters long strength calling with 6');
    ok(!checkMinLength(5)(''), 'returns false for empty string');
    ok(!checkMinLength(5)(undefined), 'returns false for undefined');
    ok(!checkMinLength(5)(null), 'returns false for null');

    throws(
      () => checkMinLength()('something'),
      'not specifying a min length throws an error'
    );
  });

  it('checkMaxLength', () => {
    ok(checkMaxLength(5)('12345'), 'returns true for 5-characters long strength calling with 5');
    ok(checkMaxLength(5)(''), 'returns true for empty string');
    ok(!checkMaxLength(4)('12345'), 'returns false for 5-characters long strength calling with 4');
    ok(!checkMaxLength(5)(undefined), 'returns false for undefined');
    ok(!checkMaxLength(5)(null), 'returns false for null');

    throws(
      () => checkMaxLength()('something'),
      'not specifying a max length throws an error'
    );
  });
});
