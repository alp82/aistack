import { createMiddleware } from "./createMiddleware.js";
function dedupeSerializationAdapters(deduped, serializationAdapters) {
  for (let i = 0, len = serializationAdapters.length; i < len; i++) {
    const current = serializationAdapters[i];
    if (!deduped.has(current)) {
      deduped.add(current);
      if (current.extends) {
        dedupeSerializationAdapters(deduped, current.extends);
      }
    }
  }
}
const createStart = (getOptions) => {
  return {
    getOptions: async () => {
      const options = await getOptions();
      if (options.serializationAdapters) {
        const deduped = /* @__PURE__ */ new Set();
        dedupeSerializationAdapters(
          deduped,
          options.serializationAdapters
        );
        options.serializationAdapters = Array.from(deduped);
      }
      return options;
    },
    createMiddleware
  };
};
export {
  createStart
};
//# sourceMappingURL=createStart.js.map
