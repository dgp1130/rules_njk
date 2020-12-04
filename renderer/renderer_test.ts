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
async function run(template: string):
        Promise<{ stdout: string, stderr: string }> {
    return await execFile(renderer, [ '--template', template ]);
}

describe('renderer', () => {
    let tmpDirPath: string;
    beforeEach(async () => {
        tmpDirPath = await fs.mkdtemp(path.join(testTmpDir, 'renderer-'));
    });
    afterEach(async () => {
        await fs.rmdir(tmpDirPath, { recursive: true });
    });

    it('renders', async () => {
        await fs.writeFile(`${tmpDirPath}/foo.njk`, `
            Hello, {{ name }}!
        `.trim());

        const { stdout } = await run(`${tmpDirPath}/foo.njk`);
        
        expect(stdout.trim()).toBe('Hello, World!');
    });
});
