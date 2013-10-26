import config from './config';

/**
 * Iteration
 */

/**
 * Iterates over the given object's entries using the given iterator.
 *
 * @param {(Object|Array.<*>)} iterable
 * @param {function(Object, (String|Number))} iterator
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

/**
 * Returns all the keys this object has not on its prototype.
 *
 * @param {Object} object
 * @return {Array.<String>}
 */
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

export forEach;
export keys;


/**
 * Property access
 */

/**
 * Gets the given property from the given object. If the object has a method
 * named "get" then it will be used to retrieve the value, otherwise direct
 * property access will be used. If object is null or undefined then undefined
 * will be returned.
 *
 * @param {Object} object
 * @param {String} property
 * @return {Object}
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

/**
 * Get a list of property values from the given object with the given names.
 *
 * @param {Object} object
 * @param {Array.<String>} properties
 * @return {Array.<*>}
 */
function getProperties(object, properties) {
  return properties.map(function(prop) {
    return get(object, prop);
  });
}

export get;
export getProperties;


/**
 * Array manipulation
 */

/**
 * Determines whether the given array contains the given object.
 *
 * @param {Array.<*>} array
 * @param {*} object
 * @return {Boolean}
 */
function contains(array, object) {
  return array.indexOf(object) > -1;
}

/**
 * Returns an array with duplicate values in the given array removed. Only the
 * first instance of any value will be kept.
 *
 * @param {Array.<*>} array
 * @return {Array.<*>}
 */
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

export contains;
export uniq;


/**
 * Promises
 */

/**
 * Generates a promise resolving to the given object or, if the object is
 * itself a promise, resolving to the final value of that promise.
 *
 * @param {Object} promiseOrValue
 * @return {Object}
 */
function resolve(promiseOrValue) {
  var deferred = config.defer();
  deferred.resolve(promiseOrValue);
  return deferred.promise;
}

/**
 * Generates a promise that resolves to an array of values. Any non-promises
 * among the given array will be used as-is, and any promises among the given
 * array will be replaced by their final resolved value.
 *
 * @param {[*]} promisesOrValues
 * @return {Object}
 */
function all(promisesOrValues) {
  if (promisesOrValues.length === 0) {
    return resolve([]);
  }

  var results = [];
  var remaining = promisesOrValues.length;
  var deferred = config.defer();

  function resolver(index) {
    return function(value) {
      results[index] = value;
      if (--remaining === 0) {
        deferred.resolve(results);
      }
    };
  }

  for (var i = 0; i < promisesOrValues.length; i++) {
    var promiseOrValue = promisesOrValues[i];
    resolve(promiseOrValue).then(resolver(i), deferred.reject);
  }

  return deferred.promise;
}

export resolve;
export all;
