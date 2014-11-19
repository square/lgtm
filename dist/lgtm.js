(function() {
    "use strict";
    /* jshint esnext:true, undef:true, unused:true */

    var $$lgtm$config$$config = {};

    $$lgtm$config$$config.defer = function() {
      throw new Error(
        'No "defer" function provided to LGTM! ' +
        'Please use lgtm-standalone.js or call ' +
        'LGTM.configure("defer", myDeferFunction) ' +
        'e.g. to use with Q, use Q.defer.'
      );
    };

    var $$lgtm$config$$default = $$lgtm$config$$config;

    /**
     * Iteration
     */

    function $$utils$$forEach(iterable, iterator) {
      if (typeof iterable.forEach === 'function') {
        iterable.forEach(iterator);
      } else if ({}.toString.call(iterable) === '[object Object]') {
        var hasOwnProp = {}.hasOwnProperty;
        for (var key in iterable) {
          if (hasOwnProp.call(iterable, key)) {
            iterator(iterable[key], key);
          }
        }
      } else {
        for (var i = 0; i < iterable.length; i++) {
          iterator(iterable[i], i);
        }
      }
    }

    function $$utils$$keys(object) {
      if (Object.getOwnPropertyNames) {
        return Object.getOwnPropertyNames(object);
      } else {
        var result = [];
        $$utils$$forEach(object, function(key) {
          result.push(key);
        });
        return result;
      }
    }


    /**
     * Property access
     */

    function $$utils$$get(object, property) {
      if (object === null || object === undefined) {
        return;
      } else if (typeof object.get === 'function') {
        return object.get(property);
      } else {
        return object[property];
      }
    }

    function $$utils$$getProperties(object, properties) {
      return properties.map(function(prop) {
        return $$utils$$get(object, prop);
      });
    }


    /**
     * Array manipulation
     */

    function $$utils$$contains(array, object) {
      return array.indexOf(object) > -1;
    }

    function $$utils$$uniq(array) {
      var result = [];

      for (var i = 0; i < array.length; i++) {
        var item = array[i];
        if (!$$utils$$contains(result, item)) {
          result.push(item);
        }
      }

      return result;
    }


    /**
     * Promises
     */

    function $$utils$$resolve(thenable) {
      var deferred = $$lgtm$config$$default.defer();
      deferred.resolve(thenable);
      return deferred.promise;
    }

    function $$utils$$all(thenables) {
      if (thenables.length === 0) {
        return $$utils$$resolve([]);
      }

      var results = [];
      var remaining = thenables.length;
      var deferred = $$lgtm$config$$default.defer();

      function resolver(index) {
        return function(value) {
          results[index] = value;
          if (--remaining === 0) {
            deferred.resolve(results);
          }
        };
      }

      for (var i = 0; i < thenables.length; i++) {
        var thenable = thenables[i];
        $$utils$$resolve(thenable).then(resolver(i), deferred.reject);
      }

      return deferred.promise;
    }

    function $$lgtm$object_validator$$ObjectValidator() {
      this._validations  = {};
      this._dependencies = {};
    }

    $$lgtm$object_validator$$ObjectValidator.prototype = {
      _validations  : null,
      _dependencies : null,

      addValidation: function(attr, fn, message) {
        var list = this._validations[attr];

        if (!list) {
          list = this._validations[attr] = [];
        }

        list.push([fn, message]);
      },

      // e.g. spouseName (dependentAttribute) depends on maritalStatus (parentAttribute)
      addDependentsFor: function(/* parentAttribute, ...dependentAttributes */) {
        var dependentAttributes = [].slice.apply(arguments);
        var parentAttribute = dependentAttributes.shift();

        var dependentsForParent = this._dependencies[parentAttribute];

        if (!dependentsForParent) {
          dependentsForParent = this._dependencies[parentAttribute] = [];
        }

        for (var i = 0; i < dependentAttributes.length; i++) {
          var attr = dependentAttributes[i];
          if (!$$utils$$contains(dependentsForParent, attr)) {
            dependentsForParent.push(attr);
          }
        }
      },

      attributes: function() {
        return $$utils$$uniq(
          $$utils$$keys(this._validations).concat(
            $$utils$$keys(this._dependencies)
          )
        );
      },

      validate: function(/* object, attributes..., callback */) {
        var attributes = [].slice.apply(arguments);
        var object = attributes.shift();
        var callback = attributes.pop();
        var self = this;

        if (typeof callback === 'string') {
          attributes.push(callback);
          callback = null;
        }

        if (attributes.length === 0) {
          attributes = $$utils$$keys(this._validations);
        }

        var validationPromises = [];
        for (var i = 0; i < attributes.length; i++) {
          var attr = attributes[i];
          validationPromises = validationPromises.concat(this._validateAttribute(object, attr));
        }

        var promise = $$utils$$all(validationPromises).then(
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
      },

      _validateAttribute: function(object, attr) {
        var value       = $$utils$$get(object, attr);
        var validations = this._validations[attr];
        var results     = [];

        if (validations) {
          validations.forEach(function(pair) {
            var fn      = pair[0];
            var message = pair[1];

            var promise = $$utils$$resolve()
              .then(function() {
                return fn(value, attr, object);
              })
              .then(function(isValid) {
                return [ attr, isValid ? null : message ];
              });

            results.push(promise);
          });
        } else if ($$utils$$contains(this.attributes(), attr)) {
          results.push([ attr, null ]);
        }

        var dependents = this._getDependentsFor(attr);
        for (var i = 0; i < dependents.length; i++) {
          var dependent = dependents[i];
          results = results.concat(this._validateAttribute(object, dependent));
        }

        return results;
      },

      _collectResults: function(results) {
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
      },

      // e.g. getDependents("maritalStatus")  # => ["spouseName"]
      _getDependentsFor: function(parentAttribute) {
        return (this._dependencies[parentAttribute] || []).slice();
      }
    };

    var $$lgtm$object_validator$$default = $$lgtm$object_validator$$ObjectValidator;

    function $$lgtm$validator_builder$$ValidatorBuilder() {
      this._validator = new $$lgtm$object_validator$$default();
    }

    $$lgtm$validator_builder$$ValidatorBuilder.prototype = {
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

      using: function(/* ...dependencies, predicate, message */) {
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
          var properties = $$utils$$getProperties(object, dependencies);
          return predicate.apply(null, properties.concat([attr, object]));
        }

        var conditions = this._conditions.slice();
        var conditionDependencies = this._conditionDependencies.slice();

        function validationWithConditions(value, attr, object) {
          return $$utils$$all(conditions.map(function(condition, i) {
            var dependencies = conditionDependencies[i];
            var properties = $$utils$$getProperties(object, dependencies);
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

    $$lgtm$validator_builder$$ValidatorBuilder.registerHelper = function(name, fn) {
      this.prototype[name] = function() {
        fn.apply(this, arguments);
        return this;
      };
      return null;
    };

    $$lgtm$validator_builder$$ValidatorBuilder.unregisterHelper = function(name) {
      delete this.prototype[name];
      return null;
    };

    var $$lgtm$validator_builder$$default = $$lgtm$validator_builder$$ValidatorBuilder;

    function $$lgtm$helpers$core$$present(value) {
      if (typeof value === 'string') {
        value = value.trim();
      }

      return value !== '' && value !== null && value !== undefined;
    }

    var $$lgtm$helpers$core$$STRICT_CHARS = /^[\x20-\x7F]*$/;
    // http://stackoverflow.com/a/46181/11236
    var $$lgtm$helpers$core$$EMAIL = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    function $$lgtm$helpers$core$$checkEmail(options) {
      if (!options) {
        options = {};
      }

      return function(value) {
        if (typeof value === 'string') {
          value = value.trim();
        }

        if (options.strictCharacters) {
          if (!$$lgtm$helpers$core$$STRICT_CHARS.test(value)) {
            return false;
          }
        }

        return $$lgtm$helpers$core$$EMAIL.test(value);
      };
    }

    function $$lgtm$helpers$core$$checkMinLength(minLength) {
      if (minLength === null || minLength === undefined) {
        throw new Error('must specify a min length');
      }

      return function(value) {
        if (value !== null && value !== undefined) {
          return value.length >= minLength;
        } else {
          return false;
        }
      };
    }

    function $$lgtm$helpers$core$$checkMaxLength(maxLength) {
      if (maxLength === null || maxLength === undefined) {
        throw new Error('must specify a max length');
      }

      return function(value) {
        if (value !== null && value !== undefined) {
          return value.length <= maxLength;
        } else {
          return false;
        }
      };
    }

    function $$lgtm$helpers$core$$register() {
      $$lgtm$validator_builder$$default.registerHelper('required', function(message) {
        this.using($$lgtm$helpers$core$$present, message);
      });

      $$lgtm$validator_builder$$default.registerHelper('optional', function() {
        this.when($$lgtm$helpers$core$$present);
      });

      $$lgtm$validator_builder$$default.registerHelper('email', function(message, options) {
        this.using($$lgtm$helpers$core$$checkEmail(options), message);
      });

      $$lgtm$validator_builder$$default.registerHelper('minLength', function(minLength, message) {
        this.using($$lgtm$helpers$core$$checkMinLength(minLength), message);
      });

      $$lgtm$validator_builder$$default.registerHelper('maxLength', function(maxLength, message) {
        this.using($$lgtm$helpers$core$$checkMaxLength(maxLength), message);
      });
    }

    $$lgtm$helpers$core$$register();

    function $$lgtm$$validator() {
      return new $$lgtm$validator_builder$$default();
    }

    function $$lgtm$$register() {
      $$lgtm$validator_builder$$default.registerHelper.apply($$lgtm$validator_builder$$default, arguments);
    }

    function $$lgtm$$unregister() {
      $$lgtm$validator_builder$$default.unregisterHelper.apply($$lgtm$validator_builder$$default, arguments);
    }

    var $$lgtm$$helpers = {
      core: {
        present: $$lgtm$helpers$core$$present,
        checkEmail: $$lgtm$helpers$core$$checkEmail,
        checkMinLength: $$lgtm$helpers$core$$checkMinLength,
        checkMaxLength: $$lgtm$helpers$core$$checkMaxLength,
        register: $$lgtm$helpers$core$$register
      },
      register: $$lgtm$$register,
      unregister: $$lgtm$$unregister
    };

    function $$lgtm$$configure(key, value) {
      $$lgtm$config$$default[key] = value;
    }

    /* global RSVP, require */
    if (typeof RSVP !== 'undefined') {
      $$lgtm$$configure('defer', RSVP.defer);
    } else if (typeof require === 'function') {
      try {
        $$lgtm$$configure('defer', require('rsvp').defer);
      } catch (e) {}
    }

    var lgtm$umd$$LGTM = {
      configure: $$lgtm$$configure,
      validator: $$lgtm$$validator,
      helpers: $$lgtm$$helpers,
      ObjectValidator: $$lgtm$object_validator$$default
    };

    if (typeof module !== 'undefined' && module.exports) {
      module.exports = lgtm$umd$$LGTM;
    } else if (typeof define !== 'undefined' && define.amd) {
      define(function() { return lgtm$umd$$LGTM; });
    } else if (typeof window !== 'undefined') {
      window.LGTM = lgtm$umd$$LGTM;
    } else if (this) {
      this.LGTM = lgtm$umd$$LGTM;
    }
}).call(this);

//# sourceMappingURL=lgtm.js.map