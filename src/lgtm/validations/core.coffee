import ValidatorBuilder from '../validator_builder'

required = (value) ->
  if typeof value is 'string'
    value = value.trim()

  value not in ['', null, undefined]

email = (value) ->
  if typeof value is 'string'
    value = value.trim()

  # http://stackoverflow.com/a/46181/11236
  regexp = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  regexp.test(value)

register = ->
  ValidatorBuilder.registerHelper 'required', required
  ValidatorBuilder.registerHelper 'email', email

export { required, email, register }
