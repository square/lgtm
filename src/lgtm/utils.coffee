get = (object, property) ->
  if not object?
    return
  else if typeof object.get is 'function'
    object.get(property)
  else
    object[property]

export get
