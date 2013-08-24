"use strict";
var ValidatorBuilder = require("./lgtm/validator_builder");
var ObjectValidator = require("./lgtm/object_validator");
var core = require("./lgtm/helpers/core");
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

var helpers = {
  core       : core,
  register   : register,
  unregister : unregister
};

function configure(key, value) {
  config[key] = value;
}

// This kinda sucks, but I don't think ES6 has the ability to require modules
// that may not exist. And we may be in node or in the browser.
if (typeof RSVP !== 'undefined') {
  configure('defer', RSVP.defer);
} else if (typeof require === 'function') {
  try {
    configure('defer', require('rsvp').defer);
  } catch (e) {}
}


exports.configure = configure;
exports.validator = validator;
exports.helpers = helpers;
exports.ObjectValidator = ObjectValidator;