import ObjectValidator from './lgtm/object_validator.js';
import ValidatorBuilder from './lgtm/validator_builder.js';
import config from './lgtm/config.js';
import { get } from './lgtm/utils.js';
import {
  present,
  checkEmail,
  checkMinLength,
  checkMaxLength,
  register as core_register
} from './lgtm/helpers/core.js';

core_register();

function validator() {
  return new ValidatorBuilder();
}

function register() {
  ValidatorBuilder.registerHelper.apply(ValidatorBuilder, arguments);
}

function unregister() {
  ValidatorBuilder.unregisterHelper.apply(ValidatorBuilder, arguments);
}

let helpers = {
  core: {
    present,
    checkEmail,
    checkMinLength,
    checkMaxLength,
    register: core_register
  },
  register,
  unregister
};

function configure(key, value) {
  config[key] = value;
}

configure('defer', () => {
  let Promise = config['Promise'];
  let resolve;
  let reject;
  let promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  if (!resolve || !reject) {
    throw new Error('Configured promise does not behave as expected');
  }

  return { promise, resolve, reject };
});

function PromiseProxy(callback) {
  let Promise = getPromise();
  return new Promise(callback);
}

PromiseProxy.all = (...args) => getPromise().all(...args);

PromiseProxy.race = (...args) => getPromise().race(...args);

PromiseProxy.resolve = (...args) => getPromise().resolve(...args);

PromiseProxy.reject = (...args) => getPromise().reject(...args);

function getPromise() {
  let warn = config['warn'];

  /* global Promise, RSVP, require */
  if (typeof RSVP !== 'undefined') {
    configure('Promise', RSVP.Promise);
    warn(
      `Implicitly using RSVP.Promise. This will be removed in LGTM 2.0. ` +
        `Instead, use 'LGTM.configure("Promise", RSVP.Promise)' to ` +
        `continue using RSVP promises.`
    );
    return RSVP.Promise;
  }

  if (typeof require === 'function') {
    try {
      let { Promise } = require('rsvp');
      configure('Promise', Promise);
      warn(
        `Implicitly using require("rsvp").Promise. This will be removed in LGTM 2.0. ` +
          `Instead, use 'LGTM.configure("Promise", require("rsvp").Promise)' to ` +
          `continue using RSVP promises.`
      );
      return Promise;
    } catch (err) {
      // Ignore errors, just try built-in Promise or fail.
    }
  }

  if (typeof Promise === 'function') {
    configure('Promise', Promise);
    return Promise;
  }

  throw new Error(
    `'Promise' could not be found. Configure LGTM with your promise library using ` +
      `e.g. 'LGTM.configure("Promise", RSVP.Promise)'.`
  );
}

/* global console */
configure('Promise', PromiseProxy);
configure('warn', console.warn.bind(console)); // eslint-disable-line no-console
configure('get', (object, property) => {
  let warn = config['warn'];

  configure('get', get);
  warn(
    `Implicitly using 'get' implementation that uses a 'get' method when available. ` +
      `This will be removed in LGTM 2.0. Instead, use e.g. 'LGTM.configure("get", Ember.get)' ` +
      `if you rely on this behavior.`
  );
  return get(object, property);
});

export { configure, validator, helpers, ObjectValidator };
