import { promises as fs } from 'fs';
import * as nunjucks from 'nunjucks';
import * as path from 'path';
import yargs from 'yargs';

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
    const { template, output } = yargs(process.argv.slice(2))
            .scriptName('renderer')
            .option('template', {
                type: 'string',
                describe: 'Path to the Nunjucks template file to render',
            })
            .option('output', {
                type: 'string',
                describe: 'Path of the output file to be generated',
            })
            .demandOption([ 'template', 'output' ])
            .argv;

    // Render the template.
    const { dir: templateDir, base: templateName } = path.parse(template);
    nunjucks.configure(templateDir, nunjucksOptions);
    let rendered: string;
    try {
        rendered = nunjucks.render(templateName, {
            name: 'World',
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
