"use strict";

Object.seal(Object.defineProperties(exports, {
  configure: {
    get: function() {
      return $$lgtm$$.configure;
    },

    enumerable: true
  },

  validator: {
    get: function() {
      return $$lgtm$$.validator;
    },

    enumerable: true
  },

  helpers: {
    get: function() {
      return $$lgtm$$.helpers;
    },

    enumerable: true
  },

  ObjectValidator: {
    get: function() {
      return $$lgtm$$.ObjectValidator;
    },

    enumerable: true
  }
}));

var $$lgtm$$ = require("./lgtm"), rsvp$$ = require("rsvp");

$$lgtm$$.configure('defer', rsvp$$.defer);

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

//# sourceMappingURL=lgtm-standalone.umd.js.map