import { jsx } from "react/jsx-runtime";
import { Await, RouterProvider } from "@tanstack/react-router";
import { hydrateStart } from "./hydrateStart.js";
let hydrationPromise;
function StartClient() {
  if (!hydrationPromise) {
    hydrationPromise = hydrateStart();
  }
  return /* @__PURE__ */ jsx(
    Await,
    {
      promise: hydrationPromise,
      children: (router) => /* @__PURE__ */ jsx(RouterProvider, { router })
    }
  );
}
export {
  StartClient
};
//# sourceMappingURL=StartClient.js.map
