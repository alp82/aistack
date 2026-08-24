import { PluginInjection } from '@tanstack/devtools-client';
import { types as Babel } from '@babel/core';
import { ParseResult } from '@babel/parser';
/**
 * Finds the TanStackDevtools component name in the file
 * Handles renamed imports and namespace imports
 */
export declare const findDevtoolsComponentName: (ast: ParseResult<Babel.File>) => string | null;
export declare const transformAndInject: (ast: ParseResult<Babel.File>, injection: PluginInjection, devtoolsComponentName: string) => boolean;
/**
 * Detects if a file contains TanStack devtools import
 */
export declare function detectDevtoolsFile(code: string): boolean;
/**
 * Injects a plugin into the TanStackDevtools component in a file
 * Reads the file, transforms it, and writes it back
 */
export declare function injectPluginIntoFile(filePath: string, injection: PluginInjection): {
    success: boolean;
    error?: string;
};
