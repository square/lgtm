"use strict";
Object.seal(exports);
var $$lgtm$$ = require("./lgtm");

var LGTM = {
  configure: $$lgtm$$.configure,
  validator: $$lgtm$$.validator,
  helpers: $$lgtm$$.helpers,
  ObjectValidator: $$lgtm$$.ObjectValidator
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LGTM;
} else if (typeof define !== 'undefined' && define.amd) {
  define(function() { return LGTM; });
} else if (typeof window !== 'undefined') {
  window.LGTM = LGTM;
} else if (this) {
  this.LGTM = LGTM;
}

//# sourceMappingURL=lgtm.umd.js.map