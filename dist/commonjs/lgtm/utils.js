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
