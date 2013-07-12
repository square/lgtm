"use strict";
var get;

get = function(object, property) {
  if (object == null) {

  } else if (typeof object.get === 'function') {
    return object.get(property);
  } else {
    return object[property];
  }
};

exports.get = get;
