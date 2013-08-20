"use strict";
var __dependency1__ = require("./lgtm");
var configure = __dependency1__.configure;
var validator = __dependency1__.validator;
var validations = __dependency1__.validations;
var ObjectValidator = __dependency1__.ObjectValidator;
var defer = require("rsvp").defer;
// TODO: use this instead: export * from './lgtm';

configure('defer', defer);


exports.configure = configure;
exports.validator = validator;
exports.validations = validations;
exports.ObjectValidator = ObjectValidator;