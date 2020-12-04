import { promises as fs } from 'fs';
import * as nunjucks from 'nunjucks';
import * as path from 'path';
import yargs from 'yargs';

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
    nunjucks.configure(templateDir);
    const rendered = nunjucks.render(templateName, {
        name: 'World',
    });

    // Write to the output file location.
    await fs.writeFile(output, rendered);

    return 0;
}

main().then((exitCode) => process.exit(exitCode));
