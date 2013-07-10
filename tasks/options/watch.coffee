module.exports =
  options:
    nospawn: yes

  test:
    files: ['src/**/*.coffee', 'test/**/*.coffee']
    tasks: ['build']
