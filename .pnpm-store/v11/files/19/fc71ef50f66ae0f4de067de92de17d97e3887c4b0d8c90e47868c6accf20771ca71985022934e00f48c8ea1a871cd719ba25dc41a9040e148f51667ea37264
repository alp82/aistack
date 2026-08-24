import { Prettify } from "./helper.cjs";
import { InferBodyInput, InferHeaders, InferHeadersInput, InferMiddlewareBody, InferMiddlewareQuery, InferQueryInput, InferRequest, InferRequestInput, InferUse } from "./context.cjs";
import { EndpointContext, EndpointOptions } from "./endpoint.cjs";

//#region src/middleware.d.ts
interface MiddlewareOptions extends Omit<EndpointOptions, "method"> {}
type MiddlewareResponse = null | void | undefined | Record<string, any>;
type MiddlewareContext<Options extends MiddlewareOptions, Context = {}> = EndpointContext<string, Options & {
  method: "*";
}> & {
  /**
   * Method
   *
   * The request method
   */
  method: string;
  /**
   * Path
   *
   * The path of the endpoint
   */
  path: string;
  /**
   * Body
   *
   * The body object will be the parsed JSON from the request and validated
   * against the body schema if it exists
   */
  body: InferMiddlewareBody<Options>;
  /**
   * Query
   *
   * The query object will be the parsed query string from the request
   * and validated against the query schema if it exists
   */
  query: InferMiddlewareQuery<Options>;
  /**
   * Params
   *
   * If the path is `/user/:id` and the request is `/user/1` then the
   * params will
   * be `{ id: "1" }` and if the path includes a wildcard like `/user/*`
   * then the
   * params will be `{ _: "1" }` where `_` is the wildcard key. If the
   * wildcard
   * is named like `/user/**:name` then the params will be `{ name: string }`
   */
  params: string;
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
   * Get header
   *
   * If it's called outside of a request it will just return null
   *
   * @param key  - The key of the header
   * @returns
   */
  getHeader: (key: string) => string | null;
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
  } | Response) => Promise<R>;
  /**
   * Middleware context
   */
  context: Prettify<Context>;
};
declare function createMiddleware<Options extends MiddlewareOptions, R>(options: Options, handler: (context: MiddlewareContext<Options>) => Promise<R>): <InputCtx extends MiddlewareInputContext<Options>>(inputContext: InputCtx) => Promise<R>;
declare function createMiddleware<Options extends MiddlewareOptions, R>(handler: (context: MiddlewareContext<Options>) => Promise<R>): <InputCtx extends MiddlewareInputContext<Options>>(inputContext: InputCtx) => Promise<R>;
declare namespace createMiddleware {
  var create: <E extends {
    use?: Middleware[];
  }>(opts?: E) => {
    <Options extends MiddlewareOptions, R>(options: Options, handler: (ctx: MiddlewareContext<Options, InferUse<E["use"]>>) => Promise<R>): (inputContext: MiddlewareInputContext<Options>) => Promise<R>;
    <Options extends MiddlewareOptions, R_1>(handler: (ctx: MiddlewareContext<Options, InferUse<E["use"]>>) => Promise<R_1>): (inputContext: MiddlewareInputContext<Options>) => Promise<R_1>;
  };
}
type MiddlewareInputContext<Options extends MiddlewareOptions> = InferBodyInput<Options> & InferQueryInput<Options> & InferRequestInput<Options> & InferHeadersInput<Options> & {
  asResponse?: boolean;
  returnHeaders?: boolean;
  use?: Middleware[];
};
type Middleware<Options extends MiddlewareOptions = MiddlewareOptions, Handler extends (inputCtx: any) => Promise<any> = any> = Handler & {
  options: Options;
};
//#endregion
export { Middleware, MiddlewareContext, MiddlewareInputContext, MiddlewareOptions, MiddlewareResponse, createMiddleware };
//# sourceMappingURL=middleware.d.cts.map