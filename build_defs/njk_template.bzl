"""Implementation of the njk_template() BUILD rule."""

_NjkTemplateInfo = provider(
    "Provides information about Nunjucks templates",
    fields = [
        "templates", # depset() of template files.
    ],
)

def _njk_template_impl(ctx):
    templates = depset(
        transitive = [dep[_NjkTemplateInfo].templates for dep in ctx.attr.deps],
    )

    args = ctx.actions.args()
    args.add("--template", ctx.file.template)
    args.add("--output", ctx.outputs.output)
    args.add("--template_tc_import", ctx.file.template)
    args.add("--template_tc_path", ctx.file.template)
    args.add_all(templates, before_each = "--template_tc_import", map_each = _template_short_path)
    args.add_all(templates, before_each = "--template_tc_path")
    ctx.actions.run(
        mnemonic = "NjkRender",
        progress_message = "Rendering njk template",
        executable = ctx.executable._renderer,
        inputs = depset([ctx.file.template], transitive = [templates]),
        outputs = [ctx.outputs.output],
        arguments = [args],
    )

    return _NjkTemplateInfo(
        templates = depset([ctx.file.template],
            transitive = [dep[_NjkTemplateInfo].templates for dep in ctx.attr.deps],
        ),
    )

njk_template = rule(
    implementation = _njk_template_impl,
    attrs = {
        "template": attr.label(
            mandatory = True,
            allow_single_file = True,
            doc = "The Nunjucks template file to render.",
        ),
        "deps": attr.label_list(
            default = [],
            doc = "`njk_template()` dependencies to import in this template.",
            providers = [_NjkTemplateInfo],
        ),
        "_renderer": attr.label(
            default = "//renderer",
            executable = True,
            cfg = "exec",
        ),
    },
    outputs = {
        "output": "%{name}.html",
    },
    doc = """
        Renders the given Nunjucks template file and outputs the result at
        "%{name}.html".
    """,
)

def _template_short_path(template):
    return template.short_path
