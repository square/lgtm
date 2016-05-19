import { all, resolve, contains, keys, get, uniq } from './utils.js';

export default class ObjectValidator {
  constructor() {
    this._validations = {};
    this._dependencies = {};
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
    return uniq(
      keys(this._validations).concat(
        keys(this._dependencies)
      )
    );
  }

  validate(object, ...attributes) {
    let callback = attributes.pop();

    if (typeof callback === 'string') {
      attributes.push(callback);
      callback = null;
    }

    if (attributes.length === 0) {
      attributes = keys(this._validations);
    }

    let validationPromises = [];
    let alreadyValidating = attributes.slice();
    for (let i = 0; i < attributes.length; i++) {
      let attr = attributes[i];
      validationPromises = validationPromises.concat(
        this._validateAttribute(object, attr, alreadyValidating));
    }

    let promise = all(validationPromises)
      .then(results => {
        results = this._collectResults(results);
        if (callback) {
          callback(null, results);
        }
        return results;
      })
      .catch(err => {
        if (callback) {
          callback(err);
        }
        throw err;
      });

    if (!callback) {
      return promise;
    }
  }

  _validateAttribute(object, attr, alreadyValidating) {
    let value = get(object, attr);
    let validations = this._validations[attr];
    let results = [];

    if (validations) {
      validations.forEach(([fn, message]) => {
        let promise = resolve()
          .then(() => fn(value, attr, object))
          .then(isValid => [ attr, isValid ? null : message ]);

        results.push(promise);
      });
    } else if (contains(this.attributes(), attr)) {
      results.push([ attr, null ]);
    }

    let dependents = this._getDependentsFor(attr);
    for (let i = 0; i < dependents.length; i++) {
      let dependent = dependents[i];
      if (alreadyValidating.indexOf(dependent) < 0) {
        alreadyValidating.push(dependent);
        results = results.concat(this._validateAttribute(object, dependent, alreadyValidating));
      }
    }

    return results;
  }

  _collectResults(results) {
    let result = {
      valid  : true,
      errors : {}
    };

    for (let i = 0; i < results.length; i++) {
      if (!results[i]) { continue; }

      let [ attr, message ] = results[i];
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
