global.resolve = (value) ->
  then: (callback) ->
    setTimeout ->
      callback value
    , 0
