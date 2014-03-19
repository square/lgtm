module.exports = {
  test: {
    files: [{
      src: 'test/index.html',
      dest: 'tmp/test/index.html'
    }, {
      expand: true,
      cwd: 'test',
      src: 'libs/**/*',
      dest: 'tmp/test'
    }, {
      src: 'node_modules/qunit-bdd/lib/qunit-bdd.js',
      dest: 'tmp/test/libs/qunit-bdd.js'
    }]
  },

  afterBrowserify: {
    files: [{
      src: 'dist/lgtm-standalone.js',
      dest: 'tmp/test/lgtm-standalone.js'
    }]
  }
};
