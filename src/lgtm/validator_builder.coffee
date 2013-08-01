import ObjectValidator from './object_validator'
import { resolve } from 'rsvp'
import { getProperties } from './utils'

class ValidatorBuilder
  _attr      : null
  _condition : null
  _validator : null

  constructor: ->
    @_validator = new ObjectValidator()

  validates: (attr) ->
    @_attr = attr
    @_condition = null
    return this

  when: (dependencies..., condition) ->
    dependencies = [@_attr] if dependencies.length is 0
    for dependency in dependencies when dependency isnt @_attr
      @_validator.addDependentsFor dependency, @_attr

    @_condition = condition
    @_conditionDependencies = dependencies
    return this

  using: (dependencies..., predicate, message) ->
    dependencies = [@_attr] if dependencies.length is 0
    for dependency in dependencies when dependency isnt @_attr
      @_validator.addDependentsFor dependency, @_attr

    validation = (value, attr, object) ->
      predicate getProperties(object, dependencies)..., attr, object

    condition = @_condition
    conditionDependencies = @_conditionDependencies

    validationWithCondition = (value, attr, object) ->
      args = getProperties object, conditionDependencies
      args.push attr, object
      resolve(condition(args...)).then (result) ->
        if result
          # condition resolved to a truthy value, so continue with validation
          validation value, attr, object
        else
          # condition resolved to a falsy value, so just return as valid
          yes

    @_validator.addValidation @_attr,
      (if condition? then validationWithCondition else validation),
      message
    return this

  build: ->
    @_validator

  @registerHelper: (name, fn) ->
    @::[name] = (message) ->
      @using fn, message
    return null

  @unregisterHelper: (name) ->
    delete @::[name]
    return null

export default ValidatorBuilder
