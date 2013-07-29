"use strict";
var ValidatorBuilder, email, register, required;

ValidatorBuilder = require("../validator_builder");

required = function(value) {
  if (typeof value === 'string') {
    value = value.trim();
  }
  return value !== '' && value !== null && value !== (void 0);
};

email = function(value) {
  var regexp;
  if (typeof value === 'string') {
    value = value.trim();
  }
  regexp = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regexp.test(value);
};

register = function() {
  ValidatorBuilder.registerHelper('required', required);
  return ValidatorBuilder.registerHelper('email', email);
};

exports.required = required;

exports.email = email;

exports.register = register;
