import { OutdatedDeps } from '@tanstack/devtools-client';
/**
 * Adds a plugin to the devtools configuration file
 */
export declare const addPluginToDevtools: (devtoolsFileId: string | null, packageName: string, pluginName: string, pluginImport?: {
    importName: string;
    type: "jsx" | "function";
}) => {
    success: boolean;
    error?: string;
};
export declare const installPackage: (packageName: string) => Promise<{
    success: boolean;
    error?: string;
}>;
export declare const emitOutdatedDeps: () => Promise<OutdatedDeps | null>;
