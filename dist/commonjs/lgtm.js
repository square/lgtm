"use strict";
var ObjectValidator, ValidatorBuilder, core, validator, validators;

ValidatorBuilder = require("./lgtm/validator_builder");

ObjectValidator = require("./lgtm/object_validator");

core = require("./lgtm/validators/core");

core.register();

validator = function(object) {
  return new ValidatorBuilder(object);
};

validators = {
  core: core
};

exports.validator = validator;

exports.validators = validators;

exports.ObjectValidator = ObjectValidator;
