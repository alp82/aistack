import { initialState } from './chunk/VZEY7HNC.js';
export { PLUGIN_CONTAINER_ID, PLUGIN_TITLE_CONTAINER_ID } from './chunk/VZEY7HNC.js';
import 'solid-js/web';
import 'solid-js';
import '@tanstack/devtools-event-bus/client';

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
    return;
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
