/* jshint esnext:true */

import ValidatorBuilder from '../validator_builder';

function present(value) {
  if (typeof value === 'string') {
    value = value.trim();
  }

  return value !== '' && value !== null && value !== undefined;
}

function checkEmail(value, options) {
  if (typeof value === 'string') {
    value = value.trim();
  }

  // http://stackoverflow.com/a/46181/11236
  var regexp = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regexp.test(value);
}

function checkStrictEmail(value) {
  if (typeof value === 'string') {
    value = value.trim();
  }

  var regexp = /^[\x20-\x7F]*$/;
  return regexp.test(value) && checkEmail(value)
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
  ValidatorBuilder.registerHelper('required', function(message) {
    this.using(present, message);
  });

  ValidatorBuilder.registerHelper('optional', function() {
    this.when(present);
  });

  ValidatorBuilder.registerHelper('email', function(message) {
    this.using(checkEmail, message);
  });

  ValidatorBuilder.registerHelper('strictEmail', function(message) {
    this.using(checkStrictEmail, message);
  });

  ValidatorBuilder.registerHelper('minLength', function(minLength, message) {
    this.using(checkMinLength(minLength), message);
  });

  ValidatorBuilder.registerHelper('maxLength', function(maxLength, message) {
    this.using(checkMaxLength(maxLength), message);
  });
}

export { present, checkEmail, checkStrictEmail, checkMinLength, checkMaxLength, register };
