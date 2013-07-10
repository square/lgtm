import ValidatorBuilder from './lgtm/validator_builder'
import ObjectValidator from './lgtm/object_validator'
import core from './lgtm/validations/core'

core.register()

validator = (object) ->
  new ValidatorBuilder(object)


validations = { core }

export { validator, validations, ObjectValidator }
