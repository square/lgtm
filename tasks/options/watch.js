module.exports = {
  options: {
    nospawn: true
  },

  test: {
    files: ['src/**/*.js', 'test/**/*.js'],
    tasks: ['build']
  }
};
