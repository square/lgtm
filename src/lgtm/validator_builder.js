import ObjectValidator from './object_validator';
import { getProperties, resolve } from './utils';

function ValidatorBuilder() {
  this._validator = new ObjectValidator();
}

ValidatorBuilder.prototype = {
  _attr      : null,
  _condition : null,
  _validator : null,

  validates: function(attr) {
    this._attr = attr;
    this._condition = null;
    return this;
  },

  when: function(/* ...dependencies, condition */) {
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
  },

  using: function(/* ...dependencies, predicate, message */) {
    var dependencies = [].slice.apply(arguments);
    var message      = dependencies.pop();
    var predicate    = dependencies.pop();

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
  },

  build: function() {
    return this._validator;
  }
};

ValidatorBuilder.registerHelper = function(name, fn) {
  this.prototype[name] = function() {
    fn.apply(this, arguments);
    return this;
  };
  return null;
};

ValidatorBuilder.unregisterHelper = function(name) {
  delete this.prototype[name];
  return null;
};

export default ValidatorBuilder;
