import { join } from "pathe";
import { VITE_ENVIRONMENT_NAMES } from "./constants.js";
function getClientOutputDirectory(userConfig) {
  return getOutputDirectory(userConfig, VITE_ENVIRONMENT_NAMES.client, "client");
}
function getServerOutputDirectory(userConfig) {
  return getOutputDirectory(userConfig, VITE_ENVIRONMENT_NAMES.server, "server");
}
function getOutputDirectory(userConfig, environmentName, directoryName) {
  const rootOutputDirectory = userConfig.build?.outDir ?? "dist";
  return userConfig.environments?.[environmentName]?.build?.outDir ?? join(rootOutputDirectory, directoryName);
}
export {
  getClientOutputDirectory,
  getServerOutputDirectory
};
//# sourceMappingURL=output-directory.js.map
