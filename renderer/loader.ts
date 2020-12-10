import { promises as fsPromises } from 'fs';
import { LoaderSource, Callback, ILoader } from 'nunjucks';

/** Loads source files from Bazel. */
export class BazelFsLoader implements ILoader {
    // Tells Nunjucks to expect loads to be asynchronous.
    public readonly async = true;

    /** Map of import path to file path. */
    private readonly importMap: Map<string, string>;
    private readonly fs: typeof fsPromises;
    public constructor({ importMap, fs }: {
        importMap: Map<string, string>,
        fs: typeof fsPromises,
    }) {
        this.importMap = importMap;
        this.fs = fs;
    }

    /**
     * Factory to create a `BazelFsLoader` for the given paths.
     * 
     * `importPaths` and `templatePaths` are lists of the same length, where
     * each index of `importPaths` maps to a file path at the same index of
     * `templatePaths`.
     */
    public static from({
        importPaths,
        templatePaths,
        fs = fsPromises,
    }: {
        importPaths: string[],
        templatePaths: string[],
        fs?: typeof fsPromises,
    }): BazelFsLoader {
        if (importPaths.length !== templatePaths.length) {
            throw new Error('`importPaths` and `templatePaths` should be the'
                    + ` same length: ${importPaths.length} !== ${
                    templatePaths.length}`)
        }

        const templateMap =
                new Map<string, string>(zip(importPaths, templatePaths));
        return new BazelFsLoader({ importMap: templateMap, fs });
    }

    // Need to declare the synchronous version to get types to check, although
    // such a signature should never be called at runtime.
    public getSource(name: string): LoaderSource;
    public getSource(name: string, cb?: Callback<Error, LoaderSource>):
            LoaderSource|void {
        if (!cb) throw new Error('Expected asynchronous loader call.');

        // Convert a more ergonomic `Promise` API to the required callback.
        this.getSourceAsync(name).then(
            (source) => cb(null, source),
            (error) => cb(error, null),
        );
    }

    /** Load the given source file using `Promises`. */
    private async getSourceAsync(path: string): Promise<LoaderSource> {
        const template = this.resolve(path);
        const src = await this.fs.readFile(template, 'utf8');
        return { src, path, noCache: false };
    }

    /** Resolve the provided path to its real source path to be read. */
    private resolve(importPath: string): string {
        const filePath = this.importMap.get(importPath);
        if (!filePath) throw new Error(`Could not load template ${importPath},`
                + ' was it added as a dependency?');

        return filePath;
    }
}

function* zip<T, R>(first: T[], second: R[]): Iterable<[ T, R ]> {
    for (let i = 0; i < Math.min(first.length, second.length); ++i) {
        yield [ first[i], second[i] ];
    }
}
