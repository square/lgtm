module.exports =
  commonjs:
    options:
      bare: yes
    files: [
      expand: yes
      cwd: 'tmp/commonjs'
      src: '**/*.coffee'
      dest: 'dist/commonjs'
      ext: '.js'
    ]

  test:
    files: [
      expand: yes
      cwd: 'test'
      src: '**/*.coffee'
      dest: 'tmp/test'
      ext: '.js'
    ]
