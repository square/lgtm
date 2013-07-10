{ validator, validations } = LGTM
{ module }                 = QUnit

module 'validations.(un)register'

test 'can add and remove a predicate from the builder', ->
  builder = validator()
  ok ! builder.isEven, 'precondition: predicate is not there yet'

  validations.register 'isEven', (value) ->
    value % 2 is 0
  ok builder.isEven, 'predicate is added to the builder'

  validations.unregister 'isEven'
  ok ! builder.isEven, 'postcondition: predicate is removed after unregister'
