import { all, resolve } from 'rsvp'
import { get, uniq } from './utils'

class ObjectValidator
  _validations : null
  _dependencies: null

  constructor: ->
    @_validations  = {}
    @_dependencies = {}

  addValidation: (attr, fn, message) ->
    list = @_validations[attr] ||= []
    list.push [fn, message]
    return null

  # e.g. spouseName (dependentAttribute) depends on maritalStatus (parentAttribute)
  addDependentsFor: (parentAttribute, dependentAttributes...) ->
    dependentsForParent = @_dependencies[parentAttribute] ||= []
    for attr in dependentAttributes
      dependentsForParent.push attr unless attr in dependentsForParent
    return null

  attributes: ->
    attributes = []

    for own attribute of @_validations
      attributes.push attribute

    for own parentAttribute of @_dependencies
      attributes.push parentAttribute

    uniq attributes

  validate: (object, attributes..., callback) ->
    if typeof callback is 'string'
      attributes.push callback
      callback = null

    if attributes.length is 0
      attributes = (attr for own attr of @_validations)

    validationPromises = []
    for attr in attributes
      validationPromises.push @_validateAttribute(object, attr)...

    promise = all(validationPromises).then (results) =>
      results = @_collectResults results
      callback? results
      return results

    return promise unless callback?

  _validateAttribute: (object, attr) ->
    value       = get object, attr
    validations = @_validations[attr]
    results     = []

    if validations?
      validations.forEach ([fn, message]) ->
        results.push resolve(fn(value, attr, object)).then(
          (isValid) -> [ attr, message ] if isValid isnt yes
        )

    for dependent in @_getDependentsFor(attr)
      results.push @_validateAttribute(object, dependent)...

    return results

  _collectResults: (results) ->
    result =
      valid  : yes
      errors : {}

    for attrMessage in results when attrMessage?
      [ attr, message ] = attrMessage
      messages = result.errors[attr] ||= []
      messages.push message
      result.valid = no

    return result

  # e.g. getDependents("maritalStatus")  # => ["spouseName"]
  _getDependentsFor: (parentAttribute) ->
    (@_dependencies[parentAttribute] || []).slice()

export default ObjectValidator
