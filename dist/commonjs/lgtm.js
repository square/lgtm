"use strict";
var ObjectValidator, ValidatorBuilder, core, validator, validators;

ValidatorBuilder = require("./lgtm/validator_builder");

ObjectValidator = require("./lgtm/object_validator");

core = require("./lgtm/validations/core");

core.register();

validator = function(object) {
  return new ValidatorBuilder(object);
};

validations = {
  core: core
};

exports.validator = validator;

exports.validations = validations;

exports.ObjectValidator = ObjectValidator;
