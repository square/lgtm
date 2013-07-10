import ValidatorBuilder from './lgtm/validator_builder'
import ObjectValidator from './lgtm/object_validator'
import core from './lgtm/validations/core'

core.register()

validator = (object) ->
  new ValidatorBuilder(object)

register = (args...) ->
  ValidatorBuilder.registerHelper args...

unregister = (args...) ->
  ValidatorBuilder.unregisterHelper args...

validations = { core, register, unregister }

export { validator, validations, ObjectValidator }
