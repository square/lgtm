(typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this).resolve = function(value) {
  return {
    then: function(callback) {
      setTimeout(function() {
        callback(value);
      }, 0);
    }
  };
};
