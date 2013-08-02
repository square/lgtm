{ validator, ObjectValidator } = LGTM
{ module }                     = QUnit

module 'validator',
  setup: ->
    @validator =
      validator()
        .validates('name')
          .required("You must provide a name.")
        .build()

test 'provides an easy way to build a validator', ->
  expect 2

  @validator.validate({}).then (result) ->
    start()
    ok ! result.valid, 'result is invalid'
    deepEqual result.errors, name: ["You must provide a name."]
  stop()

test 'returns an ObjectValidator', ->
  ok @validator instanceof ObjectValidator

module 'validator#paramCoreValidators',
  setup: ->
    @validator =
      validator()
        .validates('theString')
          .minLength(5, 'too short')
        .build()

test 'performs validation with specified param in mind', ->
  expect 1
  @validator.validate(theString: '1234').then (result) ->
    start()
    deepEqual result,
      valid: no,
      errors:
        theString: ['too short']
  stop()

module 'validator#using',
  setup: ->
    @validator =
      validator()
        .validates('password')
          .using('password', 'passwordConfirmation', ((password, passwordConfirmation) -> password is passwordConfirmation), "Passwords must match.")
        .build()

test 'passes declared dependencies', ->
  expect 1

  @validator.validate(password: 'abc123', passwordConfirmation: 'abc123').then (result) ->
    start()
    deepEqual result,
      valid: yes
      errors: {}
    , 'dependent values are passed in'
  stop()

test 'causes dependent attributes to be validated, even when not specified explicitly', ->
  expect 1

  # we're leaving out "password" but it gets validated anyway because it
  # depends on "passwordConfirmation"
  @validator.validate({password: 'abc123'}, 'passwordConfirmation').then (result) ->
    start()
    deepEqual result,
      valid: no
      errors:
        password: ["Passwords must match."]
  stop()

module 'validator#when',
  setup: ->
    @object = {}

    @validator =
      validator()
        .validates('age')
          .when((age) -> age % 2 is 0)
            .using(((age) -> age > 12), "You must be at least 13 years old.")
        .validates('name')
          .required("You must provide a name.")
        .build()

test 'allows conditionally running validations', ->
  expect 2

  @object.age = 10 # even numbered ages are validated

  @validator.validate(@object).then (result) =>
    start()
    deepEqual result,
      valid: no
      errors:
        name: ["You must provide a name."]
        age:  ["You must be at least 13 years old."]
    , 'validations matching their when clause are run'


    @object.age = 7 # odd numbered ages aren't validated

    @validator.validate(@object).then (result) =>
      start()
      deepEqual result,
        valid: no
        errors:
          name: ["You must provide a name."]
      , 'validations not matching their clause are not run'
    stop()

  stop()

test 'allows conditionals that return promises', ->
  @validator =
    validator()
      .validates('name')
        .when((name) -> resolve(name.length % 2 isnt 0))
          .using(((name) -> name is 'Han'), "Your name is not Han!")
      .build()

  @object.name = 'Brian' # odd length names are validated

  @validator.validate(@object).then (result) =>
    start()
    deepEqual result,
      valid: no
      errors:
        name: ["Your name is not Han!"]

    @object.name = 'Fred' # even length names are not validated

    @validator.validate(@object).then (result) =>
      start()
      deepEqual result,
        valid: yes
        errors: {}
      , 'promise conditions are respected'
    stop()
  stop()

test 'passes declared dependencies', ->
  expect 5

  object =
    name : 'Brian'
    age  : 30

  v =
    validator()
      .validates('name')
        .when('name', 'age', 'unset', (name, age, unset, key, obj) =>
          strictEqual name, 'Brian'
          strictEqual age, 30
          strictEqual unset, undefined
          strictEqual key, 'name'
          strictEqual obj, object
          no
        )
        .required("You must enter a name.")
      .build()

  v.validate(object).then (result) ->
    start()

  stop()

test 'causes dependent attributes to be validated, even when not specified explicitly', ->
  expect 2

  v =
    validator()
      .validates('name')
        .when('age', -> yes)
          .required("You must enter a name.")
      .build()

  # we leave out "name" but it is validated anyway because it depends on "age"
  v.validate({}, 'age').then (result) ->
    start()
    deepEqual result,
      valid: no
      errors:
        name: ["You must enter a name."]
  stop()


  v =
    validator()
      .validates('name')
        .when('age', -> yes)
          .required("You must enter a name.")
      .validates('age')
        .when('isBorn', (isBorn) -> isBorn)
          .required("You must have an age if you've been born.")
      .build()

  # we leave out "name" and "age" but they are validated anyway because they
  # both depend on "isBorn", either directly or transitively
  v.validate({isBorn: yes}, 'isBorn').then (result) ->
    start()
    deepEqual result,
      valid: no
      errors:
        name: ["You must enter a name."]
        age: ["You must have an age if you've been born."]
  stop()

test 'used with #using specifying attributes in both', ->
  v = validator()
        .validates('passwordConfirmation')
          .when('password', ((password) -> console.log 'called condition with', [].slice(arguments...); password?.length > 0))
          .using('password', 'passwordConfirmation',
            ((password, passwordConfirmation) -> console.log 'called validation with', [].slice(arguments...); password is passwordConfirmation),
            "Passwords must match!")
        .build()

  v.validate({password: 'letmein'}, 'password').then (result) ->
    start()
    deepEqual result,
      valid: no
      errors:
        passwordConfirmation: ["Passwords must match!"]
    , 'returns the correct results for all attributes'
  stop()
