# LGTM

LGTM is a simple JavaScript library for validating objects and collecting error messages.

## Example

```coffeescript
person =
  firstName : 'Brian'
  lastName  : null
  age       : 30

validator = LGTM.validatorFor(person)
              .validates('firstName')
                .required("You must enter a first name.")
              .validates('lastName')
                .required("You must enter a last name.")
              .validates('age')
                .with(((age) -> age > 18), "You must be over 18.")
              .build()

validator.validate().then (result) ->
  if not result.valid
    alert JSON.stringify(result.errors) # { "lastName": ["You must enter a last name."] }
```
