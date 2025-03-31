> [Wiki](Home) ▸ **API Reference** ▸ **ValidatorBuilder**

<a name="validator" href="#wiki-validator">#</a> LGTM.<b>validator</b>()

Creates a new `ValidatorBuilder` which can be used to build an
[ObjectValidator](ObjectValidator). This object uses the builder pattern and
the method calls are intended to be chained. The result is intended to read
more or less as a sentence -- a description of what the validator will do.

<a name="validates" href="#wiki-validates">#</a> builder.<b>validates</b>(<i>attr</i>)

This method sets the current attribute for subsequent calls to `using()` and
`when()` and **must** be called before calls to either of those methods.

<a name="using" href="#wiki-using">#</a> builder.<b>using</b>([<i>attr</i>, …], <i>fn(value[, value, …], attr, object)</i>, <i>message</i>)

This method adds a validation to the underlying `ObjectValidator` for the
current attribute wrapped by the current conditions if any exist. This method
may be called multiple times to add multiple validations for the current
attribute. By default `fn` will be passed the value of the attribute to be
validated, the name of the attribute, and the object being validated:

```js
LGTM.validator()
  .validates('name')
    .using(function(value, attr, object) {
      // value  === person.name
      // attr   === "name"
      // object === person
    }, "OH NO!")
  .build()
.validate(person);
```

If you want the value of different attributes just pass the list you want to
`using()` one at a time:

```js
LGTM.validator()
  .validates('name')
    .using('name', 'age', function(name, age, attr, object) {
      // name   === person.name
      // age    === person.age
      // attr   === "name"
      // object === person
    }, "OH NO!")
  .build()
.validate(person);
```

`fn` must return either true or false or a promise that resolves to true or
false. `message` may be anything you want, but is generally an error message
string you intend to present to the user. If the validation added by this call
fails, `message` will be included in the validation results.

<a name="when" href="#wiki-when">#</a> builder.<b>when</b>([<i>attr</i>, …], <i>fn</i>)

Use this to make subsequent calls to `using()` conditional. This method adds a
condition to any previously added since the last call to `validates()`,
modifying the behavior of subsequent calls to `using()`. All `when()`
conditions are AND-ed together and must all return true to continue with
validation. Consider using `and()`, an alias for `when()`, for subsequent
conditions to make this clearer in your code. Like with `using()`, `when()` by
default will give you the value to validate, the name of the attribute being
validated, and the object being validated:

```js
LGTM.validator()
  .validates('name')
    .when(function(value, attr, object) {
      // value  === person.name
      // attr   === "name"
      // object === person
    })
    .required("OH NO!")
  .build()
.validate(person);
```

Also like with `using()` you can ask for a specific set of attributes by naming
them as arguments before `fn`:

```js
LGTM.validator()
  .validates('name')
    .when('name', 'age', function(name, age, attr, object) {
      // name   === person.name
      // age    === person.age
      // attr   === "name"
      // object === person
    })
    .required("OH NO!")
  .build()
.validate(person);
```

`fn` must return either true or false or a promise that resolves to true or
false. If the result of `fn()` is false (or resolves to false) then the
validations chained after this call will not be called.

<a name="build" href="#wiki-and">#</a> builder.<b>and</b>()

An alias for [`when()`](#wiki-when) to improve the readability of chained
method calls.

<a name="build" href="#wiki-build">#</a> builder.<b>build</b>()

Returns the built [`ObjectValidator`](ObjectValidator) ready to validate
objects. *You must remember to call this function at the end of the chain!*

### Helpers

Helpers provide shortcuts to commonly-used validations and conditions. All
registered helpers are automatically available on `ValidatorBuilder` instances.

#### Core

<a name="core_required" href="#wiki-core_required">#</a> builder.<b>required</b>(<i>message</i>)

Adds a validation for the current attribute that will fail if the value of the
validated attribute is absent (i.e. `null`, `undefined`, or an all-whitespace
string).

<a name="core_optional" href="#wiki-core_optional">#</a> builder.<b>optional</b>()

Sets the condition for the current attribute's subsequent validations such that
they will not be used unless the value to validate is present (i.e. not `null`,
`undefined`, or an all-whitespace string).

<a name="core_email" href="#wiki-core_email">#</a> builder.<b>email</b>(<i>message</i>[, <i>options</i>])

Adds a validation for the current attribute that will fail if the value of the
validated attribute is not an email address. This validation is meant to be a
good default but may allow email addresses you don't want. Remember that you
can always override any built-in helper (see [Custom Helpers](Custom-Helpers)).

If you want to disallow special characters (such as 'ñ'), pass the `options`
argument with `strictCharacters: true`.

<a name="core_minLength" href="#wiki-core_minLength">#</a> builder.<b>minLength</b>(<i>length</i>, <i>message</i>)

Adds a validation for the current attribute that will fail if the length of the
value is less than the given `length`. This works for anything that has a
`.length` property, such as strings and arrays.

<a name="core_maxLength" href="#wiki-core_maxLength">#</a> builder.<b>maxLength</b>(<i>length</i>, <i>message</i>)

See [Custom Helpers](Custom-Helpers) for information on writing your own helpers.
