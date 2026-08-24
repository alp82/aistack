import { ServerFn } from './types.js';
import { CompileStartFrameworkOptions } from '../types.js';
import * as t from '@babel/types';
type Binding = {
    type: 'import';
    source: string;
    importedName: string;
    resolvedKind?: Kind;
} | {
    type: 'var';
    init: t.Expression | null;
    resolvedKind?: Kind;
};
type Kind = 'None' | `Root` | `Builder` | LookupKind;
export type LookupKind = 'ServerFn' | 'Middleware' | 'IsomorphicFn' | 'ServerOnlyFn' | 'ClientOnlyFn' | 'ClientOnlyJSX';
export declare const KindDetectionPatterns: Record<LookupKind, RegExp>;
export declare const LookupKindsPerEnv: Record<'client' | 'server', Set<LookupKind>>;
/**
 * Detects which LookupKinds are present in the code using string matching.
 * This is a fast pre-scan before AST parsing to limit the work done during compilation.
 */
export declare function detectKindsInCode(code: string, env: 'client' | 'server'): Set<LookupKind>;
export type LookupConfig = {
    libName: string;
    rootExport: string;
    kind: LookupKind | 'Root';
};
interface ModuleInfo {
    id: string;
    bindings: Map<string, Binding>;
    exports: Map<string, string>;
    reExportAllSources: Array<string>;
}
export declare class StartCompiler {
    private options;
    private moduleCache;
    private initialized;
    private validLookupKinds;
    private resolveIdCache;
    private exportResolutionCache;
    private knownRootImports;
    private entryIdToFunctionId;
    private functionIds;
    private _rootWithTrailingSlash;
    constructor(options: {
        env: 'client' | 'server';
        envName: string;
        root: string;
        lookupConfigurations: Array<LookupConfig>;
        lookupKinds: Set<LookupKind>;
        loadModule: (id: string) => Promise<void>;
        resolveId: (id: string, importer?: string) => Promise<string | null>;
        /**
         * In 'build' mode, resolution results are cached for performance.
         * In 'dev' mode (default), caching is disabled to avoid invalidation complexity with HMR.
         */
        mode?: 'dev' | 'build';
        /**
         * The framework being used (e.g., 'react', 'solid').
         */
        framework: CompileStartFrameworkOptions;
        /**
         * The Vite environment name for the server function provider.
         */
        providerEnvName: string;
        /**
         * Custom function ID generator (optional, defaults to hash-based).
         */
        generateFunctionId?: (opts: {
            filename: string;
            functionName: string;
        }) => string | undefined;
        /**
         * Callback when server functions are discovered.
         * Called after each file is compiled with its new functions.
         */
        onServerFnsById?: (d: Record<string, ServerFn>) => void;
        /**
         * Returns the currently known server functions from previous builds.
         * Used by server callers to look up canonical extracted filenames.
         */
        getKnownServerFns?: () => Record<string, ServerFn>;
    });
    /**
     * Generates a unique function ID for a server function.
     * In dev mode, uses a base64-encoded JSON with file path and export name.
     * In build mode, uses SHA256 hash or custom generator.
     */
    private generateFunctionId;
    private get mode();
    private get rootWithTrailingSlash();
    private resolveIdCached;
    private getExportResolutionCache;
    private init;
    /**
     * Extracts bindings and exports from an already-parsed AST.
     * This is the core logic shared by ingestModule and ingestModuleFromAst.
     */
    private extractModuleInfo;
    ingestModule({ code, id }: {
        code: string;
        id: string;
    }): {
        info: ModuleInfo;
        ast: import('@tanstack/router-utils').ParseAstResult;
    };
    invalidateModule(id: string): boolean;
    compile({ code, id, detectedKinds, }: {
        code: string;
        id: string;
        /** Pre-detected kinds present in this file. If not provided, all valid kinds are checked. */
        detectedKinds?: Set<LookupKind>;
    }): Promise<import('@tanstack/router-utils').GeneratorResult | null>;
    private resolveIdentifierKind;
    /**
     * Recursively find an export in a module, following `export * from` chains.
     * Returns the module info and binding if found, or undefined if not found.
     */
    private findExportInModule;
    private resolveBindingKind;
    /**
     * Checks if an identifier is a direct import from a known factory library.
     * Returns true for imports like `import { createServerOnlyFn } from '@tanstack/react-start'`
     * or renamed imports like `import { createServerOnlyFn as myFn } from '...'`.
     * Returns false for local variables that hold the result of calling a factory.
     */
    private isKnownFactoryImport;
    private resolveExprKind;
    private resolveCalleeKind;
    private getModuleInfo;
}
export {};
