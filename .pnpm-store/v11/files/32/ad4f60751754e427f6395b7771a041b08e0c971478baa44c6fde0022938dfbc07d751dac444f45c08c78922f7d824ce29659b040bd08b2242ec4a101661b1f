import { GenericEndpointContext } from "@better-auth/core";
import * as better_call974 from "better-call";

//#region src/api/middlewares/origin-check.d.ts

/**
 * A middleware to validate callbackURL and origin against trustedOrigins.
 * Also handles CSRF protection using Fetch Metadata for first-login scenarios.
 */
declare const originCheckMiddleware: (inputContext: better_call974.MiddlewareInputContext<better_call974.MiddlewareOptions>) => Promise<void>;
declare const originCheck: (getValue: (ctx: GenericEndpointContext) => string | string[]) => (inputContext: better_call974.MiddlewareInputContext<better_call974.MiddlewareOptions>) => Promise<void>;
/**
 * Middleware for CSRF protection using Fetch Metadata headers.
 * This prevents cross-site navigation login attacks while supporting progressive enhancement.
 */
declare const formCsrfMiddleware: (inputContext: better_call974.MiddlewareInputContext<better_call974.MiddlewareOptions>) => Promise<void>;
//#endregion
export { formCsrfMiddleware, originCheck, originCheckMiddleware };
//# sourceMappingURL=origin-check.d.mts.map