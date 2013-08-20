# LGTM

LGTM is a simple JavaScript library for validating objects and collecting error messages.


## Example

```js
var person = {
  firstName : 'Brian',
  lastName  : null,
  age       : 30
};

var lastNameRequired = true;

var validator =
  LGTM.validator()
    .validates('firstName')
      .required("You must enter a first name.")
    .validates('lastName')
      .when(function(){ return lastNameRequired; })
        .required("You must enter a last name.")
    .validates('age')
      .using(function(age){ return age > 18; }, "You must be over 18.")
    .build();

// Validate all attributes and return results with a promise.
validator.validate(person).then(function(result) {
  if (!result.valid) {
    console.log(result.errors); // { "firstName": [ ], "lastName": ["You must enter a last name."], "age": [ ] }
  }
});

// Specify the attributes to validate, this time using a callback.
validator.validate(person, 'firstName', 'age', function(result) {
  console.log(result); // { "valid": true, "errors": { "firstName": [ ], "age": [ ] } }
});
```

## Installing

### Browser

Just copy the [dist/lgtm-standalone.js](dist/lgtm-standalone.js) file into your
project and load it as normal. LGTM uses [browserify](http://browserify.org/),
so LGTM will register itself with any CommonJS or AMD setup you have. If it
doesn't find either of those it will export `LGTM` as a global with the object
you would normally get by using `require('lgtm')`.

If you already have a promise library in your application and don't want the
bundled one that comes with LGTM
([RSVP.js](https://github.com/tildeio/rsvp.js)) then you can configure LGTM to
use it by providing a `defer` function:

```js
// use LGTM with Q
LGTM.configure('defer', Q.defer);

// use LGTM with Ember's bundled RSVP
LGTM.configure('defer', Ember.RSVP.defer);
```

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

```js
var validator =
  LGTM.validator()
    // until the next validates(), all validations apply to 'name'
    .validates('name')
      // using() takes a predicate function that does the validation and an associated error message
      .using(function(name){ return name !== 'Rose'; }, "Rose, you can't sign up.")
      // you can call using() as many times as you want for a given attribute
      .using(function(name){ name[0] !== 'A'; }, "Your name starts with an 'A', you can't sign up.")

    // call validates() again to start adding validations for another attribute
    .validates('title')
      // required() is one of the built-in core validations
      .required("You must enter a title.")

    // remember to call build() at the end to get the actual validator and not the builder
    .build();
```

Once you have the validator you can use it on any object you want. All
validation is done asynchronously and the results are returned via a promise:

```js
var formData = { name: "Rose", title: "Companion" };
validator.validate(formData).then(function(result) {
  console.log(result); // { "valid": false, "errors": { "name": [ "Rose, you can't sign up." ], "title": [ ] } }
});
```

If you prefer the callback style, you can use that instead:

```js
validator.validate(formData, function(result) {
  // ...
});
```


### Custom Validations

If you find yourself using the same validations in several places you can
register your custom validation and use it just like the built-in `register()`
validation:

```js
LGTM.validations.register('isEven', function(value) {
  return value % 2 === 0;
});
```

Then just go ahead and use it just like any other validation:

```js
LGTM.validator()
  .validates('age')
    .isEven("You must have an even age!")
  .build();
```

Note that `isEven()` on the builder is not the same as the `isEven()` you
registered. The builder version of `isEven()` takes the error message for when
validation fails, yours takes the value of the attribute being validated.


### Multi-Attribute Validations

Sometimes an attribute value will be valid or not based on the value of some
other property on the object. In cases like that you can use the additional
arguments passed to validations to access more information about the object
being validated:

```js
// businesses only need street addresses if they're not mobile
LGTM.validator()
  .validates('street1')
    .using('street1', 'mobile', function(street1, mobile){ return street1 || mobile; }, "Please enter a street address.")
  .build();
```

The downside of this approach is that we're using `street1` as a substitute
for `required()`, though they aren't quite equivalent. Fortunately, we can
still use `required()` with a little bit of help from `when()`:

```js
// businesses only need street addresses if they're not mobile
LGTM.validator()
  .validates('street1')
    .when('mobile', function(mobile){ return !mobile; })
      .required("Please enter a street address.")
  .build();
```

`using()` and `when()` both implicity pass the value of the attribute being
validated by default if no attributes are specified. Validating any of the
attributes passed to `when()` or `using()` will validate the attribute that
requires them, too:

```js
// businesses only need street addresses if they're not mobile
var validator = LGTM.validator()
  .validates('street1')
    .when('mobile', function(mobile){ return !mobile; })
      .required("Please enter a street address.")
  .build();

validator.validate({ mobile: false, street1: '' }, 'mobile').then(function(result) {
  console.log(result);  // { "valid": false, "errors": { "mobile": [ ], "street1": [ "Please enter a street address." ] } }
});
```

The `errors` object will also contain errors (or empty arrays if valid) for any non-direct validations carried through dependencies.

```js
validator.validate({ mobile: false, street1: '123 Fake St' }, 'mobile').then(function(result) {
  console.log(result);  // { "valid": true, "errors": { "mobile": [ ], "street1": [ ] } }
});
```

### Attributes Used by Validations

The list of attributes your validator cares about will be available with the
`attributes()` method. All attributes passed to `validates()`, `using()` and
`when()` will be included.

```js
validator = LGTM.validator()
  .validates('street1')
    .when('mobile', 'street2', function(mobile, street2){ return !mobile && street2; })
      .required("Enter street address if you have an apartment.")
  .build();

validator.attributes();  // => ["street1", "mobile", "street2"]
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
