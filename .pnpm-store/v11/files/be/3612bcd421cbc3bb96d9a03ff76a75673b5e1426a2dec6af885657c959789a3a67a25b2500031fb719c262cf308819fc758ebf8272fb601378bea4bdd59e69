import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { devtoolsEventClient } from "@tanstack/devtools-client";
import chalk from "chalk";
import { tryParseJson, readPackageJson } from "./utils.js";
import { injectPluginIntoFile } from "./inject-plugin.js";
const getOutdatedCommand = (packageManager) => {
  switch (packageManager) {
    case "yarn":
      return "yarn outdated --json";
    case "pnpm":
      return "pnpm outdated --format json";
    case "bun":
      return "bun outdated --json";
    case "npm":
    default:
      return "npm outdated --json";
  }
};
const addPluginToDevtools = (devtoolsFileId, packageName, pluginName, pluginImport) => {
  if (!devtoolsFileId) {
    const error = "Devtools file not found";
    console.log(
      chalk.yellowBright(
        `[@tanstack/devtools-vite] Could not add plugin. ${error}.`
      )
    );
    return { success: false, error };
  }
  const result = injectPluginIntoFile(devtoolsFileId, {
    packageName,
    pluginName,
    pluginImport
  });
  if (result.success) {
    console.log(
      chalk.greenBright(
        `[@tanstack/devtools-vite] Successfully added ${packageName} to devtools!`
      )
    );
  } else {
    console.log(
      chalk.yellowBright(
        `[@tanstack/devtools-vite] Could not add plugin: ${result.error}`
      )
    );
  }
  return result;
};
const getInstallCommand = (packageManager, packageName) => {
  switch (packageManager) {
    case "yarn":
      return `yarn add -D ${packageName}`;
    case "pnpm":
      return `pnpm add -D ${packageName}`;
    case "bun":
      return `bun add -D ${packageName}`;
    case "npm":
    default:
      return `npm install -D ${packageName}`;
  }
};
const installPackage = async (packageName) => {
  return new Promise((resolve) => {
    const packageManager = detectPackageManager();
    const installCommand = getInstallCommand(packageManager, packageName);
    console.log(
      chalk.blueBright(
        `[@tanstack/devtools-vite] Installing ${packageName}...`
      )
    );
    exec(installCommand, async (installError) => {
      if (installError) {
        console.error(
          chalk.redBright(
            `[@tanstack/devtools-vite] Failed to install ${packageName}:`
          ),
          installError.message
        );
        resolve({
          success: false,
          error: installError.message
        });
        return;
      }
      console.log(
        chalk.greenBright(
          `[@tanstack/devtools-vite] Successfully installed ${packageName}`
        )
      );
      const updatedPackageJson = await readPackageJson();
      devtoolsEventClient.emit("package-json-updated", {
        packageJson: updatedPackageJson
      });
      resolve({ success: true });
    });
  });
};
const detectPackageManager = () => {
  const cwd = process.cwd();
  if (existsSync(join(cwd, "bun.lockb")) || existsSync(join(cwd, "bun.lock"))) {
    return "bun";
  }
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (existsSync(join(cwd, "yarn.lock"))) {
    return "yarn";
  }
  if (existsSync(join(cwd, "package-lock.json"))) {
    return "npm";
  }
  return "pnpm";
};
const emitOutdatedDeps = async () => {
  return await new Promise((resolve) => {
    const packageManager = detectPackageManager();
    const outdatedCommand = getOutdatedCommand(packageManager);
    exec(outdatedCommand, (_, stdout) => {
      if (stdout) {
        const newOutdatedDeps = tryParseJson(stdout);
        if (!newOutdatedDeps) {
          return;
        }
        devtoolsEventClient.emit("outdated-deps-read", {
          outdatedDeps: newOutdatedDeps
        });
        resolve(newOutdatedDeps);
      }
    });
  });
};
export {
  addPluginToDevtools,
  emitOutdatedDeps,
  installPackage
};
//# sourceMappingURL=package-manager.js.map
