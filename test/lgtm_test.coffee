{ validatorFor, ObjectValidator } = LGTM
{ core }                          = LGTM.validators

resolve = (value) ->
  then: (callback) ->
    setTimeout ->
      callback value
    , 0

module 'validatorFor',
  setup: ->
    @object = {}

    @validator =
      validatorFor(@object)
        .validates('name')
          .required("You must provide a name.")
        .build()

test 'provides an easy way to build a validator', ->
  expect 2

  @validator.validate().then (result) ->
    start()
    ok ! result.valid, 'result is invalid'
    deepEqual result.errors, name: ["You must provide a name."]
  stop()

test 'returns an ObjectValidator', ->
  ok @validator instanceof ObjectValidator


module 'validators.core'

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
