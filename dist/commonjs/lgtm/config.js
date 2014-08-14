"use strict";

Object.seal(Object.defineProperties(exports, {
  default: {
    get: function() {
      return src$lgtm$config$$default;
    },

    enumerable: true
  }
}));

var config = {};

config.defer = function() {
  throw new Error(
    'No "defer" function provided to LGTM! ' +
    'Please use lgtm-standalone.js or call ' +
    'LGTM.configure("defer", myDeferFunction) ' +
    'e.g. to use with Q, use Q.defer.'
  );
};

var src$lgtm$config$$default = config;

//# sourceMappingURL=config.js.map