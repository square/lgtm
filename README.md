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
  LGTM.validator()
    .validates('firstName')
      .required("You must enter a first name.")
    .validates('lastName')
      .when(-> lastNameRequired)
        .required("You must enter a last name.")
    .validates('age')
      .using(((age) -> age > 18), "You must be over 18.")
    .build()

# Validate all attributes and return results with a promise.
validator.validate(person).then (result) ->
  if not result.valid
    alert JSON.stringify(result.errors) # { "lastName": ["You must enter a last name."] }

# Specify the attributes to validate, this time using a callback.
validator.validate person, 'firstName', 'age', (result) ->
  alert JSON.stringify(result) # { "valid": true, "errors": {} }
```

## Installing

### Browser

Just copy the [dist/lgtm.js](dist/lgtm.js) file into your project and load it
as normal. LGTM uses [browserify](http://browserify.org/), so LGTM will
register itself with any CommonJS or AMD setup you have. If it doesn't find
either of those it will export `LGTM` as a global with the object you would
normally get by using `require('lgtm')`.

### Node.js

This package can be used just like any normal Node.js package, just
`require('lgtm')`.


## Usage

LGTM can be used in either a browser or Node.js environment. These examples
will use the `LGTM` export from the main file as if it were a global in the
browser or you had done `var LGTM = require('lgtm');` in your Node.js files.

### Basic Validation

You need to make a validator and then tell it what attributes you want to
validate. You can use the `LGTM.validator()` function which returns a builder
to help you build a validator:

```coffeescript
validator =
  LGTM.validator()
    # until the next validates(), all validations apply to 'name'
    .validates('name')
      # using() takes a predicate function that does the validation and an associated error message
      .using(((name) -> name isnt 'Rose'), "Rose, you can't sign up.")
      # you can call using() as many times as you want for a given attribute
      .using(((name) -> name[0] isnt 'A'), "Your name starts with an 'A', you can't sign up.")

    # call validates() again to start adding validations for another attribute
    .validates('title')
      # required() is one of the built-in core validations
      .required("You must enter a title.")

    # remember to call build() at the end to get the actual validator and not the builder
    .build()
```

Once you have the validator you can use it on any object you want. All
validation is done asynchronously and the results are returned via a promise:

```coffeescript
formData = name: "Rose", title: "Companion"
validator.validate(formData).then (result) ->
  console.log result # { "valid": false, "errors": { "name": "Rose, you can't sign up." } }
```

If you prefer the callback style, you can use that instead:

```coffeescript
validator.validate formData, (result) ->
  # ...
```


### Custom Validations

If you find yourself using the same validations in several places you can
register your custom validation and use it just like the built-in `register()`
validation:

```coffeescript
LGTM.validations.register 'isEven', (value) ->
  value % 2 is 0
```

Then just go ahead and use it just like any other validation:

```coffeescript
LGTM.validator()
  .validates('age')
    .isEven("You must have an even age!")
  .build()
```

Note that `isEven()` on the builder is not the same as the `isEven()` you
registered. The builder version of `isEven()` takes the error message for when
validation fails, yours takes the value of the attribute being validated.


### Multi-Attribute Validations

Sometimes an attribute value will be valid or not based on the value of some
other property on the object. In cases like that you can use the additional
arguments passed to validations to access more information about the object
being validated:

```coffeescript
# businesses only need street addresses if they're not mobile
LGTM.validator()
  .validates('street1')
    .using(((street1, _, business) -> street1? or business.mobile), "Please enter a street address.")
  .build()
```

The downside of this approach is that we're using `street1?` as a substitute
for `required()`, though they aren't quite equivalent. Fortunately, we can
still use `required()` with a little bit of help from `when()`:

```coffeescript
# businesses only need street addresses if they're not mobile
LGTM.validator()
  .validates('street1')
    .when(((_, _, business) -> not business.mobile))
      .required("Please enter a street address.")
  .build()
```


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
