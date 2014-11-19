"use strict";
var lgtm$validator_builder$$ = require("../validator_builder");

function present(value) {
  if (typeof value === 'string') {
    value = value.trim();
  }

  return value !== '' && value !== null && value !== undefined;
}

var STRICT_CHARS = /^[\x20-\x7F]*$/;
// http://stackoverflow.com/a/46181/11236
var EMAIL = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function checkEmail(options) {
  if (!options) {
    options = {};
  }

  return function(value) {
    if (typeof value === 'string') {
      value = value.trim();
    }

    if (options.strictCharacters) {
      if (!STRICT_CHARS.test(value)) {
        return false;
      }
    }

    return EMAIL.test(value);
  };
}

function checkMinLength(minLength) {
  if (minLength === null || minLength === undefined) {
    throw new Error('must specify a min length');
  }

  return function(value) {
    if (value !== null && value !== undefined) {
      return value.length >= minLength;
    } else {
      return false;
    }
  };
}

function checkMaxLength(maxLength) {
  if (maxLength === null || maxLength === undefined) {
    throw new Error('must specify a max length');
  }

  return function(value) {
    if (value !== null && value !== undefined) {
      return value.length <= maxLength;
    } else {
      return false;
    }
  };
}

function register() {
  lgtm$validator_builder$$.default.registerHelper('required', function(message) {
    this.using(present, message);
  });

  lgtm$validator_builder$$.default.registerHelper('optional', function() {
    this.when(present);
  });

  lgtm$validator_builder$$.default.registerHelper('email', function(message, options) {
    this.using(checkEmail(options), message);
  });

  lgtm$validator_builder$$.default.registerHelper('minLength', function(minLength, message) {
    this.using(checkMinLength(minLength), message);
  });

  lgtm$validator_builder$$.default.registerHelper('maxLength', function(maxLength, message) {
    this.using(checkMaxLength(maxLength), message);
  });
}

exports.present = present, exports.checkEmail = checkEmail, exports.checkMinLength = checkMinLength, exports.checkMaxLength = checkMaxLength, exports.register = register;

//# sourceMappingURL=core.js.map