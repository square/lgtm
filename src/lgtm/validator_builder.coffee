import ObjectValidator from './object_validator'
import { resolve } from 'rsvp'
import { get } from './utils'

wrapCallbackWithDependencies = (callback, dependencies) ->
  return callback if dependencies.length is 0

  (value, key, object) ->
    values = (get object, dep for dep in dependencies)
    callback values..., key, object

wrapCallbackWithCondition = (callback, condition) ->
  return callback unless condition?

  (args...) ->
    resolve(condition(args...)).then (result) ->
      if result
        callback(args...)
      else
        yes

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
    @_condition = wrapCallbackWithDependencies condition, dependencies
    for dependency in dependencies when dependency isnt @_attr
      @_validator.addDependentsFor dependency, @_attr
    return this

  # .using('password', 'passwordConfirmation', ((password, passwordConfirmation) -> password is passwordConfirmation), "Passwords must match.")
  using: (dependencies..., predicate, message) ->
    dependencies = [@_attr] if dependencies.length is 0
    for dependency in dependencies when dependency isnt @_attr
      @_validator.addDependentsFor dependency, @_attr
    predicate = wrapCallbackWithCondition predicate, @_condition
    predicate = wrapCallbackWithDependencies predicate, dependencies
    @_validator.addValidation @_attr, predicate, message
    return this

  build: ->
    @_validator

  @registerHelper: (name, fn) ->
    @::[name] = (options..., message) ->
      if options.length is 0
        @using fn, message
      else
        @using fn(options...), message
    return null

  @unregisterHelper: (name) ->
    delete @::[name]
    return null

export default ValidatorBuilder
