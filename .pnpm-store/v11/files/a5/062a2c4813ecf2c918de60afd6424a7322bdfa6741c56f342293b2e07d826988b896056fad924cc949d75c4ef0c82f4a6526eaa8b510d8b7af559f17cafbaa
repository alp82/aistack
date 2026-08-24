"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const react = require("react");
const reactQuery = require("@tanstack/react-query");
const routerSsrQueryCore = require("@tanstack/router-ssr-query-core");
function setupRouterSsrQueryIntegration(opts) {
  routerSsrQueryCore.setupCoreRouterSsrQueryIntegration(opts);
  if (opts.wrapQueryClient === false) {
    return;
  }
  const OGWrap = opts.router.options.Wrap || react.Fragment;
  opts.router.options.Wrap = ({ children }) => {
    return /* @__PURE__ */ jsxRuntime.jsx(reactQuery.QueryClientProvider, { client: opts.queryClient, children: /* @__PURE__ */ jsxRuntime.jsx(OGWrap, { children }) });
  };
}
exports.setupRouterSsrQueryIntegration = setupRouterSsrQueryIntegration;
//# sourceMappingURL=index.cjs.map
