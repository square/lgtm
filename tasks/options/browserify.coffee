module.exports =
  dist:
    src: 'dist/commonjs/lgtm.js'
    dest: 'dist/lgtm.js'
    options:
      standalone: 'LGTM'

  test:
    src: 'test/**/*.coffee'
    dest: 'tmp/test/lgtm_test.js'
    options:
      transform: ['coffeeify']
