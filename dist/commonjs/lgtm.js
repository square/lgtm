"use strict";
var ValidatorBuilder = require("./lgtm/validator_builder");
var ObjectValidator = require("./lgtm/object_validator");
var core = require("./lgtm/validations/core");
var config = require("./lgtm/config");

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

function configure(key, value) {
  config[key] = value;
}


exports.configure = configure;
exports.validator = validator;
exports.validations = validations;
exports.ObjectValidator = ObjectValidator;