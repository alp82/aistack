import { Middleware } from "./middleware.cjs";
import { Endpoint } from "./endpoint.cjs";

//#region src/router.d.ts
interface RouterConfig {
  throwError?: boolean;
  onError?: (e: unknown) => void | Promise<void> | Response | Promise<Response>;
  basePath?: string;
  routerMiddleware?: Array<{
    path: string;
    middleware: Middleware;
  }>;
  /**
   * additional Context that needs to passed to endpoints
   *
   * this will be available on `ctx.context` on endpoints
   */
  routerContext?: Record<string, any>;
  /**
   * A callback to run before any response
   */
  onResponse?: (res: Response) => any | Promise<any>;
  /**
   * A callback to run before any request
   */
  onRequest?: (req: Request) => any | Promise<any>;
  /**
   * List of allowed media types (MIME types) for the router
   *
   * if provided, only the media types in the list will be allowed to be passed in the body.
   *
   * If an endpoint has allowed media types, it will override the router's allowed media types.
   *
   * @example
   * ```ts
   * const router = createRouter({
   * 		allowedMediaTypes: ["application/json", "application/x-www-form-urlencoded"],
   * 	})
   */
  allowedMediaTypes?: string[];
  /**
   * Skip trailing slashes
   *
   * @default false
   */
  skipTrailingSlashes?: boolean;
  /**
   * Open API route configuration
   */
  openapi?: {
    /**
     * Disable openapi route
     *
     * @default false
     */
    disabled?: boolean;
    /**
     * A path to display open api using scalar
     *
     * @default "/api/reference"
     */
    path?: string;
    /**
     * Scalar Configuration
     */
    scalar?: {
      /**
       * Title
       * @default "Open API Reference"
       */
      title?: string;
      /**
       * Description
       *
       * @default "Better Call Open API Reference"
       */
      description?: string;
      /**
       * Logo URL
       */
      logo?: string;
      /**
       * Scalar theme
       * @default "saturn"
       */
      theme?: string;
    };
  };
}
declare const createRouter: <E extends Record<string, Endpoint>, Config extends RouterConfig>(endpoints: E, config?: Config) => {
  handler: (request: Request) => Promise<Response>;
  endpoints: E;
};
type Router = ReturnType<typeof createRouter>;
//#endregion
export { Router, RouterConfig, createRouter };
//# sourceMappingURL=router.d.cts.map