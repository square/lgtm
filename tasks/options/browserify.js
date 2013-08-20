module.exports = {
  dist: {
    src: 'dist/commonjs/lgtm.js',
    dest: 'dist/lgtm.js',
    options: {
      standalone: 'LGTM'
    }
  },

  test: {
    src: 'test/**/*.js',
    dest: 'tmp/test/lgtm_test.js'
  }
};
