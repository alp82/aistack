/**
 * This file defines a CorsHttpRouter class that extends Convex's HttpRouter.
 * It provides CORS (Cross-Origin Resource Sharing) support for HTTP routes.
 *
 * The CorsHttpRouter:
 * 1. Allows specifying allowed origins for CORS.
 * 2. Overrides the route method to add CORS headers to all non-OPTIONS requests.
 * 3. Automatically adds an OPTIONS route to handle CORS preflight requests.
 * 4. Uses the handleCors helper function to apply CORS headers consistently.
 *
 * This router simplifies the process of making Convex HTTP endpoints
 * accessible to web applications hosted on different domains while
 * maintaining proper CORS configuration.
 */
import { HttpRouter, type RouteSpec } from "convex/server";
export declare const DEFAULT_EXPOSED_HEADERS: string[];
export type CorsConfig = {
    /**
     * Whether to allow credentials in the request.
     * When true, the request can include cookies and authentication headers.
     * @default false
     */
    allowCredentials?: boolean;
    /**
     * An array of allowed origins: what domains are allowed to make requests.
     * For example, ["https://example.com"] would only allow requests from
     * https://example.com.
     * You can also use wildcards to allow all subdomains of a given domain.
     * E.g. ["*.example.com"] would allow requests from:
     * - https://subdomain.example.com
     * - https://example.com
     * @default ["*"]
     */
    allowedOrigins?: string[] | ((req: Request) => Promise<string[]>);
    /**
     * An array of allowed headers: what headers are allowed to be sent in
     * the request.
     * @default ["Content-Type"]
     */
    allowedHeaders?: string[];
    /**
     * An array of exposed headers: what headers are allowed to be sent in
     * the response.
     * Note: if you pass in an empty array, it will not expose any headers.
     * If you want to extend the default exposed headers, you can do so by
     * passing in [...DEFAULT_EXPOSED_HEADERS, ...yourHeaders].
     * @default {@link DEFAULT_EXPOSED_HEADERS}
     */
    exposedHeaders?: string[];
    /**
     * The maximum age of the preflight request in seconds.
     * @default 86400 (1 day)
     */
    browserCacheMaxAge?: number;
    /**
     * Whether to block requests from origins that are not in the allowedOrigins list.
     * @default false
     */
    enforceAllowOrigins?: boolean;
    /**
     * Whether to log debugging information about CORS requests.
     * @default false
     */
    debug?: boolean;
};
export type RouteSpecWithCors = RouteSpec & CorsConfig;
/**
 * An HttpRouter with built in cors support.
 */
export type CorsHttpRouter = {
    http: HttpRouter;
    route: (routeSpec: RouteSpecWithCors) => void;
};
/**
 * Factory function to create a router that adds CORS support to routes.
 * @param allowedOrigins An array of allowed origins for CORS.
 * @returns A function to use instead of http.route when you want CORS.
 */
export declare const corsRouter: (http: HttpRouter, corsConfig?: CorsConfig) => CorsHttpRouter;
export default corsRouter;
//# sourceMappingURL=cors.d.ts.map