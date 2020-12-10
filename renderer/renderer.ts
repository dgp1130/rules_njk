import { promises as fs } from 'fs';
import * as nunjucks from 'nunjucks';
import yargs from 'yargs';
import { BazelFsLoader } from './loader';

const nunjucksOptions: nunjucks.ConfigureOptions = {
    autoescape: true,
    throwOnUndefined: true,
};

class RenderError extends Error {
    public constructor(cause: Error) {
        super(cause.message);
    }
}

async function main(): Promise<number> {
    // Process command line arguments.
    const {
        template,
        output,
        template_tc_import: importPaths,
        template_tc_path: templatePaths,
    } = yargs(process.argv.slice(2))
            .scriptName('renderer')
            .usage(`
Renders the template given a \`--template\` file to render and an \`--output\`
path to write to as well as import and path strings of transitive dependency
templates.

Example: 
./$0 --template foo.njk --output output.html \\
    --template_tc_import foo.njk \\
    --template_tc_import somewhere/first.njk \\
    --template_tc_import somewhere/second.njk \\
    --template_tc_path foo.njk \\
    --template_tc_path somewhere/first.njk \\
    --template_tc_path bazel-bin/somewhere/second.njk

This will render \`./foo.njk\` and write the output to \`./output.html\`. If any
template imports \`somewhere/first.njk\`, it will use the file at
\`./somewhere/first.njk\`. If any template imports \`somewhere/second.njk\`, it
will use the file at \`bazel-bin/somewhere/second.njk\`. This association is
done by order. The first \`--template_tc_import\` maps to the first
\`--template_tc_path\` and so on.
            `.trim())
            .option('template', {
                type: 'string',
                describe: 'Path to the Nunjucks template file to render',
            })
            .option('output', {
                type: 'string',
                describe: 'Path of the output file to be generated',
            })
            .option('template_tc_import', {
                type: 'array',
                describe: 'The import string of a template file to map to a'
                        + ' path in `template_tc_paths` within the transitive'
                        + ' closure of dependencies of the rendered template'
                        + ' file',
                default: [] as string[],
            })
            .option('template_tc_path', {
                type: 'array',
                describe: 'The file path of a template file imported at the'
                        + ' same index as `template_tc_import` within the'
                        + ' transitive closure of dependencies of the rendered'
                        + ' template file',
                default: [] as string[],
            })
            .demandOption([ 'template', 'output' ])
            .argv;

    // Render the template.
    const loader = BazelFsLoader.from({ importPaths, templatePaths });
    const env = new nunjucks.Environment(loader, nunjucksOptions);
    const args = { name: 'World' };
    let rendered: string;
    try {
        rendered = await new Promise((resolve, reject) => {
            env.render(template, args, (err, str) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(str!);
            });
        });
    } catch (err) {
        throw new RenderError(err);
    }

    // Write to the output file location.
    await fs.writeFile(output, rendered);

    return 0;
}

main().then((exitCode) => process.exit(exitCode), (err) => {
    if (err instanceof RenderError) {
        // Render errors are from bad input, show a nice message.
        console.error(err.message);
        process.exit(1);
    } else {
        // Non-render errors are a tooling failure, give a full stack trace.
        throw err;
    }
});
