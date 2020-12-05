"""Implementation of the njk_template() BUILD rule."""

def _njk_template_impl(ctx):
    ctx.actions.run(
        mnemonic = "NjkRender",
        progress_message = "Rendering njk template",
        executable = ctx.executable._renderer,
        inputs = [ctx.file.template],
        outputs = [ctx.outputs.output],
        arguments = [
            '--template', ctx.file.template.path,
            '--output', ctx.outputs.output.path,
        ],
    )

njk_template = rule(
    implementation = _njk_template_impl,
    attrs = {
        "template": attr.label(
            mandatory = True,
            allow_single_file = True,
            doc = "The Nunjucks template file to render.",
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
