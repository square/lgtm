{ ObjectValidator } = LGTM
{ core }            = LGTM.validations
{ module }          = QUnit

module 'ObjectValidator',
  setup: ->
    @object    = {}
    @validator = new ObjectValidator()

test 'calls back when given a callback', ->
  expect 2

  returnValue = @validator.validate @object, (result) ->
    start()
    ok result.valid, 'properly returns results'
  ok ! returnValue, 'has no return value'
  stop()

test 'returns a promise when no callback is given', ->
  expect 1

  returnValue = @validator.validate(@object)
  returnValue.then (result) ->
    start()
    ok result.valid, 'properly returns results'
  stop()

test 'can validate a specific list of attributes', ->
  expect 2

  @validator.addValidation 'firstName', core.required, "Missing first name!"
  @validator.addValidation 'lastName', core.required, "Missing last name!"

  @validator.validate(@object).then (result) =>
    start()
    deepEqual result,
      valid: no
      errors:
        firstName: ["Missing first name!"]
        lastName: ["Missing last name!"]

    @validator.validate(@object, 'firstName').then (result) =>
      start()
      deepEqual result,
        valid: no
        errors:
          firstName: ["Missing first name!"]
    stop()
  stop()

test 'returns a hash of empty error arrays when valid', ->
  expect 1

  @validator.addValidation 'firstName', core.required, 'Missing first name!'
  @validator.addValidation 'lastName', core.required, 'Missing last name!'

  @validator.validate(firstName: 'Bah', lastName: 'Humbug').then (result) =>
    start()
    deepEqual result,
      valid: yes
      errors:
        firstName: []
        lastName: []
  stop()

test 'passes the validation function the value, key, and object being validated', ->
  expect 4

  @object.firstName = 'Han'

  @validator.addValidation 'firstName', (args...) =>
    strictEqual args.length, 3, 'passes three arguments'
    strictEqual args[0], 'Han',       '1st argument is value'
    strictEqual args[1], 'firstName', '2nd argument is key'
    strictEqual args[2], @object,     '3rd argument is object'

  @validator.validate(@object)

test 'validates as valid when validating attributes with no registered validations', ->
  expect 1

  @validator.validate(@object, 'iDoNotExist').then (result) =>
    start()
    deepEqual result, valid: yes, errors: {}
  stop()

test 'allows registering dependencies between attributes', ->
  expect 1

  # always invalid, easy to test
  @validator.addValidation 'spouseName', (-> no), 'No name is good enough.'
  @validator.addDependentsFor 'maritalStatus', 'spouseName'

  @validator.validate(@object, 'maritalStatus').then (result) =>
    start()
    deepEqual result,
      valid: no
      errors:
        maritalStatus: []
        spouseName: ['No name is good enough.']
  stop()

test 'can provide a list of all attributes it is interested in', ->
  @validator.addValidation 'street1', (-> no), 'Whatever.'
  @validator.addValidation 'street2', (-> no), 'Whatever.'
  @validator.addDependentsFor 'mobile', 'street1', 'street2'

  deepEqual @validator.attributes().sort(), ['mobile', 'street1', 'street2']

testValidatesAsExpected = ->
  test 'resolves the promise correctly', ->
    expect 1

    called = no
    @validator.validate(@object).then (result) ->
      called = yes
      start()
    ok ! called, 'the promise is not resolved synchronously'
    stop()

  test 'yields the validation results correctly', ->
    expect 1

    @object.lastName = 'Solo'
    @validator.validate(@object).then (result) ->
      deepEqual result,
        valid: no
        errors:
          firstName: ["Sorry, your first name isn't Han."]
          lastName: []
      start()
    stop()

module 'ObjectValidator with validations that return immediately',
  setup: ->
    @object    = {}
    @validator = new ObjectValidator()

    @validator.addValidation 'firstName',
      ((firstName) -> firstName is 'Han'),
      "Sorry, your first name isn't Han."
    @validator.addValidation 'lastName',
      ((lastName) -> lastName is 'Solo'),
      "Sorry, your last name isn't Solo."

testValidatesAsExpected()

module 'ObjectValidator with validations that return eventually',
  setup: ->
    @object    = {}
    @validator = new ObjectValidator()

    @validator.addValidation 'firstName',
      ((firstName) -> resolve(firstName is 'Han')),
      "Sorry, your first name isn't Han."
    @validator.addValidation 'lastName',
      ((lastName) -> resolve(lastName is 'Solo')),
      "Sorry, your last name isn't Solo."

testValidatesAsExpected()
