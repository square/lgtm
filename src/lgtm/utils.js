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
  return Object.getOwnPropertyNames(object);
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
  let { get } = config;
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
  let { Promise } = config;
  return new Promise(accept => accept(thenable));
}

function all(thenables) {
  let { Promise } = config;
  return Promise.all(thenables);
}

export { resolve, all };
