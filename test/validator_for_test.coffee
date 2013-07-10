{ validatorFor, ObjectValidator } = LGTM
{ module }                        = QUnit

module 'validatorFor',
  setup: ->
    @validator =
      validatorFor({})
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

module 'validatorFor#when',
  setup: ->
    @object = {}

    @validator =
      validatorFor(@object)
        .validates('age')
          .when((age) -> age % 2 is 0)
            .using(((age) -> age > 12), "You must be at least 13 years old.")
        .validates('name')
          .required("You must provide a name.")
        .build()

test 'allows conditionally running validations', ->
  expect 2

  @object.age = 10 # even numbered ages are validated

  @validator.validate().then (result) =>
    start()
    deepEqual result,
      valid: no
      errors:
        name: ["You must provide a name."]
        age:  ["You must be at least 13 years old."]
    , 'validations matching their when clause are run'


    @object.age = 7 # odd numbered ages aren't validated

    @validator.validate().then (result) =>
      start()
      deepEqual result,
        valid: no
        errors:
          name: ["You must provide a name."]
      , 'validations not matching their clause are not run'
    stop()

  stop()
