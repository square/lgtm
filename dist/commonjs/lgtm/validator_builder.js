"use strict";
var ObjectValidator, ValidatorBuilder, getProperties, resolve,
  __slice = [].slice;

ObjectValidator = require("./object_validator");

resolve = require("rsvp").resolve;

getProperties = require("./utils").getProperties;

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
    for (_j = 0, _len = dependencies.length; _j < _len; _j++) {
      dependency = dependencies[_j];
      if (dependency !== this._attr) {
        this._validator.addDependentsFor(dependency, this._attr);
      }
    }
    this._condition = condition;
    this._conditionDependencies = dependencies;
    return this;
  };

  ValidatorBuilder.prototype.using = function() {
    var condition, conditionDependencies, dependencies, dependency, message, predicate, validation, validationWithCondition, _i, _j, _len;
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
    validation = function(value, attr, object) {
      return predicate.apply(null, __slice.call(getProperties(object, dependencies)).concat([attr], [object]));
    };
    condition = this._condition;
    conditionDependencies = this._conditionDependencies;
    validationWithCondition = function(value, attr, object) {
      var args;
      args = getProperties(object, conditionDependencies);
      args.push(attr, object);
      return resolve(condition.apply(null, args)).then(function(result) {
        if (result) {
          return validation(value, attr, object);
        } else {
          return true;
        }
      });
    };
    this._validator.addValidation(this._attr, (condition != null ? validationWithCondition : validation), message);
    return this;
  };

  ValidatorBuilder.prototype.build = function() {
    return this._validator;
  };

  ValidatorBuilder.registerHelper = function(name, fn) {
    this.prototype[name] = function() {
      var message, options, _i;
      options = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), message = arguments[_i++];
      if (options.length === 0) {
        return this.using(fn, message);
      } else {
        return this.using(fn.apply(null, options), message);
      }
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
