module.exports = {
  commonjs: {
    type: 'cjs',
    files: [{
      expand: true,
      cwd: 'src',
      src: '**/*.js',
      dest: 'dist/commonjs'
    }]
  }
};
