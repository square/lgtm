(function(e){if("function"==typeof bootstrap)bootstrap("lgtm",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeLGTM=e}else"undefined"!=typeof window?window.LGTM=e():global.LGTM=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
"use strict";
var ObjectValidator, ValidatorBuilder, core, validatorFor, validators;

ValidatorBuilder = require("./lgtm/validator_builder");

ObjectValidator = require("./lgtm/object_validator");

core = require("./lgtm/validators/core");

core.register();

validatorFor = function(object) {
  return new ValidatorBuilder(object);
};

validators = {
  core: core
};

exports.validatorFor = validatorFor;

exports.validators = validators;

exports.ObjectValidator = ObjectValidator;

},{"./lgtm/object_validator":2,"./lgtm/validator_builder":3,"./lgtm/validators/core":4}],3:[function(require,module,exports){
"use strict";
var ObjectValidator, ValidatorBuilder;

ObjectValidator = require("./object_validator");

ValidatorBuilder = (function() {
  ValidatorBuilder.prototype._attr = null;

  ValidatorBuilder.prototype._validator = null;

  function ValidatorBuilder(object) {
    this._validator = new ObjectValidator(object);
  }

  ValidatorBuilder.prototype.validates = function(attr) {
    this._attr = attr;
    return this;
  };

  ValidatorBuilder.prototype.using = function(fn, message) {
    this._validator.addValidation(this._attr, fn, message);
    return this;
  };

  ValidatorBuilder.prototype.build = function() {
    return this._validator;
  };

  ValidatorBuilder.registerHelper = function(name, fn) {
    this.prototype[name] = function(message) {
      return this.using(fn, message);
    };
    return null;
  };

  return ValidatorBuilder;

})();

module.exports = ValidatorBuilder;

},{"./object_validator":2}],4:[function(require,module,exports){
"use strict";
var ValidatorBuilder, register, required;

ValidatorBuilder = require("../validator_builder");

required = function(value) {
  if (typeof value === 'string') {
    value = value.trim();
  }
  return value !== '' && value !== null && value !== (void 0);
};

register = function() {
  return ValidatorBuilder.registerHelper('required', required);
};

exports.required = required;

exports.register = register;

},{"../validator_builder":3}],2:[function(require,module,exports){
"use strict";
var ObjectValidator, all, get, resolve, __dependency1__,
  __slice = [].slice,
  __hasProp = {}.hasOwnProperty;

__dependency1__ = require("rsvp");

all = __dependency1__.all;

resolve = __dependency1__.resolve;

get = function(object, property) {
  if (object == null) {

  } else if (typeof object.get === 'function') {
    return object.get(property);
  } else {
    return object[property];
  }
};

ObjectValidator = (function() {
  ObjectValidator.prototype.object = null;

  ObjectValidator.prototype._validations = null;

  function ObjectValidator(object) {
    this.object = object;
    this._validations = [];
  }

  ObjectValidator.prototype.addValidation = function(attr, fn, message) {
    var list, _base;
    list = (_base = this._validations)[attr] || (_base[attr] = []);
    list.push([fn, message]);
    return null;
  };

  ObjectValidator.prototype.validate = function() {
    var attr, attributes, callback, promise, validationPromises, _i, _j, _len,
      _this = this;
    attributes = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
    attributes || (attributes = []);
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
      validationPromises.push.apply(validationPromises, this._validateAttribute(attr));
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

  ObjectValidator.prototype._validateAttribute = function(attr) {
    var fn, message, value, _i, _len, _ref, _ref1, _results;
    value = get(this.object, attr);
    _ref = this._validations[attr];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      _ref1 = _ref[_i], fn = _ref1[0], message = _ref1[1];
      _results.push((function(message) {
        return resolve(fn(value)).then(function(isValid) {
          if (isValid !== true) {
            return [attr, message];
          }
        });
      })(message));
    }
    return _results;
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
      messages.push(message);
      result.valid = false;
    }
    return result;
  };

  return ObjectValidator;

})();

module.exports = ObjectValidator;

},{"rsvp":5}],5:[function(require,module,exports){
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
},{"./rsvp/all":8,"./rsvp/config":12,"./rsvp/defer":11,"./rsvp/events":6,"./rsvp/hash":10,"./rsvp/node":9,"./rsvp/promise":7,"./rsvp/reject":14,"./rsvp/resolve":13}],6:[function(require,module,exports){
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
},{"./promise":7}],10:[function(require,module,exports){
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
},{"./defer":11}],9:[function(require,module,exports){
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
},{"./all":8,"./promise":7}],11:[function(require,module,exports){
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
},{"./promise":7}],12:[function(require,module,exports){
"use strict";
var async = require("./async").async;

var config = {};
config.async = async;


exports.config = config;
},{"./async":15}],13:[function(require,module,exports){
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
},{"./promise":7}],14:[function(require,module,exports){
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
},{"./promise":7}],16:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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
},{"__browserify_process":16}]},{},[1])(1)
});
;