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

    function $$events$$indexOf(callbacks, callback) {
      for (var i=0, l=callbacks.length; i<l; i++) {
        if (callbacks[i] === callback) { return i; }
      }

      return -1;
    }

    function $$events$$callbacksFor(object) {
      var callbacks = object._promiseCallbacks;

      if (!callbacks) {
        callbacks = object._promiseCallbacks = {};
      }

      return callbacks;
    }

    var $$events$$default = {

      /**
        `RSVP.EventTarget.mixin` extends an object with EventTarget methods. For
        Example:

        ```javascript
        var object = {};

        RSVP.EventTarget.mixin(object);

        object.on('finished', function(event) {
          // handle event
        });

        object.trigger('finished', { detail: value });
        ```

        `EventTarget.mixin` also works with prototypes:

        ```javascript
        var Person = function() {};
        RSVP.EventTarget.mixin(Person.prototype);

        var yehuda = new Person();
        var tom = new Person();

        yehuda.on('poke', function(event) {
          console.log('Yehuda says OW');
        });

        tom.on('poke', function(event) {
          console.log('Tom says OW');
        });

        yehuda.trigger('poke');
        tom.trigger('poke');
        ```

        @method mixin
        @for RSVP.EventTarget
        @private
        @param {Object} object object to extend with EventTarget methods
      */
      mixin: function(object) {
        object.on = this.on;
        object.off = this.off;
        object.trigger = this.trigger;
        object._promiseCallbacks = undefined;
        return object;
      },

      /**
        Registers a callback to be executed when `eventName` is triggered

        ```javascript
        object.on('event', function(eventInfo){
          // handle the event
        });

        object.trigger('event');
        ```

        @method on
        @for RSVP.EventTarget
        @private
        @param {String} eventName name of the event to listen for
        @param {Function} callback function to be called when the event is triggered.
      */
      on: function(eventName, callback) {
        var allCallbacks = $$events$$callbacksFor(this), callbacks;

        callbacks = allCallbacks[eventName];

        if (!callbacks) {
          callbacks = allCallbacks[eventName] = [];
        }

        if ($$events$$indexOf(callbacks, callback) === -1) {
          callbacks.push(callback);
        }
      },

      /**
        You can use `off` to stop firing a particular callback for an event:

        ```javascript
        function doStuff() { // do stuff! }
        object.on('stuff', doStuff);

        object.trigger('stuff'); // doStuff will be called

        // Unregister ONLY the doStuff callback
        object.off('stuff', doStuff);
        object.trigger('stuff'); // doStuff will NOT be called
        ```

        If you don't pass a `callback` argument to `off`, ALL callbacks for the
        event will not be executed when the event fires. For example:

        ```javascript
        var callback1 = function(){};
        var callback2 = function(){};

        object.on('stuff', callback1);
        object.on('stuff', callback2);

        object.trigger('stuff'); // callback1 and callback2 will be executed.

        object.off('stuff');
        object.trigger('stuff'); // callback1 and callback2 will not be executed!
        ```

        @method off
        @for RSVP.EventTarget
        @private
        @param {String} eventName event to stop listening to
        @param {Function} callback optional argument. If given, only the function
        given will be removed from the event's callback queue. If no `callback`
        argument is given, all callbacks will be removed from the event's callback
        queue.
      */
      off: function(eventName, callback) {
        var allCallbacks = $$events$$callbacksFor(this), callbacks, index;

        if (!callback) {
          allCallbacks[eventName] = [];
          return;
        }

        callbacks = allCallbacks[eventName];

        index = $$events$$indexOf(callbacks, callback);

        if (index !== -1) { callbacks.splice(index, 1); }
      },

      /**
        Use `trigger` to fire custom events. For example:

        ```javascript
        object.on('foo', function(){
          console.log('foo event happened!');
        });
        object.trigger('foo');
        // 'foo event happened!' logged to the console
        ```

        You can also pass a value as a second argument to `trigger` that will be
        passed as an argument to all event listeners for the event:

        ```javascript
        object.on('foo', function(value){
          console.log(value.name);
        });

        object.trigger('foo', { name: 'bar' });
        // 'bar' logged to the console
        ```

        @method trigger
        @for RSVP.EventTarget
        @private
        @param {String} eventName name of the event to be triggered
        @param {Any} options optional value to be passed to any event handlers for
        the given `eventName`
      */
      trigger: function(eventName, options) {
        var allCallbacks = $$events$$callbacksFor(this), callbacks, callback;

        if (callbacks = allCallbacks[eventName]) {
          // Don't cache the callbacks.length since it may grow
          for (var i=0; i<callbacks.length; i++) {
            callback = callbacks[i];

            callback(options);
          }
        }
      }
    };

    var $$config$$config = {
      instrument: false
    };

    $$events$$default.mixin($$config$$config);

    function $$config$$configure(name, value) {
      if (name === 'onerror') {
        // handle for legacy users that expect the actual
        // error to be passed to their function added via
        // `RSVP.configure('onerror', someFunctionHere);`
        $$config$$config.on('error', value);
        return;
      }

      if (arguments.length === 2) {
        $$config$$config[name] = value;
      } else {
        return $$config$$config[name];
      }
    }

    function $$utils1$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function $$utils1$$isFunction(x) {
      return typeof x === 'function';
    }

    function $$utils1$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var $$utils1$$_isArray;
    if (!Array.isArray) {
      $$utils1$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      $$utils1$$_isArray = Array.isArray;
    }

    var $$utils1$$isArray = $$utils1$$_isArray;

    var $$utils1$$now = Date.now || function() { return new Date().getTime(); };

    var $$utils1$$o_create = (Object.create || function(object) {
      var o = function() { };
      o.prototype = object;
      return o;
    });

    var $$instrument$$queue = [];

    function $$instrument$$instrument(eventName, promise, child) {
      if (1 === $$instrument$$queue.push({
          name: eventName,
          payload: {
            guid: promise._guidKey + promise._id,
            eventName: eventName,
            detail: promise._result,
            childGuid: child && promise._guidKey + child._id,
            label: promise._label,
            timeStamp: $$utils1$$now(),
            stack: new Error(promise._label).stack
          }})) {

            setTimeout(function() {
              var entry;
              for (var i = 0; i < $$instrument$$queue.length; i++) {
                entry = $$instrument$$queue[i];
                $$config$$config.trigger(entry.name, entry.payload);
              }
              $$instrument$$queue.length = 0;
            }, 50);
          }
      }
    var $$instrument$$default = $$instrument$$instrument;

    function $$$internal$$noop() {}

    var $$$internal$$PENDING   = void 0;
    var $$$internal$$FULFILLED = 1;
    var $$$internal$$REJECTED  = 2;

    var $$$internal$$GET_THEN_ERROR = new $$$internal$$ErrorObject();

    function $$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        $$$internal$$GET_THEN_ERROR.error = error;
        return $$$internal$$GET_THEN_ERROR;
      }
    }

    function $$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function $$$internal$$handleForeignThenable(promise, thenable, then) {
      $$config$$config.async(function(promise) {
        var sealed = false;
        var error = $$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            $$$internal$$resolve(promise, value);
          } else {
            $$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          $$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          $$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function $$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === $$$internal$$FULFILLED) {
        $$$internal$$fulfill(promise, thenable._result);
      } else if (promise._state === $$$internal$$REJECTED) {
        $$$internal$$reject(promise, thenable._result);
      } else {
        $$$internal$$subscribe(thenable, undefined, function(value) {
          if (thenable !== value) {
            $$$internal$$resolve(promise, value);
          } else {
            $$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          $$$internal$$reject(promise, reason);
        });
      }
    }

    function $$$internal$$handleMaybeThenable(promise, maybeThenable) {
      if (maybeThenable.constructor === promise.constructor) {
        $$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        var then = $$$internal$$getThen(maybeThenable);

        if (then === $$$internal$$GET_THEN_ERROR) {
          $$$internal$$reject(promise, $$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          $$$internal$$fulfill(promise, maybeThenable);
        } else if ($$utils1$$isFunction(then)) {
          $$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          $$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function $$$internal$$resolve(promise, value) {
      if (promise === value) {
        $$$internal$$fulfill(promise, value);
      } else if ($$utils1$$objectOrFunction(value)) {
        $$$internal$$handleMaybeThenable(promise, value);
      } else {
        $$$internal$$fulfill(promise, value);
      }
    }

    function $$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      $$$internal$$publish(promise);
    }

    function $$$internal$$fulfill(promise, value) {
      if (promise._state !== $$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = $$$internal$$FULFILLED;

      if (promise._subscribers.length === 0) {
        if ($$config$$config.instrument) {
          $$instrument$$default('fulfilled', promise);
        }
      } else {
        $$config$$config.async($$$internal$$publish, promise);
      }
    }

    function $$$internal$$reject(promise, reason) {
      if (promise._state !== $$$internal$$PENDING) { return; }
      promise._state = $$$internal$$REJECTED;
      promise._result = reason;

      $$config$$config.async($$$internal$$publishRejection, promise);
    }

    function $$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + $$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + $$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        $$config$$config.async($$$internal$$publish, parent);
      }
    }

    function $$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if ($$config$$config.instrument) {
        $$instrument$$default(settled === $$$internal$$FULFILLED ? 'fulfilled' : 'rejected', promise);
      }

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          $$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function $$$internal$$ErrorObject() {
      this.error = null;
    }

    var $$$internal$$TRY_CATCH_ERROR = new $$$internal$$ErrorObject();

    function $$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        $$$internal$$TRY_CATCH_ERROR.error = e;
        return $$$internal$$TRY_CATCH_ERROR;
      }
    }

    function $$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = $$utils1$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = $$$internal$$tryCatch(callback, detail);

        if (value === $$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          $$$internal$$reject(promise, new TypeError('A promises callback cannot return that same promise.'));
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== $$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        $$$internal$$resolve(promise, value);
      } else if (failed) {
        $$$internal$$reject(promise, error);
      } else if (settled === $$$internal$$FULFILLED) {
        $$$internal$$fulfill(promise, value);
      } else if (settled === $$$internal$$REJECTED) {
        $$$internal$$reject(promise, value);
      }
    }

    function $$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          $$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          $$$internal$$reject(promise, reason);
        });
      } catch(e) {
        $$$internal$$reject(promise, e);
      }
    }

    function $$$enumerator$$makeSettledResult(state, position, value) {
      if (state === $$$internal$$FULFILLED) {
        return {
          state: 'fulfilled',
          value: value
        };
      } else {
        return {
          state: 'rejected',
          reason: value
        };
      }
    }

    function $$$enumerator$$Enumerator(Constructor, input, abortOnReject, label) {
      this._instanceConstructor = Constructor;
      this.promise = new Constructor($$$internal$$noop, label);
      this._abortOnReject = abortOnReject;

      if (this._validateInput(input)) {
        this._input     = input;
        this.length     = input.length;
        this._remaining = input.length;

        this._init();

        if (this.length === 0) {
          $$$internal$$fulfill(this.promise, this._result);
        } else {
          this.length = this.length || 0;
          this._enumerate();
          if (this._remaining === 0) {
            $$$internal$$fulfill(this.promise, this._result);
          }
        }
      } else {
        $$$internal$$reject(this.promise, this._validationError());
      }
    }

    $$$enumerator$$Enumerator.prototype._validateInput = function(input) {
      return $$utils1$$isArray(input);
    };

    $$$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    $$$enumerator$$Enumerator.prototype._init = function() {
      this._result = new Array(this.length);
    };

    var $$$enumerator$$default = $$$enumerator$$Enumerator;

    $$$enumerator$$Enumerator.prototype._enumerate = function() {
      var length  = this.length;
      var promise = this.promise;
      var input   = this._input;

      for (var i = 0; promise._state === $$$internal$$PENDING && i < length; i++) {
        this._eachEntry(input[i], i);
      }
    };

    $$$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var c = this._instanceConstructor;
      if ($$utils1$$isMaybeThenable(entry)) {
        if (entry.constructor === c && entry._state !== $$$internal$$PENDING) {
          entry._onerror = null;
          this._settledAt(entry._state, i, entry._result);
        } else {
          this._willSettleAt(c.resolve(entry), i);
        }
      } else {
        this._remaining--;
        this._result[i] = this._makeResult($$$internal$$FULFILLED, i, entry);
      }
    };

    $$$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var promise = this.promise;

      if (promise._state === $$$internal$$PENDING) {
        this._remaining--;

        if (this._abortOnReject && state === $$$internal$$REJECTED) {
          $$$internal$$reject(promise, value);
        } else {
          this._result[i] = this._makeResult(state, i, value);
        }
      }

      if (this._remaining === 0) {
        $$$internal$$fulfill(promise, this._result);
      }
    };

    $$$enumerator$$Enumerator.prototype._makeResult = function(state, i, value) {
      return value;
    };

    $$$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      $$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt($$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt($$$internal$$REJECTED, i, reason);
      });
    };
    function $$promise$all$$all(entries, label) {
      return new $$$enumerator$$default(this, entries, true /* abort on reject */, label).promise;
    }
    var $$promise$all$$default = $$promise$all$$all;
    function $$promise$race$$race(entries, label) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor($$$internal$$noop, label);

      if (!$$utils1$$isArray(entries)) {
        $$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        $$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        $$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === $$$internal$$PENDING && i < length; i++) {
        $$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    }
    var $$promise$race$$default = $$promise$race$$race;
    function $$promise$resolve$$resolve(object, label) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor($$$internal$$noop, label);
      $$$internal$$resolve(promise, object);
      return promise;
    }
    var $$promise$resolve$$default = $$promise$resolve$$resolve;
    function $$promise$reject$$reject(reason, label) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor($$$internal$$noop, label);
      $$$internal$$reject(promise, reason);
      return promise;
    }
    var $$promise$reject$$default = $$promise$reject$$reject;

    var $$promise$$guidKey = 'rsvp_' + $$utils1$$now() + '-';
    var $$promise$$counter = 0;

    function $$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function $$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }
    var $$promise$$default = $$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise’s eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class RSVP.Promise
      @param {function} resolver
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @constructor
    */
    function $$promise$$Promise(resolver, label) {
      this._id = $$promise$$counter++;
      this._label = label;
      this._state = undefined;
      this._result = undefined;
      this._subscribers = [];

      if ($$config$$config.instrument) {
        $$instrument$$default('created', this);
      }

      if ($$$internal$$noop !== resolver) {
        if (!$$utils1$$isFunction(resolver)) {
          $$promise$$needsResolver();
        }

        if (!(this instanceof $$promise$$Promise)) {
          $$promise$$needsNew();
        }

        $$$internal$$initializePromise(this, resolver);
      }
    }

    // deprecated
    $$promise$$Promise.cast = $$promise$resolve$$default;
    $$promise$$Promise.all = $$promise$all$$default;
    $$promise$$Promise.race = $$promise$race$$default;
    $$promise$$Promise.resolve = $$promise$resolve$$default;
    $$promise$$Promise.reject = $$promise$reject$$default;

    $$promise$$Promise.prototype = {
      constructor: $$promise$$Promise,

      _guidKey: $$promise$$guidKey,

      _onerror: function (reason) {
        $$config$$config.trigger('error', reason);
      },

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise}
    */
      then: function(onFulfillment, onRejection, label) {
        var parent = this;
        var state = parent._state;

        if (state === $$$internal$$FULFILLED && !onFulfillment || state === $$$internal$$REJECTED && !onRejection) {
          if ($$config$$config.instrument) {
            $$instrument$$default('chained', this, this);
          }
          return this;
        }

        parent._onerror = null;

        var child = new this.constructor($$$internal$$noop, label);
        var result = parent._result;

        if ($$config$$config.instrument) {
          $$instrument$$default('chained', parent, child);
        }

        if (state) {
          var callback = arguments[state - 1];
          $$config$$config.async(function(){
            $$$internal$$invokeCallback(state, child, callback, result);
          });
        } else {
          $$$internal$$subscribe(parent, child, onFulfillment, onRejection);
        }

        return child;
      },

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection, label) {
        return this.then(null, onRejection, label);
      },

    /**
      `finally` will be invoked regardless of the promise's fate just as native
      try/catch/finally behaves

      Synchronous example:

      ```js
      findAuthor() {
        if (Math.random() > 0.5) {
          throw new Error();
        }
        return new Author();
      }

      try {
        return findAuthor(); // succeed or fail
      } catch(error) {
        return findOtherAuther();
      } finally {
        // always runs
        // doesn't affect the return value
      }
      ```

      Asynchronous example:

      ```js
      findAuthor().catch(function(reason){
        return findOtherAuther();
      }).finally(function(){
        // author was either found, or not
      });
      ```

      @method finally
      @param {Function} callback
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise}
    */
      'finally': function(callback, label) {
        var constructor = this.constructor;

        return this.then(function(value) {
          return constructor.resolve(callback()).then(function(){
            return value;
          });
        }, function(reason) {
          return constructor.resolve(callback()).then(function(){
            throw reason;
          });
        }, label);
      }
    };
    function rsvp$defer$$defer(label) {
      var deferred = { };

      deferred.promise = new $$promise$$default(function(resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
      }, label);

      return deferred;
    }
    var rsvp$defer$$default = rsvp$defer$$defer;

    $$lgtm$$configure('defer', rsvp$defer$$default);

    var lgtm$standalone$umd$$LGTM = {
      configure: $$lgtm$$configure,
      validator: $$lgtm$$validator,
      helpers: $$lgtm$$helpers,
      ObjectValidator: $$lgtm$object_validator$$default
    };

    if (typeof module !== 'undefined' && module.exports) {
      module.exports = lgtm$standalone$umd$$LGTM;
    } else if (typeof define !== 'undefined' && define.amd) {
      define(function() { return lgtm$standalone$umd$$LGTM; });
    } else if (typeof window !== 'undefined') {
      window.LGTM = lgtm$standalone$umd$$LGTM;
    } else if (this) {
      this.LGTM = lgtm$standalone$umd$$LGTM;
    }
}).call(this);

//# sourceMappingURL=lgtm-standalone.js.map