global.resolve = function(value) {
  return {
    then: function(callback) {
      setTimeout(function() {
        callback(value);
      }, 0);
    }
  };
};
