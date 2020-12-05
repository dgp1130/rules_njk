def _golden_test_impl(ctx):
    expected_file = ctx.actions.declare_file("%s_expected.txt" % ctx.attr.name)
    ctx.actions.write(expected_file, ctx.attr.expected)

    differ = ctx.actions.declare_file("%s_differ.sh" % ctx.attr.name)
    ctx.actions.write(
        output = differ,
        content = """
            # --- begin runfiles.bash initialization v2 ---
            # Copy-pasted from the Bazel Bash runfiles library v2.
            set -uo pipefail; f=bazel_tools/tools/bash/runfiles/runfiles.bash
            source "${RUNFILES_DIR:-/dev/null}/$f" 2>/dev/null || \\
            source "$(grep -sm1 "^$f " "${RUNFILES_MANIFEST_FILE:-/dev/null}" | cut -f2- -d' ')" 2>/dev/null || \\
            source "$0.runfiles/$f" 2>/dev/null || \\
            source "$(grep -sm1 "^$f " "$0.runfiles_manifest" | cut -f2- -d' ')" 2>/dev/null || \\
            source "$(grep -sm1 "^$f " "$0.exe.runfiles_manifest" | cut -f2- -d' ')" 2>/dev/null || \\
            { echo>&2 "ERROR: cannot find $f"; exit 1; }; f=; set -e
            # --- end runfiles.bash initialization v2 ---

            diff $(rlocation rules_njk/%s) $(rlocation rules_njk/%s)
        """ % (ctx.file.actual.path, expected_file.path),
        is_executable = True,
    )

    runfiles = ctx.runfiles(files = [expected_file, ctx.file.actual])
    print(ctx.attr._bash_runfiles[DefaultInfo].default_runfiles.files.to_list())
    return DefaultInfo(
        executable = differ,
        runfiles = runfiles,
    )

golden2_test = rule(
    implementation = _golden_test_impl,
    executable = True,
    test = True,
    attrs = {
        "actual": attr.label(
            mandatory = True,
            allow_single_file = True,
        ),
        "expected": attr.string(
            mandatory = True,
        ),
        "trim": attr.bool(
            default = True,
            doc = """
                Whether or not to trim both the actual and expected content
                before comparison.
            """,
        ),
        "_bash_runfiles": attr.label(
            default = "@bazel_tools//tools/bash/runfiles",
        ),
    },
)

def golden_test(name, actual, expected, trim = True):
    runner_script = "%s_runner.sh" % name
    native.genrule(
        name = "%s_runner" % name,
        outs = [runner_script],
        cmd = """
            # --- begin runfiles.bash initialization v2 ---
            # Copy-pasted from the Bazel Bash runfiles library v2.
            set -uo pipefail; f=bazel_tools/tools/bash/runfiles/runfiles.bash
            source "$${RUNFILES_DIR:-/dev/null}/$$f" 2>/dev/null || \\
            source "$$(grep -sm1 "^$$f " "$${RUNFILES_MANIFEST_FILE:-/dev/null}" | cut -f2- -d' ')" 2>/dev/null || \\
            source "$$0.runfiles/$$f" 2>/dev/null || \\
            source "$$(grep -sm1 "^$$f " "$$0.runfiles_manifest" | cut -f2- -d' ')" 2>/dev/null || \\
            source "$$(grep -sm1 "^$$f " "$$0.exe.runfiles_manifest" | cut -f2- -d' ')" 2>/dev/null || \\
            { echo>&2 "ERROR: cannot find $$f"; exit 1; }; f=; set -e
            # --- end runfiles.bash initialization v2 ---

            diff "$$(rlocation rules_njk/%s)" <(echo "%s")
        """ % (actual, expected),
    )

    """TODO"""
    native.sh_test(
        name = name,
        srcs = [runner_script],
        args = [actual, expected],
        deps = ["@bazel_tools//tools/bash/runfiles"],
    )
