/* jshint undef:true */
/* global QUnit, describe, it, expect, before, after, fail, throws */
/* global LGTM */

var validator   = LGTM.validator;
var validations = LGTM.helpers;

describe('helpers.(un)register', function() {
  it('can add and remove a helper from the builder', function() {
    var builder = validator();
    expect(builder.isEven).to.be.undefined('precondition: helper is not there yet');

    validations.register('isEven', function() {
      this.using(function(value) {
        return value % 2 === 0;
      });
    });

    expect(builder.isEven).to.be.defined('helper is added to the builder');

    validations.unregister('isEven');
    expect(builder.isEven).to.be.undefined('postcondition: helper is removed after unregister');
  });
});
