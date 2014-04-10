/* jshint esnext:true */

var config = {};

config.defer = function() {
  throw new Error('No "defer" function provided to LGTM! Please use lgtm-standalone.js or call LGTM.configure("defer", myDeferFunction) e.g. to use with Q, use Q.defer.');
};

export default config;
