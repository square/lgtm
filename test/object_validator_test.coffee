{ ObjectValidator } = LGTM
{ core }            = LGTM.validators
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

test 'passes the validation function the value, key, and object being validated', ->
  expect 4

  @object.firstName = 'Han'

  @validator.addValidation 'firstName', (args...) =>
    strictEqual args.length, 3, 'passes three arguments'
    strictEqual args[0], 'Han',       '1st argument is value'
    strictEqual args[1], 'firstName', '2nd argument is key'
    strictEqual args[2], @object,     '3rd argument is object'

  @validator.validate(@object)

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
