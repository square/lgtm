"use strict";
var ObjectValidator, ValidatorBuilder, get, resolve, wrapCallbackWithCondition, wrapCallbackWithDependencies,
  __slice = [].slice;

ObjectValidator = require("./object_validator");

resolve = require("rsvp").resolve;

get = require("./utils").get;

wrapCallbackWithDependencies = function(callback, dependencies) {
  if (dependencies.length === 0) {
    return callback;
  }
  return function(value, key, object) {
    var dep, values;
    values = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
        dep = dependencies[_i];
        _results.push(get(object, dep));
      }
      return _results;
    })();
    return callback.apply(null, __slice.call(values).concat([key], [object]));
  };
};

wrapCallbackWithCondition = function(callback, condition) {
  if (condition == null) {
    return callback;
  }
  return function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return resolve(condition.apply(null, args)).then(function(result) {
      if (result) {
        return callback.apply(null, args);
      } else {
        return true;
      }
    });
  };
};

ValidatorBuilder = (function() {
  ValidatorBuilder.prototype._attr = null;

  ValidatorBuilder.prototype._condition = null;

  ValidatorBuilder.prototype._validator = null;

  function ValidatorBuilder() {
    this._validator = new ObjectValidator();
  }

  ValidatorBuilder.prototype.validates = function(attr) {
    this._attr = attr;
    this._condition = null;
    return this;
  };

  ValidatorBuilder.prototype.when = function() {
    var condition, dependencies, dependency, _i, _j, _len;
    dependencies = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), condition = arguments[_i++];
    if (dependencies.length === 0) {
      dependencies = [this._attr];
    }
    this._condition = wrapCallbackWithDependencies(condition, dependencies);
    for (_j = 0, _len = dependencies.length; _j < _len; _j++) {
      dependency = dependencies[_j];
      if (dependency !== this._attr) {
        this._validator.addDependentsFor(dependency, this._attr);
      }
    }
    return this;
  };

  ValidatorBuilder.prototype.using = function() {
    var dependencies, dependency, message, predicate, _i, _j, _len;
    dependencies = 3 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 2) : (_i = 0, []), predicate = arguments[_i++], message = arguments[_i++];
    if (dependencies.length === 0) {
      dependencies = [this._attr];
    }
    for (_j = 0, _len = dependencies.length; _j < _len; _j++) {
      dependency = dependencies[_j];
      if (dependency !== this._attr) {
        this._validator.addDependentsFor(dependency, this._attr);
      }
    }
    predicate = wrapCallbackWithCondition(predicate, this._condition);
    predicate = wrapCallbackWithDependencies(predicate, dependencies);
    this._validator.addValidation(this._attr, predicate, message);
    return this;
  };

  ValidatorBuilder.prototype.build = function() {
    return this._validator;
  };

  ValidatorBuilder.registerHelper = function(name, fn) {
    this.prototype[name] = function(message) {
      return this.using(fn, message);
    };
    return null;
  };

  ValidatorBuilder.unregisterHelper = function(name) {
    delete this.prototype[name];
    return null;
  };

  return ValidatorBuilder;

})();

module.exports = ValidatorBuilder;
