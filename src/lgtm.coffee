import ValidatorBuilder from './lgtm/validator_builder'
import ObjectValidator from './lgtm/object_validator'
import core from './lgtm/validators/core'

core.register()

validator = (object) ->
  new ValidatorBuilder(object)

validators = { core }

export { validator, validators, ObjectValidator }
