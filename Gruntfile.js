function loadConfig(path) {
  var string = require('string');
  var glob   = require('glob');
  var object = {};

  glob.sync('*', { cwd: path }).forEach(function(option) {
    var key = option.replace(/\.(js|coffee)$/, '');
    key = string(key).camelize().s;
    object[key] = require(path + option);
  });

  return object;
}

module.exports = function(grunt) {
  // build the config by combining tasks/options/*.js
  var config = {};
  grunt.util._.extend(config, loadConfig('./tasks/options/'));
  grunt.initConfig(config);

  // load all grunt libraries
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // load all custom tasks
  grunt.loadTasks('tasks');

  // build our top-level tasks based on the smaller ones
  grunt.registerTask('default', 'test');
  grunt.registerTask('build', ['clean', 'copy:test', 'transpile', 'browserify', 'copy:afterBrowserify']);
  grunt.registerTask('test', ['build', 'connect:test', 'qunit']);
  grunt.registerTask('develop', ['build', 'connect:test', 'watch']);
};
