"use strict";
var ObjectValidator, all, get, resolve, uniq, __dependency1__, __dependency2__,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty;

__dependency1__ = require("rsvp");

all = __dependency1__.all;

resolve = __dependency1__.resolve;

__dependency2__ = require("./utils");

get = __dependency2__.get;

uniq = __dependency2__.uniq;

ObjectValidator = (function() {
  ObjectValidator.prototype._validations = null;

  ObjectValidator.prototype._dependencies = null;

  function ObjectValidator() {
    this._validations = {};
    this._dependencies = {};
  }

  ObjectValidator.prototype.addValidation = function(attr, fn, message) {
    var list, _base;
    list = (_base = this._validations)[attr] || (_base[attr] = []);
    list.push([fn, message]);
    return null;
  };

  ObjectValidator.prototype.addDependentsFor = function() {
    var attr, dependentAttributes, dependentsForParent, parentAttribute, _base, _i, _len;
    parentAttribute = arguments[0], dependentAttributes = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    dependentsForParent = (_base = this._dependencies)[parentAttribute] || (_base[parentAttribute] = []);
    for (_i = 0, _len = dependentAttributes.length; _i < _len; _i++) {
      attr = dependentAttributes[_i];
      if (__indexOf.call(dependentsForParent, attr) < 0) {
        dependentsForParent.push(attr);
      }
    }
    return null;
  };

  ObjectValidator.prototype.attributes = function() {
    var attribute, attributes, parentAttribute, _ref, _ref1;
    attributes = [];
    _ref = this._validations;
    for (attribute in _ref) {
      if (!__hasProp.call(_ref, attribute)) continue;
      attributes.push(attribute);
    }
    _ref1 = this._dependencies;
    for (parentAttribute in _ref1) {
      if (!__hasProp.call(_ref1, parentAttribute)) continue;
      attributes.push(parentAttribute);
    }
    return uniq(attributes);
  };

  ObjectValidator.prototype.validate = function() {
    var attr, attributes, callback, object, promise, validationPromises, _i, _j, _len,
      _this = this;
    object = arguments[0], attributes = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
    if (typeof callback === 'string') {
      attributes.push(callback);
      callback = null;
    }
    if (attributes.length === 0) {
      attributes = (function() {
        var _ref, _results;
        _ref = this._validations;
        _results = [];
        for (attr in _ref) {
          if (!__hasProp.call(_ref, attr)) continue;
          _results.push(attr);
        }
        return _results;
      }).call(this);
    }
    validationPromises = [];
    for (_j = 0, _len = attributes.length; _j < _len; _j++) {
      attr = attributes[_j];
      validationPromises.push.apply(validationPromises, this._validateAttribute(object, attr));
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

  ObjectValidator.prototype._validateAttribute = function(object, attr) {
    var dependent, results, validations, value, _i, _len, _ref;
    value = get(object, attr);
    validations = this._validations[attr];
    results = [];
    if (validations != null) {
      validations.forEach(function(_arg) {
        var fn, message;
        fn = _arg[0], message = _arg[1];
        return results.push(resolve(fn(value, attr, object)).then(function(isValid) {
          return [attr, isValid ? null : message];
        }));
      });
    } else {
      if (__indexOf.call(this.attributes(), attr) >= 0) {
        results.push([attr, null]);
      }
    }
    _ref = this._getDependentsFor(attr);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      dependent = _ref[_i];
      results.push.apply(results, this._validateAttribute(object, dependent));
    }
    return results;
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
      if (message != null) {
        messages.push(message);
        result.valid = false;
      }
    }
    return result;
  };

  ObjectValidator.prototype._getDependentsFor = function(parentAttribute) {
    return (this._dependencies[parentAttribute] || []).slice();
  };

  return ObjectValidator;

})();

module.exports = ObjectValidator;
