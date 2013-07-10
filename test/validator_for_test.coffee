{ validatorFor, ObjectValidator } = LGTM
{ module }                        = QUnit

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
