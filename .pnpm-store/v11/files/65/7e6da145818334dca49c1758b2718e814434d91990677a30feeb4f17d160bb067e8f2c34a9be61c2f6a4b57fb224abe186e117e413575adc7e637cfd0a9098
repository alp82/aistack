import { defaultSerovalPlugins, makeSerovalPlugin } from "@tanstack/router-core";
import { getStartOptions } from "./getStartOptions.js";
function getDefaultSerovalPlugins() {
  const start = getStartOptions();
  const adapters = start?.serializationAdapters;
  return [
    ...adapters?.map(makeSerovalPlugin) ?? [],
    ...defaultSerovalPlugins
  ];
}
export {
  getDefaultSerovalPlugins
};
//# sourceMappingURL=getDefaultSerovalPlugins.js.map
