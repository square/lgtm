/* jshint esnext:true, undef:true, unused:true */

import ValidatorBuilder from './lgtm/validator_builder';
import ObjectValidator from './lgtm/object_validator';
import { present, checkEmail, checkMinLength, checkMaxLength, register as core_register } from './lgtm/helpers/core';
import config from './lgtm/config';

core_register();

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
  core: {
    present: present,
    checkEmail: checkEmail,
    checkMinLength: checkMinLength,
    checkMaxLength: checkMaxLength,
    register: core_register
  },
  register: register,
  unregister: unregister
};

function configure(key, value) {
  config[key] = value;
}

/* global RSVP, require */
if (typeof RSVP !== 'undefined') {
  configure('defer', RSVP.defer);
} else if (typeof require === 'function') {
  try {
    configure('defer', require('rsvp').defer);
  } catch (e) {}
}

export { configure, validator, helpers, ObjectValidator };
