import ValidatorBuilder from '../validator_builder';

function required(value) {
  if (typeof value === 'string') {
    value = value.trim();
  }

  return value !== '' && value !== null && value !== undefined;
}

function email(value) {
  if (typeof value === 'string') {
    value = value.trim();
  }

  // http://stackoverflow.com/a/46181/11236
  var regexp = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return regexp.test(value);
}

function minLength(minLength) {
  if (minLength === null || minLength === undefined) {
    throw new Error('must specify a min length')
  }

  return function(value) {
    if (value !== null && value !== undefined) {
      return value.length >= minLength;
    } else {
      return false;
    }
  };
}

function maxLength(maxLength) {
  if (maxLength === null || maxLength === undefined) {
    throw new Error('must specify a max length')
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
  ValidatorBuilder.registerHelper('required',  required);
  ValidatorBuilder.registerHelper('email',     email);
  ValidatorBuilder.registerHelper('minLength', minLength);
  ValidatorBuilder.registerHelper('maxLength', maxLength);
}

export { required, email, minLength, maxLength, register };
