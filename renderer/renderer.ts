import * as nunjucks from 'nunjucks';
import * as path from 'path';
import yargs from 'yargs';

const { template } = yargs(process.argv.slice(2))
    .scriptName('renderer')
    .option('template', {
        type: 'string',
        describe: 'Path to the Nunjucks template file to render',
    })
    .demandOption(['template'])
    .argv;

const { dir: templateDir, base: templateName } = path.parse(template);
nunjucks.configure(templateDir);
console.log(nunjucks.render(templateName, {
    name: 'World',
}));
