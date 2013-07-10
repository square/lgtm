"use strict";
var ObjectValidator, ValidatorBuilder;

ObjectValidator = require("./object_validator");

ValidatorBuilder = (function() {
  ValidatorBuilder.prototype._attr = null;

  ValidatorBuilder.prototype._validator = null;

  function ValidatorBuilder(object) {
    this._validator = new ObjectValidator(object);
  }

  ValidatorBuilder.prototype.validates = function(attr) {
    this._attr = attr;
    return this;
  };

  ValidatorBuilder.prototype.using = function(fn, message) {
    this._validator.addValidation(this._attr, fn, message);
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

  return ValidatorBuilder;

})();

module.exports = ValidatorBuilder;
