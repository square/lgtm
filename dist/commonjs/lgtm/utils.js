/* jshint esnext:true, undef:true, unused:true */

"use strict";
var lgtm$config$$ = require("./config");

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
  var deferred = lgtm$config$$.default.defer();
  deferred.resolve(thenable);
  return deferred.promise;
}

function all(thenables) {
  if (thenables.length === 0) {
    return resolve([]);
  }

  var results = [];
  var remaining = thenables.length;
  var deferred = lgtm$config$$.default.defer();

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

exports.forEach = forEach, exports.keys = keys, exports.get = get, exports.getProperties = getProperties, exports.contains = contains, exports.uniq = uniq, exports.resolve = resolve, exports.all = all;

//# sourceMappingURL=utils.js.map