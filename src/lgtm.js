import ValidatorBuilder from './lgtm/validator_builder';
import ObjectValidator from './lgtm/object_validator';
import core from './lgtm/validations/core';

core.register();

function validator() {
  return new ValidatorBuilder();
}

function register() {
  ValidatorBuilder.registerHelper.apply(ValidatorBuilder, arguments);
}

function unregister() {
  ValidatorBuilder.unregisterHelper.apply(ValidatorBuilder, arguments);
}

var validations = {
  core       : core,
  register   : register,
  unregister : unregister
};

export { configure } from 'rsvp';
export { validator, validations, ObjectValidator };
