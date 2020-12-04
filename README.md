# rules_njk

A library of [Bazel](https://bazel.build/) rules for rendering
[Nunjucks](https://mozilla.github.io/nunjucks/) templates at build-time.

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
    temple = "about.njk",
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
