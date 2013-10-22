(function(e){if("function"==typeof bootstrap)bootstrap("lgtm",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeLGTM=e}else"undefined"!=typeof window?window.LGTM=e():global.LGTM=e()})(function(){var define,ses,bootstrap,module,exports;
return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var ValidatorBuilder = require("./lgtm/validator_builder");
var ObjectValidator = require("./lgtm/object_validator");
var core = require("./lgtm/helpers/core");
var config = require("./lgtm/config");

core.register();

function validator() {
  return new ValidatorBuilder();
}

function register() {
  ValidatorBuilder.registerHelper.apply(ValidatorBuilder, arguments);
}

function unregister() {
  ValidatorBuilder.unregisterHelper.apply(ValidatorBuilder, arguments);
}

var helpers = {
  core       : core,
  register   : register,
  unregister : unregister
};

function configure(key, value) {
  config[key] = value;
}

// This kinda sucks, but I don't think ES6 has the ability to require modules
// that may not exist. And we may be in node or in the browser.
if (typeof RSVP !== 'undefined') {
  configure('defer', RSVP.defer);
} else if (typeof require === 'function') {
  try {
    configure('defer', require('rsvp').defer);
  } catch (e) {}
}


exports.configure = configure;
exports.validator = validator;
exports.helpers = helpers;
exports.ObjectValidator = ObjectValidator;
},{"./lgtm/config":2,"./lgtm/helpers/core":3,"./lgtm/object_validator":4,"./lgtm/validator_builder":6,"rsvp":8}],2:[function(require,module,exports){
"use strict";
var config = {};

module.exports = config;
},{}],3:[function(require,module,exports){
"use strict";
var ValidatorBuilder = require("../validator_builder");

function present(value) {
  if (typeof value === 'string') {
    value = value.trim();
  }

  return value !== '' && value !== null && value !== undefined;
}

function checkEmail(value) {
  if (typeof value === 'string') {
    value = value.trim();
  }

  // http://stackoverflow.com/a/46181/11236
  var regexp = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return regexp.test(value);
}

function checkMinLength(minLength) {
  if (minLength === null || minLength === undefined) {
    throw new Error('must specify a min length')
  }

  return function(value) {
    if (value !== null && value !== undefined) {
      return value.length >= minLength;
    } else {
      return false;
    }
  };
}

function checkMaxLength(maxLength) {
  if (maxLength === null || maxLength === undefined) {
    throw new Error('must specify a max length')
  }

  return function(value) {
    if (value !== null && value !== undefined) {
      return value.length <= maxLength;
    } else {
      return false;
    }
  };
}

function register() {
  ValidatorBuilder.registerHelper('required', function(message) {
    this.using(present, message);
  });

  ValidatorBuilder.registerHelper('optional', function() {
    this.when(present);
  });

  ValidatorBuilder.registerHelper('email', function(message) {
    this.using(checkEmail, message);
  });

  ValidatorBuilder.registerHelper('minLength', function(minLength, message) {
    this.using(checkMinLength(minLength), message);
  });

  ValidatorBuilder.registerHelper('maxLength', function(maxLength, message) {
    this.using(checkMaxLength(maxLength), message);
  });
}


exports.present = present;
exports.checkEmail = checkEmail;
exports.checkMinLength = checkMinLength;
exports.checkMaxLength = checkMaxLength;
exports.register = register;
},{"../validator_builder":6}],4:[function(require,module,exports){
"use strict";
var config = require("./config");
var __dependency1__ = require("./utils");
var all = __dependency1__.all;
var resolve = __dependency1__.resolve;
var contains = __dependency1__.contains;
var keys = __dependency1__.keys;
var forEach = __dependency1__.forEach;
var get = __dependency1__.get;
var uniq = __dependency1__.uniq;

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
      if (!contains(dependentsForParent, attr)) {
        dependentsForParent.push(attr)
      }
    }
  },

  attributes: function() {
    return uniq(
      keys(this._validations).concat(
        keys(this._dependencies)
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
  },

  _validateAttribute: function(object, attr) {
    var value       = get(object, attr);
    var validations = this._validations[attr];
    var results     = [];

    if (validations) {
      validations.forEach(function(pair) {
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


module.exports = ObjectValidator;
},{"./config":2,"./utils":5}],5:[function(require,module,exports){
"use strict";
var config = require("./config");

/**
 * Iteration
 */

function forEach(iterable, iterator) {
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

function keys(object) {
  if (Object.getOwnPropertyNames) {
    return Object.getOwnPropertyNames(object);
  } else {
    var result = [];
    forEach(object, function(key) {
      result.push(key);
    });
    return result;
  }
}



/**
 * Property access
 */

function get(object, property) {
  if (object === null || object === undefined) {
    return;
  } else if (typeof object.get === 'function') {
    return object.get(property);
  } else {
    return object[property];
  }
}

function getProperties(object, properties) {
  return properties.map(function(prop) {
    return get(object, prop);
  });
}



/**
 * Array manipulation
 */

function contains(array, object) {
  return array.indexOf(object) > -1;
}

function uniq(array) {
  var result = [];

  for (var i = 0; i < array.length; i++) {
    var item = array[i];
    if (!contains(result, item)) {
      result.push(item);
    }
  }

  return result;
}



/**
 * Promises
 */

function resolve(thenable) {
  var deferred = config.defer();
  deferred.resolve(thenable);
  return deferred.promise;
}

function all(thenables) {
  if (thenables.length === 0) {
    return resolve([]);
  }

  var results = [];
  var remaining = thenables.length;
  var deferred = config.defer();

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
    resolve(thenable).then(resolver(i), deferred.reject);
  }

  return deferred.promise;
}


exports.forEach = forEach;
exports.keys = keys;
exports.get = get;
exports.getProperties = getProperties;
exports.contains = contains;
exports.uniq = uniq;
exports.resolve = resolve;
exports.all = all;
},{"./config":2}],6:[function(require,module,exports){
"use strict";
var ObjectValidator = require("./object_validator");
var __dependency1__ = require("./utils");
var getProperties = __dependency1__.getProperties;
var resolve = __dependency1__.resolve;

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


module.exports = ValidatorBuilder;
},{"./object_validator":4,"./utils":5}],7:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],8:[function(require,module,exports){
"use strict";
var EventTarget = require("./rsvp/events").EventTarget;
var Promise = require("./rsvp/promise").Promise;
var denodeify = require("./rsvp/node").denodeify;
var all = require("./rsvp/all").all;
var hash = require("./rsvp/hash").hash;
var rethrow = require("./rsvp/rethrow").rethrow;
var defer = require("./rsvp/defer").defer;
var config = require("./rsvp/config").config;
var resolve = require("./rsvp/resolve").resolve;
var reject = require("./rsvp/reject").reject;

function configure(name, value) {
  config[name] = value;
}


exports.Promise = Promise;
exports.EventTarget = EventTarget;
exports.all = all;
exports.hash = hash;
exports.rethrow = rethrow;
exports.defer = defer;
exports.denodeify = denodeify;
exports.configure = configure;
exports.resolve = resolve;
exports.reject = reject;
},{"./rsvp/all":9,"./rsvp/config":11,"./rsvp/defer":12,"./rsvp/events":13,"./rsvp/hash":14,"./rsvp/node":15,"./rsvp/promise":16,"./rsvp/reject":17,"./rsvp/resolve":18,"./rsvp/rethrow":19}],9:[function(require,module,exports){
"use strict";
var Promise = require("./promise").Promise;
/* global toString */


function all(promises) {
  if (Object.prototype.toString.call(promises) !== "[object Array]") {
    throw new TypeError('You must pass an array to all.');
  }

  return new Promise(function(resolve, reject) {
    var results = [], remaining = promises.length,
    promise;

    if (remaining === 0) {
      resolve([]);
    }

    function resolver(index) {
      return function(value) {
        resolveAll(index, value);
      };
    }

    function resolveAll(index, value) {
      results[index] = value;
      if (--remaining === 0) {
        resolve(results);
      }
    }

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && typeof promise.then === 'function') {
        promise.then(resolver(i), reject);
      } else {
        resolveAll(i, promise);
      }
    }
  });
}


exports.all = all;
},{"./promise":16}],10:[function(require,module,exports){
var process=require("__browserify_process"),global=self;"use strict";
var browserGlobal = (typeof window !== 'undefined') ? window : {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var async;
var local = (typeof global !== 'undefined') ? global : this;

// old node
function useNextTick() {
  return function(callback, arg) {
    process.nextTick(function() {
      callback(arg);
    });
  };
}

// node >= 0.10.x
function useSetImmediate() {
  return function(callback, arg) {
    /* global  setImmediate */
    setImmediate(function(){
      callback(arg);
    });
  };
}

function useMutationObserver() {
  var queue = [];

  var observer = new BrowserMutationObserver(function() {
    var toProcess = queue.slice();
    queue = [];

    toProcess.forEach(function(tuple) {
      var callback = tuple[0], arg= tuple[1];
      callback(arg);
    });
  });

  var element = document.createElement('div');
  observer.observe(element, { attributes: true });

  // Chrome Memory Leak: https://bugs.webkit.org/show_bug.cgi?id=93661
  window.addEventListener('unload', function(){
    observer.disconnect();
    observer = null;
  }, false);

  return function(callback, arg) {
    queue.push([callback, arg]);
    element.setAttribute('drainQueue', 'drainQueue');
  };
}

function useSetTimeout() {
  return function(callback, arg) {
    local.setTimeout(function() {
      callback(arg);
    }, 1);
  };
}

if (typeof setImmediate === 'function') {
  async = useSetImmediate();
} else if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
  async = useNextTick();
} else if (BrowserMutationObserver) {
  async = useMutationObserver();
} else {
  async = useSetTimeout();
}


exports.async = async;
},{"__browserify_process":7}],11:[function(require,module,exports){
"use strict";
var async = require("./async").async;

var config = {};
config.async = async;


exports.config = config;
},{"./async":10}],12:[function(require,module,exports){
"use strict";
var Promise = require("./promise").Promise;

function defer() {
  var deferred = {
    // pre-allocate shape
    resolve: undefined,
    reject:  undefined,
    promise: undefined
  };

  deferred.promise = new Promise(function(resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
}


exports.defer = defer;
},{"./promise":16}],13:[function(require,module,exports){
"use strict";
var Event = function(type, options) {
  this.type = type;

  for (var option in options) {
    if (!options.hasOwnProperty(option)) { continue; }

    this[option] = options[option];
  }
};

var indexOf = function(callbacks, callback) {
  for (var i=0, l=callbacks.length; i<l; i++) {
    if (callbacks[i][0] === callback) { return i; }
  }

  return -1;
};

var callbacksFor = function(object) {
  var callbacks = object._promiseCallbacks;

  if (!callbacks) {
    callbacks = object._promiseCallbacks = {};
  }

  return callbacks;
};

var EventTarget = {
  mixin: function(object) {
    object.on = this.on;
    object.off = this.off;
    object.trigger = this.trigger;
    return object;
  },

  on: function(eventNames, callback, binding) {
    var allCallbacks = callbacksFor(this), callbacks, eventName;
    eventNames = eventNames.split(/\s+/);
    binding = binding || this;

    while (eventName = eventNames.shift()) {
      callbacks = allCallbacks[eventName];

      if (!callbacks) {
        callbacks = allCallbacks[eventName] = [];
      }

      if (indexOf(callbacks, callback) === -1) {
        callbacks.push([callback, binding]);
      }
    }
  },

  off: function(eventNames, callback) {
    var allCallbacks = callbacksFor(this), callbacks, eventName, index;
    eventNames = eventNames.split(/\s+/);

    while (eventName = eventNames.shift()) {
      if (!callback) {
        allCallbacks[eventName] = [];
        continue;
      }

      callbacks = allCallbacks[eventName];

      index = indexOf(callbacks, callback);

      if (index !== -1) { callbacks.splice(index, 1); }
    }
  },

  trigger: function(eventName, options) {
    var allCallbacks = callbacksFor(this),
        callbacks, callbackTuple, callback, binding, event;

    if (callbacks = allCallbacks[eventName]) {
      // Don't cache the callbacks.length since it may grow
      for (var i=0; i<callbacks.length; i++) {
        callbackTuple = callbacks[i];
        callback = callbackTuple[0];
        binding = callbackTuple[1];

        if (typeof options !== 'object') {
          options = { detail: options };
        }

        event = new Event(eventName, options);
        callback.call(binding, event);
      }
    }
  }
};


exports.EventTarget = EventTarget;
},{}],14:[function(require,module,exports){
"use strict";
var defer = require("./defer").defer;

function size(object) {
  var s = 0;

  for (var prop in object) {
    s++;
  }

  return s;
}

function hash(promises) {
  var results = {}, deferred = defer(), remaining = size(promises);

  if (remaining === 0) {
    deferred.resolve({});
  }

  var resolver = function(prop) {
    return function(value) {
      resolveAll(prop, value);
    };
  };

  var resolveAll = function(prop, value) {
    results[prop] = value;
    if (--remaining === 0) {
      deferred.resolve(results);
    }
  };

  var rejectAll = function(error) {
    deferred.reject(error);
  };

  for (var prop in promises) {
    if (promises[prop] && typeof promises[prop].then === 'function') {
      promises[prop].then(resolver(prop), rejectAll);
    } else {
      resolveAll(prop, promises[prop]);
    }
  }

  return deferred.promise;
}


exports.hash = hash;
},{"./defer":12}],15:[function(require,module,exports){
"use strict";
var Promise = require("./promise").Promise;
var all = require("./all").all;

function makeNodeCallbackFor(resolve, reject) {
  return function (error, value) {
    if (error) {
      reject(error);
    } else if (arguments.length > 2) {
      resolve(Array.prototype.slice.call(arguments, 1));
    } else {
      resolve(value);
    }
  };
}

function denodeify(nodeFunc) {
  return function()  {
    var nodeArgs = Array.prototype.slice.call(arguments), resolve, reject;
    var thisArg = this;

    var promise = new Promise(function(nodeResolve, nodeReject) {
      resolve = nodeResolve;
      reject = nodeReject;
    });

    all(nodeArgs).then(function(nodeArgs) {
      nodeArgs.push(makeNodeCallbackFor(resolve, reject));

      try {
        nodeFunc.apply(thisArg, nodeArgs);
      } catch(e) {
        reject(e);
      }
    });

    return promise;
  };
}


exports.denodeify = denodeify;
},{"./all":9,"./promise":16}],16:[function(require,module,exports){
"use strict";
var config = require("./config").config;
var EventTarget = require("./events").EventTarget;

function objectOrFunction(x) {
  return isFunction(x) || (typeof x === "object" && x !== null);
}

function isFunction(x){
  return typeof x === "function";
}

var Promise = function(resolver) {
  var promise = this,
  resolved = false;

  if (typeof resolver !== 'function') {
    throw new TypeError('You must pass a resolver function as the sole argument to the promise constructor');
  }

  if (!(promise instanceof Promise)) {
    return new Promise(resolver);
  }

  var resolvePromise = function(value) {
    if (resolved) { return; }
    resolved = true;
    resolve(promise, value);
  };

  var rejectPromise = function(value) {
    if (resolved) { return; }
    resolved = true;
    reject(promise, value);
  };

  this.on('promise:failed', function(event) {
    this.trigger('error', { detail: event.detail });
  }, this);

  this.on('error', onerror);

  try {
    resolver(resolvePromise, rejectPromise);
  } catch(e) {
    rejectPromise(e);
  }
};

function onerror(event) {
  if (config.onerror) {
    config.onerror(event.detail);
  }
}

var invokeCallback = function(type, promise, callback, event) {
  var hasCallback = isFunction(callback),
      value, error, succeeded, failed;

  if (hasCallback) {
    try {
      value = callback(event.detail);
      succeeded = true;
    } catch(e) {
      failed = true;
      error = e;
    }
  } else {
    value = event.detail;
    succeeded = true;
  }

  if (handleThenable(promise, value)) {
    return;
  } else if (hasCallback && succeeded) {
    resolve(promise, value);
  } else if (failed) {
    reject(promise, error);
  } else if (type === 'resolve') {
    resolve(promise, value);
  } else if (type === 'reject') {
    reject(promise, value);
  }
};

Promise.prototype = {
  constructor: Promise,

  isRejected: undefined,
  isFulfilled: undefined,
  rejectedReason: undefined,
  fulfillmentValue: undefined,

  then: function(done, fail) {
    this.off('error', onerror);

    var thenPromise = new this.constructor(function() {});

    if (this.isFulfilled) {
      config.async(function(promise) {
        invokeCallback('resolve', thenPromise, done, { detail: promise.fulfillmentValue });
      }, this);
    }

    if (this.isRejected) {
      config.async(function(promise) {
        invokeCallback('reject', thenPromise, fail, { detail: promise.rejectedReason });
      }, this);
    }

    this.on('promise:resolved', function(event) {
      invokeCallback('resolve', thenPromise, done, event);
    });

    this.on('promise:failed', function(event) {
      invokeCallback('reject', thenPromise, fail, event);
    });

    return thenPromise;
  },

  fail: function(fail) {
    return this.then(null, fail);
  }
};

EventTarget.mixin(Promise.prototype);

function resolve(promise, value) {
  if (promise === value) {
    fulfill(promise, value);
  } else if (!handleThenable(promise, value)) {
    fulfill(promise, value);
  }
}

function handleThenable(promise, value) {
  var then = null,
  resolved;

  try {
    if (promise === value) {
      throw new TypeError("A promises callback cannot return that same promise.");
    }

    if (objectOrFunction(value)) {
      then = value.then;

      if (isFunction(then)) {
        then.call(value, function(val) {
          if (resolved) { return true; }
          resolved = true;

          if (value !== val) {
            resolve(promise, val);
          } else {
            fulfill(promise, val);
          }
        }, function(val) {
          if (resolved) { return true; }
          resolved = true;

          reject(promise, val);
        });

        return true;
      }
    }
  } catch (error) {
    reject(promise, error);
    return true;
  }

  return false;
}

function fulfill(promise, value) {
  config.async(function() {
    promise.trigger('promise:resolved', { detail: value });
    promise.isFulfilled = true;
    promise.fulfillmentValue = value;
  });
}

function reject(promise, value) {
  config.async(function() {
    promise.trigger('promise:failed', { detail: value });
    promise.isRejected = true;
    promise.rejectedReason = value;
  });
}


exports.Promise = Promise;
},{"./config":11,"./events":13}],17:[function(require,module,exports){
"use strict";
var Promise = require("./promise").Promise;

function reject(reason) {
  return new Promise(function (resolve, reject) {
    reject(reason);
  });
}


exports.reject = reject;
},{"./promise":16}],18:[function(require,module,exports){
"use strict";
var Promise = require("./promise").Promise;

function resolve(thenable) {
  return new Promise(function(resolve, reject) {
    resolve(thenable);
  });
}


exports.resolve = resolve;
},{"./promise":16}],19:[function(require,module,exports){
var global=self;"use strict";
var local = (typeof global === "undefined") ? this : global;

function rethrow(reason) {
  local.setTimeout(function() {
    throw reason;
  });
  throw reason;
}


exports.rethrow = rethrow;
},{}]},{},[1])(1)
});
;