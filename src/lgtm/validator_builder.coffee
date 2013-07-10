import ObjectValidator from './object_validator'

class ValidatorBuilder
  _attr      : null
  _validator : null

  constructor: (object) ->
    @_validator = new ObjectValidator(object)

  validates: (attr) ->
    @_attr = attr
    return this

  with: (fn, message) ->
    @_validator.addValidation @_attr, fn, message
    return this

  build: ->
    @_validator

  @registerHelper: (name, fn) ->
    @::[name] = (message) ->
      @with fn, message
    return null

export default ValidatorBuilder
