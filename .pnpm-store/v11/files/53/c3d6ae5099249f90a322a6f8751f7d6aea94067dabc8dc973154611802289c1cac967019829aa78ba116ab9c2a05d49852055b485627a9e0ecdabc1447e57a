import { jsx } from "react/jsx-runtime";
import { Fragment } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { setupCoreRouterSsrQueryIntegration } from "@tanstack/router-ssr-query-core";
function setupRouterSsrQueryIntegration(opts) {
  setupCoreRouterSsrQueryIntegration(opts);
  if (opts.wrapQueryClient === false) {
    return;
  }
  const OGWrap = opts.router.options.Wrap || Fragment;
  opts.router.options.Wrap = ({ children }) => {
    return /* @__PURE__ */ jsx(QueryClientProvider, { client: opts.queryClient, children: /* @__PURE__ */ jsx(OGWrap, { children }) });
  };
}
export {
  setupRouterSsrQueryIntegration
};
//# sourceMappingURL=index.js.map
