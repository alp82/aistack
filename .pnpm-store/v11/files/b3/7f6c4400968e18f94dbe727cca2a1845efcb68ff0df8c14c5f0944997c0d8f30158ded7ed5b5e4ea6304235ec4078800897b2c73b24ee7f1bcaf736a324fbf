import { ClientEventBusConfig } from '@tanstack/devtools-event-bus/client';
export { ClientEventBusConfig } from '@tanstack/devtools-event-bus/client';
import * as solid_js from 'solid-js';

declare const PLUGIN_CONTAINER_ID = "plugin-container";
declare const PLUGIN_TITLE_CONTAINER_ID = "plugin-title-container";

declare const tabs: readonly [{
    readonly name: "Plugins";
    readonly id: "plugins";
    readonly component: () => solid_js.JSX.Element;
    readonly icon: () => solid_js.JSX.Element;
}, {
    readonly name: "SEO";
    readonly id: "seo";
    readonly component: () => solid_js.JSX.Element;
    readonly icon: () => solid_js.JSX.Element;
}, {
    readonly name: "Settings";
    readonly id: "settings";
    readonly component: () => solid_js.JSX.Element;
    readonly icon: () => solid_js.JSX.Element;
}];
type TabName = (typeof tabs)[number]['id'];

type ModifierKey = 'Alt' | 'Control' | 'Meta' | 'Shift';
type KeyboardKey = ModifierKey | (string & {});
type TriggerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'middle-left' | 'middle-right';
type DevtoolsStore = {
    settings: {
        /**
         * Whether the dev tools should be open by default
         * @default false
         */
        defaultOpen: boolean;
        /**
         * Whether the dev tools trigger should be hidden until the user hovers over it
         * @default false
         */
        hideUntilHover: boolean;
        /**
         * The position of the trigger button
         * @default "bottom-right"
         */
        position: TriggerPosition;
        /**
         * The location of the panel once it is open
         * @default "bottom"
         */
        panelLocation: 'top' | 'bottom';
        /**
         * The hotkey to open the dev tools
         * @default "shift+a"
         */
        openHotkey: Array<KeyboardKey>;
        /**
         * Whether to require the URL flag to open the dev tools
         * @default false
         */
        requireUrlFlag: boolean;
        /**
         * The URL flag to open the dev tools, used in conjunction with requireUrlFlag (if set to true)
         * @default "tanstack-devtools"
         */
        urlFlag: string;
        /**
         * The theme of the dev tools
         * @default "dark"
         */
        theme: 'light' | 'dark';
        /**
         * The image used for the dev tools trigger
         * @default TanStackLogo
         */
        triggerImage: string;
        /**
         * Whether the trigger should be completely hidden or not (you can still open with the hotkey)
         */
        triggerHidden?: boolean;
    };
    state: {
        activeTab: TabName;
        height: number;
        activePlugins: Array<string>;
        persistOpen: boolean;
    };
    plugins?: Array<TanStackDevtoolsPlugin>;
};

interface TanStackDevtoolsPlugin {
    /**
     * Name to be displayed in the devtools UI.
     * If a string, it will be used as the plugin name.
     * If a function, it will be called with the mount element.
     *
     * Example:
     * ```ts
     *   {
     *     // If a string, it will be used as the plugin name
     *     name: "Your Plugin",
     *     render: () => {}
     *   }
     * ```
     * or
     *
     * ```ts
     *   {
     *     // If a function, it will be called with the mount element
     *     name: (el) => {
     *       el.innerText = "Your Plugin Name"
     *       // Your name logic here
     *     },
     *     render: () => {}
     *   }
     * ```
     */
    name: string | ((el: HTMLHeadingElement, theme: DevtoolsStore['settings']['theme']) => void);
    /**
     * Unique identifier for the plugin.
     * If not provided, it will be generated based on the name.
     */
    id?: string;
    /**
     * Whether the plugin should be open by default when there are no active plugins.
     * If true, this plugin will be added to activePlugins on initial load when activePlugins is empty.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Render the plugin UI by using the provided element. This function will be called
     * when the plugin tab is clicked and expected to be mounted.
     * @param el The mount element for the plugin.
     * @returns void
     *
     * Example:
     * ```ts
     *   render: (el) => {
     *     el.innerHTML = "<h1>Your Plugin</h1>"
     *   }
     * ```
     */
    render: (el: HTMLDivElement, theme: DevtoolsStore['settings']['theme']) => void;
}
type TanStackDevtoolsConfig = DevtoolsStore['settings'];

interface TanStackDevtoolsInit {
    /**
     * Configuration for the devtools shell. These configuration options are used to set the
     * initial state of the devtools when it is started for the first time. Afterwards,
     * the settings are persisted in local storage and changed through the settings panel.
     */
    config?: Partial<TanStackDevtoolsConfig>;
    /**
     * Array of plugins to be used in the devtools.
     * Each plugin has a `render` function that gives you the dom node to mount into
     *
     * Example:
     * ```ts
     *  const devtools = new TanStackDevtoolsCore({
     *    plugins: [
     *      {
     *        id: "your-plugin-id",
     *        name: "Your Plugin",
     *        render: (el) => {
     *          // Your render logic here
     *        },
     *      },
     *    ],
     *  })
     * ```
     */
    plugins?: Array<TanStackDevtoolsPlugin>;
    eventBusConfig?: ClientEventBusConfig;
}
declare class TanStackDevtoolsCore {
    #private;
    constructor(init: TanStackDevtoolsInit);
    mount<T extends HTMLElement>(el: T): void;
    unmount(): void;
    setConfig(config: Partial<TanStackDevtoolsInit>): void;
}

export { PLUGIN_CONTAINER_ID, PLUGIN_TITLE_CONTAINER_ID, type TanStackDevtoolsConfig, TanStackDevtoolsCore, type TanStackDevtoolsInit, type TanStackDevtoolsPlugin };
