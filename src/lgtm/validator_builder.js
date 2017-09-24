import ObjectValidator from './object_validator.js';
import Validation from './validation';

function ValidatorBuilder(...validations) {
  this._validations = validations;
}

ValidatorBuilder.prototype = {
  _validations: null,
  _validation: null,

  validates(attr) {
    this._validation = new Validation(attr);
    this._validations.push(this._validation);
    return this;
  },

  when(/* ...dependencies, condition */) {
    this._validation.when.apply(this._validation, arguments);
    return this;
  },

  and(/* ...dependencies, condition */) {
    this._validation.and.apply(this._validation, arguments);
    return this;
  },

  using(/* ...dependencies, predicate, message */) {
    this._validation.using.apply(this._validation, arguments);
    return this;
  },

  build() {
    return new ObjectValidator(...this._validations);
  }
};

ValidatorBuilder.registerHelper = function(name, fn) {
  this.prototype[name] = function() {
    fn.apply(this._validation, arguments);
    return this;
  };

  Validation.prototype[name] = function() {
    fn.apply(this, arguments);
    return this;
  };

  return null;
};

ValidatorBuilder.unregisterHelper = function(name) {
  delete this.prototype[name];
  delete Validation.prototype[name];
  return null;
};

export default ValidatorBuilder;
