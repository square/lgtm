get = (object, property) ->
  if not object?
    return
  else if typeof object.get is 'function'
    object.get(property)
  else
    object[property]

getProperties = (object, properties) ->
  get object, prop for prop in properties

uniq = (array) ->
  result = []
  for item in array
    result.push item unless item in result
  return result

export get
export getProperties
export uniq
