/* jshint esnext:true, undef:true, unused:true */

"use strict";

var config = {};

config.defer = function() {
  throw new Error(
    'No "defer" function provided to LGTM! ' +
    'Please use lgtm-standalone.js or call ' +
    'LGTM.configure("defer", myDeferFunction) ' +
    'e.g. to use with Q, use Q.defer.'
  );
};

exports["default"] = config;

//# sourceMappingURL=config.js.map