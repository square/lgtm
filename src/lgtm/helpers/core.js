import ValidatorBuilder from '../validator_builder.js';

export function present(value) {
  if (typeof value === 'string') {
    value = value.trim();
  }

  return value !== '' && value !== null && value !== undefined;
}

const STRICT_CHARS = /^[\x20-\x7F]*$/;
// http://stackoverflow.com/a/46181/11236
const EMAIL = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// http://www.rfc-editor.org/errata_search.php?rfc=3696&eid=1690
const MAX_EMAIL_LENGTH = 254;

export function checkEmail(options = {}) {
  return function(value) {
    if (typeof value === 'string') {
      value = value.trim();
    }

    if (options.strictCharacters) {
      if (!STRICT_CHARS.test(value)) {
        return false;
      }
    }

    return (
      value !== undefined &&
      value !== null &&
      value.length <= MAX_EMAIL_LENGTH &&
      EMAIL.test(value)
    );
  };
}

export function checkMinLength(minLength) {
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

export function checkMaxLength(maxLength) {
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

export function register() {
  ValidatorBuilder.registerHelper('required', function(message) {
    this.using(present, message);
  });

  ValidatorBuilder.registerHelper('optional', function() {
    this.when(present);
  });

  ValidatorBuilder.registerHelper('email', function(message, options) {
    this.using(checkEmail(options), message);
  });

  ValidatorBuilder.registerHelper('minLength', function(minLength, message) {
    this.using(checkMinLength(minLength), message);
  });

  ValidatorBuilder.registerHelper('maxLength', function(maxLength, message) {
    this.using(checkMaxLength(maxLength), message);
  });
}
