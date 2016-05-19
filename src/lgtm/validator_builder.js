import ObjectValidator from './object_validator.js';
import { getProperties, all } from './utils.js';

export default class ValidatorBuilder {
  constructor() {
    this._validator = new ObjectValidator();
  }

  validates(attr) {
    this._attr = attr;
    this._conditions = [];
    this._conditionDependencies = [];
    return this;
  }

  when(...dependencies) {
    let condition = dependencies.pop();

    if (dependencies.length === 0) {
      dependencies = [this._attr];
    }

    for (let i = 0; i < dependencies.length; i++) {
      let dependency = dependencies[i];
      if (dependency !== this._attr) {
        this._validator.addDependentsFor(dependency, this._attr);
      }
    }

    this._conditions.push(condition);
    this._conditionDependencies.push(dependencies);
    return this;
  }

  and(...dependencies) {
    return this.when(...dependencies);
  }

  using(...dependencies) {
    let message = dependencies.pop();
    let predicate = dependencies.pop();

    if (typeof message === 'undefined') {
      throw new Error(`expected a message but got: ${message}`);
    }

    if (typeof message === 'function' && typeof predicate === 'undefined') {
      throw new Error('missing expected argument `message` after predicate function');
    }

    if (dependencies.length === 0) {
      dependencies = [this._attr];
    }

    for (let i = 0; i < dependencies.length; i++) {
      let dependency = dependencies[i];
      if (dependency !== this._attr) {
        this._validator.addDependentsFor(dependency, this._attr);
      }
    }

    function validation(value, attr, object) {
      return predicate(...getProperties(object, dependencies), attr, object);
    }

    let conditions = this._conditions.slice();
    let conditionDependencies = this._conditionDependencies.slice();

    function validationWithConditions(value, attr, object) {
      return all(conditions.map((condition, i) => {
        let dependencies = conditionDependencies[i];
        let properties = getProperties(object, dependencies);
        return condition(...properties, attr, object);
      })).then(results => {
        for (let i = 0; i < results.length; i++) {
          // a condition resolved to a falsy value; return as valid
          if (!results[i]) {
            return true;
          }
        }
        // all conditions resolved to truthy values; continue with validation
        return validation(value, attr, object);
      });
    }

    this._validator.addValidation(
      this._attr,
      conditions ? validationWithConditions : validation,
      message
    );
    return this;
  }

  build() {
    return this._validator;
  }

  static registerHelper(name, fn) {
    this.prototype[name] = function(...args) {
      fn.apply(this, args);
      return this;
    };
  }

  static unregisterHelper(name) {
    delete this.prototype[name];
  }
}
