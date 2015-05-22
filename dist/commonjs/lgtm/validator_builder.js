/* jshint esnext:true, undef:true, unused:true */

"use strict";
var lgtm$object_validator$$ = require("./object_validator"), lgtm$utils$$ = require("./utils");

function ValidatorBuilder() {
  this._validator = new lgtm$object_validator$$.default();
}

ValidatorBuilder.prototype = {
  _attr                  : null,
  _conditions            : null,
  _conditionDependencies : null,
  _validator             : null,

  validates: function(attr) {
    this._attr = attr;
    this._conditions = [];
    this._conditionDependencies = [];
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

    this._conditions.push(condition);
    this._conditionDependencies.push(dependencies);
    return this;
  },

  and: function(/* ...dependencies, condition */) {
    return this.when.apply(this, arguments);
  },

  using: function(/* ...dependencies, predicate, [message] */) {
    var dependencies = [].slice.apply(arguments);
    var message, predicate;
    if (typeof dependencies[dependencies.length-1] === 'function') {
      // This form of the .using() call defers message generation to the
      // validation function
      predicate = dependencies.pop();
    } else if (
      typeof dependencies[dependencies.length-2] === 'function' &&
      typeof dependencies[dependencies.length-1] === 'string'
    ) {
      // This is the form of .using() with a message specified at the time
      // the validation is built
      message = dependencies.pop();
      predicate = dependencies.pop();
    } else {
      throw new Error('invalid arguments');
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
      var properties = lgtm$utils$$.getProperties(object, dependencies);
      return predicate.apply(null, properties.concat([attr, object]));
    }

    var conditions = this._conditions.slice();
    var conditionDependencies = this._conditionDependencies.slice();

    function validationWithConditions(value, attr, object) {
      return lgtm$utils$$.all(conditions.map(function(condition, i) {
        var dependencies = conditionDependencies[i];
        var properties = lgtm$utils$$.getProperties(object, dependencies);
        return condition.apply(null, properties.concat([attr, object]));
      })).then(function(results) {
        for (var i = 0; i < results.length; i++) {
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

exports["default"] = ValidatorBuilder;

//# sourceMappingURL=validator_builder.js.map
