// TODO: use this instead: export * from './lgtm';
import { configure, validator, helpers, ObjectValidator } from './lgtm';
import { defer } from 'rsvp';

configure('defer', defer);

export { configure, validator, helpers, ObjectValidator };
