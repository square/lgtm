import ValidatorBuilder from './lgtm/validator_builder'
import ObjectValidator from './lgtm/object_validator'
import core from './lgtm/validators/core'

core.register()

validatorFor = (object) ->
  new ValidatorBuilder(object)

validators = { core }

export { validatorFor, validators, ObjectValidator }
