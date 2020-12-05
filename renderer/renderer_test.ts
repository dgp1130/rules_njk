import 'jasmine';

import { execFile as execFileCb } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execFile = promisify(execFileCb);

const testTmpDir = process.env['TEST_TMPDIR']!;
if (!testTmpDir) fail('$TEST_TMPDIR not set.');

const runfiles = process.env['RUNFILES']!;
if (!runfiles) fail('$RUNFILES not set.');

const renderer = `${runfiles}/rules_njk/renderer/renderer.sh`;
async function run(template: string, output: string):
        Promise<{ code: number, stdout: string, stderr: string }> {
    try {
        const { stdout, stderr } = await execFile(renderer, [
            '--template', template,
            '--output', output,
        ]);
        return { code: 0, stdout, stderr };
    } catch (err) {
        const { code, stdout, stderr } = err as {
            code: number,
            stdout: string,
            stderr: string,
        };
        return { code, stdout, stderr };
    }
}

describe('renderer', () => {
    let tmpDirPath: string;
    beforeEach(async () => {
        tmpDirPath = await fs.mkdtemp(path.join(testTmpDir, 'renderer-'));
    });
    afterEach(async () => {
        await fs.rmdir(tmpDirPath, { recursive: true });
    });

    it('renders successfully', async () => {
        await fs.writeFile(`${tmpDirPath}/foo.njk`, `
            Hello, {{ name }}!
        `.trim());

        const { code, stdout, stderr } = await run(
            `${tmpDirPath}/foo.njk`,
            `${tmpDirPath}/foo.html`,
        );

        expect(code).toBe(0);

        const generated = await fs.readFile(`${tmpDirPath}/foo.html`, 'utf8');
        expect(generated.trim()).toBe('Hello, World!');

        expect(stdout.trim()).toBe('');
        expect(stderr.trim()).toBe('');
    });

    it('emits an error on render failure', async () => {
        // User accidentally uses a symbol that does not exist.
        await fs.writeFile(`${tmpDirPath}/foo.njk`, `
            Hello, {{ doesNotExist }}!
        `.trim());

        const { code, stdout, stderr } = await run(
            `${tmpDirPath}/foo.njk`,
            `${tmpDirPath}/foo.html`,
        );
        
        expect(code).toBe(1);

        // Output file should not have been created.
        await expectAsync(fs.access(`${tmpDirPath}/foo.html`)).toBeRejected();

        expect(stdout.trim()).toBe('');
        expect(stderr.trim()).toContain('attempted to output null or undefined value');
    });
});
