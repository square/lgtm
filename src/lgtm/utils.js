import config from './config.js';

/**
 * Iteration
 */

function forEach(iterable, iterator) {
  if (typeof iterable.forEach === 'function') {
    iterable.forEach(iterator);
  } else if ({}.toString.call(iterable) === '[object Object]') {
    let hasOwnProp = {}.hasOwnProperty;
    for (let key in iterable) {
      if (hasOwnProp.call(iterable, key)) {
        iterator(iterable[key], key);
      }
    }
  } else {
    for (let i = 0; i < iterable.length; i++) {
      iterator(iterable[i], i);
    }
  }
}

function keys(object) {
  if (Object.getOwnPropertyNames) {
    return Object.getOwnPropertyNames(object);
  } else {
    let result = [];
    forEach(object, function(key) {
      result.push(key);
    });
    return result;
  }
}

export { forEach, keys };


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
  return properties.map(prop => get(object, prop));
}

export { get, getProperties };


/**
 * Array manipulation
 */

function contains(array, object) {
  return array.indexOf(object) > -1;
}

function uniq(array) {
  let result = [];

  for (let i = 0; i < array.length; i++) {
    let item = array[i];
    if (!contains(result, item)) {
      result.push(item);
    }
  }

  return result;
}

export { contains, uniq };


/**
 * Promises
 */

function resolve(thenable) {
  let deferred = config.defer();
  deferred.resolve(thenable);
  return deferred.promise;
}

function all(thenables) {
  if (thenables.length === 0) {
    return resolve([]);
  }

  let results = [];
  let remaining = thenables.length;
  let deferred = config.defer();

  function resolver(index) {
    return function(value) {
      results[index] = value;
      if (--remaining === 0) {
        deferred.resolve(results);
      }
    };
  }

  for (let i = 0; i < thenables.length; i++) {
    let thenable = thenables[i];
    resolve(thenable).then(resolver(i), deferred.reject);
  }

  return deferred.promise;
}

export { resolve, all };
