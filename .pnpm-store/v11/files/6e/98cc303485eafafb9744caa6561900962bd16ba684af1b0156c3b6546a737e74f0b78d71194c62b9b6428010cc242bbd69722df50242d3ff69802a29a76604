import { Prettify } from "./helper.cjs";
import { StandardSchemaV1 } from "./standard-schema.cjs";
import { APIError, Status, statusCodes } from "./error.cjs";
import { CookieOptions, CookiePrefixOptions } from "./cookies.cjs";
import { InferBody, InferHeaders, InferMethod, InferParam, InferQuery, InferRequest, InferUse, InputContext } from "./context.cjs";
import { Middleware } from "./middleware.cjs";
import { OpenAPIParameter, OpenAPISchemaType } from "./openapi.cjs";

//#region src/endpoint.d.ts
interface EndpointBaseOptions {
  /**
   * Query Schema
   */
  query?: StandardSchemaV1;
  /**
   * Error Schema
   */
  error?: StandardSchemaV1;
  /**
   * If true headers will be required to be passed in the context
   */
  requireHeaders?: boolean;
  /**
   * If true request object will be required
   */
  requireRequest?: boolean;
  /**
   * Clone the request object from the router
   */
  cloneRequest?: boolean;
  /**
   * If true the body will be undefined
   */
  disableBody?: boolean;
  /**
   * Endpoint metadata
   */
  metadata?: {
    /**
     * Open API definition
     */
    openapi?: {
      summary?: string;
      description?: string;
      tags?: string[];
      operationId?: string;
      parameters?: OpenAPIParameter[];
      requestBody?: {
        content: {
          "application/json": {
            schema: {
              type?: OpenAPISchemaType;
              properties?: Record<string, any>;
              required?: string[];
              $ref?: string;
            };
          };
        };
      };
      responses?: {
        [status: string]: {
          description: string;
          content?: {
            "application/json"?: {
              schema: {
                type?: OpenAPISchemaType;
                properties?: Record<string, any>;
                required?: string[];
                $ref?: string;
              };
            };
            "text/plain"?: {
              schema?: {
                type?: OpenAPISchemaType;
                properties?: Record<string, any>;
                required?: string[];
                $ref?: string;
              };
            };
            "text/html"?: {
              schema?: {
                type?: OpenAPISchemaType;
                properties?: Record<string, any>;
                required?: string[];
                $ref?: string;
              };
            };
          };
        };
      };
    };
    /**
     * Infer body and query type from ts interface
     *
     * useful for generic and dynamic types
     *
     * @example
     * ```ts
     * const endpoint = createEndpoint("/path", {
     * 		method: "POST",
     * 		body: z.record(z.string()),
     * 		$Infer: {
     * 			body: {} as {
     * 				type: InferTypeFromOptions<Option> // custom type inference
     * 			}
     * 		}
     * 	}, async(ctx)=>{
     * 		const body = ctx.body
     * 	})
     * ```
     */
    $Infer?: {
      /**
       * Body
       */
      body?: any;
      /**
       * Query
       */
      query?: Record<string, any>;
    };
    /**
     * If enabled, endpoint won't be exposed over a router
     * @deprecated Use path-less endpoints instead
     */
    SERVER_ONLY?: boolean;
    /**
     * If enabled, endpoint won't be exposed as an action to the client
     * @deprecated Use path-less endpoints instead
     */
    isAction?: boolean;
    /**
     * Defines the places where the endpoint will be available
     *
     * Possible options:
     * - `rpc` - the endpoint is exposed to the router, can be invoked directly and is available to the client
     * - `server` - the endpoint is exposed to the router, can be invoked directly, but is not available to the client
     * - `http` - the endpoint is only exposed to the router
     * @default "rpc"
     */
    scope?: "rpc" | "server" | "http";
    /**
     * List of allowed media types (MIME types) for the endpoint
     *
     * if provided, only the media types in the list will be allowed to be passed in the body
     *
     * @example
     * ```ts
     * const endpoint = createEndpoint("/path", {
     * 		method: "POST",
     * 		allowedMediaTypes: ["application/json", "application/x-www-form-urlencoded"],
     * 	}, async(ctx)=>{
     * 		const body = ctx.body
     * 	})
     * ```
     */
    allowedMediaTypes?: string[];
    /**
     * Extra metadata
     */
    [key: string]: any;
  };
  /**
   * List of middlewares to use
   */
  use?: Middleware[];
  /**
   * A callback to run before any API error is throw or returned
   *
   * @param e - The API error
   * @returns - The response to return
   */
  onAPIError?: (e: APIError) => void | Promise<void>;
  /**
   * A callback to run before a validation error is thrown
   * You can customize the validation error message by throwing your own APIError
   */
  onValidationError?: ({
    issues,
    message
  }: {
    message: string;
    issues: readonly StandardSchemaV1.Issue[];
  }) => void | Promise<void>;
}
type EndpointBodyMethodOptions = {
  /**
   * Request Method
   */
  method: "POST" | "PUT" | "DELETE" | "PATCH" | ("POST" | "PUT" | "DELETE" | "PATCH")[];
  /**
   * Body Schema
   */
  body?: StandardSchemaV1;
} | {
  /**
   * Request Method
   */
  method: "GET" | "HEAD" | ("GET" | "HEAD")[];
  /**
   * Body Schema
   */
  body?: never;
} | {
  /**
   * Request Method
   */
  method: "*";
  /**
   * Body Schema
   */
  body?: StandardSchemaV1;
} | {
  /**
   * Request Method
   */
  method: ("POST" | "PUT" | "DELETE" | "PATCH" | "GET" | "HEAD")[];
  /**
   * Body Schema
   */
  body?: StandardSchemaV1;
};
type EndpointOptions = EndpointBaseOptions & EndpointBodyMethodOptions;
type EndpointContext<Path extends string, Options extends EndpointOptions, Context = {}> = {
  /**
   * Method
   *
   * The request method
   */
  method: InferMethod<Options>;
  /**
   * Path
   *
   * The path of the endpoint
   */
  path: Path;
  /**
   * Body
   *
   * The body object will be the parsed JSON from the request and validated
   * against the body schema if it exists.
   */
  body: InferBody<Options>;
  /**
   * Query
   *
   * The query object will be the parsed query string from the request
   * and validated against the query schema if it exists
   */
  query: InferQuery<Options>;
  /**
   * Params
   *
   * If the path is `/user/:id` and the request is `/user/1` then the params will
   * be `{ id: "1" }` and if the path includes a wildcard like `/user/*` then the
   * params will be `{ _: "1" }` where `_` is the wildcard key. If the wildcard
   * is named like `/user/**:name` then the params will be `{ name: string }`
   */
  params: InferParam<Path>;
  /**
   * Request object
   *
   * If `requireRequest` is set to true in the endpoint options this will be
   * required
   */
  request: InferRequest<Options>;
  /**
   * Headers
   *
   * If `requireHeaders` is set to true in the endpoint options this will be
   * required
   */
  headers: InferHeaders<Options>;
  /**
   * Set header
   *
   * If it's called outside of a request it will just be ignored.
   */
  setHeader: (key: string, value: string) => void;
  /**
   * Set the response status code
   */
  setStatus: (status: Status) => void;
  /**
   * Get header
   *
   * If it's called outside of a request it will just return null
   *
   * @param key  - The key of the header
   * @returns
   */
  getHeader: (key: string) => string | null;
  /**
   * Get a cookie value from the request
   *
   * @param key - The key of the cookie
   * @param prefix - The prefix of the cookie between `__Secure-` and `__Host-`
   * @returns - The value of the cookie
   */
  getCookie: (key: string, prefix?: CookiePrefixOptions) => string | null;
  /**
   * Get a signed cookie value from the request
   *
   * @param key - The key of the cookie
   * @param secret - The secret of the signed cookie
   * @param prefix - The prefix of the cookie between `__Secure-` and `__Host-`
   * @returns - The value of the cookie or null if the cookie is not found or false if the signature is invalid
   */
  getSignedCookie: (key: string, secret: string, prefix?: CookiePrefixOptions) => Promise<string | null | false>;
  /**
   * Set a cookie value in the response
   *
   * @param key - The key of the cookie
   * @param value - The value to set
   * @param options - The options of the cookie
   * @returns - The cookie string
   */
  setCookie: (key: string, value: string, options?: CookieOptions) => string;
  /**
   * Set signed cookie
   *
   * @param key - The key of the cookie
   * @param value  - The value to set
   * @param secret - The secret to sign the cookie with
   * @param options - The options of the cookie
   * @returns - The cookie string
   */
  setSignedCookie: (key: string, value: string, secret: string, options?: CookieOptions) => Promise<string>;
  /**
   * JSON
   *
   * a helper function to create a JSON response with
   * the correct headers
   * and status code. If `asResponse` is set to true in
   * the context then
   * it will return a Response object instead of the
   * JSON object.
   *
   * @param json - The JSON object to return
   * @param routerResponse - The response object to
   * return if `asResponse` is
   * true in the context this will take precedence
   */
  json: <R extends Record<string, any> | null>(json: R, routerResponse?: {
    status?: number;
    headers?: Record<string, string>;
    response?: Response;
    body?: Record<string, string>;
  } | Response) => Promise<R>;
  /**
   * Middleware context
   */
  context: Prettify<Context & InferUse<Options["use"]>>;
  /**
   * Redirect to a new URL
   */
  redirect: (url: string) => APIError;
  /**
   * Return error
   */
  error: (status: keyof typeof statusCodes | Status, body?: {
    message?: string;
    code?: string;
  } & Record<string, any>, headers?: HeadersInit) => APIError;
};
type EndpointHandler<Path extends string, Options extends EndpointOptions, R> = (context: EndpointContext<Path, Options>) => Promise<R>;
declare function createEndpoint<Path extends string, Options extends EndpointOptions, R>(path: Path, options: Options, handler: EndpointHandler<Path, Options, R>): StrictEndpoint<Path, Options, R>;
declare function createEndpoint<Options extends EndpointOptions, R>(options: Options, handler: EndpointHandler<never, Options, R>): StrictEndpoint<never, Options, R>;
declare namespace createEndpoint {
  var create: <E extends {
    use?: Middleware[];
  }>(opts?: E) => <Path extends string, Opts extends EndpointOptions, R extends Promise<any>>(path: Path, options: Opts, handler: (ctx: EndpointContext<Path, Opts, InferUse<E["use"]>>) => R) => StrictEndpoint<Path, Opts & {
    use: any[];
  }, any>;
}
type StrictEndpoint<Path extends string, Options extends EndpointOptions, R = any> = {
  (context: InputContext<Path, Options> & {
    asResponse: true;
  }): Promise<Response>;
  (context: InputContext<Path, Options> & {
    returnHeaders: true;
    returnStatus: true;
  }): Promise<{
    headers: Headers;
    status: number;
    response: Awaited<R>;
  }>;
  (context: InputContext<Path, Options> & {
    returnHeaders: true;
    returnStatus: false;
  }): Promise<{
    headers: Headers;
    response: Awaited<R>;
  }>;
  (context: InputContext<Path, Options> & {
    returnHeaders: false;
    returnStatus: true;
  }): Promise<{
    status: number;
    response: Awaited<R>;
  }>;
  (context: InputContext<Path, Options> & {
    returnHeaders: false;
    returnStatus: false;
  }): Promise<R>;
  (context: InputContext<Path, Options> & {
    returnHeaders: true;
  }): Promise<{
    headers: Headers;
    response: Awaited<R>;
  }>;
  (context: InputContext<Path, Options> & {
    returnStatus: true;
  }): Promise<{
    status: number;
    response: Awaited<R>;
  }>;
  (context?: InputContext<Path, Options>): Promise<R>;
  options: Options;
  path: Path;
};
type Endpoint<Path extends string = string, Options extends EndpointOptions = EndpointOptions, Handler extends (inputCtx: any) => Promise<any> = (inputCtx: any) => Promise<any>> = Handler & {
  options: Options;
  path: Path;
};
//#endregion
export { Endpoint, EndpointBaseOptions, EndpointBodyMethodOptions, EndpointContext, EndpointOptions, StrictEndpoint, createEndpoint };
//# sourceMappingURL=endpoint.d.cts.map