module.exports = {
  dist: {
    src: 'dist/commonjs/lgtm.js',
    dest: 'dist/lgtm.js',
    options: {
      standalone: 'LGTM'
    }
  },

  // bundles rsvp.js
  standalone: {
    src: 'dist/commonjs/lgtm-standalone.js',
    dest: 'dist/lgtm-standalone.js',
    options: {
      standalone: 'LGTM'
    }
  },

  test: {
    src: 'test/**/*.js',
    dest: 'tmp/test/lgtm_test.js'
  }
};
