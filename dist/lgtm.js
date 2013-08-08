(function(e){if("function"==typeof bootstrap)bootstrap("lgtm",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeLGTM=e}else"undefined"!=typeof window?window.LGTM=e():global.LGTM=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
"use strict";
var ObjectValidator, ValidatorBuilder, core, register, unregister, validations, validator, __reexport1__,
  __slice = [].slice;

ValidatorBuilder = require("./lgtm/validator_builder");

ObjectValidator = require("./lgtm/object_validator");

core = require("./lgtm/validations/core");

__reexport1__ = require("rsvp");

core.register();

validator = function() {
  return new ValidatorBuilder();
};

register = function() {
  var args;
  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  return ValidatorBuilder.registerHelper.apply(ValidatorBuilder, args);
};

unregister = function() {
  var args;
  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  return ValidatorBuilder.unregisterHelper.apply(ValidatorBuilder, args);
};

validations = {
  core: core,
  register: register,
  unregister: unregister
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
},{"./rsvp/all":9,"./rsvp/config":12,"./rsvp/defer":10,"./rsvp/events":6,"./rsvp/hash":11,"./rsvp/node":8,"./rsvp/promise":7,"./rsvp/reject":14,"./rsvp/resolve":13}],4:[function(require,module,exports){
"use strict";
var ValidatorBuilder, email, maxLength, minLength, register, required;

ValidatorBuilder = require("../validator_builder");

required = function(value) {
  if (typeof value === 'string') {
    value = value.trim();
  }
  return value !== '' && value !== null && value !== (void 0);
};

email = function(value) {
  var regexp;
  if (typeof value === 'string') {
    value = value.trim();
  }
  regexp = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regexp.test(value);
};

minLength = function(minLength) {
  if (minLength == null) {
    throw new Error('must specify a min length');
  }
  return function(value) {
    if (value != null) {
      return value.length >= minLength;
    } else {
      return false;
    }
  };
};

maxLength = function(maxLength) {
  if (maxLength == null) {
    throw new Error('must specify a max length');
  }
  return function(value) {
    if (value != null) {
      return value.length <= maxLength;
    } else {
      return false;
    }
  };
};

register = function() {
  ValidatorBuilder.registerHelper('required', required);
  ValidatorBuilder.registerHelper('email', email);
  ValidatorBuilder.registerHelper('minLength', minLength);
  return ValidatorBuilder.registerHelper('maxLength', maxLength);
};

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
var get, getProperties, uniq,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

get = function(object, property) {
  if (object == null) {

  } else if (typeof object.get === 'function') {
    return object.get(property);
  } else {
    return object[property];
  }
};

getProperties = function(object, properties) {
  var prop, _i, _len, _results;
  _results = [];
  for (_i = 0, _len = properties.length; _i < _len; _i++) {
    prop = properties[_i];
    _results.push(get(object, prop));
  }
  return _results;
};

uniq = function(array) {
  var item, result, _i, _len;
  result = [];
  for (_i = 0, _len = array.length; _i < _len; _i++) {
    item = array[_i];
    if (__indexOf.call(result, item) < 0) {
      result.push(item);
    }
  }
  return result;
};

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
},{"./promise":7}],9:[function(require,module,exports){
(function(){"use strict";
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
})()
},{"./promise":7}],11:[function(require,module,exports){
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
},{"./defer":10}],13:[function(require,module,exports){
"use strict";
var Promise = require("./promise").Promise;

function resolve(thenable) {
  return new Promise(function(resolve, reject) {
    resolve(thenable);
  });
}


exports.resolve = resolve;
},{"./promise":7}],12:[function(require,module,exports){
"use strict";
var async = require("./async").async;

var config = {};
config.async = async;


exports.config = config;
},{"./async":16}],14:[function(require,module,exports){
"use strict";
var Promise = require("./promise").Promise;

function reject(reason) {
  return new Promise(function (resolve, reject) {
    reject(reason);
  });
}


exports.reject = reject;
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
    setTimeout(function() {
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
})(require("__browserify_process"))
},{"__browserify_process":17}],2:[function(require,module,exports){
"use strict";
var ObjectValidator, ValidatorBuilder, getProperties, resolve,
  __slice = [].slice;

ObjectValidator = require("./object_validator");

resolve = require("rsvp").resolve;

getProperties = require("./utils").getProperties;

ValidatorBuilder = (function() {
  ValidatorBuilder.prototype._attr = null;

  ValidatorBuilder.prototype._condition = null;

  ValidatorBuilder.prototype._validator = null;

  function ValidatorBuilder() {
    this._validator = new ObjectValidator();
  }

  ValidatorBuilder.prototype.validates = function(attr) {
    this._attr = attr;
    this._condition = null;
    return this;
  };

  ValidatorBuilder.prototype.when = function() {
    var condition, dependencies, dependency, _i, _j, _len;
    dependencies = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), condition = arguments[_i++];
    if (dependencies.length === 0) {
      dependencies = [this._attr];
    }
    for (_j = 0, _len = dependencies.length; _j < _len; _j++) {
      dependency = dependencies[_j];
      if (dependency !== this._attr) {
        this._validator.addDependentsFor(dependency, this._attr);
      }
    }
    this._condition = condition;
    this._conditionDependencies = dependencies;
    return this;
  };

  ValidatorBuilder.prototype.using = function() {
    var condition, conditionDependencies, dependencies, dependency, message, predicate, validation, validationWithCondition, _i, _j, _len;
    dependencies = 3 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 2) : (_i = 0, []), predicate = arguments[_i++], message = arguments[_i++];
    if (dependencies.length === 0) {
      dependencies = [this._attr];
    }
    for (_j = 0, _len = dependencies.length; _j < _len; _j++) {
      dependency = dependencies[_j];
      if (dependency !== this._attr) {
        this._validator.addDependentsFor(dependency, this._attr);
      }
    }
    validation = function(value, attr, object) {
      return predicate.apply(null, __slice.call(getProperties(object, dependencies)).concat([attr], [object]));
    };
    condition = this._condition;
    conditionDependencies = this._conditionDependencies;
    validationWithCondition = function(value, attr, object) {
      var args;
      args = getProperties(object, conditionDependencies);
      args.push(attr, object);
      return resolve(condition.apply(null, args)).then(function(result) {
        if (result) {
          return validation(value, attr, object);
        } else {
          return true;
        }
      });
    };
    this._validator.addValidation(this._attr, (condition != null ? validationWithCondition : validation), message);
    return this;
  };

  ValidatorBuilder.prototype.build = function() {
    return this._validator;
  };

  ValidatorBuilder.registerHelper = function(name, fn) {
    this.prototype[name] = function() {
      var message, options, _i;
      options = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), message = arguments[_i++];
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

  return ValidatorBuilder;

})();

module.exports = ValidatorBuilder;

},{"./object_validator":3,"./utils":15,"rsvp":5}],3:[function(require,module,exports){
"use strict";
var ObjectValidator, all, get, resolve, uniq, __dependency1__, __dependency2__,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty;

__dependency1__ = require("rsvp");

all = __dependency1__.all;

resolve = __dependency1__.resolve;

__dependency2__ = require("./utils");

get = __dependency2__.get;

uniq = __dependency2__.uniq;

ObjectValidator = (function() {
  ObjectValidator.prototype._validations = null;

  ObjectValidator.prototype._dependencies = null;

  function ObjectValidator() {
    this._validations = {};
    this._dependencies = {};
  }

  ObjectValidator.prototype.addValidation = function(attr, fn, message) {
    var list, _base;
    list = (_base = this._validations)[attr] || (_base[attr] = []);
    list.push([fn, message]);
    return null;
  };

  ObjectValidator.prototype.addDependentsFor = function() {
    var attr, dependentAttributes, dependentsForParent, parentAttribute, _base, _i, _len;
    parentAttribute = arguments[0], dependentAttributes = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    dependentsForParent = (_base = this._dependencies)[parentAttribute] || (_base[parentAttribute] = []);
    for (_i = 0, _len = dependentAttributes.length; _i < _len; _i++) {
      attr = dependentAttributes[_i];
      if (__indexOf.call(dependentsForParent, attr) < 0) {
        dependentsForParent.push(attr);
      }
    }
    return null;
  };

  ObjectValidator.prototype.attributes = function() {
    var attribute, attributes, parentAttribute, _ref, _ref1;
    attributes = [];
    _ref = this._validations;
    for (attribute in _ref) {
      if (!__hasProp.call(_ref, attribute)) continue;
      attributes.push(attribute);
    }
    _ref1 = this._dependencies;
    for (parentAttribute in _ref1) {
      if (!__hasProp.call(_ref1, parentAttribute)) continue;
      attributes.push(parentAttribute);
    }
    return uniq(attributes);
  };

  ObjectValidator.prototype.validate = function() {
    var attr, attributes, callback, object, promise, validationPromises, _i, _j, _len,
      _this = this;
    object = arguments[0], attributes = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
    if (typeof callback === 'string') {
      attributes.push(callback);
      callback = null;
    }
    if (attributes.length === 0) {
      attributes = (function() {
        var _ref, _results;
        _ref = this._validations;
        _results = [];
        for (attr in _ref) {
          if (!__hasProp.call(_ref, attr)) continue;
          _results.push(attr);
        }
        return _results;
      }).call(this);
    }
    validationPromises = [];
    for (_j = 0, _len = attributes.length; _j < _len; _j++) {
      attr = attributes[_j];
      validationPromises.push.apply(validationPromises, this._validateAttribute(object, attr));
    }
    promise = all(validationPromises).then(function(results) {
      results = _this._collectResults(results);
      if (typeof callback === "function") {
        callback(results);
      }
      return results;
    });
    if (callback == null) {
      return promise;
    }
  };

  ObjectValidator.prototype._validateAttribute = function(object, attr) {
    var dependent, results, validations, value, _i, _len, _ref;
    value = get(object, attr);
    validations = this._validations[attr];
    results = [];
    if (validations != null) {
      validations.forEach(function(_arg) {
        var fn, message;
        fn = _arg[0], message = _arg[1];
        return results.push(resolve(fn(value, attr, object)).then(function(isValid) {
          return [attr, isValid ? null : message];
        }));
      });
    } else {
      if (__indexOf.call(this.attributes(), attr) >= 0) {
        results.push([attr, null]);
      }
    }
    _ref = this._getDependentsFor(attr);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      dependent = _ref[_i];
      results.push.apply(results, this._validateAttribute(object, dependent));
    }
    return results;
  };

  ObjectValidator.prototype._collectResults = function(results) {
    var attr, attrMessage, message, messages, result, _base, _i, _len;
    result = {
      valid: true,
      errors: {}
    };
    for (_i = 0, _len = results.length; _i < _len; _i++) {
      attrMessage = results[_i];
      if (!(attrMessage != null)) {
        continue;
      }
      attr = attrMessage[0], message = attrMessage[1];
      messages = (_base = result.errors)[attr] || (_base[attr] = []);
      if (message != null) {
        messages.push(message);
        result.valid = false;
      }
    }
    return result;
  };

  ObjectValidator.prototype._getDependentsFor = function(parentAttribute) {
    return (this._dependencies[parentAttribute] || []).slice();
  };

  return ObjectValidator;

})();

module.exports = ObjectValidator;

},{"./utils":15,"rsvp":5}]},{},[1])(1)
});
;