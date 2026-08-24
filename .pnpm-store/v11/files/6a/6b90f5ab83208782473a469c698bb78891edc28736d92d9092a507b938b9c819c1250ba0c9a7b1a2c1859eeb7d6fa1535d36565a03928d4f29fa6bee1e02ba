import { JSX, ReactElement } from 'react';
import { ClientEventBusConfig, TanStackDevtoolsConfig, TanStackDevtoolsPlugin } from '@tanstack/devtools';
type PluginRender = JSX.Element | ((el: HTMLElement, theme: 'dark' | 'light') => JSX.Element);
export type TanStackDevtoolsReactPlugin = Omit<TanStackDevtoolsPlugin, 'render' | 'name'> & {
    /**
     * The render function can be a React element or a function that returns a React element.
     * If it's a function, it will be called to render the plugin, otherwise it will be rendered directly.
     *
     * Example:
     * ```jsx
     *   {
     *     render: () => <CustomPluginComponent />,
     *   }
     * ```
     * or
     * ```jsx
     *   {
     *     render: <CustomPluginComponent />,
     *   }
     * ```
     */
    render: PluginRender;
    /**
     * Name to be displayed in the devtools UI.
     * If a string, it will be used as the plugin name.
     * If a function, it will be called with the mount element.
     *
     * Example:
     * ```jsx
     *   {
     *     name: "Your Plugin",
     *     render: () => <CustomPluginComponent />,
     *   }
     * ```
     * or
     * ```jsx
     *   {
     *     name:  <h1>Your Plugin title</h1>,
     *     render: () => <CustomPluginComponent />,
     *   }
     * ```
     */
    name: string | PluginRender;
};
export interface TanStackDevtoolsReactInit {
    /**
     * Array of plugins to be used in the devtools.
     * Each plugin should have a `render` function that returns a React element or a function
     *
     * Example:
     * ```jsx
     * <TanStackDevtools
     *   plugins={[
     *     {
     *       id: "your-plugin-id",
     *       name: "Your Plugin",
     *       render: <CustomPluginComponent />,
     *     }
     *   ]}
     * />
     * ```
     */
    plugins?: Array<TanStackDevtoolsReactPlugin>;
    /**
     * Configuration for the devtools shell. These configuration options are used to set the
     * initial state of the devtools when it is started for the first time. Afterwards,
     * the settings are persisted in local storage and changed through the settings panel.
     */
    config?: Partial<TanStackDevtoolsConfig>;
    /**
     * Configuration for the TanStack Devtools client event bus.
     */
    eventBusConfig?: ClientEventBusConfig;
}
export declare const TanStackDevtools: ({ plugins, config, eventBusConfig, }: TanStackDevtoolsReactInit) => ReactElement | null;
export {};
