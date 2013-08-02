{ core }   = LGTM.validations
{ module } = QUnit

module 'validations.core'

test 'required', ->
  ok core.required(0), 'returns true for numbers'
  ok core.required([0]), 'returns true for arrays'
  ok core.required({}), 'returns true for objects'
  ok core.required('HEY!'), 'returns true for non-empty strings'
  ok core.required(new Date()), 'returns true for dates'
  ok ! core.required(''), 'returns false for empty strings'
  ok ! core.required(' '),'returns false for whitespace strings'
  ok ! core.required(null), 'returns false for null'
  ok ! core.required(undefined), 'returns false for undefined'

test 'email', ->
  ok core.email('test@squareup.com'), 'returns true for correct email'
  ok ! core.email('paypal'), 'returns false for missing @'
  ok ! core.email('anything@paypal'), 'returns false for missing . in domain part'
  ok ! core.email('!$23@screwedup'), 'returns false for invalid characters'
  ok ! core.email(''), 'returns false for empty string'

test 'minLength', ->
  ok core.minLength(5)('12345'), 'returns true for 5-characters long strength calling with 5'
  ok ! core.minLength(6)('12345'), 'returns false for 5-characters long strength calling with 6'
  ok ! core.minLength(5)(''), 'returns false for empty string'
  ok ! core.minLength(5)(undefined), 'returns false for undefined'
  ok ! core.minLength(5)(null), 'returns false for null'

  throws ( -> core.minLength()('something') ), 'not specifying a min length throws an error'

test 'maxLength', ->
  ok core.maxLength(5)('12345'), 'returns true for 5-characters long strength calling with 5'
  ok core.maxLength(5)(''), 'returns true for empty string'
  ok ! core.maxLength(4)('12345'), 'returns false for 5-characters long strength calling with 4'
  ok ! core.maxLength(5)(undefined), 'returns false for undefined'
  ok ! core.maxLength(5)(null), 'returns false for null'

  throws ( -> core.maxLength()('something') ), 'not specifying a max length throws an error'
