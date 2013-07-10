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

  validate: (callback) ->
    validationPromises = []
    for own attr of @_validations
      validationPromises.push @_validateAttribute(attr)...

    promise = all(validationPromises).then (results) =>
      results = @_collectResults results
      callback? results
      return results

    return promise unless callback?

  _validateAttribute: (attr) ->
    value = get @object, attr

    for [fn, message] in @_validations[attr]
      do (message) ->
        resolve(fn(value))
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
