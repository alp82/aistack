import "vite/client";
import "nitro/vite/types";
import { RunnerManager } from "env-runner";
import { Plugin } from "vite";
import { Nitro, NitroConfig, NitroModule } from "nitro/types";
declare module "vite" {
  interface UserConfig {
    /**
     * Nitro Vite Plugin options.
     */
    nitro?: NitroConfig;
  }
  interface Plugin {
    nitro?: NitroModule;
  }
}
interface NitroPluginConfig extends NitroConfig {
  /**
   * @internal Use preinitialized Nitro instance for the plugin.
   */
  _nitro?: Nitro;
  experimental?: NitroConfig["experimental"] & {
    vite?: {
      /**
       * @experimental Enable `?assets` import proposed by https://github.com/vitejs/vite/discussions/20913
       * @default true
       */
      assetsImport?: boolean;
      /**
       *
       * Invalidate server-only modules and optionally reload the browser when a server-only module is updated.
       *
       * @default true
       */
      serverReload?: boolean;
      /**
       * Additional Vite environment services to register.
       */
      services?: Record<string, ServiceConfig>;
    };
  };
}
interface ServiceConfig {
  entry: string;
}
declare function nitro(pluginConfig?: NitroPluginConfig): Plugin[];
export { type NitroPluginConfig, type ServiceConfig, nitro };