/**
 * This file contains a helper class for integrating Convex with Hono.
 *
 * See the [guide on Stack](https://stack.convex.dev/hono-with-convex)
 * for tips on using Hono for HTTP endpoints.
 *
 * To use this helper, create a new Hono app in convex/http.ts like so:
 * ```ts
 * import { Hono } from "hono";
 * import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
 * import { ActionCtx } from "./_generated/server";
 *
 * const app: HonoWithConvex<ActionCtx> = new Hono();
 *
 * app.get("/", async (c) => {
 *   return c.json("Hello world!");
 * });
 *
 * export default new HttpRouterWithHono(app);
 * ```
 */
import type { PublicHttpAction, RoutableMethod, GenericActionCtx } from "convex/server";
import { HttpRouter } from "convex/server";
import { Hono } from "hono";
export { Hono };
/**
 * Hono uses the `FetchEvent` type internally, which has to do with service workers
 * and isn't included in the Convex tsconfig.
 *
 * As a workaround, define this type here so Hono + Convex compiles.
 */
declare global {
    type FetchEvent = any;
}
/**
 * A type representing a Hono app with `c.env` containing Convex's
 * `HttpEndpointCtx` (e.g. `c.env.runQuery` is valid).
 */
export type HonoWithConvex<ActionCtx extends GenericActionCtx<any>> = Hono<{
    Bindings: {
        [Name in keyof ActionCtx]: ActionCtx[Name];
    };
}>;
/**
 * An implementation of the Convex `HttpRouter` that integrates with Hono by
 * overridding `getRoutes` and `lookup`.
 *
 * This defers all routing and request handling to the provided Hono app, and
 * passes along the Convex `HttpEndpointCtx` to the Hono handlers as part of
 * `env`.
 *
 * It will attempt to log each request with the most specific Hono route it can
 * find. For example,
 *
 * ```
 * app.on("GET", "*", ...)
 * app.on("GET", "/profile/:userId", ...)
 *
 * const http = new HttpRouterWithHono(app);
 * http.lookup("/profile/abc", "GET") // [handler, "GET", "/profile/:userId"]
 * ```
 *
 * An example `convex/http.ts` file would look like this:
 * ```
 * const app: HonoWithConvex = new Hono();
 *
 * // add Hono routes on `app`
 *
 * export default new HttpRouterWithHono(app);
 * ```
 */
export declare class HttpRouterWithHono<ActionCtx extends GenericActionCtx<any>> extends HttpRouter {
    private _app;
    private _handler;
    private _handlerInfoCache;
    constructor(app: HonoWithConvex<ActionCtx>);
    /**
     * Returns a list of routed HTTP endpoints.
     *
     * These are used to populate the list of routes shown in the Functions page of the Convex dashboard.
     *
     * @returns - an array of [path, method, endpoint] tuples.
     */
    getRoutes: () => [string, "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "PATCH", PublicHttpAction][];
    /**
     * Returns the appropriate HTTP endpoint and its routed request path and method.
     *
     * The path and method returned are used for logging and metrics, and should
     * match up with one of the routes returned by `getRoutes`.
     *
     * For example,
     *
     * ```js
     * http.route({ pathPrefix: "/profile/", method: "GET", handler: getProfile});
     *
     * http.lookup("/profile/abc", "GET") // returns [getProfile, "GET", "/profile/*"]
     *```
     *
     * @returns - a tuple [PublicHttpEndpoint, method, path] or null.
     */
    lookup: (path: string, method: RoutableMethod | "HEAD") => readonly [PublicHttpAction, "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "PATCH", string];
}
export declare function normalizeMethod(method: RoutableMethod | "HEAD"): RoutableMethod;
//# sourceMappingURL=hono.d.ts.map