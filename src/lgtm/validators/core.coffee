import ValidatorBuilder from '../validator_builder'

required = (value) ->
  if typeof value is 'string'
    value = value.trim()

  value not in ['', null, undefined]

register = ->
  ValidatorBuilder.registerHelper 'required', required

export { required, register }
