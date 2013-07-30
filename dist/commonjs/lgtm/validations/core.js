"use strict";
var ValidatorBuilder, email, maxLength, minLength, register, required;

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

minLength = function(minLength) {
  if (arguments.length === 0) {
    throw new Error('must specify a min length');
  }
  return function(value) {
    if (value != null) {
      return value.length >= minLength;
    } else {
      return false;
    }
  };
};

maxLength = function(maxLength) {
  if (arguments.length === 0) {
    throw new Error('must specify a max length');
  }
  return function(value) {
    if (value != null) {
      return value.length <= maxLength;
    } else {
      return false;
    }
  };
};

register = function() {
  ValidatorBuilder.registerHelper('required', required);
  ValidatorBuilder.registerHelper('email', email);
  ValidatorBuilder.registerHelper('minLength', minLength);
  return ValidatorBuilder.registerHelper('maxLength', maxLength);
};

exports.required = required;

exports.email = email;

exports.minLength = minLength;

exports.maxLength = maxLength;

exports.register = register;
