import { hydrate } from "@tanstack/router-core/ssr/client";
import { ServerFunctionSerializationAdapter } from "./ServerFunctionSerializationAdapter.js";
import { getRouter } from "#tanstack-router-entry";
import { startInstance } from "#tanstack-start-entry";
async function hydrateStart() {
  const router = await getRouter();
  let serializationAdapters;
  if (startInstance) {
    const startOptions = await startInstance.getOptions();
    startOptions.serializationAdapters = startOptions.serializationAdapters ?? [];
    window.__TSS_START_OPTIONS__ = startOptions;
    serializationAdapters = startOptions.serializationAdapters;
    router.options.defaultSsr = startOptions.defaultSsr;
  } else {
    serializationAdapters = [];
    window.__TSS_START_OPTIONS__ = {
      serializationAdapters
    };
  }
  serializationAdapters.push(ServerFunctionSerializationAdapter);
  if (router.options.serializationAdapters) {
    serializationAdapters.push(...router.options.serializationAdapters);
  }
  router.update({
    basepath: process.env.TSS_ROUTER_BASEPATH,
    ...{ serializationAdapters }
  });
  if (!router.state.matches.length) {
    await hydrate(router);
  }
  return router;
}
export {
  hydrateStart
};
//# sourceMappingURL=hydrateStart.js.map
