import ObjectValidator from './object_validator';
import { getProperties, resolve } from './utils';

/**
 * This object builds an ObjectValidator using the builder pattern. The result
 * is intended to read more or less as a sentence – a description of what the
 * validator will do.
 *
 * @constructor
 */
function ValidatorBuilder() {
  this._validator = new ObjectValidator();
}

/**
 * The current validated attribute – the last value passed to validates().
 *
 * @type {String}
 * @private
 */
ValidatorBuilder.prototype._attr = null;

/**
 * The current condition function – the last value passed to when().
 *
 * @type {function(...[*], String, Object)}
 * @private
 */
ValidatorBuilder.prototype._condition = null;

/**
 * The ObjectValidator being built. Returned by build().
 *
 * @type {ObjectValidator}
 * @private
 */
ValidatorBuilder.prototype._validator = null;

/**
 * Configures the builder to start building validation for the given attribute.
 *
 * @param {String} attr
 * @return {ValidatorBuilder}
 */
ValidatorBuilder.prototype.validates = function(attr) {
  this._attr = attr;
  this._condition = null;
  return this;
};

/**
 * Configures the builder to make subsequent validations for the current
 * attribute conditional based on the given predicate function.
 *
 * @param {...[String]} dependencies Attributes this condition depends on.
 * @param {function(...[*], String, Object)} condition The condition used to gate validations.
 * @return {ValidatorBuilder}
 */
ValidatorBuilder.prototype.when = function(/* ...dependencies, condition */) {
  var dependencies = [].slice.apply(arguments);
  var condition    = dependencies.pop();

  if (dependencies.length === 0) {
    dependencies = [this._attr];
  }

  for (var i = 0; i < dependencies.length; i++) {
    var dependency = dependencies[i];
    if (dependency !== this._attr) {
      this._validator.addDependentsFor(dependency, this._attr);
    }
  }

  this._condition = condition;
  this._conditionDependencies = dependencies;
  return this;
};

/**
 * Register a validation for the current attribute.
 *
 * @param {...[String]} dependencies Attributes this validation depends on.
 * @param {function(...[*], String, Object)} predicate The function to validate the current attribute.
 * @param {Object} message A message, usually a string, to pass when invalid.
 * @return {ValidatorBuilder}
 */
ValidatorBuilder.prototype.using = function(/* ...dependencies, predicate, message */) {
  var dependencies = [].slice.apply(arguments);
  var message      = dependencies.pop();
  var predicate    = dependencies.pop();

  if (typeof message === 'function' && typeof predicate === 'undefined') {
    throw new Error('missing expected argument `message` after predicate function');
  }

  if (dependencies.length === 0) {
    dependencies = [this._attr];
  }

  for (var i = 0; i < dependencies.length; i++) {
    var dependency = dependencies[i];
    if (dependency !== this._attr) {
      this._validator.addDependentsFor(dependency, this._attr);
    }
  }

  function validation(value, attr, object) {
    var properties = getProperties(object, dependencies);
    return predicate.apply(null, properties.concat([attr, object]));
  }

  var condition = this._condition;
  var conditionDependencies = this._conditionDependencies;

  function validationWithCondition(value, attr, object) {
    var properties = getProperties(object, conditionDependencies);
    var conditionResult = condition.apply(null, properties.concat([attr, object]));
    return resolve(conditionResult).then(function(result) {
      if (result) {
        // condition resolved to a truthy value, so continue with validation
        return validation(value, attr, object);
      } else {
        // condition resolved to a falsy value, so just return as valid
        return true;
      }
    });
  }

  this._validator.addValidation(
    this._attr,
    condition ? validationWithCondition : validation,
    message
  );
  return this;
};

/**
 * Build the ObjectValidator for use with validation.
 *
 * @return {ObjectValidator}
 */
ValidatorBuilder.prototype.build = function() {
  return this._validator;
};

/**
 * Registers a helper to extend the DSL offered by ValidatorBuilder.
 *
 * @param {String} name The name to use for the DSL method.
 * @param {function(...[*])} fn A callback for when the helper is used.
 */
ValidatorBuilder.registerHelper = function(name, fn) {
  ValidatorBuilder.prototype[name] = function() {
    fn.apply(this, arguments);
    return this;
  };
};

/**
 * Unregisters an existing DSL helper. Existing ObjectValidators built using
 * the helper will continue to function, but new ValidatorBuilder instances
 * will not have the helper.
 *
 * @param {String} name
 */
ValidatorBuilder.unregisterHelper = function(name) {
  delete ValidatorBuilder.prototype[name];
};

export default ValidatorBuilder;
