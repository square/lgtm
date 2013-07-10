{ ObjectValidator } = LGTM
{ core }            = LGTM.validators
{ module }          = QUnit

resolve = (value) ->
  then: (callback) ->
    setTimeout ->
      callback value
    , 0

module 'ObjectValidator',
  setup: ->
    @validator = new ObjectValidator({})

test 'calls back when given a callback', ->
  expect 2

  returnValue = @validator.validate (result) ->
    start()
    ok result.valid, 'properly returns results'
  ok ! returnValue, 'has no return value'
  stop()

test 'returns a promise when no callback is given', ->
  expect 1

  returnValue = @validator.validate()
  returnValue.then (result) ->
    start()
    ok result.valid, 'properly returns results'
  stop()

test 'can validate a specific list of attributes', ->
  expect 2

  @validator.addValidation 'firstName', core.required, "Missing first name!"
  @validator.addValidation 'lastName', core.required, "Missing last name!"

  @validator.validate().then (result) =>
    start()
    deepEqual result,
      valid: no
      errors:
        firstName: ["Missing first name!"]
        lastName: ["Missing last name!"]

    @validator.validate('firstName').then (result) =>
      start()
      deepEqual result,
        valid: no
        errors:
          firstName: ["Missing first name!"]
    stop()
  stop()

testValidatesAsExpected = ->
  test 'resolves the promise correctly', ->
    expect 1

    called = no
    @validator.validate().then (result) ->
      called = yes
      start()
    ok ! called, 'the promise is not resolved synchronously'
    stop()

  test 'yields the validation results correctly', ->
    expect 1

    @object.lastName = 'Solo'
    @validator.validate().then (result) ->
      deepEqual result,
        valid: no
        errors:
          firstName: ["Sorry, your first name isn't Han."]
      start()
    stop()

module 'ObjectValidator with validations that return immediately',
  setup: ->
    @object    = {}
    @validator = new ObjectValidator(@object)

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
    @validator = new ObjectValidator(@object)

    @validator.addValidation 'firstName',
      ((firstName) -> resolve(firstName is 'Han')),
      "Sorry, your first name isn't Han."
    @validator.addValidation 'lastName',
      ((lastName) -> resolve(lastName is 'Solo')),
      "Sorry, your last name isn't Solo."

testValidatesAsExpected()
