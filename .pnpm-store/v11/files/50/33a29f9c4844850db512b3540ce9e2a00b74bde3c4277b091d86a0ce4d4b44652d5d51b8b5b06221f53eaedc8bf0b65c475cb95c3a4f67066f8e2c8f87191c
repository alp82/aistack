import { devtoolsEventClient } from "@tanstack/devtools-client";
import { ServerEventBus } from "@tanstack/devtools-event-bus/server";
import { normalizePath } from "vite";
import chalk from "chalk";
import { handleDevToolsViteRequest, readPackageJson } from "./utils.js";
import { DEFAULT_EDITOR_CONFIG, handleOpenSource } from "./editor.js";
import { removeDevtools } from "./remove-devtools.js";
import { addSourceToJsx } from "./inject-source.js";
import { enhanceConsoleLog } from "./enhance-logs.js";
import { detectDevtoolsFile, injectPluginIntoFile } from "./inject-plugin.js";
import { emitOutdatedDeps, installPackage, addPluginToDevtools } from "./package-manager.js";
const defineDevtoolsConfig = (config) => config;
const devtools = (args) => {
  let port = 5173;
  const logging = args?.logging ?? true;
  const enhancedLogsConfig = args?.enhancedLogs ?? { enabled: true };
  const injectSourceConfig = args?.injectSource ?? { enabled: true };
  const removeDevtoolsOnBuild = args?.removeDevtoolsOnBuild ?? true;
  const serverBusEnabled = args?.eventBusConfig?.enabled ?? true;
  const bus = new ServerEventBus(args?.eventBusConfig);
  let devtoolsFileId = null;
  return [
    {
      enforce: "pre",
      name: "@tanstack/devtools:inject-source",
      apply(config) {
        return config.mode === "development" && injectSourceConfig.enabled;
      },
      transform(code, id) {
        if (id.includes("node_modules") || id.includes("?raw") || id.includes("dist") || id.includes("build"))
          return;
        return addSourceToJsx(code, id, args?.injectSource?.ignore);
      }
    },
    {
      name: "@tanstack/devtools:config",
      enforce: "pre",
      config(_, { command }) {
        if (command !== "serve") {
          return;
        }
      }
    },
    {
      enforce: "pre",
      name: "@tanstack/devtools:custom-server",
      apply(config) {
        return config.mode === "development";
      },
      configureServer(server) {
        if (serverBusEnabled) {
          bus.start();
        }
        server.middlewares.use((req, _res, next) => {
          if (req.socket.localPort && req.socket.localPort !== port) {
            port = req.socket.localPort;
          }
          next();
        });
        if (server.config.server.port) {
          port = server.config.server.port;
        }
        server.httpServer?.on("listening", () => {
          port = server.config.server.port;
        });
        const editor = args?.editor ?? DEFAULT_EDITOR_CONFIG;
        const openInEditor = async (path, lineNum, columnNum) => {
          if (!path) {
            return;
          }
          await editor.open(path, lineNum, columnNum);
        };
        server.middlewares.use(
          (req, res, next) => handleDevToolsViteRequest(req, res, next, (parsedData) => {
            const { data, routine } = parsedData;
            if (routine === "open-source") {
              return handleOpenSource({
                data: { type: data.type, data },
                openInEditor
              });
            }
            return;
          })
        );
      }
    },
    {
      name: "@tanstack/devtools:remove-devtools-on-build",
      apply(config, { command }) {
        return (command !== "serve" || config.mode === "production") && removeDevtoolsOnBuild;
      },
      enforce: "pre",
      transform(code, id) {
        if (id.includes("node_modules") || id.includes("?raw")) return;
        const transform = removeDevtools(code, id);
        if (!transform) return;
        if (logging) {
          console.log(
            `
${chalk.greenBright(`[@tanstack/devtools-vite]`)} Removed devtools code from: ${id.replace(normalizePath(process.cwd()), "")}
`
          );
        }
        return transform;
      }
    },
    {
      name: "@tanstack/devtools:event-client-setup",
      apply(config, { command }) {
        if (process.env.CI || process.env.NODE_ENV !== "development" || command !== "serve")
          return false;
        return config.mode === "development";
      },
      async configureServer() {
        const packageJson = await readPackageJson();
        const outdatedDeps = emitOutdatedDeps().then((deps) => deps);
        devtoolsEventClient.on("install-devtools", async (event) => {
          const result = await installPackage(event.payload.packageName);
          devtoolsEventClient.emit("devtools-installed", {
            packageName: event.payload.packageName,
            success: result.success,
            error: result.error
          });
          if (result.success) {
            const { packageName, pluginName, pluginImport } = event.payload;
            console.log(
              chalk.blueBright(
                `[@tanstack/devtools-vite] Auto-adding ${packageName} to devtools...`
              )
            );
            const injectResult = addPluginToDevtools(
              devtoolsFileId,
              packageName,
              pluginName,
              pluginImport
            );
            if (injectResult.success) {
              devtoolsEventClient.emit("plugin-added", {
                packageName,
                success: true
              });
              const updatedPackageJson = await readPackageJson();
              devtoolsEventClient.emit("package-json-read", {
                packageJson: updatedPackageJson
              });
            }
          }
        });
        devtoolsEventClient.on("add-plugin-to-devtools", (event) => {
          const { packageName, pluginName, pluginImport } = event.payload;
          console.log(
            chalk.blueBright(
              `[@tanstack/devtools-vite] Adding ${packageName} to devtools...`
            )
          );
          const result = addPluginToDevtools(
            devtoolsFileId,
            packageName,
            pluginName,
            pluginImport
          );
          devtoolsEventClient.emit("plugin-added", {
            packageName,
            success: result.success,
            error: result.error
          });
        });
        devtoolsEventClient.on("bump-package-version", async (event) => {
          const {
            packageName,
            devtoolsPackage,
            pluginName,
            minVersion,
            pluginImport
          } = event.payload;
          console.log(
            chalk.blueBright(
              `[@tanstack/devtools-vite] Bumping ${packageName} to version ${minVersion}...`
            )
          );
          const packageWithVersion = minVersion ? `${packageName}@^${minVersion}` : packageName;
          const result = await installPackage(packageWithVersion);
          if (!result.success) {
            console.log(
              chalk.redBright(
                `[@tanstack/devtools-vite] Failed to bump ${packageName}: ${result.error}`
              )
            );
            devtoolsEventClient.emit("devtools-installed", {
              packageName: devtoolsPackage,
              success: false,
              error: result.error
            });
            return;
          }
          console.log(
            chalk.greenBright(
              `[@tanstack/devtools-vite] Successfully bumped ${packageName} to ${minVersion}!`
            )
          );
          if (!devtoolsFileId) {
            console.log(
              chalk.yellowBright(
                `[@tanstack/devtools-vite] Devtools file not found. Skipping auto-injection.`
              )
            );
            devtoolsEventClient.emit("devtools-installed", {
              packageName: devtoolsPackage,
              success: true
            });
            return;
          }
          console.log(
            chalk.blueBright(
              `[@tanstack/devtools-vite] Adding ${devtoolsPackage} to devtools...`
            )
          );
          const injectResult = injectPluginIntoFile(devtoolsFileId, {
            packageName: devtoolsPackage,
            pluginName,
            pluginImport
          });
          if (injectResult.success) {
            console.log(
              chalk.greenBright(
                `[@tanstack/devtools-vite] Successfully added ${devtoolsPackage} to devtools!`
              )
            );
            devtoolsEventClient.emit("plugin-added", {
              packageName: devtoolsPackage,
              success: true
            });
            const updatedPackageJson = await readPackageJson();
            devtoolsEventClient.emit("package-json-read", {
              packageJson: updatedPackageJson
            });
          } else {
            console.log(
              chalk.redBright(
                `[@tanstack/devtools-vite] Failed to add ${devtoolsPackage} to devtools: ${injectResult.error}`
              )
            );
            devtoolsEventClient.emit("plugin-added", {
              packageName: devtoolsPackage,
              success: false,
              error: injectResult.error
            });
          }
        });
        devtoolsEventClient.on("mounted", async () => {
          devtoolsEventClient.emit("outdated-deps-read", {
            outdatedDeps: await outdatedDeps
          });
          devtoolsEventClient.emit("package-json-read", {
            packageJson
          });
        });
      },
      async handleHotUpdate({ file }) {
        if (file.endsWith("package.json")) {
          const newPackageJson = await readPackageJson();
          devtoolsEventClient.emit("package-json-read", {
            packageJson: newPackageJson
          });
          emitOutdatedDeps();
        }
      }
    },
    {
      name: "@tanstack/devtools:better-console-logs",
      enforce: "pre",
      apply(config) {
        return config.mode === "development" && enhancedLogsConfig.enabled;
      },
      transform(code, id) {
        if (id.includes("node_modules") || id.includes("?raw") || id.includes("dist") || id.includes("build") || !code.includes("console."))
          return;
        return enhanceConsoleLog(code, id, port);
      }
    },
    {
      name: "@tanstack/devtools:inject-plugin",
      apply(config, { command }) {
        return config.mode === "development" && command === "serve";
      },
      transform(code, id) {
        if (!devtoolsFileId && detectDevtoolsFile(code)) {
          const [filePath] = id.split("?");
          if (filePath) {
            devtoolsFileId = filePath;
          }
        }
        return void 0;
      }
    }
  ];
};
export {
  defineDevtoolsConfig,
  devtools
};
//# sourceMappingURL=plugin.js.map
