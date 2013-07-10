import { all, resolve } from 'rsvp'

get = (object, property) ->
  if not object?
    return
  else if typeof object.get is 'function'
    object.get(property)
  else
    object[property]

class ObjectValidator
  object       : null
  _validations : null

  constructor: (object) ->
    @object = object
    @_validations = []

  addValidation: (attr, fn, message) ->
    list = @_validations[attr] ||= []
    list.push [fn, message]
    return null

  validate: (attributes..., callback) ->
    attributes ||= []

    if typeof callback is 'string'
      attributes.push callback
      callback = null

    if attributes.length is 0
      attributes = (attr for own attr of @_validations)

    validationPromises = []
    for attr in attributes
      validationPromises.push @_validateAttribute(attr)...

    promise = all(validationPromises).then (results) =>
      results = @_collectResults results
      callback? results
      return results

    return promise unless callback?

  _validateAttribute: (attr) ->
    object = @object
    value  = get @object, attr

    for [fn, message] in @_validations[attr]
      do (message) ->
        resolve(fn(value, attr, object))
          .then((isValid) -> [ attr, message ] if isValid isnt yes)

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

export default ObjectValidator
