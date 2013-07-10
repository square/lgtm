module.exports =
  commonjs:
    type: 'cjs'
    files: [
      expand: yes
      cwd: 'src'
      src: '**/*.coffee'
      dest: 'tmp/commonjs'
    ]
