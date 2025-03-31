> [Wiki](Home) ▸ **Custom Helpers**

Helpers are named shortcuts to common validations or conditions.

### Basic Helpers

Let's say you want a validation to check that a value is a URL:

```js
LGTM.helpers.register('url', function(message) {
  this.using(function(value) {
    return /^https?:/.test(value);
  }, message);
});
```

Now you can use your custom helper as a validation when building a validator:

```js
LGTM.validator()
  .validates('homepage')
    .url("Please enter a valid URL.")
  .build();
```

Obviously this validator is a bit naïve, but you can customize it to your
needs.


### Configurable Helpers

You can take whatever arguments you want in your helper and use them in the
helper function. For example:

```js
LGTM.helpers.register('between', function(min, max, message) {
  this.using(function(value) {
    return min <= value && value <= max;
  }, message);
});

LGTM.validator()
  .validates('rating')
    .between(1, 5, "Please rate between 1-5.")
  .build();
```


### Overriding Built-in Helpers

If one of the built-in helpers isn't to your liking you can simply override it:

```js
LGTM.validations.register('email', function(message) {
  this.using(myAwesomeEmailChecker, message);
});
```

### How it Works

The basic validation function all validation helpers use is [using()](ValidatorBuilder#wiki-using). You use
`using()` yourself when building your validators for anything a built-in
validation cannot express, which is probably often. You can make validations
conditional by preceding the call to `using()` with a call to [when()](ValidatorBuilder#wiki-when). Doing
so will act as a condition for all subsequent validations for the same
attribute. Let's break down one of the examples from the README:

```js
var validator =
  LGTM.validator()
    .validates('firstName')                               // set current attribute = firstName
      .required("You must enter a first name.")           // add validation for firstName
    .validates('lastName')                                // set current attribute = lastName
      .when(=> lastNameRequired)                          // conditionally run subsequent validations
        .required("You must enter a last name.")          // add (conditional) validation for lastName
    .validates('age')                                     // set current attribute = age
      .optional()                                         // conditionally run subsequent validations
        .using((age) => age > 18, "You must be over 18.") // add (conditional) validation for age
    .build();                                             // returns an object with validate() method
```
