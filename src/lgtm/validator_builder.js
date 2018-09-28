import ObjectValidator from './object_validator';
import Validation from './validation';

export default class ValidatorBuilder {
  _validations = null;
  _validation = null;

  constructor(...validations) {
    this._validations = validations;
  }

  validates(attr) {
    this._validation = new Validation(attr);
    this._validations.push(this._validation);
    return this;
  }

  when(/* ...dependencies, condition */) {
    this._validation.when(...arguments);
    return this;
  }

  and(/* ...dependencies, condition */) {
    this._validation.and(...arguments);
    return this;
  }

  using(/* ...dependencies, predicate, message */) {
    this._validation.using(...arguments);
    return this;
  }

  build() {
    return new ObjectValidator(...this._validations);
  }

  static registerHelper(name, fn) {
    this.prototype[name] = function() {
      fn.apply(this._validation, arguments);
      return this;
    };

    Validation.prototype[name] = function() {
      fn.apply(this, arguments);
      return this;
    };

    return null;
  }

  static unregisterHelper(name) {
    delete this.prototype[name];
    delete Validation.prototype[name];
    return null;
  }
}
