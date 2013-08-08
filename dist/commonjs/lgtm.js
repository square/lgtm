"use strict";
var ObjectValidator, ValidatorBuilder, core, register, unregister, validations, validator, __reexport1__,
  __slice = [].slice;

ValidatorBuilder = require("./lgtm/validator_builder");

ObjectValidator = require("./lgtm/object_validator");

core = require("./lgtm/validations/core");

__reexport1__ = require("rsvp");

core.register();

validator = function() {
  return new ValidatorBuilder();
};

register = function() {
  var args;
  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  return ValidatorBuilder.registerHelper.apply(ValidatorBuilder, args);
};

unregister = function() {
  var args;
  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  return ValidatorBuilder.unregisterHelper.apply(ValidatorBuilder, args);
};

validations = {
  core: core,
  register: register,
  unregister: unregister
};

exports.configure = __reexport1__.configure;

exports.validator = validator;

exports.validations = validations;

exports.ObjectValidator = ObjectValidator;
