module.exports =
  commonjs:
    type: 'cjs'
    files: [
      expand: yes
      cwd: 'src'
      src: '**/*.js'
      dest: 'dist/commonjs'
    ]
