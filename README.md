# rules_njk

A library of [Bazel](https://bazel.build/) rules for rendering
[Nunjucks](https://mozilla.github.io/nunjucks/) templates at build-time.

## Status

This project is currently dead after a very short and simple prototype. The
original motivation for this was to have a templating language with a powerful
Bazel toolchain in order to develop an
[HTML prerendering rule set](https://github.com/dgp1130/rules_prerender) on top
of. There wasn't much out there and Nunjucks was the most compatible templating
library I could find given its use of explicit imports and such.

However, the Nunjucks API simply wasn't designed for this use case. We can stub
out imports for dependent libraries, but strict dependency checking is mostly
impossible to implement as is without knowledge of what template file is
requesting the given resource, which just isn't how Nunjucks is configured.

Nunjucks also expects all templates to share the same set of data, a `{{ foo }}`
variable will always be the same for all template files in a given `render()`
call. That makes sense for normal usage, but trying to make a proper library
component with Bazel means that the library needs its data decoupled from the
final binary.

Ultimately, I could make feature requests to Nunjucks or use a local fork with
some patches on top of it. A lot of this could possibly be done with a Nunjucks
extension, however doing that would require me to re-implement a lot of the
existing functionality. For instance, you would not be able to do `{{ foo }}`,
but would instead have to do something like `{% print foo %}` so the extension
can intercept the call and load the right `foo` for the given file. At that
point, you're not even really using Nunjucks anyways.

I later had the idea that we don't strictly need a full-on templating language
for prerendering HTML. We could use simple JavaScript template literals,
`lit-html`, JSX, or anything else directly embedded in JavaScript. The advantage
of that is that it greatly simplifies the Starlark layer because everything is
done within the JavaScript language, no plumbing necessary to set it up. We also
have a well-designed and supported JS/TS toolchain in the form of
`ts_library()`, which already implements all the strict deps checks and such
that are expected of a Bazel rule set like this.

As a result, I'm instead pushing forward with `rules_prerender` using a
JavaScript-based templating system rather than a Nunjucks-based one. While a
comprehensive Bazel toolchain for Nunjucks would be really cool, it's just not
worth the effort of implementation without a strong motivating use case.

As a result, this project is stalled and not likely to move forward in any
meaningful fashion.

## Example API

The exact API is not totally nailed down, but this is expected to look something
like:

```BUILD.bazel
# BUILD.bazel
load("@rules_njk//:build_defs.bzl", "njk_template")
load("@npm//@bazel/typescript:index.bzl", "ts_project")

# Compile `about.njk` to `about.html` with data from `:person`.
njk_template(
    name = "about",
    template = "about.njk",
    deps = [":person"],
)

ts_project(
    name = "person",
    srcs = ["person.ts"],
    tsconfig = {}, # ...
)
```

```nunjucks
{# about.njk #}

{# Import a dependency. #}
{% import "person.ts" as person %}

{# Reference the exported symbol of some dependency. #}
Hello, {{ person.name }}!
```

```typescript
// person.ts

// Exported symbols can be used in a template.
export const name: string = 'World';
```
