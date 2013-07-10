"use strict";
var ValidatorBuilder, register, required;

ValidatorBuilder = require("../validator_builder");

required = function(value) {
  if (typeof value === 'string') {
    value = value.trim();
  }
  return value !== '' && value !== null && value !== (void 0);
};

register = function() {
  return ValidatorBuilder.registerHelper('required', required);
};

exports.required = required;

exports.register = register;
