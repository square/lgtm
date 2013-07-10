{ ObjectValidator } = LGTM
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
  returnValue = @validator.validate (result) ->
    start()
    ok result.valid, 'properly returns results'
  ok ! returnValue, 'has no return value'
  stop()

test 'returns a promise when no callback is given', ->
  returnValue = @validator.validate()
  returnValue.then (result) ->
    ok result.valid, 'properly returns results'
    start()
  stop()

testValidatesAsExpected = ->
  test 'resolves the promise correctly', ->
    called = no
    @validator.validate().then (result) ->
      called = yes
      start()
    ok ! called, 'the promise is not resolved synchronously'
    stop()

  test 'yields the validation results correctly', ->
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
