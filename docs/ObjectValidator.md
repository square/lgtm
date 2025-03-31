> [Wiki](Home) ▸ **API Reference** ▸ **ObjectValidator**

<a name="validate" href="#wiki-validator">#</a> validator.<b>validate</b>(<i>object</i>, [<i>attrs...</i>], [<i>callback(err, result)</i>])

Runs validations for the given `attrs` on `object` and any attributes that
depend on them. By default all attributes are validated. When validation is
complete `callback` will be called with a validation result object with two
keys: "valid" and "errors":

* `valid` - will be true if no validations failed, false otherwise
* `errors` - is an object with keys for all validated attributes whose values are arrays of error messages, empty for all attributes that passed validation


If an exception occurred while validating then the `err` argument to `callback`
will contain the thrown exception. Otherwise it will be null. If no `callback`
is given a promise will be returned which will resolve to the validation result
shown above or, if an exception occurred, will be rejected with the thrown
exception.

<a name="attributes" href="#wiki-attributes">#</a> validator.<b>attributes</b>()

Returns an array of attribute names used directly or indirectly by this
validator. A directly used attribute is one that has at least one validation
against it. An indirectly used attribute is one that does not have any
validations run against it but another attribute validation depends on its
value.

```js
LGTM.validator()
  .validates('street1')
    .when('mobile', (mobile) => mobile)
      .required("Enter a street address!")
  .build().attributes();
// => ["street1", "mobile"]
```

This method is primarily provided to allow better integration with JavaScript
frameworks supporting observers and binding.

<a name="addValidation" href="#wiki-addValidation">#</a> validator.<b>addValidation</b>(<i>attr</i>, <i>fn(value, attr, object)</i>, <i>message</i>)

*This method is internal.*

Registers a validation for `attr` with a validation function and corresponding
error message. `fn` must be a function that returns either true or false or a
promise that resolves to true or false. This function receives as arguments the
current value of the attribute on the object, the attribute name being
validated, and the object being validated (i.e. the object passed to
[validator.validate()](ObjectValidator#wiki-validate)).

<a name="addDependentsFor" href="#wiki-addDependentsFor">#</a> validator.<b>addDependentsFor</b>(<i>parent</i>, [<i>dependent</i>, …])

*This method is internal.*

Tells the validator that all the specified dependent attributes should all be
re-validated when the parent attribute is validated. This is useful only in
conjunction with partial validations (i.e. when specific attributes are passed
to [validator.validate()](ObjectValidator#wiki-validate)).
