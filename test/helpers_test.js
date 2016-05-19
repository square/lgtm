import { helpers, validator } from './lgtm';
import { throws } from 'assert';

describe('LGTM.helpers.(un)register', () => {
  afterEach(() => {
    helpers.unregister('isBob');
  });

  it('allow registering a custom helper for use in the builder DSL', () => {
    helpers.register('isBob', function(message) {
      this.using(value => value === 'Bob', message);
    });

    // this would throw if the above didn't work
    validator()
      .validates('name')
      .isBob('You must be Bob.')
      .build();
  });

  it('fails when delegating to using() without a message', () => {
    helpers.register('isBob', function(message) {
      // eslint-disable-line no-unused-vars
      this.using(value => value === 'Bob' /* note I don't pass message here */);
    });

    throws(() => {
      validator()
        .validates('name')
        .isBob('You must be Bob.')
        .build();
    }, 'using() should have thrown an exception');
  });

  it('unregistering makes the helper unavailable to the builder DSL', () => {
    helpers.register('isBob', function(message) {
      this.using(value => value === 'Bob', message);
    });

    helpers.unregister('isBob');

    throws(() => {
      validator()
        .validates('name')
        .isBob('You must be Bob.')
        .build();
    }, 'unregister() makes the helper unavailable');
  });
});
