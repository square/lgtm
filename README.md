# LGTM

LGTM is a simple JavaScript library for validating objects and collecting error messages.

## Example

```coffeescript
person =
  firstName : 'Brian'
  lastName  : null
  age       : 30

lastNameRequired = yes

validator =
  LGTM.validatorFor(person)
    .validates('firstName')
      .required("You must enter a first name.")
    .validates('lastName')
      .when(-> lastNameRequired)
        .required("You must enter a last name.")
    .validates('age')
      .using(((age) -> age > 18), "You must be over 18.")
    .build()

# Validate all attributes and return results with a promise.
validator.validate().then (result) ->
  if not result.valid
    alert JSON.stringify(result.errors) # { "lastName": ["You must enter a last name."] }

# Specify the attributes to validate, this time using a callback.
validator.validate 'firstName', 'age', (result) ->
  alert JSON.stringify(result) # { "valid": true, "errors": {} }
```

## Installing

Just copy the [dist/lgtm.js](dist/lgtm.js) file into your project and load it as normal.

## Contributing

### Setup

First, install the development dependencies:

```
$ npm install
```

You may need to install the `grunt` command-line utility:

```
$ [sudo] npm install -g grunt-cli
```

Then, try running the tests:

```
$ grunt test
```

### Development

As you make changes you may find it useful to have everything automatically
compiled and ready to test interactively in the browser. You can do that using
the `develop` grunt test:

```
$ grunt develop
```

Then go to http://localhost:8000/ in your browser (run with `PORT={port}` to
override the default port).

### Pull Requests

Contributions via pull requests are very welcome! Follow the steps in
Developing above, then add your feature or bugfix with tests to cover it, push
to a branch, and open a pull request.
