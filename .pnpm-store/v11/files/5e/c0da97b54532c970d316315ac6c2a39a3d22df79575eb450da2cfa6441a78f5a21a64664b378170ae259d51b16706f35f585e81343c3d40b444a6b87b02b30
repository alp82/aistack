import { BetterAuthOptions } from "../types/index.mjs";
import * as better_call129 from "better-call";
import { RequestEvent } from "@sveltejs/kit";

//#region src/integrations/svelte-kit.d.ts
declare const toSvelteKitHandler: (auth: {
  handler: (request: Request) => Response | Promise<Response>;
  options: BetterAuthOptions;
}) => (event: {
  request: Request;
}) => Response | Promise<Response>;
declare const svelteKitHandler: ({
  auth,
  event,
  resolve,
  building
}: {
  auth: {
    handler: (request: Request) => Response | Promise<Response>;
    options: BetterAuthOptions;
  };
  event: RequestEvent;
  resolve: (event: RequestEvent) => Response | Promise<Response>;
  building: boolean;
}) => Promise<Response>;
declare function isAuthPath(url: string, options: BetterAuthOptions): boolean;
declare const sveltekitCookies: (getRequestEvent: () => RequestEvent<any, any>) => {
  id: "sveltekit-cookies";
  hooks: {
    after: {
      matcher(): true;
      handler: (inputContext: better_call129.MiddlewareInputContext<better_call129.MiddlewareOptions>) => Promise<void>;
    }[];
  };
};
//#endregion
export { isAuthPath, svelteKitHandler, sveltekitCookies, toSvelteKitHandler };
//# sourceMappingURL=svelte-kit.d.mts.map