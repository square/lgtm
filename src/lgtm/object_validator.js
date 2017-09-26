import config from './config.js';
import { all, resolve, contains, keys, uniq } from './utils.js';

export default class ObjectValidator {
  _validations = {};
  _dependencies = {};

  constructor(...validations) {
    validations.forEach(validation => validation.addToValidator(this));
  }

  addValidation(attr, fn, message) {
    let list = this._validations[attr];

    if (!list) {
      list = this._validations[attr] = [];
    }

    list.push([fn, message]);
  }

  // e.g. spouseName (dependentAttribute) depends on maritalStatus (parentAttribute)
  addDependentsFor(parentAttribute, ...dependentAttributes) {
    let dependentsForParent = this._dependencies[parentAttribute];

    if (!dependentsForParent) {
      dependentsForParent = this._dependencies[parentAttribute] = [];
    }

    for (let i = 0; i < dependentAttributes.length; i++) {
      let attr = dependentAttributes[i];
      if (!contains(dependentsForParent, attr)) {
        dependentsForParent.push(attr);
      }
    }
  }

  attributes() {
    return uniq(keys(this._validations).concat(keys(this._dependencies)));
  }

  validate(object, ...attributes) {
    let callback = null;

    if (typeof attributes[attributes.length - 1] !== 'string') {
      callback = attributes.pop();
    }

    if (attributes.length === 0) {
      attributes = keys(this._validations);
    }

    let validationPromises = [];
    let alreadyValidating = attributes.slice();
    for (let i = 0; i < attributes.length; i++) {
      let attr = attributes[i];
      validationPromises = validationPromises.concat(
        this._validateAttribute(object, attr, alreadyValidating)
      );
    }

    let self = this;
    let promise = all(validationPromises).then(
      results => {
        results = this._collectResults(results);
        if (callback) {
          callback(null, results);
        }
        return results;
      },
      err => {
        if (callback) {
          callback(err);
        }
        throw err;
      }
    );

    if (!callback) {
      return promise;
    }
  }

  _validateAttribute(object, attr, alreadyValidating) {
    let value = config.get(object, attr);
    let validations = this._validations[attr];
    let results = [];

    if (validations) {
      validations.forEach(function(pair) {
        let fn = pair[0];
        let message = pair[1];

        let promise = resolve()
          .then(() => fn(value, attr, object))
          .then(isValid => [attr, isValid ? null : message]);

        results.push(promise);
      });
    } else if (contains(this.attributes(), attr)) {
      results.push([attr, null]);
    }

    let dependents = this._getDependentsFor(attr);
    for (let i = 0; i < dependents.length; i++) {
      let dependent = dependents[i];
      if (alreadyValidating.indexOf(dependent) < 0) {
        alreadyValidating.push(dependent);
        results = results.concat(
          this._validateAttribute(object, dependent, alreadyValidating)
        );
      }
    }

    return results;
  }

  _collectResults(results) {
    let result = {
      valid: true,
      errors: {}
    };

    for (let i = 0; i < results.length; i++) {
      if (!results[i]) {
        continue;
      }

      let attr = results[i][0];
      let message = results[i][1];
      let messages = result.errors[attr];

      if (!messages) {
        messages = result.errors[attr] = [];
      }

      if (message) {
        messages.push(message);
        result.valid = false;
      }
    }

    return result;
  }

  // e.g. getDependents("maritalStatus")  # => ["spouseName"]
  _getDependentsFor(parentAttribute) {
    return (this._dependencies[parentAttribute] || []).slice();
  }
}
