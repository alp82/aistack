import { initialState, DevtoolsProvider, PiPProvider } from './chunk/VZEY7HNC.js';
export { PLUGIN_CONTAINER_ID, PLUGIN_TITLE_CONTAINER_ID } from './chunk/VZEY7HNC.js';
import { render, createComponent, Portal } from 'solid-js/web';
import { lazy } from 'solid-js';
import { ClientEventBus } from '@tanstack/devtools-event-bus/client';

var TanStackDevtoolsCore = class {
  #config = {
    ...initialState.settings
  };
  #plugins = [];
  #isMounted = false;
  #dispose;
  #Component;
  #eventBus;
  #eventBusConfig;
  #setPlugins;
  constructor(init) {
    this.#plugins = init.plugins || [];
    this.#eventBusConfig = init.eventBusConfig;
    this.#config = {
      ...this.#config,
      ...init.config
    };
  }
  mount(el) {
    if (this.#isMounted) {
      throw new Error("Devtools is already mounted");
    }
    const mountTo = el;
    const dispose = render(() => {
      const _self$ = this;
      this.#Component = lazy(() => import('./devtools/7NDEDZB7.js'));
      const Devtools = this.#Component;
      this.#eventBus = new ClientEventBus(this.#eventBusConfig);
      this.#eventBus.start();
      return createComponent(DevtoolsProvider, {
        get plugins() {
          return _self$.#plugins;
        },
        get config() {
          return _self$.#config;
        },
        onSetPlugins: (setPlugins) => {
          _self$.#setPlugins = setPlugins;
        },
        get children() {
          return createComponent(PiPProvider, {
            get children() {
              return createComponent(Portal, {
                mount: mountTo,
                get children() {
                  return createComponent(Devtools, {});
                }
              });
            }
          });
        }
      });
    }, mountTo);
    this.#isMounted = true;
    this.#dispose = dispose;
  }
  unmount() {
    if (!this.#isMounted) {
      throw new Error("Devtools is not mounted");
    }
    this.#eventBus?.stop();
    this.#dispose?.();
    this.#isMounted = false;
  }
  setConfig(config) {
    this.#config = {
      ...this.#config,
      ...config
    };
    if (config.plugins) {
      this.#plugins = config.plugins;
      if (this.#isMounted && this.#setPlugins) {
        this.#setPlugins(config.plugins);
      }
    }
  }
};

export { TanStackDevtoolsCore };
