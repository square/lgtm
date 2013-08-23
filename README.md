# LGTM

LGTM is a simple JavaScript library for validating objects and collecting error
messages. It leaves the display, behavior, and error messages in your hands,
focusing on letting you describe your validations cleanly and concisely for
whatever environment you're using.


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
      .optional()
        .using(function(age){ return age > 18; }, "You must be over 18.")
    .build();

// Validate all attributes and return results with a promise.
validator.validate(person).then(function(result) {
  if (!result.valid) {
    console.log(result.errors); // { "firstName": [ ], "lastName": ["You must enter a last name."], "age": [ ] }
  }
});

// Specify the attributes to validate, this time using a callback.
validator.validate(person, 'firstName', 'age', function(err, result) {
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

You can also install it with bower:

```
$ bower install lgtm
```

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

```
$ npm install lgtm
$ node
> var LGTM = require('lgtm');
```


## Usage

LGTM can be used in either a browser or Node.js environment. These examples
will use the `LGTM` export from the main file as if it were a global in the
browser or you had done `var LGTM = require('lgtm');` in your Node.js files.

### Built-in Helpers

See the list of built-in helpers [on the wiki][built-in-helpers]. Check out the
Contributing section below if you have a generally-useful validation you think
fits in core.

[built-in-helpers]: https://github.com/square/lgtm/wiki/Helpers

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
validator.validate(formData, function(err, result) {
  // ...
});
```

When using the callback style, LGTM follows the node.js convention of passing
any exception thrown or runtime error generated as the first argument. If there
is no exception then `err` will be `null`, even if the validated object turned
out to be invalid. When using the promise style runtime errors will be handled
as a rejected promise.

LGTM supports async using
[promises](http://blog.parse.com/2013/01/29/whats-so-great-about-javascript-promises/).
If the result of a validation function is a thenable (read: promise) then the
result of that validation will be whatever the promise resolves to. This could
allow you to check with your server for usernames being taken, for example:

```js
var validator =
  LGTM.validator()
    .validates('username')
      .using(function(username) {
        return $.getJSON('/check-username', { username: username })
                .then(function(response){ return !response.taken; });
      })
    .build();
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
the `develop` grunt task:

```
$ grunt develop
```

Then go to http://localhost:8000/ in your browser (run with `PORT={port}` to
override the default port).

### Pull Requests

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

Any contributors to the master lgtm repository must sign the [Individual
Contributor License Agreement (CLA)][cla].  It's a short form that covers our
bases and makes sure you're eligible to contribute.

[cla]: https://spreadsheets.google.com/spreadsheet/viewform?formkey=dDViT2xzUHAwRkI3X3k5Z0lQM091OGc6MQ&ndplr=1

When you have a change you'd like to see in the master repository, [send a pull
request](https://github.com/square/lgtm/pulls). Before we merge your request,
we'll make sure you're in the list of people who have signed a CLA.

Thanks, and enjoy validating all the things!
