import { jsx } from "react/jsx-runtime";
import { defineHandlerCallback, renderRouterToString } from "@tanstack/react-router/ssr/server";
import { StartServer } from "./StartServer.js";
const defaultRenderHandler = defineHandlerCallback(
  ({ router, responseHeaders }) => renderRouterToString({
    router,
    responseHeaders,
    children: /* @__PURE__ */ jsx(StartServer, { router })
  })
);
export {
  defaultRenderHandler
};
//# sourceMappingURL=defaultRenderHandler.js.map
