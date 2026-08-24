import { A as FetchableObject, C as EventHandler, D as EventHandlerResponse, E as EventHandlerRequest, I as MaybePromise$1, J as CookieSerializeOptions, L as TypedRequest, M as InferEventInput, O as EventHandlerWithFetch, P as Middleware, S as DynamicEventHandler, T as EventHandlerObject, a as H3EventContext, c as H3Plugin, d as HTTPMethod, i as HTTPEvent, j as HTTPHandler, o as H3Config, r as H3Event, t as H3, u as H3RouteMeta, x as HTTPError, y as ErrorDetails } from "./h3.mjs";
import { NodeServerRequest, NodeServerResponse, ServerRequest, ServerRequestContext } from "srvx";
import { Hooks, Hooks as WebSocketHooks, Message as WebSocketMessage, Peer as WebSocketPeer } from "crossws";
/**
* Checks if the input is an H3Event object.
* @param input - The input to check.
* @returns True if the input is an H3Event object, false otherwise.
* @see H3Event
*/
declare function isEvent(input: any): input is H3Event;
/**
* Checks if the input is an object with `{ req: Request }` signature.
* @param input - The input to check.
* @returns True if the input is `{ req: Request }`
*/
declare function isHTTPEvent(input: any): input is HTTPEvent;
/**
* Gets the context of the event, if it does not exists, initializes a new context on `req.context`.
*/
declare function getEventContext<T extends ServerRequestContext | H3EventContext>(event: HTTPEvent | H3Event): T;
declare function mockEvent(_request: string | URL | Request, options?: RequestInit & {
  h3?: H3EventContext;
}): H3Event;
/** The Standard Schema interface. */
interface StandardSchemaV1<Input = unknown, Output = Input> {
  /** The Standard Schema properties. */
  readonly "~standard": Props<Input, Output>;
}
/** The Standard Schema properties interface. */
interface Props<Input = unknown, Output = Input> {
  /** The version number of the standard. */
  readonly version: 1;
  /** The vendor name of the schema library. */
  readonly vendor: string;
  /** Validates unknown input values. */
  readonly validate: (value: unknown) => Result<Output> | Promise<Result<Output>>;
  /** Inferred types associated with the schema. */
  readonly types?: Types<Input, Output> | undefined;
}
/** The result interface of the validate function. */
type Result<Output> = SuccessResult<Output> | FailureResult;
/** The result interface if validation succeeds. */
interface SuccessResult<Output> {
  /** The typed output value. */
  readonly value: Output;
  /** The non-existent issues. */
  readonly issues?: undefined;
}
/** The result interface if validation fails. */
interface FailureResult {
  /** The issues of failed validation. */
  readonly issues: ReadonlyArray<Issue>;
}
/** The issue interface of the failure output. */
interface Issue {
  /** The error message of the issue. */
  readonly message: string;
  /** The path of the issue, if any. */
  readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
}
/** The path segment interface of the issue. */
interface PathSegment {
  /** The key representing a path segment. */
  readonly key: PropertyKey;
}
/** The Standard Schema types interface. */
interface Types<Input = unknown, Output = Input> {
  /** The input type of the schema. */
  readonly input: Input;
  /** The output type of the schema. */
  readonly output: Output;
}
/** Infers the output type of a Standard Schema. */
type InferOutput<Schema extends StandardSchemaV1> = NonNullable<Schema["~standard"]["types"]>["output"];
type ValidateResult<T> = T | true | false | void;
type OnValidateError<Source extends string = string> = (result: FailureResult & {
  _source?: Source;
}) => ErrorDetails;
declare function defineHandler<Req extends EventHandlerRequest = EventHandlerRequest, Res = EventHandlerResponse>(handler: EventHandler<Req, Res>): EventHandlerWithFetch<Req, Res>;
declare function defineHandler<Req extends EventHandlerRequest = EventHandlerRequest, Res = EventHandlerResponse>(def: EventHandlerObject<Req, Res>): EventHandlerWithFetch<Req, Res>;
type StringHeaders<T> = { [K in keyof T]: Extract<T[K], string> };
/**
* @experimental defineValidatedHandler is an experimental feature and API may change.
*/
declare function defineValidatedHandler<RequestBody extends StandardSchemaV1, RequestHeaders extends StandardSchemaV1, RequestQuery extends StandardSchemaV1, Res extends EventHandlerResponse = EventHandlerResponse>(def: Omit<EventHandlerObject, "handler"> & {
  validate?: {
    body?: RequestBody;
    headers?: RequestHeaders;
    query?: RequestQuery;
    onError?: OnValidateError;
  };
  handler: EventHandler<{
    body: InferOutput<RequestBody>;
    query: StringHeaders<InferOutput<RequestQuery>>;
  }, Res>;
}): EventHandlerWithFetch<TypedRequest<InferOutput<RequestBody>, InferOutput<RequestHeaders>>, Res>;
declare function dynamicEventHandler(initial?: EventHandler | FetchableObject): DynamicEventHandler;
type MaybePromise<T> = T | Promise<T>;
declare function defineLazyEventHandler(loader: () => MaybePromise<HTTPHandler>): EventHandlerWithFetch;
declare function toEventHandler(handler: HTTPHandler | undefined): EventHandler | undefined;
declare function defineMiddleware(input: Middleware): Middleware;
declare function callMiddleware(event: H3Event, middleware: Middleware[], handler: EventHandler, index?: number): unknown | Promise<unknown>;
/**
* Converts any HTTPHandler or Middleware into Middleware.
*
* If FetchableObject or Handler returns a Response with 404 status, the next middleware will be called.
*/
declare function toMiddleware(input: HTTPHandler | Middleware | undefined): Middleware;
declare function toResponse(val: unknown, event: H3Event, config?: H3Config): Response | Promise<Response>;
declare class HTTPResponse {
  #private;
  body?: BodyInit | null;
  constructor(body: BodyInit | null, init?: Pick<ResponseInit, "status" | "statusText" | "headers">);
  get status(): number;
  get statusText(): string;
  get headers(): Headers;
}
type NodeHandler = (req: NodeServerRequest, res: NodeServerResponse) => unknown | Promise<unknown>;
type NodeMiddleware = (req: NodeServerRequest, res: NodeServerResponse, next: (error?: Error) => void) => unknown | Promise<unknown>;
/**
* @deprecated Since h3 v2 you can directly use `app.fetch(request, init?, context?)`
*/
declare function toWebHandler(app: H3): (request: ServerRequest, context?: H3EventContext) => Promise<Response>;
declare function fromWebHandler(handler: (request: ServerRequest, context?: H3EventContext) => Promise<Response>): EventHandler;
/**
* Convert a Node.js handler function (req, res, next?) to an EventHandler.
*
* **Note:** The returned event handler requires to be executed with h3 Node.js handler.
*/
declare function fromNodeHandler(handler: NodeMiddleware): EventHandler;
declare function fromNodeHandler(handler: NodeHandler): EventHandler;
declare function defineNodeHandler(handler: NodeHandler): NodeHandler;
declare function defineNodeMiddleware(handler: NodeMiddleware): NodeMiddleware;
/**
* Route definition options
*/
interface RouteDefinition {
  /**
  * HTTP method for the route, e.g. 'GET', 'POST', etc.
  */
  method: HTTPMethod;
  /**
  * Route pattern, e.g. '/api/users/:id'
  */
  route: string;
  /**
  * Handler function for the route.
  */
  handler: EventHandler;
  /**
  * Optional middleware to run before the handler.
  */
  middleware?: Middleware[];
  /**
  * Additional route metadata.
  */
  meta?: H3RouteMeta;
  validate?: {
    body?: StandardSchemaV1;
    headers?: StandardSchemaV1;
    query?: StandardSchemaV1;
  };
}
/**
* Define a route as a plugin that can be registered with app.register()
*
* @example
* ```js
* import { z } from "zod";
*
* const userRoute = defineRoute({
*    method: 'POST',
*    validate: {
*      query: z.object({ id: z.string().uuid() }),
*      body: z.object({ name: z.string() }),
*    },
*    handler: (event) => {
*      return { success: true };
*    }
* });
*
* app.register(userRoute);
* ```
*/
declare function defineRoute(def: RouteDefinition): H3Plugin;
/**
* Convert input into a web [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request).
*
* If input is a relative URL, it will be normalized into a full path based on headers.
*
* If input is already a Request and no options are provided, it will be returned as-is.
*/
declare function toRequest(input: ServerRequest | URL | string, options?: RequestInit): ServerRequest;
/**
* Get parsed query string object from the request URL.
*
* @example
* app.get("/", (event) => {
*   const query = getQuery(event); // { key: "value", key2: ["value1", "value2"] }
* });
*/
declare function getQuery<T, Event extends H3Event | HTTPEvent = HTTPEvent, _T = Exclude<InferEventInput<"query", Event, T>, undefined>>(event: Event): _T;
declare function getValidatedQuery<Event extends HTTPEvent, S extends StandardSchemaV1<any, any>>(event: Event, validate: S, options?: {
  onError?: (result: FailureResult) => ErrorDetails;
}): Promise<InferOutput<S>>;
declare function getValidatedQuery<Event extends HTTPEvent, OutputT, InputT = InferEventInput<"query", Event, OutputT>>(event: Event, validate: (data: InputT) => ValidateResult<OutputT> | Promise<ValidateResult<OutputT>>, options?: {
  onError?: () => ErrorDetails;
}): Promise<OutputT>;
/**
* Get matched route params.
*
* If `decode` option is `true`, it will decode the matched route params using `decodeURIComponent`.
*
* @example
* app.get("/", (event) => {
*   const params = getRouterParams(event); // { key: "value" }
* });
*/
declare function getRouterParams(event: HTTPEvent, opts?: {
  decode?: boolean;
}): NonNullable<H3Event["context"]["params"]>;
declare function getValidatedRouterParams<Event extends HTTPEvent, S extends StandardSchemaV1>(event: Event, validate: S, options?: {
  decode?: boolean;
  onError?: (result: FailureResult) => ErrorDetails;
}): Promise<InferOutput<S>>;
declare function getValidatedRouterParams<Event extends HTTPEvent, OutputT, InputT = InferEventInput<"routerParams", Event, OutputT>>(event: Event, validate: (data: InputT) => ValidateResult<OutputT> | Promise<ValidateResult<OutputT>>, options?: {
  decode?: boolean;
  onError?: () => ErrorDetails;
}): Promise<OutputT>;
/**
* Get a matched route param by name.
*
* If `decode` option is `true`, it will decode the matched route param using `decodeURI`.
*
* @example
* app.get("/", (event) => {
*   const param = getRouterParam(event, "key");
* });
*/
declare function getRouterParam(event: HTTPEvent, name: string, opts?: {
  decode?: boolean;
}): string | undefined;
/**
*
* Checks if the incoming request method is of the expected type.
*
* If `allowHead` is `true`, it will allow `HEAD` requests to pass if the expected method is `GET`.
*
* @example
* app.get("/", (event) => {
*   if (isMethod(event, "GET")) {
*     // Handle GET request
*   } else if (isMethod(event, ["POST", "PUT"])) {
*     // Handle POST or PUT request
*   }
* });
*/
declare function isMethod(event: HTTPEvent, expected: HTTPMethod | HTTPMethod[], allowHead?: boolean): boolean;
/**
* Asserts that the incoming request method is of the expected type using `isMethod`.
*
* If the method is not allowed, it will throw a 405 error with the message "HTTP method is not allowed".
*
* If `allowHead` is `true`, it will allow `HEAD` requests to pass if the expected method is `GET`.
*
* @example
* app.get("/", (event) => {
*   assertMethod(event, "GET");
*   // Handle GET request, otherwise throw 405 error
* });
*/
declare function assertMethod(event: HTTPEvent, expected: HTTPMethod | HTTPMethod[], allowHead?: boolean): void;
/**
* Get the request hostname.
*
* If `xForwardedHost` is `true`, it will use the `x-forwarded-host` header if it exists.
*
* If no host header is found, it will default to "localhost".
*
* @example
* app.get("/", (event) => {
*   const host = getRequestHost(event); // "example.com"
* });
*/
declare function getRequestHost(event: HTTPEvent, opts?: {
  xForwardedHost?: boolean;
}): string;
/**
* Get the request protocol.
*
* If `x-forwarded-proto` header is set to "https", it will return "https". You can disable this behavior by setting `xForwardedProto` to `false`.
*
* If protocol cannot be determined, it will default to "http".
*
* @example
* app.get("/", (event) => {
*   const protocol = getRequestProtocol(event); // "https"
* });
*/
declare function getRequestProtocol(event: HTTPEvent | H3Event, opts?: {
  xForwardedProto?: boolean;
}): "http" | "https" | (string & {});
/**
* Generated the full incoming request URL.
*
* If `xForwardedHost` is `true`, it will use the `x-forwarded-host` header if it exists.
*
* If `xForwardedProto` is `false`, it will not use the `x-forwarded-proto` header.
*
* @example
* app.get("/", (event) => {
*   const url = getRequestURL(event); // "https://example.com/path"
* });
*/
declare function getRequestURL(event: HTTPEvent | H3Event, opts?: {
  xForwardedHost?: boolean;
  xForwardedProto?: boolean;
}): URL;
/**
* Try to get the client IP address from the incoming request.
*
* If `xForwardedFor` is `true`, it will use the `x-forwarded-for` header if it exists.
*
* If IP cannot be determined, it will default to `undefined`.
*
* @example
* app.get("/", (event) => {
*   const ip = getRequestIP(event); // "192.0.2.0"
* });
*/
declare function getRequestIP(event: HTTPEvent, opts?: {
  /**
  * Use the X-Forwarded-For HTTP header set by proxies.
  *
  * Note: Make sure that this header can be trusted (your application running behind a CDN or reverse proxy) before enabling.
  */
  xForwardedFor?: boolean;
}): string | undefined;
type IterationSource<Val, Ret = Val> = Iterable<Val> | AsyncIterable<Val> | Iterator<Val, Ret | undefined> | AsyncIterator<Val, Ret | undefined> | (() => Iterator<Val, Ret | undefined> | AsyncIterator<Val, Ret | undefined>);
type IteratorSerializer<Value> = (value: Value) => Uint8Array | undefined;
/**
* Respond with an empty payload.<br>
*
* @example
* app.get("/", () => noContent());
*
* @param status status code to be send. By default, it is `204 No Content`.
*/
declare function noContent(status?: number): HTTPResponse;
/**
* Send a redirect response to the client.
*
* It adds the `location` header to the response and sets the status code to 302 by default.
*
* In the body, it sends a simple HTML page with a meta refresh tag to redirect the client in case the headers are ignored.
*
* @example
* app.get("/", () => {
*   return redirect("https://example.com");
* });
*
* @example
* app.get("/", () => {
*   return redirect("https://example.com", 301); // Permanent redirect
* });
*/
declare function redirect(location: string, status?: number, statusText?: string): HTTPResponse;
/**
* Write `HTTP/1.1 103 Early Hints` to the client.
*/
declare function writeEarlyHints(event: H3Event, hints: Record<string, string>): void | Promise<void>;
/**
* Iterate a source of chunks and send back each chunk in order.
* Supports mixing async work together with emitting chunks.
*
* Each chunk must be a string or a buffer.
*
* For generator (yielding) functions, the returned value is treated the same as yielded values.
*
* @param iterable - Iterator that produces chunks of the response.
* @param serializer - Function that converts values from the iterable into stream-compatible values.
* @template Value - Test
*
* @example
* return iterable(async function* work() {
*   // Open document body
*   yield "<!DOCTYPE html>\n<html><body><h1>Executing...</h1><ol>\n";
*   // Do work ...
*   for (let i = 0; i < 1000) {
*     await delay(1000);
*     // Report progress
*     yield `<li>Completed job #`;
*     yield i;
*     yield `</li>\n`;
*   }
*   // Close out the report
*   return `</ol></body></html>`;
* })
* async function delay(ms) {
*   return new Promise(resolve => setTimeout(resolve, ms));
* }
*/
declare function iterable<Value = unknown, Return = unknown>(iterable: IterationSource<Value, Return>, options?: {
  serializer: IteratorSerializer<Value | Return>;
}): HTTPResponse;
/**
* Respond with HTML content.
*
* @example
* app.get("/", () => html("<h1>Hello, World!</h1>"));
* app.get("/", () => html`<h1>Hello, ${name}!</h1>`);
*/
declare function html(strings: TemplateStringsArray, ...values: unknown[]): HTTPResponse;
declare function html(markup: string): HTTPResponse;
/**
* Define a middleware that runs on each request.
*/
declare function onRequest(hook: (event: H3Event) => void | Promise<void>): Middleware;
/**
* Define a middleware that runs after Response is generated.
*
* You can return a new Response from the handler to replace the original response.
*/
declare function onResponse(hook: (response: Response, event: H3Event) => MaybePromise$1<void | Response>): Middleware;
/**
* Define a middleware that runs when an error occurs.
*
* You can return a new Response from the handler to gracefully handle the error.
*/
declare function onError(hook: (error: HTTPError, event: H3Event) => MaybePromise$1<void | unknown>): Middleware;
/**
* Define a middleware that checks whether request body size is within specified limit.
*
* If body size exceeds the limit, throws a `413` Request Entity Too Large response error.
* If you need custom handling for this case, use `assertBodySize` instead.
*
* @param limit Body size limit in bytes
* @see {assertBodySize}
*/
declare function bodyLimit(limit: number): Middleware;
interface ProxyOptions {
  headers?: HeadersInit;
  forwardHeaders?: string[];
  filterHeaders?: string[];
  fetchOptions?: RequestInit & {
    duplex?: "half" | "full";
  };
  cookieDomainRewrite?: string | Record<string, string>;
  cookiePathRewrite?: string | Record<string, string>;
  onResponse?: (event: H3Event, response: Response) => void;
}
/**
* Proxy the incoming request to a target URL.
*/
declare function proxyRequest(event: H3Event, target: string, opts?: ProxyOptions): Promise<HTTPResponse>;
/**
* Make a proxy request to a target URL and send the response back to the client.
*/
declare function proxy(event: H3Event, target: string, opts?: ProxyOptions): Promise<HTTPResponse>;
/**
* Get the request headers object without headers known to cause issues when proxying.
*/
declare function getProxyRequestHeaders(event: H3Event, opts?: {
  host?: boolean;
  forwardHeaders?: string[];
  filterHeaders?: string[];
}): Record<string, string>;
/**
* Make a fetch request with the event's context and headers.
*/
declare function fetchWithEvent(event: H3Event, url: string, init?: RequestInit): Promise<Response>;
/**
* Reads request body and tries to parse using JSON.parse or URLSearchParams.
*
* @example
* app.get("/", async (event) => {
*   const body = await readBody(event);
* });
*
* @param event H3 event passed by h3 handler
* @param encoding The character encoding to use, defaults to 'utf-8'.
*
* @return {*} The `Object`, `Array`, `String`, `Number`, `Boolean`, or `null` value corresponding to the request JSON body
*/
declare function readBody<T, _Event extends HTTPEvent = HTTPEvent, _T = InferEventInput<"body", _Event, T>>(event: _Event): Promise<undefined | _T>;
declare function readValidatedBody<Event extends HTTPEvent, S extends StandardSchemaV1>(event: Event, validate: S, options?: {
  onError?: (result: FailureResult) => ErrorDetails;
}): Promise<InferOutput<S>>;
declare function readValidatedBody<Event extends HTTPEvent, OutputT, InputT = InferEventInput<"body", Event, OutputT>>(event: Event, validate: (data: InputT) => ValidateResult<OutputT> | Promise<ValidateResult<OutputT>>, options?: {
  onError?: () => ErrorDetails;
}): Promise<OutputT>;
/**
* Asserts that request body size is within the specified limit.
*
* If body size exceeds the limit, throws a `413` Request Entity Too Large response error.
*
* @example
* app.get("/", async (event) => {
*   await assertBodySize(event, 10 * 1024 * 1024); // 10MB
*   const data = await event.req.formData();
* });
*
* @param event HTTP event
* @param limit Body size limit in bytes
*/
declare function assertBodySize(event: HTTPEvent, limit: number): Promise<void>;
/**
* Parse the request to get HTTP Cookie header string and returning an object of all cookie name-value pairs.
* @param event {HTTPEvent} H3 event or req passed by h3 handler
* @returns Object of cookie name-value pairs
* ```ts
* const cookies = parseCookies(event)
* ```
*/
declare function parseCookies(event: HTTPEvent): Record<string, string>;
/**
* Get a cookie value by name.
* @param event {HTTPEvent} H3 event or req passed by h3 handler
* @param name Name of the cookie to get
* @returns {*} Value of the cookie (String or undefined)
* ```ts
* const authorization = getCookie(request, 'Authorization')
* ```
*/
declare function getCookie(event: HTTPEvent, name: string): string | undefined;
/**
* Set a cookie value by name.
* @param event {H3Event} H3 event or res passed by h3 handler
* @param name Name of the cookie to set
* @param value Value of the cookie to set
* @param options {CookieSerializeOptions} Options for serializing the cookie
* ```ts
* setCookie(res, 'Authorization', '1234567')
* ```
*/
declare function setCookie(event: H3Event, name: string, value: string, options?: CookieSerializeOptions): void;
/**
* Remove a cookie by name.
* @param event {H3Event} H3 event or res passed by h3 handler
* @param name Name of the cookie to delete
* @param serializeOptions {CookieSerializeOptions} Cookie options
* ```ts
* deleteCookie(res, 'SessionId')
* ```
*/
declare function deleteCookie(event: H3Event, name: string, serializeOptions?: CookieSerializeOptions): void;
/**
* Get a chunked cookie value by name. Will join chunks together.
* @param event {HTTPEvent} { req: Request }
* @param name Name of the cookie to get
* @returns {*} Value of the cookie (String or undefined)
* ```ts
* const authorization = getCookie(request, 'Session')
* ```
*/
declare function getChunkedCookie(event: HTTPEvent, name: string): string | undefined;
/**
* Set a cookie value by name. Chunked cookies will be created as needed.
* @param event {H3Event} H3 event or res passed by h3 handler
* @param name Name of the cookie to set
* @param value Value of the cookie to set
* @param options {CookieSerializeOptions} Options for serializing the cookie
* ```ts
* setCookie(res, 'Session', '<session data>')
* ```
*/
declare function setChunkedCookie(event: H3Event, name: string, value: string, options?: CookieSerializeOptions & {
  chunkMaxLength?: number;
}): void;
/**
* Remove a set of chunked cookies by name.
* @param event {H3Event} H3 event or res passed by h3 handler
* @param name Name of the cookie to delete
* @param serializeOptions {CookieSerializeOptions} Cookie options
* ```ts
* deleteCookie(res, 'Session')
* ```
*/
declare function deleteChunkedCookie(event: H3Event, name: string, serializeOptions?: CookieSerializeOptions): void;
/**
* A helper class for [server sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format)
*/
declare class EventStream {
  private readonly _event;
  private readonly _transformStream;
  private readonly _writer;
  private readonly _encoder;
  private _writerIsClosed;
  private _paused;
  private _unsentData;
  private _disposed;
  private _handled;
  constructor(event: H3Event, opts?: EventStreamOptions);
  /**
  * Publish new event(s) for the client
  */
  push(message: string): Promise<void>;
  push(message: string[]): Promise<void>;
  push(message: EventStreamMessage): Promise<void>;
  push(message: EventStreamMessage[]): Promise<void>;
  pushComment(comment: string): Promise<void>;
  private _sendEvent;
  private _sendEvents;
  pause(): void;
  get isPaused(): boolean;
  resume(): Promise<void>;
  flush(): Promise<void>;
  /**
  * Close the stream and the connection if the stream is being sent to the client
  */
  close(): Promise<void>;
  /**
  * Triggers callback when the writable stream is closed.
  * It is also triggered after calling the `close()` method.
  */
  onClosed(cb: () => any): void;
  send(): Promise<BodyInit>;
}
interface EventStreamOptions {
  /**
  * Automatically close the writable stream when the request is closed
  *
  * Default is `true`
  */
  autoclose?: boolean;
}
/**
* See https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#fields
*/
interface EventStreamMessage {
  id?: string;
  event?: string;
  retry?: number;
  data: string;
}
/**
* Initialize an EventStream instance for creating [server sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
*
* @experimental This function is experimental and might be unstable in some environments.
*
* @example
*
* ```ts
* import { createEventStream, sendEventStream } from "h3";
*
* app.get("/sse", (event) => {
*   const eventStream = createEventStream(event);
*
*   // Send a message every second
*   const interval = setInterval(async () => {
*     await eventStream.push("Hello world");
*   }, 1000);
*
*   // cleanup the interval and close the stream when the connection is terminated
*   eventStream.onClosed(async () => {
*     console.log("closing SSE...");
*     clearInterval(interval);
*     await eventStream.close();
*   });
*
*   return eventStream.send();
* });
* ```
*/
declare function createEventStream(event: H3Event, opts?: EventStreamOptions): EventStream;
/**
* Make sure the status message is safe to use in a response.
*
* Allowed characters: horizontal tabs, spaces or visible ascii characters: https://www.rfc-editor.org/rfc/rfc7230#section-3.1.2
*/
declare function sanitizeStatusMessage(statusMessage?: string): string;
/**
* Make sure the status code is a valid HTTP status code.
*/
declare function sanitizeStatusCode(statusCode?: string | number, defaultStatusCode?: number): number;
interface CacheConditions {
  modifiedTime?: string | Date;
  maxAge?: number;
  etag?: string;
  cacheControls?: string[];
}
/**
* Check request caching headers (`If-Modified-Since`) and add caching headers (Last-Modified, Cache-Control)
* Note: `public` cache control will be added by default
* @returns `true` when cache headers are matching. When `true` is returned, no response should be sent anymore
*/
declare function handleCacheHeaders(event: H3Event, opts: CacheConditions): boolean;
interface StaticAssetMeta {
  type?: string;
  etag?: string;
  mtime?: number | string | Date;
  path?: string;
  size?: number;
  encoding?: string;
}
interface ServeStaticOptions {
  /**
  * This function should resolve asset meta
  */
  getMeta: (id: string) => StaticAssetMeta | undefined | Promise<StaticAssetMeta | undefined>;
  /**
  * This function should resolve asset content
  */
  getContents: (id: string) => BodyInit | null | undefined | Promise<BodyInit | null | undefined>;
  /**
  * Headers to set on the response
  */
  headers?: HeadersInit;
  /**
  * Map of supported encodings (compressions) and their file extensions.
  *
  * Each extension will be appended to the asset path to find the compressed version of the asset.
  *
  * @example { gzip: ".gz", br: ".br" }
  */
  encodings?: Record<string, string>;
  /**
  * Default index file to serve when the path is a directory
  *
  * @default ["/index.html"]
  */
  indexNames?: string[];
  /**
  * When set to true, the function will not throw 404 error when the asset meta is not found or meta validation failed
  */
  fallthrough?: boolean;
  /**
  * Custom MIME type resolver function
  * @param ext - File extension including dot (e.g., ".css", ".js")
  */
  getType?: (ext: string) => string | undefined;
}
/**
* Dynamically serve static assets based on the request path.
*/
declare function serveStatic(event: H3Event, options: ServeStaticOptions): Promise<HTTPResponse | undefined>;
/**
* Returns a new event handler that removes the base url of the event before calling the original handler.
*
* @example
* const api = new H3()
*  .get("/", () => "Hello API!");
* const app = new H3();
*  .use("/api/**", withBase("/api", api.handler));
*
* @param base The base path to prefix.
* @param handler The event handler to use with the adapted path.
*/
declare function withBase(base: string, input: HTTPHandler): EventHandler;
/**
* Check if the origin is allowed.
*/
declare function isCorsOriginAllowed(origin: string | null | undefined, options: CorsOptions): boolean;
interface CorsOptions {
  /**
  * This determines the value of the "access-control-allow-origin" response header.
  * If "*", it can be used to allow all origins.
  * If an array of strings or regular expressions, it can be used with origin matching.
  * If a custom function, it's used to validate the origin. It takes the origin as an argument and returns `true` if allowed.
  *
  * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
  * @default "*"
  */
  origin?: "*" | "null" | (string | RegExp)[] | ((origin: string) => boolean);
  /**
  * This determines the value of the "access-control-allow-methods" response header of a preflight request.
  *
  * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods
  * @default "*"
  * @example ["GET", "HEAD", "PUT", "POST"]
  */
  methods?: "*" | string[];
  /**
  * This determines the value of the "access-control-allow-headers" response header of a preflight request.
  *
  * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers
  * @default "*"
  */
  allowHeaders?: "*" | string[];
  /**
  * This determines the value of the "access-control-expose-headers" response header.
  *
  * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers
  * @default "*"
  */
  exposeHeaders?: "*" | string[];
  /**
  * This determines the value of the "access-control-allow-credentials" response header.
  * When request with credentials, the options that `origin`, `methods`, `exposeHeaders` and `allowHeaders` should not be set "*".
  *
  * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
  * @see https://fetch.spec.whatwg.org/#cors-protocol-and-credentials
  * @default false
  */
  credentials?: boolean;
  /**
  * This determines the value of the "access-control-max-age" response header of a preflight request.
  *
  * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age
  * @default false
  */
  maxAge?: string | false;
  /**
  *
  * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers
  */
  preflight?: {
    statusCode?: number;
  };
}
/**
* Check if the incoming request is a CORS preflight request.
*/
declare function isPreflightRequest(event: HTTPEvent): boolean;
/**
* Append CORS preflight headers to the response.
*/
declare function appendCorsPreflightHeaders(event: H3Event, options: CorsOptions): void;
/**
* Append CORS headers to the response.
*/
declare function appendCorsHeaders(event: H3Event, options: CorsOptions): void;
/**
* Handle CORS for the incoming request.
*
* If the incoming request is a CORS preflight request, it will append the CORS preflight headers and send a 204 response.
*
* If return value is not `false`, the request is handled and no further action is needed.
*
* @example
* const app = new H3();
* const router = createRouter();
* router.use("/", async (event) => {
*   const corsRes = handleCors(event, {
*     origin: "*",
*     preflight: {
*       statusCode: 204,
*     },
*     methods: "*",
*   });
*   if (corsRes !== false) {
*     return corsRes;
*   }
*   // Your code here
* });
*/
declare function handleCors(event: H3Event, options: CorsOptions): false | HTTPResponse;
type _BasicAuthOptions = {
  /**
  * Validate username for basic auth.
  */
  username: string;
  /***
  * Simple password for basic auth.
  */
  password: string;
  /**
  * Custom validation function for basic auth.
  */
  validate: (username: string, password: string) => boolean | Promise<boolean>;
  /**
  * Realm for the basic auth challenge.
  *
  * Defaults to "auth".
  */
  realm: string;
};
type BasicAuthOptions = Partial<_BasicAuthOptions> & ({
  validate: _BasicAuthOptions["validate"];
} | {
  password: _BasicAuthOptions["password"];
});
/**
* Apply basic authentication for current request.
*
* @example
* import { defineHandler, requireBasicAuth } from "h3";
* export default defineHandler(async (event) => {
*   await requireBasicAuth(event, { password: "test" });
*   return `Hello, ${event.context.basicAuth.username}!`;
* });
*/
declare function requireBasicAuth(event: HTTPEvent, opts: BasicAuthOptions): Promise<true>;
/**
* Create a basic authentication middleware.
*
* @example
* import { H3, serve, basicAuth } from "h3";
* const auth = basicAuth({ password: "test" });
* app.get("/", (event) => `Hello ${event.context.basicAuth?.username}!`, [auth]);
* serve(app, { port: 3000 });
*/
declare function basicAuth(opts: BasicAuthOptions): Middleware;
interface RequestFingerprintOptions {
  /** @default SHA-1 */
  hash?: false | "SHA-1";
  /** @default `true` */
  ip?: boolean;
  /** @default `false` */
  xForwardedFor?: boolean;
  /** @default `false` */
  method?: boolean;
  /** @default `false` */
  url?: boolean;
  /** @default `false` */
  userAgent?: boolean;
}
/**
*
* Get a unique fingerprint for the incoming request.
*
* @experimental Behavior of this utility might change in the future versions
*/
declare function getRequestFingerprint(event: HTTPEvent, opts?: RequestFingerprintOptions): Promise<string | null>;
/**
* Define WebSocket hooks.
*
* @see https://h3.dev/guide/websocket
*/
declare function defineWebSocket(hooks: Partial<Hooks>): Partial<Hooks>;
/**
* Define WebSocket event handler.
*
* @see https://h3.dev/guide/websocket
*/
declare function defineWebSocketHandler(hooks: Partial<Hooks> | ((event: H3Event) => Partial<Hooks> | Promise<Partial<Hooks>>)): EventHandler;
/** @deprecated Use `HTTPError` */
type H3Error = HTTPError;
/** @deprecated Use `HTTPError` */
declare const H3Error: typeof HTTPError;
/** @deprecated Use new HTTPError() */
declare function createError(message: number, details?: ErrorDetails): HTTPError;
declare function createError(details: ErrorDetails): HTTPError;
/**
* @deprecated Use `HTTPError.isError`
*/
declare function isError(input: any): input is HTTPError;
/** @deprecated Please use `event.url` */
declare const getRequestPath: (event: H3Event) => string;
/** @deprecated Please use `event.req.headers.get(name)` */
declare function getRequestHeader(event: H3Event, name: string): string | undefined;
/** @deprecated Please use `event.req.headers.get(name)` */
declare const getHeader: (event: H3Event, name: string) => string | undefined;
/** @deprecated Please use `Object.fromEntries(event.req.headers.entries())` */
declare function getRequestHeaders(event: H3Event): Record<string, string>;
/** @deprecated Please use `Object.fromEntries(event.req.headers.entries())` */
declare const getHeaders: (event: H3Event) => Record<string, string>;
/** @deprecated Please use `event.req.method` */
declare function getMethod(event: H3Event, defaultMethod?: string): string;
/** @deprecated Please use `event.req.text()` or `event.req.arrayBuffer()` */
declare function readRawBody<E extends "utf8" | false = "utf8">(event: H3Event, encoding?: E): E extends false ? Promise<Uint8Array | undefined> : Promise<string | undefined>;
/** @deprecated Please use `event.req.formData()` */
declare function readFormDataBody(event: H3Event): Promise<FormData>;
/** @deprecated Please use `event.req.formData()` */
declare const readFormData: (event: H3Event) => Promise<FormData>;
/** @deprecated Please use `event.req.formData()` */
declare function readMultipartFormData(event: H3Event): Promise<Array<{
  data: Uint8Array;
  name?: string;
  filename?: string;
  type?: string;
}>>;
/** @deprecated Please use `event.req.body` */
declare function getBodyStream(event: H3Event): ReadableStream<Uint8Array> | undefined;
/** @deprecated Please use `event.req.body` */
declare const getRequestWebStream: (event: H3Event) => ReadableStream | undefined;
/** @deprecated Please directly return stream */
declare function sendStream(_event: H3Event, value: ReadableStream): ReadableStream;
/** @deprecated Please use `return noContent(event)` */
declare const sendNoContent: (event: H3Event, code?: number) => HTTPResponse;
/** @deprecated Please use `return redirect(event, code)` */
declare const sendRedirect: (event: H3Event, location: string, code: number) => HTTPResponse;
/** @deprecated Please directly return response */
declare const sendWebResponse: (response: Response) => Response;
/** @deprecated Please use `return proxy(event)` */
declare const sendProxy: (event: H3Event, target: string, opts?: ProxyOptions) => Promise<HTTPResponse>;
/** @deprecated Please use `return iterable(event, value)` */
declare const sendIterable: <Value = unknown, Return = unknown>(_event: H3Event, val: IterationSource<Value, Return>, options?: {
  serializer: IteratorSerializer<Value | Return>;
}) => HTTPResponse;
/** @deprecated Please use `event.res.statusText` */
declare function getResponseStatusText(event: H3Event): string;
/** @deprecated Please use `event.res.headers.append(name, value)` */
declare function appendResponseHeader(event: H3Event, name: string, value: string | string[]): void;
/** @deprecated Please use `event.res.headers.append(name, value)` */
declare const appendHeader: (event: H3Event, name: string, value: string | string[]) => void;
/** @deprecated Please use `event.res.headers.set(name, value)` */
declare function setResponseHeader(event: H3Event, name: string, value: string | string[]): void;
/** @deprecated Please use `event.res.headers.set(name, value)` */
declare const setHeader: (event: H3Event, name: string, value: string | string[]) => void;
/** @deprecated Please use `event.res.headers.set(name, value)` */
declare function setResponseHeaders(event: H3Event, headers: Record<string, string>): void;
/** @deprecated Please use `event.res.headers.set(name, value)` */
declare const setHeaders: (event: H3Event, headers: Record<string, string>) => void;
/** @deprecated Please use `event.res.status` */
declare function getResponseStatus(event: H3Event): number;
/** @deprecated Please directly set `event.res.status` and `event.res.statusText` */
declare function setResponseStatus(event: H3Event, code?: number, text?: string): void;
/** @deprecated Please use `event.res.headers.set("content-type", type)` */
declare function defaultContentType(event: H3Event, type?: string): void;
/** @deprecated Please use `Object.fromEntries(event.res.headers.entries())` */
declare function getResponseHeaders(event: H3Event): Record<string, string>;
/** @deprecated Please use `event.res.headers.get(name)` */
declare function getResponseHeader(event: H3Event, name: string): string | undefined;
/** @deprecated Please use `event.res.headers.delete(name)` instead. */
declare function removeResponseHeader(event: H3Event, name: string): void;
/** @deprecated Please use `event.res.headers.append(name, value)` */
declare function appendResponseHeaders(event: H3Event, headers: string): void;
/** @deprecated Please use `event.res.headers.append(name, value)` */
declare const appendHeaders: (event: H3Event, headers: string) => void;
/** @deprecated Please use `event.res.headers.delete` */
declare function clearResponseHeaders(event: H3Event, headerNames?: string[]): void;
declare const defineEventHandler: typeof defineHandler;
declare const eventHandler: typeof defineHandler;
declare const lazyEventHandler: typeof defineLazyEventHandler;
/** @deprecated Please use `defineNodeHandler` */
declare const defineNodeListener: typeof defineNodeHandler;
/** @deprecated Please use `defineNodeHandler` */
declare const fromNodeMiddleware: (handler: NodeHandler | NodeMiddleware) => EventHandler;
/**
* @deprecated please use `toNodeHandler` from `h3/node`.
*/
declare function toNodeHandler(app: H3): NodeHandler;
/** @deprecated Please use `toNodeHandler` */
declare const toNodeListener: (app: H3) => NodeHandler;
/** @deprecated Please use `new H3()` */
declare const createApp: (config?: H3Config) => H3;
/** @deprecated Please use `new H3()` */
declare const createRouter: (config?: H3Config) => H3;
/** @deprecated Please use `withBase()` */
declare const useBase: (base: string, input: EventHandler | H3) => EventHandler;
export { RequestFingerprintOptions as $, getValidatedQuery as $t, readFormDataBody as A, readValidatedBody as At, setHeader as B, html as Bt, getResponseHeader as C, isEvent as Cn, getChunkedCookie as Ct, isError as D, setCookie as Dt, getResponseStatusText as E, setChunkedCookie as Et, sendNoContent as F, proxyRequest as Ft, toNodeHandler as G, assertMethod as Gt, setResponseHeader as H, noContent as Ht, sendProxy as I, bodyLimit as It, WebSocketHooks as J, getRequestIP as Jt, toNodeListener as K, getQuery as Kt, sendRedirect as L, onError as Lt, readRawBody as M, fetchWithEvent as Mt, removeResponseHeader as N, getProxyRequestHeaders as Nt, lazyEventHandler as O, assertBodySize as Ot, sendIterable as P, proxy as Pt, defineWebSocketHandler as Q, getRouterParams as Qt, sendStream as R, onRequest as Rt, getRequestWebStream as S, getEventContext as Sn, deleteCookie as St, getResponseStatus as T, mockEvent as Tn, parseCookies as Tt, setResponseHeaders as U, redirect as Ut, setHeaders as V, iterable as Vt, setResponseStatus as W, writeEarlyHints as Wt, WebSocketPeer as X, getRequestURL as Xt, WebSocketMessage as Y, getRequestProtocol as Yt, defineWebSocket as Z, getRouterParam as Zt, getHeaders as _, defineHandler as _n, sanitizeStatusMessage as _t, appendResponseHeaders as a, NodeHandler as an, appendCorsHeaders as at, getRequestHeaders as b, dynamicEventHandler as bn, createEventStream as bt, createError as c, defineNodeMiddleware as cn, isPreflightRequest as ct, defineEventHandler as d, toWebHandler as dn, ServeStaticOptions as dt, getValidatedRouterParams as en, getRequestFingerprint as et, defineNodeListener as f, HTTPResponse as fn, StaticAssetMeta as ft, getHeader as g, toMiddleware as gn, sanitizeStatusCode as gt, getBodyStream as h, defineMiddleware as hn, handleCacheHeaders as ht, appendResponseHeader as i, defineRoute as in, CorsOptions as it, readMultipartFormData as j, ProxyOptions as jt, readFormData as k, readBody as kt, createRouter as l, fromNodeHandler as ln, isCorsOriginAllowed as lt, fromNodeMiddleware as m, callMiddleware as mn, CacheConditions as mt, appendHeader as n, toRequest as nn, basicAuth as nt, clearResponseHeaders as o, NodeMiddleware as on, appendCorsPreflightHeaders as ot, eventHandler as p, toResponse as pn, serveStatic as pt, useBase as q, getRequestHost as qt, appendHeaders as r, RouteDefinition as rn, requireBasicAuth as rt, createApp as s, defineNodeHandler as sn, handleCors as st, H3Error as t, isMethod as tn, BasicAuthOptions as tt, defaultContentType as u, fromWebHandler as un, withBase as ut, getMethod as v, defineLazyEventHandler as vn, EventStreamMessage as vt, getResponseHeaders as w, isHTTPEvent as wn, getCookie as wt, getRequestPath as x, toEventHandler as xn, deleteChunkedCookie as xt, getRequestHeader as y, defineValidatedHandler as yn, EventStreamOptions as yt, sendWebResponse as z, onResponse as zt };