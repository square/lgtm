"use strict";
var ObjectValidator, ValidatorBuilder, core, validatorFor, validators;

ValidatorBuilder = require("./lgtm/validator_builder");

ObjectValidator = require("./lgtm/object_validator");

core = require("./lgtm/validators/core");

core.register();

validatorFor = function(object) {
  return new ValidatorBuilder(object);
};

validators = {
  core: core
};

exports.validatorFor = validatorFor;

exports.validators = validators;

exports.ObjectValidator = ObjectValidator;
