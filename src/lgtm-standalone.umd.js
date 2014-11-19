/* jshint esnext:true, undef:true, unused:true */

// TODO: use this instead: export * from './lgtm';
import { configure, validator, helpers, ObjectValidator } from './lgtm';
import defer from 'rsvp/defer';

configure('defer', defer);

export { configure, validator, helpers, ObjectValidator };

var LGTM = {
  configure: configure,
  validator: validator,
  helpers: helpers,
  ObjectValidator: ObjectValidator
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
