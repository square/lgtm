(function(e){if("function"==typeof bootstrap)bootstrap("lgtm",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeLGTM=e}else"undefined"!=typeof window?window.LGTM=e():global.LGTM=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
"use strict";
var ValidatorBuilder = require("./lgtm/validator_builder");
var ObjectValidator = require("./lgtm/object_validator");
var core = require("./lgtm/validations/core");
var __reexport1__ = require("rsvp");

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

var validations = {
  core       : core,
  register   : register,
  unregister : unregister
};


exports.configure = __reexport1__.configure;
exports.validator = validator;
exports.validations = validations;
exports.ObjectValidator = ObjectValidator;
},{"./lgtm/object_validator":3,"./lgtm/validations/core":4,"./lgtm/validator_builder":2,"rsvp":5}],5:[function(require,module,exports){
"use strict";
var EventTarget = require("./rsvp/events").EventTarget;
var Promise = require("./rsvp/promise").Promise;
var denodeify = require("./rsvp/node").denodeify;
var all = require("./rsvp/all").all;
var hash = require("./rsvp/hash").hash;
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
exports.defer = defer;
exports.denodeify = denodeify;
exports.configure = configure;
exports.resolve = resolve;
exports.reject = reject;
},{"./rsvp/all":9,"./rsvp/config":12,"./rsvp/defer":11,"./rsvp/events":6,"./rsvp/hash":10,"./rsvp/node":8,"./rsvp/promise":7,"./rsvp/reject":13,"./rsvp/resolve":14}],4:[function(require,module,exports){
"use strict";
var ValidatorBuilder = require("../validator_builder");

function required(value) {
  if (typeof value === 'string') {
    value = value.trim();
  }

  return value !== '' && value !== null && value !== undefined;
}

function email(value) {
  if (typeof value === 'string') {
    value = value.trim();
  }

  // http://stackoverflow.com/a/46181/11236
  var regexp = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return regexp.test(value);
}

function minLength(minLength) {
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

function maxLength(maxLength) {
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
  ValidatorBuilder.registerHelper('required',  required);
  ValidatorBuilder.registerHelper('email',     email);
  ValidatorBuilder.registerHelper('minLength', minLength);
  ValidatorBuilder.registerHelper('maxLength', maxLength);
}


exports.required = required;
exports.email = email;
exports.minLength = minLength;
exports.maxLength = maxLength;
exports.register = register;
},{"../validator_builder":2}],6:[function(require,module,exports){
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
},{}],15:[function(require,module,exports){
"use strict";
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


exports.contains = contains;
exports.forEach = forEach;
exports.keys = keys;
exports.get = get;
exports.getProperties = getProperties;
exports.uniq = uniq;
},{}],7:[function(require,module,exports){
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

  this.on('promise:resolved', function(event) {
    this.trigger('success', { detail: event.detail });
  }, this);

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

  then: function(done, fail) {
    this.off('error', onerror);

    var thenPromise = new this.constructor(function() {});

    if (this.isFulfilled) {
      config.async(function() {
        invokeCallback('resolve', thenPromise, done, { detail: this.fulfillmentValue });
      }, this);
    }

    if (this.isRejected) {
      config.async(function() {
        invokeCallback('reject', thenPromise, fail, { detail: this.rejectedReason });
      }, this);
    }

    this.on('promise:resolved', function(event) {
      invokeCallback('resolve', thenPromise, done, event);
    });

    this.on('promise:failed', function(event) {
      invokeCallback('reject', thenPromise, fail, event);
    });

    return thenPromise;
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
  var then = null;

  if (objectOrFunction(value)) {
    try {
      then = value.then;
    } catch(e) {
      reject(promise, e);
      return true;
    }

    if (isFunction(then)) {
      try {
        then.call(value, function(val) {
          if (value !== val) {
            resolve(promise, val);
          } else {
            fulfill(promise, val);
          }
        }, function(val) {
          reject(promise, val);
        });
      } catch (e) {
        reject(promise, e);
      }
      return true;
    }
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
},{"./config":12,"./events":6}],8:[function(require,module,exports){
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
},{"./all":9,"./promise":7}],10:[function(require,module,exports){
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
},{"./defer":11}],12:[function(require,module,exports){
"use strict";
var async = require("./async").async;

var config = {};
config.async = async;


exports.config = config;
},{"./async":16}],9:[function(require,module,exports){
(function(){"use strict";
var Promise = require("./promise").Promise;
/* global toString */


function all(promises) {
  if(toString.call(promises) !== "[object Array]") {
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
})()
},{"./promise":7}],11:[function(require,module,exports){
"use strict";
var Promise = require("./promise").Promise;

function defer() {
  var deferred = {};

  var promise = new Promise(function(resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  deferred.promise = promise;
  return deferred;
}


exports.defer = defer;
},{"./promise":7}],13:[function(require,module,exports){
"use strict";
var Promise = require("./promise").Promise;


function objectOrFunction(x) {
  return typeof x === "function" || (typeof x === "object" && x !== null);
}


function reject(reason) {
  return new Promise(function (resolve, reject) {
    reject(reason);
  });
}


exports.reject = reject;
},{"./promise":7}],14:[function(require,module,exports){
"use strict";
var Promise = require("./promise").Promise;

function objectOrFunction(x) {
  return typeof x === "function" || (typeof x === "object" && x !== null);
}

function resolve(thenable) {
  if (thenable instanceof Promise) {
    return thenable;
  }

  var promise = new Promise(function(resolve, reject) {
    var then;

    try {
      if ( objectOrFunction(thenable) ) {
        then = thenable.then;

        if (typeof then === "function") {
          then.call(thenable, resolve, reject);
        } else {
          resolve(thenable);
        }

      } else {
        resolve(thenable);
      }

    } catch(error) {
      reject(error);
    }
  });

  return promise;
}


exports.resolve = resolve;
},{"./promise":7}],17:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
(function(process){"use strict";
var browserGlobal = (typeof window !== 'undefined') ? window : {};

var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var async;

if (typeof process !== 'undefined' &&
  {}.toString.call(process) === '[object process]') {
  async = function(callback, binding) {
    process.nextTick(function() {
      callback.call(binding);
    });
  };
} else if (BrowserMutationObserver) {
  var queue = [];

  var observer = new BrowserMutationObserver(function() {
    var toProcess = queue.slice();
    queue = [];

    toProcess.forEach(function(tuple) {
      var callback = tuple[0], binding = tuple[1];
      callback.call(binding);
    });
  });

  var element = document.createElement('div');
  observer.observe(element, { attributes: true });

  // Chrome Memory Leak: https://bugs.webkit.org/show_bug.cgi?id=93661
  window.addEventListener('unload', function(){
    observer.disconnect();
    observer = null;
  });

  async = function(callback, binding) {
    queue.push([callback, binding]);
    element.setAttribute('drainQueue', 'drainQueue');
  };
} else {
  async = function(callback, binding) {
    setTimeout(function() {
      callback.call(binding);
    }, 1);
  };
}


exports.async = async;
})(require("__browserify_process"))
},{"__browserify_process":17}],2:[function(require,module,exports){
"use strict";
var ObjectValidator = require("./object_validator");
var resolve = require("rsvp").resolve;
var getProperties = require("./utils").getProperties;

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
  this.prototype[name] = function(/* ...options, message */) {
    var options = [].slice.apply(arguments);
    var message = options.pop();

    if (options.length === 0) {
      return this.using(fn, message);
    } else {
      return this.using(fn.apply(null, options), message);
    }
  };
  return null;
};

ValidatorBuilder.unregisterHelper = function(name) {
  delete this.prototype[name];
  return null;
};


module.exports = ValidatorBuilder;
},{"./object_validator":3,"./utils":15,"rsvp":5}],3:[function(require,module,exports){
"use strict";
var __dependency1__ = require("rsvp");
var all = __dependency1__.all;
var resolve = __dependency1__.resolve;
var __dependency2__ = require("./utils");
var contains = __dependency2__.contains;
var keys = __dependency2__.keys;
var forEach = __dependency2__.forEach;
var get = __dependency2__.get;
var uniq = __dependency2__.uniq;

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

    var promise = all(validationPromises).then(function(results) {
      results = this._collectResults(results);
      if (callback) {
        callback(results);
      }
      return results;
    }.bind(this));

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
        results.push(resolve(fn(value, attr, object)).then(
          function(isValid) {
            return [ attr, isValid ? null : message ];
          })
        );
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
},{"./utils":15,"rsvp":5}]},{},[1])(1)
});
;