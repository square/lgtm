import config from './config';
import { all, resolve, contains, keys, forEach, get, uniq } from './utils';

/**
 * Represents validations for named object attributes.
 *
 * @constructor
 */
function ObjectValidator() {
  this._validations  = {};
  this._dependencies = {};
}

/**
 * Maps attribute names to a list of predicate/message pairs.
 *
 * @type {Object}
 * @private
 */
ObjectValidator.prototype._validations = null;

/**
 * Maps attribute names to a list of dependent attributes.
 *
 * @type {Object}
 * @private
 */
ObjectValidator.prototype._dependencies = null;

/**
 * Add a validation for the given attribute.
 *
 * @param {String} attr
 * @param {function(Object, String, Object)} fn
 * @param {Object} message
 */
ObjectValidator.prototype.addValidation = function(attr, fn, message) {
  var list = this._validations[attr];

  if (!list) {
    list = this._validations[attr] = [];
  }

  list.push([fn, message]);
};

/**
 * Register dependents of the given attribute.
 *
 * @param {String} parentAttribute
 * @param {...[String]} dependentAttributes
 */
ObjectValidator.prototype.addDependentsFor = function(/* parentAttribute, ...dependentAttributes */) {
  var dependentAttributes = [].slice.apply(arguments);
  var parentAttribute = dependentAttributes.shift();

  var dependentsForParent = this._dependencies[parentAttribute];

  if (!dependentsForParent) {
    dependentsForParent = this._dependencies[parentAttribute] = [];
  }

  for (var i = 0; i < dependentAttributes.length; i++) {
    var attr = dependentAttributes[i];
    if (!contains(dependentsForParent, attr)) {
      dependentsForParent.push(attr)
    }
  }
};

/**
 * Retrieves the list of attributes this validator knows about. This includes
 * all attributes for which there is a validation plus all the attributes which
 * are dependended on by other attributes.
 *
 * @return {Array.<String>}
 */
ObjectValidator.prototype.attributes = function() {
  return uniq(
    keys(this._validations).concat(
      keys(this._dependencies)
    )
  );
};

/**
 * Validates the given object. By default all attributes will be validated, but
 * you can specify the attributes you wish to validate by passing additional
 * attribute names as arguments.
 *
 *    validator.validate(obj, 'name', 'age');
 *
 * If you pass a callback function it will be called with an error, if any
 * occurred while validating, followed by the validation results.
 *
 *    validator.validate(obj, function(error, results){});
 *
 * If no callback function is given then a promise will be returned that will
 * resolve to the validation result or, in the event of an error while
 * validating, will be rejected with the exception that was thrown.
 *
 *    validator.validate(obj).then(function(result){}, function(error){});
 *
 * @param {Object} object
 * @param {...[String]} attributes
 * @param {function(Object, Object)} callback
 * @return {Object}
 */
ObjectValidator.prototype.validate = function(/* object, attributes..., callback */) {
  var attributes = [].slice.apply(arguments);
  var object = attributes.shift();
  var callback = attributes.pop();
  var self = this;

  if (typeof callback === 'string') {
    attributes.push(callback);
    callback = null;
  }

  if (attributes.length === 0) {
    attributes = keys(this._validations);
  }

  var validationPromises = [];
  for (var i = 0; i < attributes.length; i++) {
    var attr = attributes[i];
    validationPromises = validationPromises.concat(this._validateAttribute(object, attr));
  }

  var promise = all(validationPromises).then(
    function(results) {
      results = self._collectResults(results);
      if (callback) {
        callback(null, results);
      }
      return results;
    },
    function(err) {
      if (callback) {
        callback(err);
      }
      throw err;
    });

  if (!callback) {
    return promise;
  }
};

/**
 * Runs all validations for a particular attribute and all of its dependents on
 * the given object. Returns an array of promises, one entry for each
 * validation, resolving to attribute name/message pairs, where the message is
 * null if validation passed or there were no validations for an attribute.
 *
 * @param {Object} object
 * @param {String} attr
 * @return {Array.<*>}
 * @private
 */
ObjectValidator.prototype._validateAttribute = function(object, attr) {
  var value       = get(object, attr);
  var validations = this._validations[attr];
  var results     = [];

  if (validations) {
    forEach(validations, function(pair) {
      var fn      = pair[0];
      var message = pair[1];

      var promise = resolve()
        .then(function() {
          return fn(value, attr, object);
        })
        .then(function(isValid) {
          return [ attr, isValid ? null : message ];
        });

      results.push(promise);
    });
  } else if (contains(this.attributes(), attr)) {
    results.push([ attr, null ]);
  }

  var dependents = this._getDependentsFor(attr);
  for (var i = 0; i < dependents.length; i++) {
    var dependent = dependents[i];
    results = results.concat(this._validateAttribute(object, dependent));
  }

  return results;
};

/**
 * Helper method to build the final result based on the individual validation
 * results for each validated attribute.
 *
 * @param {Array.<*>} results
 * @return {Object}
 */
ObjectValidator.prototype._collectResults = function(results) {
  var result = {
    valid  : true,
    errors : {}
  };

  for (var i = 0; i < results.length; i++) {
    if (!results[i]){ continue; }

    var attr = results[i][0];
    var message = results[i][1];
    var messages = result.errors[attr];

    if (!messages) {
      messages = result.errors[attr] = [];
    }

    if (message) {
      messages.push(message);
      result.valid = false;
    }
  }

  return result;
};

/**
 * Gets all attributes dependent on the given attribute.
 *
 * @param {String} parentAttribute
 * @return {Array.<String>}
 */
ObjectValidator.prototype._getDependentsFor = function(parentAttribute) {
  return (this._dependencies[parentAttribute] || []).slice();
};

export default ObjectValidator;
