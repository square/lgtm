> [Wiki](Home) ▸ **API Reference**

Everything in this library is contained in a module, which by default is
exported as `LGTM` in the browser. The documentation will assume that the
module is exposed in your code as `LGTM`, whether using globals, AMD, or
CommonJS.

### [ValidatorBuilder](ValidatorBuilder)

This is the main API you'll want to use. It is the API used in all the
examples.

* [LGTM.validator](ValidatorBuilder#wiki-validator) - factory method for creating a `ValidatorBuilder`
* [builder.validates](ValidatorBuilder#wiki-validates) - start validations for an attribute
* [builder.using](ValidatorBuilder#wiki-using) - add a validation for the current attribute
* [builder.when](ValidatorBuilder#wiki-when) - make some validations conditional
* [builder.build](ValidatorBuilder#wiki-build) - build an [`ObjectValidator`](ObjectValidator)

#### [Core Helpers](ValidatorBuilder#core)

* [core.required](ValidatorBuilder#wiki-core_required) - validate that a value is present
* [core.optional](ValidatorBuilder#wiki-core_optional) - only validate if a value is present
* [core.email](ValidatorBuilder#wiki-core_email) - validate that the value is an email
* [core.minLength](ValidatorBuilder#wiki-core_minLength) - validate that the value has a minimum length
* [core.maxLength](ValidatorBuilder#wiki-core_maxLength) - validate that the value has a maximum length


### [ObjectValidator](ObjectValidator)

This is the core API underlying `ValidatorBuilder`.

* [validator.validate](ObjectValidator#wiki-validate) - performs validations against a given object
* [validator.attributes](ObjectValidator#wiki-attributes) - lists all the attributes directly or indirectly used in validation
* [validator.addValidation](ObjectValidator#wiki-addValidation) - registers a validation for a given attribute `[internal]`
* [validator.addDependentsFor](ObjectValidator#wiki-addDependentsFor) - registers dependencies between attributes `[internal]`
