"use strict";
var ValidatorBuilder = require("./lgtm/validator_builder");
var ObjectValidator = require("./lgtm/object_validator");
var core = require("./lgtm/validations/core");
var __reexport1__ = require("rsvp");

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


exports.configure = __reexport1__.configure;
exports.validator = validator;
exports.validations = validations;
exports.ObjectValidator = ObjectValidator;