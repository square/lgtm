"use strict";
var lgtm$validator_builder$$ = require("./lgtm/validator_builder"), lgtm$object_validator$$ = require("./lgtm/object_validator"), lgtm$helpers$core$$ = require("./lgtm/helpers/core"), lgtm$config$$ = require("./lgtm/config");

lgtm$helpers$core$$.register();

function validator() {
  return new lgtm$validator_builder$$.default();
}

function register() {
  lgtm$validator_builder$$.default.registerHelper.apply(lgtm$validator_builder$$.default, arguments);
}

function unregister() {
  lgtm$validator_builder$$.default.unregisterHelper.apply(lgtm$validator_builder$$.default, arguments);
}

var helpers = {
  core: {
    present: lgtm$helpers$core$$.present,
    checkEmail: lgtm$helpers$core$$.checkEmail,
    checkMinLength: lgtm$helpers$core$$.checkMinLength,
    checkMaxLength: lgtm$helpers$core$$.checkMaxLength,
    register: lgtm$helpers$core$$.register
  },
  register: register,
  unregister: unregister
};

function configure(key, value) {
  lgtm$config$$.default[key] = value;
}

/* global RSVP, require */
if (typeof RSVP !== 'undefined') {
  configure('defer', RSVP.defer);
} else if (typeof require === 'function') {
  try {
    configure('defer', require('rsvp').defer);
  } catch (e) {}
}

exports.configure = configure, exports.validator = validator, exports.helpers = helpers, exports.ObjectValidator = lgtm$object_validator$$.default;

//# sourceMappingURL=lgtm.js.map