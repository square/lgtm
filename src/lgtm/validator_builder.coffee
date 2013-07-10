import ObjectValidator from './object_validator'

class ValidatorBuilder
  _attr      : null
  _condition : null
  _validator : null

  constructor: (object) ->
    @_validator = new ObjectValidator(object)

  validates: (attr) ->
    @_attr = attr
    @_condition = null
    return this

  when: (condition) ->
    @_condition = condition
    return this

  using: (predicate, message) ->
    if @_condition
      condition = @_condition
      originalPredicate = predicate
      predicate = (args...) ->
        if condition(args...)
          originalPredicate(args...)
        else
          yes

    @_validator.addValidation @_attr, predicate, message
    return this

  build: ->
    @_validator

  @registerHelper: (name, fn) ->
    @::[name] = (message) ->
      @using fn, message
    return null

export default ValidatorBuilder
