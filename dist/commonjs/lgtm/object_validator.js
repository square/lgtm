/* jshint esnext:true, undef:true, unused:true */

"use strict";
var lgtm$utils$$ = require("./utils");

function ObjectValidator() {
  this._validations  = {};
  this._dependencies = {};
}

ObjectValidator.prototype = {
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
      if (!lgtm$utils$$.contains(dependentsForParent, attr)) {
        dependentsForParent.push(attr);
      }
    }
  },

  attributes: function() {
    return lgtm$utils$$.uniq(
      lgtm$utils$$.keys(this._validations).concat(
        lgtm$utils$$.keys(this._dependencies)
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
      attributes = lgtm$utils$$.keys(this._validations);
    }

    var validationPromises = [];
    var alreadyValidating = attributes.slice();
    for (var i = 0; i < attributes.length; i++) {
      var attr = attributes[i];
      validationPromises = validationPromises.concat(
        this._validateAttribute(object, attr, alreadyValidating));
    }

    var promise = lgtm$utils$$.all(validationPromises).then(
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

  _validateAttribute: function(object, attr, alreadyValidating) {
    var value       = lgtm$utils$$.get(object, attr);
    var validations = this._validations[attr];
    var results     = [];

    if (validations) {
      validations.forEach(function(pair) {
        var fn      = pair[0];
        var message = pair[1];

        var promise = lgtm$utils$$.resolve()
          .then(function() {
            return fn(value, attr, object);
          })
          .then(function(validationResult) {
            if (message == undefined) {
              // This form of validation returns a message (invalid) or null (valid)
              return [ attr, validationResult ];
            } else {
              // This form of validation returns a boolean
              return [ attr, validationResult ? null : message ];
            }
          });

        results.push(promise);
      });
    } else if (lgtm$utils$$.contains(this.attributes(), attr)) {
      results.push([ attr, null ]);
    }

    var dependents = this._getDependentsFor(attr);
    for (var i = 0; i < dependents.length; i++) {
      var dependent = dependents[i];
      if (alreadyValidating.indexOf(dependent) < 0) {
        alreadyValidating.push(dependent);
        results = results.concat(this._validateAttribute(object, dependent, alreadyValidating));
      }
    }

    return results;
  },

  _collectResults: function(results) {
    var result = {
      valid  : true,
      errors : {}
    };

    for (var i = 0; i < results.length; i++) {
      if (!results[i]) { continue; }

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

exports["default"] = ObjectValidator;

//# sourceMappingURL=object_validator.js.map