import { Plugin } from 'vite';
import { EditorConfig } from './editor.js';
import { ServerEventBusConfig } from '@tanstack/devtools-event-bus/server';
export type TanStackDevtoolsViteConfig = {
    /**
     * Configuration for the editor integration. Defaults to opening in VS code
     */
    editor?: EditorConfig;
    /**
     * The configuration options for the server event bus
     */
    eventBusConfig?: ServerEventBusConfig & {
        /**
         * Should the server event bus be enabled or not
         * @default true
         */
        enabled?: boolean;
    };
    /**
     * Configuration for enhanced logging.
     */
    enhancedLogs?: {
        /**
         * Whether to enable enhanced logging.
         * @default true
         */
        enabled: boolean;
    };
    /**
     * Whether to remove devtools from the production build.
     * @default true
     */
    removeDevtoolsOnBuild?: boolean;
    /**
     * Whether to log information to the console.
     * @default true
     */
    logging?: boolean;
    /**
     * Configuration for source injection.
     */
    injectSource?: {
        /**
         * Whether to enable source injection via data-tsd-source.
         * @default true
         */
        enabled: boolean;
        /**
         * List of files or patterns to ignore for source injection.
         */
        ignore?: {
            files?: Array<string | RegExp>;
            components?: Array<string | RegExp>;
        };
    };
};
export declare const defineDevtoolsConfig: (config: TanStackDevtoolsViteConfig) => TanStackDevtoolsViteConfig;
export declare const devtools: (args?: TanStackDevtoolsViteConfig) => Array<Plugin>;
