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
    }]
  },

  afterBrowserify: {
    files: [{
      src: 'dist/lgtm-standalone.js',
      dest: 'tmp/test/lgtm-standalone.js'
    }]
  }
};
