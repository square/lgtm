"use strict";
var ObjectValidator, all, get, resolve, __dependency1__,
  __hasProp = {}.hasOwnProperty;

__dependency1__ = require("rsvp");

all = __dependency1__.all;

resolve = __dependency1__.resolve;

get = function(object, property) {
  if (object == null) {

  } else if (typeof object.get === 'function') {
    return object.get(property);
  } else {
    return object[property];
  }
};

ObjectValidator = (function() {
  ObjectValidator.prototype.object = null;

  ObjectValidator.prototype._validations = null;

  function ObjectValidator(object) {
    this.object = object;
    this._validations = [];
  }

  ObjectValidator.prototype.addValidation = function(attr, fn, message) {
    var list, _base;
    list = (_base = this._validations)[attr] || (_base[attr] = []);
    list.push([fn, message]);
    return null;
  };

  ObjectValidator.prototype.validate = function(callback) {
    var attr, promise, validationPromises, _ref,
      _this = this;
    validationPromises = [];
    _ref = this._validations;
    for (attr in _ref) {
      if (!__hasProp.call(_ref, attr)) continue;
      validationPromises.push.apply(validationPromises, this._validateAttribute(attr));
    }
    promise = all(validationPromises).then(function(results) {
      results = _this._collectResults(results);
      if (typeof callback === "function") {
        callback(results);
      }
      return results;
    });
    if (callback == null) {
      return promise;
    }
  };

  ObjectValidator.prototype._validateAttribute = function(attr) {
    var fn, message, value, _i, _len, _ref, _ref1, _results;
    value = get(this.object, attr);
    _ref = this._validations[attr];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      _ref1 = _ref[_i], fn = _ref1[0], message = _ref1[1];
      _results.push((function(message) {
        return resolve(fn(value)).then(function(isValid) {
          if (isValid !== true) {
            return [attr, message];
          }
        });
      })(message));
    }
    return _results;
  };

  ObjectValidator.prototype._collectResults = function(results) {
    var attr, attrMessage, message, messages, result, _base, _i, _len;
    result = {
      valid: true,
      errors: {}
    };
    for (_i = 0, _len = results.length; _i < _len; _i++) {
      attrMessage = results[_i];
      if (!(attrMessage != null)) {
        continue;
      }
      attr = attrMessage[0], message = attrMessage[1];
      messages = (_base = result.errors)[attr] || (_base[attr] = []);
      messages.push(message);
      result.valid = false;
    }
    return result;
  };

  return ObjectValidator;

})();

module.exports = ObjectValidator;
