import { promises as fs } from 'fs';
import { BazelFsLoader } from './loader';
import { ILoader, LoaderSource } from 'nunjucks';

function getSource(loader: ILoader, name: string): Promise<LoaderSource> {
    return new Promise((resolve, reject) => {
        loader.getSource(name, (err, source) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(source!);
        });
    });
}

describe('loader', () => {
    it('loads source files from the given path', async () => {
        const readFile = jasmine.createSpy('readFile')
                .and.returnValue(Promise.resolve('<div>foo</div>'));

        const loader = BazelFsLoader.from({
            importPaths: [ 'foo/bar.njk' ],
            templatePaths: [ 'bazel-out/k8-fastbuild/bin/foo/bar.njk' ],
            fs: {
                ...fs,
                readFile,
            },
        });

        const source = await getSource(loader, 'foo/bar.njk');

        expect(readFile).toHaveBeenCalledOnceWith(
                'bazel-out/k8-fastbuild/bin/foo/bar.njk', 'utf8');

        expect(source).toEqual({
            src: '<div>foo</div>',
            path: 'foo/bar.njk',
            noCache: false,
        });
    });

    it('throws an error if given import and template path arguments of different lengths', () => {
        expect(() => BazelFsLoader.from({
            // Only one `importPath`.
            importPaths: [ 'first.njk' ],
            // Two `templatePaths`.
            templatePaths: [ 'bazel-bin/first.njk', 'bazel-bin/second.njk' ],
        })).toThrowError(/should be the same length/);
    });

    it('throws an error if the requested path could not be resolved', async () => {
        const loader = BazelFsLoader.from({
            importPaths: [ 'foo.njk' ],
            templatePaths: [ 'foo.njk' ],
        });

        // Requesting `bar.njk` which is not known to `loader`.
        await expectAsync(getSource(loader, 'bar.njk'))
                .toBeRejectedWithError(Error, /was it added as a dependency\?/);
    });

    it('throws an error if the request file could not be read', async () => {
        const error = new Error('Solar flare flipped a bit.');
        const readFile = jasmine.createSpy('readFile')
                .and.returnValue(Promise.reject(error));
        
        const loader = BazelFsLoader.from({
            importPaths: [ 'foo.njk' ],
            templatePaths: [ 'foo.njk' ],
            fs: {
                ...fs,
                readFile,
            },
        });

        await expectAsync(getSource(loader, 'foo.njk')).toBeRejectedWith(error);
    });
});
