import { commonjs } from "../_libs/estree+pluginutils.mjs";
import { C12InputConfig, ChokidarOptions, ConfigWatcher, DotenvOptions, ResolvedConfig, WatchConfigOptions } from "../_libs/c12+readdirp+chokidar.mjs";
import { CompatibilityDateSpec, CompatibilityDates, DateString } from "../_libs/compatx.mjs";
import { ProxyServerOptions } from "../_libs/httpxy.mjs";
import { RawConfig } from "../_libs/undici+jsonc-parser.mjs";
import { OutputBundleConfig } from "../_libs/common.mjs";
import { TSConfig } from "../_libs/pkg-types.mjs";
import { Unimport, UnimportPluginOptions } from "../_libs/unplugin+unimport.mjs";
import { UnwasmPluginOptions } from "../_libs/unwasm.mjs";
import { OpenAPIV3_1 } from "../_libs/openapi-types.mjs";
import { RouterCompilerOptions, RouterContext } from "../_libs/rou3.mjs";
import { ProviderName } from "../_libs/std-env.mjs";
import { ConsolaInstance, LogLevel } from "consola";
import { Hookable, HookableCore, NestedHooks } from "hookable";
import { version } from "nitro/meta";
import { EnvRunner, EnvRunnerData, FetchHandler, RunnerMessageListener, RunnerName, RunnerRPCHooks, UpgradeHandler, WorkerAddress, WorkerHooks } from "env-runner";
import { BasicAuthOptions, H3Core, HTTPError, HTTPEvent, HTTPHandler, HTTPMethod, Middleware, ProxyOptions } from "h3";
import { ServerRequest, ServerRequest as ServerRequest$1 } from "srvx";
import { Preset } from "unenv";
import { ConnectorName } from "db0";
import { BuiltinDriverName } from "unstorage";
import { Nitro as Nitro$1 } from "nitro/types";
import { InputOptions, MinifyOptions, OutputOptions, TransformOptions } from "rolldown";
import { InputOptions as InputOptions$1, OutputOptions as OutputOptions$1 } from "rollup";
import { FetchOptions, FetchRequest, FetchResponse } from "ofetch";
import { CacheEntry, CacheOptions, ResponseCacheEntry } from "ocache";
import { ExecutionContext, ForwardableEmailMessage, MessageBatch, ScheduledController, TraceItem } from "@cloudflare/workers-types";
import { DurableObject } from "cloudflare:workers";
import { send } from "@vercel/queue";
import { ExternalsTraceOptions } from "nf3";
interface InternalApi {}
type RouterMethod = Lowercase<HTTPMethod>;
type NitroFetchRequest = Exclude<keyof InternalApi, `/_${string}` | `/api/_${string}`> | Exclude<FetchRequest, string> | (string & {});
type MiddlewareOf<Route extends string, Method extends RouterMethod | "default"> = Method extends keyof InternalApi[MatchedRoutes<Route>] ? InternalApi[MatchedRoutes<Route>][Method] : never;
type TypedInternalResponse<Route, Default = unknown, Method extends RouterMethod = RouterMethod> = Default extends string | boolean | number | null | void | object ? Default : Route extends string ? MiddlewareOf<Route, Method> extends never ? MiddlewareOf<Route, "default"> extends never ? Default : MiddlewareOf<Route, "default"> : MiddlewareOf<Route, Method> : Default;
type AvailableRouterMethod<R extends NitroFetchRequest> = R extends string ? keyof InternalApi[MatchedRoutes<R>] extends undefined ? RouterMethod : Extract<keyof InternalApi[MatchedRoutes<R>], "default"> extends undefined ? Extract<RouterMethod, keyof InternalApi[MatchedRoutes<R>]> : RouterMethod : RouterMethod;
interface NitroFetchOptions<R extends NitroFetchRequest, M extends AvailableRouterMethod<R> = AvailableRouterMethod<R>> extends FetchOptions {
  method?: Uppercase<M> | M;
}
type ExtractedRouteMethod<R extends NitroFetchRequest, O extends NitroFetchOptions<R>> = O extends undefined ? "get" : Lowercase<Exclude<O["method"], undefined>> extends RouterMethod ? Lowercase<Exclude<O["method"], undefined>> : "get";
type Base$Fetch<DefaultT = unknown, DefaultR extends NitroFetchRequest = NitroFetchRequest> = <T = DefaultT, R extends NitroFetchRequest = DefaultR, O extends NitroFetchOptions<R> = NitroFetchOptions<R>>(request: R, opts?: O) => Promise<TypedInternalResponse<R, T, NitroFetchOptions<R> extends O ? "get" : ExtractedRouteMethod<R, O>>>;
interface $Fetch<DefaultT = unknown, DefaultR extends NitroFetchRequest = NitroFetchRequest> extends Base$Fetch<DefaultT, DefaultR> {
  raw<T = DefaultT, R extends NitroFetchRequest = DefaultR, O extends NitroFetchOptions<R> = NitroFetchOptions<R>>(request: R, opts?: O): Promise<FetchResponse<TypedInternalResponse<R, T, NitroFetchOptions<R> extends O ? "get" : ExtractedRouteMethod<R, O>>>>;
  create<T = DefaultT, R extends NitroFetchRequest = DefaultR>(defaults: FetchOptions): $Fetch<T, R>;
}
type MatchResult<Key extends string, Exact extends boolean = false, Score extends any[] = [], catchAll extends boolean = false> = { [k in Key]: {
  key: k;
  exact: Exact;
  score: Score;
  catchAll: catchAll;
} }[Key];
type Subtract<Minuend extends any[] = [], Subtrahend extends any[] = []> = Minuend extends [...Subtrahend, ...infer Remainder] ? Remainder : never;
type TupleIfDiff<First extends string, Second extends string, Tuple extends any[] = []> = First extends `${Second}${infer Diff}` ? (Diff extends "" ? [] : Tuple) : [];
type MaxTuple<N extends any[] = [], T extends any[] = []> = {
  current: T;
  result: MaxTuple<N, ["", ...T]>;
}[[N["length"]] extends [Partial<T>["length"]] ? "current" : "result"];
type CalcMatchScore<Key extends string, Route extends string, Score extends any[] = [], Init extends boolean = false, FirstKeySegMatcher extends string = (Init extends true ? ":Invalid:" : "")> = `${Key}/` extends `${infer KeySeg}/${infer KeyRest}` ? KeySeg extends FirstKeySegMatcher ? Subtract<[...Score, ...TupleIfDiff<Route, Key, ["", ""]>], TupleIfDiff<Key, Route, ["", ""]>> : `${Route}/` extends `${infer RouteSeg}/${infer RouteRest}` ? `${RouteSeg}?` extends `${infer RouteSegWithoutQuery}?${string}` ? RouteSegWithoutQuery extends KeySeg ? CalcMatchScore<KeyRest, RouteRest, [...Score, "", ""]> : KeySeg extends `:${string}` ? RouteSegWithoutQuery extends "" ? never : CalcMatchScore<KeyRest, RouteRest, [...Score, ""]> : KeySeg extends RouteSegWithoutQuery ? CalcMatchScore<KeyRest, RouteRest, [...Score, ""]> : never : never : never : never;
type _MatchedRoutes<Route extends string, MatchedResultUnion extends MatchResult<string> = MatchResult<keyof InternalApi>> = MatchedResultUnion["key"] extends infer MatchedKeys ? MatchedKeys extends string ? Route extends MatchedKeys ? MatchResult<MatchedKeys, true> : MatchedKeys extends `${infer Root}/**${string}` ? MatchedKeys extends `${string}/**` ? Route extends `${Root}/${string}` ? MatchResult<MatchedKeys, false, [], true> : never : MatchResult<MatchedKeys, false, CalcMatchScore<Root, Route, [], true>> : MatchResult<MatchedKeys, false, CalcMatchScore<MatchedKeys, Route, [], true>> : never : never;
type MatchedRoutes<Route extends string, MatchedKeysResult extends MatchResult<string> = MatchResult<keyof InternalApi>, Matches extends MatchResult<string> = _MatchedRoutes<Route, MatchedKeysResult>> = Route extends "/" ? keyof InternalApi : Extract<Matches, {
  exact: true;
}> extends never ? Extract<Exclude<Matches, {
  score: never;
}>, {
  score: MaxTuple<Matches["score"]>;
}>["key"] | Extract<Matches, {
  catchAll: true;
}>["key"] : Extract<Matches, {
  exact: true;
}>["key"];
/**
 * @link https://github.com/remix-run/remix/blob/2248669ed59fd716e267ea41df5d665d4781f4a9/packages/remix-server-runtime/serialize.ts
 */
type JsonPrimitive = string | number | boolean | string | number | boolean | null;
type NonJsonPrimitive = undefined | Function | symbol;
type IsAny<T> = 0 extends 1 & T ? true : false;
type FilterKeys<TObj extends object, TFilter> = { [TKey in keyof TObj]: TObj[TKey] extends TFilter ? TKey : never }[keyof TObj];
type Serialize<T> = IsAny<T> extends true ? any : T extends JsonPrimitive | undefined ? T : T extends Map<any, any> | Set<any> ? Record<string, never> : T extends NonJsonPrimitive ? never : T extends {
  toJSON(): infer U;
} ? U : T extends [] ? [] : T extends [unknown, ...unknown[]] ? SerializeTuple<T> : T extends ReadonlyArray<infer U> ? (U extends NonJsonPrimitive ? null : Serialize<U>)[] : T extends object ? SerializeObject<T> : never;
/** JSON serialize [tuples](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types) */
type SerializeTuple<T extends [unknown, ...unknown[]]> = { [k in keyof T]: T[k] extends NonJsonPrimitive ? null : Serialize<T[k]> };
/** JSON serialize objects (not including arrays) and classes */
type SerializeObject<T extends object> = { [k in keyof Omit<T, FilterKeys<T, NonJsonPrimitive>>]: Serialize<T[k]> };
/**
 * @see https://github.com/ianstormtaylor/superstruct/blob/7973400cd04d8ad92bbdc2b6f35acbfb3c934079/src/utils.ts#L323-L325
 */
type Simplify<TType> = TType extends any[] | Date ? TType : { [K in keyof TType]: Simplify<TType[K]> };
interface PublicAsset {
  type: string;
  etag: string;
  mtime: string;
  path: string;
  size: number;
  encoding?: string;
  data?: string;
}
interface AssetMeta {
  type?: string;
  etag?: string;
  mtime?: string;
}
/**
 * Options for `defineCachedHandler`.
 *
 * @see https://nitro.build/docs/cache
 */
interface CachedEventHandlerOptions extends Omit<import("ocache").CachedEventHandlerOptions<HTTPEvent & import("ocache").HTTPEvent>, "toResponse" | "createResponse" | "handleCacheHeaders"> {}
/**
 * The runtime Nitro application instance accessible via `useNitroApp()`.
 *
 * @see https://nitro.build/docs/plugins
 */
interface NitroApp {
  fetch: (req: Request) => Response | Promise<Response>;
  h3?: H3Core;
  hooks?: HookableCore<NitroRuntimeHooks>;
  captureError?: CaptureError;
}
/**
 * A Nitro runtime plugin function.
 *
 * Receives the {@link NitroApp} instance (with `hooks` guaranteed to exist)
 * and can register runtime hooks or modify the app.
 *
 * @see https://nitro.build/docs/plugins
 */
interface NitroAppPlugin {
  (nitro: NitroApp & {
    hooks: NonNullable<NitroApp["hooks"]>;
  }): void;
}
interface NitroAsyncContext {
  request: ServerRequest$1;
}
interface RenderResponse {
  body: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}
type RenderHandler = (event: HTTPEvent) => Partial<RenderResponse> | Promise<Partial<RenderResponse>>;
interface RenderContext {
  event: HTTPEvent;
  render: RenderHandler;
  response?: Partial<RenderResponse>;
}
/** Context provided when an error is captured at runtime. */
interface CapturedErrorContext {
  event?: HTTPEvent;
  tags?: string[];
}
/** Error capture callback used by `nitroApp.captureError`. */
type CaptureError = (error: Error, context: CapturedErrorContext) => void;
/**
 * Runtime hooks available in Nitro plugins.
 *
 * @see https://nitro.build/docs/plugins
 * @see https://nitro.build/docs/lifecycle
 */
interface NitroRuntimeHooks {
  close: () => void;
  error: CaptureError;
  request: (event: HTTPEvent) => void | Promise<void>;
  response: (res: Response, event: HTTPEvent) => void | Promise<void>;
}
type MaybePromise$1<T> = T | Promise<T>;
/** @experimental */
interface TaskContext {}
/** @experimental */
interface TaskPayload {
  [key: string]: unknown;
}
/** @experimental */
interface TaskMeta {
  name?: string;
  description?: string;
}
/** @experimental */
interface TaskEvent {
  name: string;
  payload: TaskPayload;
  context: TaskContext;
}
/** @experimental */
interface TaskResult<RT = unknown> {
  result?: RT;
}
/** @experimental */
interface Task<RT = unknown> {
  meta?: TaskMeta;
  run(event: TaskEvent): MaybePromise$1<{
    result?: RT;
  }>;
}
/** @experimental */
interface TaskRunnerOptions {
  cwd?: string;
  buildDir?: string;
}
type AmplifyImageSettings = {
  /** Array of supported image widths */sizes: number[];
  /**
   * Array of allowed external domains that can use Image Optimization.
   * Leave empty for only allowing the deployment domain to use Image Optimization.
   */
  domains: string[];
  /**
   * Array of allowed external patterns that can use Image Optimization.
   * Similar to `domains` but provides more control with RegExp.
   */
  remotePatterns: {
    /** The protocol of the allowed remote pattern. Can be `http` or `https`. */protocol?: "http" | "https";
    /**
     * The hostname of the allowed remote pattern.
     * Can be literal or wildcard. Single `*` matches a single subdomain.
     *  Double `**` matches any number of subdomains.
     * We will disallow blanket wildcards of `**` with nothing else.
     */
    hostname: string; /** The port of the allowed remote pattern. */
    port?: string; /** The pathname of the allowed remote pattern. */
    pathname?: string;
  }[]; /** Array of allowed output image formats. */
  formats: ("image/avif" | "image/webp" | "image/gif" | "image/png" | "image/jpeg")[]; /** Cache duration (in seconds) for the optimized images. */
  minimumCacheTTL: number; /** Allow SVG input image URLs. This is disabled by default for security purposes. */
  dangerouslyAllowSVG: boolean;
};
interface AWSAmplifyOptions {
  catchAllStaticFallback?: boolean;
  imageOptimization?: {
    path?: string;
    cacheControl?: string;
  };
  imageSettings?: AmplifyImageSettings;
  runtime?: "nodejs20.x" | "nodejs22.x" | "nodejs24.x";
}
interface AwsLambdaOptions {
  streaming?: boolean;
}
interface AzureOptions {
  config?: {
    platform?: {
      apiRuntime?: string;
      [key: string]: unknown;
    };
    navigationFallback?: {
      rewrite?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}
type WranglerConfig = Partial<RawConfig>;
/**
 * https://developers.cloudflare.com/pages/platform/functions/routing/#functions-invocation-routes
 */
interface CloudflarePagesRoutes {
  /** Defines the version of the schema. Currently there is only one version of the schema (version 1), however, we may add more in the future and aim to be backwards compatible. */
  version?: 1;
  /** Defines routes that will be invoked by Functions. Accepts wildcard behavior. */
  include?: string[];
  /** Defines routes that will not be invoked by Functions. Accepts wildcard behavior. `exclude` always take priority over `include`. */
  exclude?: string[];
}
interface CloudflareOptions {
  /**
   * Configuration for the Cloudflare Deployments.
   *
   * **NOTE:** This option is only effective if `deployConfig` is enabled.
   */
  wrangler?: WranglerConfig;
  /**
   * Enable automatic generation of `.wrangler/deploy/config.json`.
   *
   * **IMPORTANT:** Enabling this option will cause settings from cloudflare dashboard (including environment variables) to be disabled and discarded.
   *
   * More info: https://developers.cloudflare.com/workers/wrangler/configuration#generated-wrangler-configuration
   */
  deployConfig?: boolean;
  /**
   * Enable native Node.js compatibility support.
   *
   * If this option disabled, pure unenv polyfills will be used instead.
   *
   * If not set, will be auto enabled if `nodejs_compat` or `nodejs_compat_v2` is detected in `wrangler.toml` or `wrangler.json`.
   */
  nodeCompat?: boolean;
  /**
   * Options for dev emulation.
   */
  dev?: {
    configPath?: string;
    environment?: string;
    persistDir?: string;
  };
  pages?: {
    /**
     * Nitro will automatically generate a `_routes.json` that controls which files get served statically and
     * which get served by the Worker. Using this config will override the automatic `_routes.json`. Or, if the
     * `merge` options is set, it will merge the user-set routes with the auto-generated ones, giving priority
     * to the user routes.
     *
     * @see https://developers.cloudflare.com/pages/platform/functions/routing/#functions-invocation-routes
     *
     * There are a maximum of 100 rules, and you must have at least one include rule. Wildcards are accepted.
     *
     * If any fields are unset, they default to:
     *
     * ```json
     * {
     *   "version": 1,
     *   "include": ["/*"],
     *   "exclude": []
     * }
     * ```
     */
    routes?: CloudflarePagesRoutes;
    /**
     * If set to `false`, nitro will disable the automatically generated `_routes.json` and instead use the user-set only ones.
     *
     * @default true
     */
    defaultRoutes?: boolean;
  };
  /**
   * Custom Cloudflare exports additional classes such as WorkflowEntrypoint.
   */
  exports?: string;
}
type DurableObjectState = ConstructorParameters<typeof DurableObject>[0];
declare module "nitro/types" {
  interface NitroRuntimeHooks {
    "cloudflare:scheduled": (_: {
      controller: ScheduledController;
      env: unknown;
      context: ExecutionContext;
    }) => void;
    "cloudflare:email": (_: {
      message: ForwardableEmailMessage; /** @deprecated please use `message` */
      event: ForwardableEmailMessage;
      env: unknown;
      context: ExecutionContext;
    }) => void;
    "cloudflare:queue": (_: {
      batch: MessageBatch; /** @deprecated please use `batch` */
      event: MessageBatch;
      env: unknown;
      context: ExecutionContext;
    }) => void;
    "cloudflare:tail": (_: {
      traces: TraceItem[];
      env: unknown;
      context: ExecutionContext;
    }) => void;
    "cloudflare:trace": (_: {
      traces: TraceItem[];
      env: unknown;
      context: ExecutionContext;
    }) => void;
    "cloudflare:durable:init": (durable: DurableObject, _: {
      state: DurableObjectState;
      env: unknown;
    }) => void;
    "cloudflare:durable:alarm": (durable: DurableObject) => void;
  }
}
type AppHostingOutputBundleConfig = OutputBundleConfig;
interface FirebaseOptions {
  appHosting: Partial<AppHostingOutputBundleConfig["runConfig"]>;
}
interface NetlifyOptions {
  /** @deprecated Use `config.images` */
  images?: NetlifyImagesConfig;
  config?: NetlifyConfigJson;
}
interface NetlifyConfigJson {
  edge_functions?: NetlifyEdgeFunctionDeclaration[];
  functions?: NetlifyFunctionsConfig | NetlifyFunctionsConfigByPattern;
  headers?: NetlifyHeaderRule[];
  images?: NetlifyImagesConfig;
  redirects?: NetlifyRedirectRule[];
  "redirects!"?: NetlifyRedirectRule[];
}
interface NetlifyEdgeFunctionDeclaration {
  function: string;
  path?: string;
  pattern?: string;
  excludedPath?: string;
  excludedPattern?: string;
  cache?: string;
  [key: string]: unknown;
}
interface NetlifyFunctionsConfig extends NetlifyFunctionInlineConfig {
  directory?: string;
}
type NetlifyFunctionsConfigByPattern = Record<string, NetlifyFunctionInlineConfig>;
interface NetlifyFunctionInlineConfig {
  included_files?: string[];
  [key: string]: unknown;
}
interface NetlifyHeaderRule {
  for: string;
  values: Record<string, string>;
  [key: string]: unknown;
}
interface NetlifyImagesConfig {
  remote_images?: string[];
  [key: string]: unknown;
}
interface NetlifyRedirectRule {
  from: string;
  to: string;
  status?: number;
  force?: boolean;
  conditions?: Record<string, string[]>;
  query?: Record<string, string>;
  [key: string]: unknown;
}
/**
 * Vercel Build Output Configuration
 * @see https://vercel.com/docs/build-output-api/v3
 */
interface VercelBuildConfigV3 {
  version: 3;
  routes?: ({
    src: string;
    dest?: string;
    headers?: Record<string, string>;
    continue?: boolean;
    status?: number;
  } | {
    handle: string;
  })[];
  images?: {
    sizes: number[];
    domains: string[];
    remotePatterns?: {
      protocol?: "http" | "https";
      hostname: string;
      port?: string;
      pathname?: string;
    }[];
    minimumCacheTTL?: number;
    formats?: ("image/avif" | "image/webp")[];
    dangerouslyAllowSVG?: boolean;
    contentSecurityPolicy?: string;
  };
  wildcard?: Array<{
    domain: string;
    value: string;
  }>;
  overrides?: Record<string, {
    path?: string;
    contentType?: string;
  }>;
  cache?: string[];
  bypassToken?: string;
  framework?: {
    version: string;
  };
  crons?: {
    path: string;
    schedule: string;
  }[];
}
/**
 * https://vercel.com/docs/build-output-api/primitives#serverless-function-configuration
 * https://vercel.com/docs/build-output-api/primitives#node.js-config
 */
interface VercelServerlessFunctionConfig {
  /**
   * Amount of memory (RAM in MB) that will be allocated to the Serverless Function.
   */
  memory?: number;
  /**
   * Specifies the instruction set "architecture" the Vercel Function supports.
   *
   * Either `x86_64` or `arm64`. The default value is `x86_64`
   */
  architecture?: "x86_64" | "arm64";
  /**
   * Maximum execution duration (in seconds) that will be allowed for the Serverless Function. `max` automatically sets the duration to the maximum allowed value.
   */
  maxDuration?: number | "max";
  /**
   * Map of additional environment variables that will be available to the Vercel Function,
   * in addition to the env vars specified in the Project Settings.
   */
  environment?: Record<string, string>;
  /**
   * List of Vercel Regions where the Vercel Function will be deployed to.
   */
  regions?: string[];
  /**
   * True if a custom runtime has support for Lambda runtime wrappers.
   */
  supportsWrapper?: boolean;
  /**
   * When true, the Serverless Function will stream the response to the client.
   */
  supportsResponseStreaming?: boolean;
  /**
   * Enables source map generation.
   */
  shouldAddSourcemapSupport?: boolean;
  /**
   * The runtime to use. Defaults to the auto-detected Node.js version.
   */
  runtime?: "nodejs20.x" | "nodejs22.x" | "bun1.x" | (string & {});
  /**
   * Experimental trigger configuration (e.g., Vercel Queues).
   */
  experimentalTriggers?: VercelFunctionTrigger[];
  [key: string]: unknown;
}
type VercelFunctionTrigger = {
  type: "queue/v2beta";
  topic: string;
  retryAfterSeconds?: number;
  initialDelaySeconds?: number;
  consumer?: string;
};
interface VercelOptions {
  config?: VercelBuildConfigV3;
  /**
   * If you have enabled skew protection in the Vercel dashboard, it will
   * be enabled by default.
   *
   * You can disable the Nitro integration by setting this option to `false`.
   */
  skewProtection?: boolean;
  /**
   * If you are using `vercel-edge`, you can specify the region(s) for your edge function.
   * @see https://vercel.com/docs/concepts/functions/edge-functions#edge-function-regions
   */
  regions?: string[];
  functions?: VercelServerlessFunctionConfig;
  /**
   * Handler format to use for Vercel Serverless Functions.
   *
   * Using `node` format enables compatibility with Node.js specific APIs in your Nitro application (e.g., `req.runtime.node`).
   *
   * Possible values are: `web` (default) and `node`.
   */
  entryFormat?: "web" | "node";
  /**
   * The route path for the Vercel cron handler endpoint.
   *
   * When `experimental.tasks` and `scheduledTasks` are configured,
   * Nitro registers a cron handler at this path that Vercel invokes
   * on each scheduled cron trigger.
   *
   * @default "/_vercel/cron"
   * @see https://vercel.com/docs/cron-jobs
   */
  cronHandlerRoute?: string;
  /**
   * Vercel Queues configuration.
   *
   * Messages are delivered via the `vercel:queue` runtime hook.
   *
   * @example
   * ```ts
   * // nitro.config.ts
   * export default defineNitroConfig({
   *   vercel: {
   *     queues: {
   *       triggers: [{ topic: "orders" }],
   *     },
   *   },
   * });
   * ```
   *
   * ```ts
   * // server/plugins/queues.ts
   * export default defineNitroPlugin((nitro) => {
   *   nitro.hooks.hook("vercel:queue", ({ message, metadata }) => {
   *     console.log(`Received message on ${metadata.topicName}:`, message);
   *   });
   * });
   * ```
   *
   * @see https://vercel.com/docs/queues
   */
  queues?: {
    /**
     * Route path for the queue consumer handler.
     * @default "/_vercel/queues/consumer"
     */
    handlerRoute?: string; /** Queue topic triggers to subscribe to. */
    triggers: Array<{
      topic: string;
      retryAfterSeconds?: number;
      initialDelaySeconds?: number;
    }>;
  };
  /**
   * Per-route function configuration overrides.
   *
   * Keys are route patterns (e.g., `/api/queues/*`, `/api/slow-routes/**`).
   * Values are partial {@link VercelServerlessFunctionConfig} objects.
   *
   * @example
   * ```ts
   * functionRules: {
   *   '/api/my-slow-routes/**': { maxDuration: 3600 },
   *   '/api/queues/fulfill-order': {
   *     experimentalTriggers: [{ type: 'queue/v2beta', topic: 'orders' }],
   *   },
   * }
   * ```
   */
  functionRules?: Record<string, VercelServerlessFunctionConfig>;
}
declare module "nitro/types" {
  interface NitroRuntimeHooks {
    "vercel:queue": (_: {
      message: unknown;
      metadata: import("@vercel/queue").MessageMetadata;
      send: typeof send;
    }) => void;
  }
}
interface ZephyrOptions {
  /**
   * Deploy to Zephyr during `nitro build` when using the `zephyr` preset.
   *
   * @default false
   */
  deployOnBuild?: boolean;
}
interface PresetOptions {
  awsAmplify?: AWSAmplifyOptions;
  awsLambda?: AwsLambdaOptions;
  azure?: AzureOptions;
  cloudflare?: CloudflareOptions;
  firebase?: FirebaseOptions;
  netlify?: NetlifyOptions;
  vercel?: VercelOptions;
  zephyr?: ZephyrOptions;
}
type PresetName = "alwaysdata" | "aws-amplify" | "aws-lambda" | "azure-swa" | "base-worker" | "bun" | "cleavr" | "cloudflare-dev" | "cloudflare-durable" | "cloudflare-module" | "cloudflare-pages" | "cloudflare-pages-static" | "deno" | "deno-deploy" | "deno-server" | "digital-ocean" | "edgeone" | "edgeone-pages" | "firebase-app-hosting" | "flight-control" | "genezio" | "github-pages" | "gitlab-pages" | "heroku" | "iis-handler" | "iis-node" | "koyeb" | "netlify" | "netlify-edge" | "netlify-static" | "nitro-dev" | "nitro-prerender" | "node" | "node-cluster" | "node-middleware" | "node-server" | "platform-sh" | "render-com" | "standard" | "static" | "stormkit" | "vercel" | "vercel-dev" | "vercel-static" | "winterjs" | "zeabur" | "zeabur-static" | "zephyr" | "zerops" | "zerops-static";
type PresetNameInput = "alwaysdata" | "aws-amplify" | "awsAmplify" | "aws_amplify" | "aws-lambda" | "awsLambda" | "aws_lambda" | "azure-swa" | "azureSwa" | "azure_swa" | "base-worker" | "baseWorker" | "base_worker" | "bun" | "cleavr" | "cloudflare-dev" | "cloudflareDev" | "cloudflare_dev" | "cloudflare-durable" | "cloudflareDurable" | "cloudflare_durable" | "cloudflare-module" | "cloudflareModule" | "cloudflare_module" | "cloudflare-pages" | "cloudflarePages" | "cloudflare_pages" | "cloudflare-pages-static" | "cloudflarePagesStatic" | "cloudflare_pages_static" | "deno" | "deno-deploy" | "denoDeploy" | "deno_deploy" | "deno-server" | "denoServer" | "deno_server" | "digital-ocean" | "digitalOcean" | "digital_ocean" | "edgeone" | "edgeone-pages" | "edgeonePages" | "edgeone_pages" | "firebase-app-hosting" | "firebaseAppHosting" | "firebase_app_hosting" | "flight-control" | "flightControl" | "flight_control" | "genezio" | "github-pages" | "githubPages" | "github_pages" | "gitlab-pages" | "gitlabPages" | "gitlab_pages" | "heroku" | "iis-handler" | "iisHandler" | "iis_handler" | "iis-node" | "iisNode" | "iis_node" | "koyeb" | "netlify" | "netlify-edge" | "netlifyEdge" | "netlify_edge" | "netlify-static" | "netlifyStatic" | "netlify_static" | "nitro-dev" | "nitroDev" | "nitro_dev" | "nitro-prerender" | "nitroPrerender" | "nitro_prerender" | "node" | "node-cluster" | "nodeCluster" | "node_cluster" | "node-middleware" | "nodeMiddleware" | "node_middleware" | "node-server" | "nodeServer" | "node_server" | "platform-sh" | "platformSh" | "platform_sh" | "render-com" | "renderCom" | "render_com" | "standard" | "static" | "stormkit" | "vercel" | "vercel-dev" | "vercelDev" | "vercel_dev" | "vercel-static" | "vercelStatic" | "vercel_static" | "winterjs" | "zeabur" | "zeabur-static" | "zeaburStatic" | "zeabur_static" | "zephyr" | "zerops" | "zerops-static" | "zeropsStatic" | "zerops_static" | (string & {});
interface Extensable {
  [key: `x-${string}`]: any;
}
type OpenAPI3 = OpenAPIV3_1.Document & Extensable;
type OperationObject = OpenAPIV3_1.OperationObject;
type MaybeArray$1<T> = T | T[];
/**
 * Route-level metadata attached to event handlers.
 *
 * @experimental
 * @see https://nitro.build/docs/routing
 */
interface NitroRouteMeta {
  openAPI?: OperationObject & {
    $global?: Pick<OpenAPI3, "components"> & Extensable;
  };
}
interface NitroHandlerCommon {
  /**
   * HTTP pathname pattern to match.
   *
   * @example "/test", "/api/:id", "/blog/**"
   */
  route: string;
  /**
   * HTTP method to match.
   */
  method?: HTTPMethod;
  /**
   * Run handler as a middleware before other route handlers.
   */
  middleware?: boolean;
  /**
   * Route metadata (e.g. OpenAPI operation info).
   */
  meta?: NitroRouteMeta;
}
/**
 * Handler module format.
 *
 * - `"web"` — standard Web API handler (default).
 * - `"node"` — Node.js-style handler, automatically converted to web-compatible.
 */
type EventHandlerFormat = "web" | "node";
/**
 * Event handler registration for build-time bundling.
 *
 * Handlers are file references that the bundler imports and transforms.
 * For runtime-only handlers in development, use {@link NitroDevEventHandler}.
 *
 * @see https://nitro.build/config#handlers
 * @see https://nitro.build/docs/routing
 */
interface NitroEventHandler extends NitroHandlerCommon {
  /**
   * Use lazy loading to import handler.
   */
  lazy?: boolean;
  /**
   * Path to event handler.
   */
  handler: string;
  /**
   * Event handler type.
   *
   * Default is `"web"`. If set to `"node"`, the handler will be converted into a web compatible handler.
   */
  format?: EventHandlerFormat;
  /**
   * Environments to include and bundle this handler.
   *
   * @example
   * ```ts
   * env: ["dev", "prod"]
   * env: "prerender"
   * ```
   */
  env?: MaybeArray$1<"dev" | "prod" | "prerender" | PresetName | (string & {})>;
}
/**
 * Development-only event handler with an inline handler function.
 *
 * These handlers are available only during `nitro dev` and are not
 * included in production builds.
 *
 * @see https://nitro.build/config#devhandlers
 */
interface NitroDevEventHandler extends NitroHandlerCommon {
  /**
   * Event handler function.
   */
  handler: HTTPHandler;
}
type MaybePromise<T> = T | Promise<T>;
/**
 * Custom error handler function signature.
 *
 * Receives the error, the H3 event, and a helper object containing the
 * `defaultHandler` for fallback rendering.
 *
 * @see https://nitro.build/config#errorhandler
 */
type NitroErrorHandler = (error: HTTPError, event: HTTPEvent, _: {
  defaultHandler: (error: HTTPError, event: HTTPEvent, opts?: {
    silent?: boolean;
    json?: boolean;
  }) => MaybePromise<{
    status?: number;
    statusText?: string;
    headers?: HeadersInit;
    body?: string | Record<string, any>;
  }>;
}) => MaybePromise<Response | void>;
interface PrerenderRoute {
  route: string;
  contents?: string;
  data?: ArrayBuffer;
  fileName?: string;
  error?: Partial<HTTPError>;
  generateTimeMS?: number;
  skip?: boolean;
  contentType?: string;
}
/** @deprecated Internal type will be removed in future versions */
type PrerenderGenerateRoute = PrerenderRoute;
interface Route<T = unknown> {
  route: string;
  method: string;
  data: T;
}
declare class Router<T> {
  _routes?: Route<T>[];
  _router?: RouterContext<T>;
  _compiled?: Record<string, string>;
  _baseURL: string;
  constructor(baseURL?: string);
  get routes(): Route<T>[];
  _update(routes: Route<T>[], opts?: {
    merge?: boolean;
  }): void;
  hasRoutes(): boolean;
  compileToString(opts?: RouterCompilerOptions<T>): string;
  match(method: string, path: string): undefined | T;
  matchAll(method: string, path: string): T[];
}
type Enumerate<N extends number, Acc extends number[] = []> = Acc["length"] extends N ? Acc[number] : Enumerate<N, [...Acc, Acc["length"]]>;
type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>;
type ExcludeFunctions<G extends Record<string, any>> = Pick<G, { [P in keyof G]: NonNullable<G[P]> extends Function ? never : P }[keyof G]>;
/** Valid HTTP status code range (100–599). */
type HTTPstatus = IntRange<100, 599>;
/**
 * Route rule options that can be applied to matching route patterns.
 *
 * Rules are matched against the request path (without query string or
 * `app.baseURL`) using rou3 pattern matching. When multiple patterns match,
 * their options are deep-merged with more-specific patterns taking precedence.
 *
 *
 * @see https://nitro.build/docs/routing#route-rules
 */
interface NitroRouteConfig {
  /**
   * Enables runtime caching.
   *
   * When set to an options object, matching handlers are wrapped with
   * `defineCachedHandler`. Set to `false` to disable caching.
   *
   * @see https://nitro.build/docs/cache
   */
  cache?: ExcludeFunctions<CachedEventHandlerOptions> | false;
  /**
   * Response headers to set for matching routes.
   *
   * @example
   * ```ts
   * headers: { 'cache-control': 's-maxage=60' }
   * ```
   *
   * @see https://nitro.build/docs/routing#headers
   */
  headers?: Record<string, string>;
  /**
   * Server-side redirect for matching routes.
   *
   * A plain string defaults to status `307`. Use an object to specify a
   * custom status code. When the rule key ends with `/**` and `to` also
   * ends with `/**`, the matched path tail is appended to the destination.
   *
   * @example
   * ```ts
   * redirect: '/new-page'
   * redirect: { to: '/new-page', status: 301 }
   * ```
   *
   * @see https://nitro.build/docs/routing#redirect
   */
  redirect?: string | {
    to: string;
    status?: HTTPstatus;
  };
  /**
   * Add this route to the prerender queue at build time.
   *
   * Only exact paths are collected; wildcard rules apply at runtime but are
   * not auto-added to the queue. Set to `false` to explicitly exclude a
   * route from prerendering.
   *
   * @see https://nitro.build/docs/routing#prerender
   */
  prerender?: boolean;
  /**
   * Proxy matching requests to another origin or internal path.
   *
   * A plain string specifies the destination. Use an object for additional
   * H3 {@link ProxyOptions}. Wildcard `/**` tail behavior works the same
   * as {@link NitroRouteConfig.redirect | redirect}.
   *
   * **IMPORTANT:** Proxy target should be a trusted and safe origin.
   *
   * @see https://nitro.build/docs/routing#proxy
   */
  proxy?: string | ({
    to: string;
  } & ProxyOptions);
  /**
   * Incremental Static Regeneration on supported platforms.
   *
   * - `number` — revalidation time in seconds.
   * - `true` — never expires until the next deployment.
   * - `false` — disable ISR for this route.
   *
   * Only handled by presets with native support (e.g. Vercel, Netlify).
   * Ignored on platforms without ISR support.
   *
   * @see https://nitro.build/docs/routing#isr-vercel
   */
  isr?: number | boolean | VercelISRConfig;
  /**
   * Protect matching routes with HTTP Basic Authentication.
   *
   * **IMPORTANT:** Depending on the deployment platform, this might not apply to public assets.
   *
   * Set to `false` to disable auth inherited from a less-specific pattern.
   *
   * @see https://nitro.build/docs/routing#basic-auth
   */
  basicAuth?: Pick<BasicAuthOptions, "password" | "username" | "realm"> | false;
  /**
   * Shortcut to add permissive CORS headers (`access-control-allow-origin: *`,
   * `access-control-allow-methods: *`, `access-control-allow-headers: *`,
   * `access-control-max-age: 0`). Override individual headers via
   * {@link NitroRouteConfig.headers | headers}.
   *
   * @see https://nitro.build/docs/routing#cors
   */
  cors?: boolean;
  /**
   * Shortcut for `cache: { swr: true, maxAge?: number }`.
   *
   * - `true` — enable SWR with no explicit `maxAge`.
   * - `number` — enable SWR with the given `maxAge` in seconds.
   *
   * @see https://nitro.build/docs/routing#caching-swr-static
   */
  swr?: boolean | number;
  static?: boolean | number;
}
/**
 * Normalized route rules used at runtime after shortcut resolution.
 */
interface NitroRouteRules extends Omit<NitroRouteConfig, "redirect" | "cors" | "swr" | "static"> {
  redirect?: {
    to: string;
    status: HTTPstatus;
  };
  proxy?: {
    to: string;
  } & ProxyOptions;
  [key: string]: any;
}
type MatchedRouteRule<K extends keyof NitroRouteRules = "custom"> = {
  name: K;
  options: Exclude<NitroRouteRules[K], false>;
  route: string;
  params?: Record<string, string>;
  /**
   * Middleware constructor. May expose an `order` property — lower runs first
   * (default `0`).
   */
  handler?: ((opts: unknown) => Middleware) & {
    order?: number;
  };
};
type MatchedRouteRules = { [K in keyof NitroRouteRules]: MatchedRouteRule<K> };
interface VercelISRConfig {
  /**
   * (vercel)
   * Expiration time (in seconds) before the cached asset will be re-generated by invoking the Serverless Function.
   * Setting the value to `false` (or `isr: true` route rule) means it will never expire.
   */
  expiration?: number | false;
  /**
   * (vercel)
   * Group number of the asset.
   * Prerender assets with the same group number will all be re-validated at the same time.
   */
  group?: number;
  /**
   * (vercel)
   * List of query string parameter names that will be cached independently.
   * - If an empty array, query values are not considered for caching.
   * - If undefined each unique query value is cached independently
   * - For wildcard `/**` route rules, `url` is always added.
   */
  allowQuery?: string[];
  /**
   * (vercel)
   * When `true`, the query string will be present on the `request` argument passed to the invoked function. The `allowQuery` filter still applies.
   */
  passQuery?: boolean;
  /**
   * (vercel)
   *
   * When `true`, expose the response body regardless of status code including error status codes. (default `false`)
   */
  exposeErrBody?: boolean;
}
type MaybeArray<T> = T | T[];
/** Nitro package metadata including version information. */
interface NitroMeta {
  version: string;
  majorVersion: number;
}
/**
 * The core Nitro instance available throughout the build lifecycle.
 *
 * Provides access to resolved options, hooks, the virtual file system,
 * scanned handlers, and utility methods.
 */
interface Nitro {
  meta: NitroMeta;
  options: NitroOptions;
  scannedHandlers: NitroEventHandler[];
  vfs: Map<string, {
    render: () => string | Promise<string>;
  }>;
  hooks: Hookable<NitroHooks>;
  unimport?: Unimport;
  logger: ConsolaInstance;
  fetch: (input: Request) => Response | Promise<Response>;
  close: () => Promise<void>;
  updateConfig: (config: NitroDynamicConfig) => void | Promise<void>;
  routing: Readonly<{
    sync: () => void;
    routeRules: Router<NitroRouteRules & {
      _route: string;
    }>;
    routes: Router<MaybeArray<NitroEventHandler & {
      _importHash: string;
    }>>;
    globalMiddleware: (NitroEventHandler & {
      _importHash: string;
    })[];
    routedMiddleware: Router<NitroEventHandler & {
      _importHash: string;
    }>;
  }>;
  _prerenderedRoutes?: PrerenderRoute[];
  _prerenderMeta?: Record<string, {
    contentType?: string;
  }>;
}
/**
 * Subset of {@link NitroConfig} that can be updated at runtime via
 * `nitro.updateConfig()`.
 */
type NitroDynamicConfig = Pick<NitroConfig, "runtimeConfig" | "routeRules">;
type NitroTypes = {
  routes: Record<string, Partial<Record<HTTPMethod | "default", string[]>>>;
  tsConfig?: TSConfig;
};
/**
 * Metadata about the framework using Nitro.
 *
 * @see https://nitro.build/config#framework
 */
interface NitroFrameworkInfo {
  name?: "nitro" | (string & {});
  version?: string;
  /**
   * Command shown in build output as the suggested preview command.
   *
   * Display-only: Nitro never executes this. Use this when the framework
   * wraps `nitro preview` with its own CLI (e.g. `npx nuxt preview`).
   * Defaults to `npx nitro preview`.
   */
  previewCommand?: string;
  /**
   * Command shown in build output as the suggested deploy command.
   *
   * Display-only: Nitro never executes this. Use this when the framework
   * wraps `nitro deploy` with its own CLI (e.g. `npx nuxt deploy`).
   * Defaults to `npx nitro deploy --prebuilt`.
   */
  deployCommand?: string;
}
/**
 * Build info written to `<output.dir>/nitro.json` (production, default
 * `.output/nitro.json`) or `<rootDir>/node_modules/.nitro/nitro.dev.json`
 * (development).
 *
 * Contains preset, framework, version, and command information.
 */
interface NitroBuildInfo {
  date: string;
  preset: PresetName;
  framework: NitroFrameworkInfo;
  versions: {
    nitro: string;
    [key: string]: string;
  };
  commands?: {
    preview?: string;
    deploy?: string;
  };
  serverEntry?: string;
  publicDir?: string;
  dev?: {
    pid: number;
    workerAddress?: WorkerAddress;
  };
  config?: Partial<PresetOptions>;
}
type RollupConfig = InputOptions$1 & {
  output?: OutputOptions$1;
};
type RolldownConfig = InputOptions & {
  output?: OutputOptions;
};
interface OXCOptions {
  minify?: MinifyOptions;
  transform?: Omit<TransformOptions, "jsx"> & {
    jsx?: Exclude<TransformOptions["jsx"], false | string>;
  };
}
type HookResult = void | Promise<void>;
interface NitroHooks {
  "types:extend": (types: NitroTypes) => HookResult;
  "build:before": (nitro: Nitro) => HookResult;
  "rollup:before": (nitro: Nitro, config: RollupConfig) => HookResult;
  compiled: (nitro: Nitro) => HookResult;
  "dev:reload": (payload?: {
    entry?: string;
    workerData?: EnvRunnerData;
  }) => HookResult;
  "dev:start": () => HookResult;
  "dev:error": (cause?: unknown) => HookResult;
  "rollup:reload": () => HookResult;
  restart: () => HookResult;
  close: () => HookResult;
  "prerender:routes": (routes: Set<string>) => HookResult;
  "prerender:config": (config: NitroConfig) => HookResult;
  "prerender:init": (prerenderer: Nitro) => HookResult;
  "prerender:generate": (route: PrerenderRoute, nitro: Nitro) => HookResult;
  "prerender:route": (route: PrerenderRoute) => HookResult;
  "prerender:done": (result: {
    prerenderedRoutes: PrerenderRoute[];
    failedRoutes: PrerenderRoute[];
  }) => HookResult;
}
/**
 * Accepted input formats for Nitro modules.
 *
 * Can be a module path string, a {@link NitroModule} object, a bare setup
 * function, or an object with a `nitro` key containing a {@link NitroModule}.
 *
 * @see https://nitro.build/config#modules
 */
type NitroModuleInput = string | NitroModule | NitroModule["setup"] | {
  nitro: NitroModule;
};
/**
 * A Nitro module that extends behavior during initialization.
 *
 * Modules receive the {@link Nitro} instance and can register hooks,
 * add handlers, modify options, or perform other setup tasks.
 *
 * @example
 * ```ts
 * export default {
 *   name: "my-module",
 *   nitro: {
 *     setup(nitro) {
 *       nitro.hooks.hook("compiled", () => {
 *         console.log("Build complete!");
 *       });
 *     },
 *   },
 * };
 * ```
 *
 * @see https://nitro.build/config#modules
 */
interface NitroModule {
  name?: string;
  setup: (this: void, nitro: Nitro) => void | Promise<void>;
}
/**
 * Swagger UI configuration options.
 *
 * @see https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/
 */
interface SwaggerUIConfig {
  deepLinking?: boolean;
  displayOperationId?: boolean;
  defaultModelsExpandDepth?: number;
  defaultModelExpandDepth?: number;
  defaultModelRendering?: "example" | "model";
  displayRequestDuration?: boolean;
  docExpansion?: "list" | "full" | "none";
  filter?: boolean | string;
  persistAuthorization?: boolean;
  requestSnippetsEnabled?: boolean;
  showExtensions?: boolean;
  showCommonExtensions?: boolean;
  /** Only "alpha" is supported (function values are not JSON-serializable). */
  tagsSorter?: "alpha";
  /**
   * Note: function callbacks cannot be passed via Nitro configuration (not JSON-serializable).
   */
  onComplete?: never;
  layout?: string;
  configUrl?: string;
  oauth2RedirectUrl?: string;
  withCredentials?: boolean;
  [key: string]: unknown;
}
/**
 * Nitro OpenAPI configuration.
 *
 * @see https://nitro.build/config#openapi
 * @see https://nitro.build/docs/openapi
 */
interface NitroOpenAPIConfig {
  /**
   * OpenAPI document metadata.
   */
  meta?: {
    title?: string;
    description?: string;
    version?: string;
  };
  /**
   * Route for the OpenAPI JSON endpoint.
   *
   * @default "/_openapi.json"
   */
  route?: string;
  /**
   * Enable OpenAPI generation for production builds.
   *
   * - `"runtime"` — generate at runtime (allows middleware usage).
   * - `"prerender"` — prerender the JSON response at build time (most efficient).
   * - `false` — disable in production.
   *
   * @see https://nitro.build/config#openapi
   */
  production?: false | "runtime" | "prerender";
  /**
   * UI configurations for interactive API documentation.
   */
  ui?: {
    /**
     * Scalar UI configuration.
     *
     * Set to `false` to disable.
     */
    scalar?: false | (Partial<unknown> & {
      /**
       * Route for Scalar UI.
       *
       * @default "/_scalar"
       */
      route?: string;
    });
    /**
     * Swagger UI configuration.
     *
     * Set to `false` to disable.
     *
     * @see https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/
     */
    swagger?: false | (SwaggerUIConfig & {
      /**
       * Route for Swagger UI.
       *
       * @default "/_swagger"
       */
      route?: string;
    });
  };
}
type NitroPreset = NitroConfig | (() => NitroConfig);
interface NitroPresetMeta$1 {
  name: string;
  stdName?: ProviderName;
  aliases?: string[];
  static?: boolean;
  dev?: boolean;
  compatibilityDate?: DateString;
}
type RollupCommonJSOptions = NonNullable<Parameters<typeof commonjs.default>[0]>;
/**
 * Fully resolved Nitro options available on `nitro.options`.
 *
 * These are the normalized options after preset defaults and user config
 * have been merged. For the user-facing input type, see {@link NitroConfig}.
 *
 * @see https://nitro.build/config
 */
interface NitroOptions extends PresetOptions {
  _config: NitroConfig;
  _c12: ResolvedConfig<NitroConfig> | ConfigWatcher<NitroConfig>;
  _cli?: {
    command?: string;
  };
  /**
   * Opt-in date for deployment provider and runtime compatibility features.
   *
   * Providers introduce new features that Nitro presets can leverage, but
   * some need to be explicitly opted into. Set to the latest tested date
   * in `YYYY-MM-DD` format.
   *
   * @default "latest"
   * @see https://nitro.build/config#compatibilitydate
   */
  compatibilityDate: CompatibilityDates;
  /**
   * Enables debugging nitro (build time) hooks in the console.
   *
   * @see https://nitro.build/config#debug
   */
  debug: boolean;
  /**
   * Deployment preset name.
   *
   * Determines how the production bundle is built and optimized for a
   * specific hosting provider or runtime. Auto-detected in known
   * environments when not set. Use the `NITRO_PRESET` environment
   * variable as an alternative.
   *
   * @see https://nitro.build/config#preset
   */
  preset: PresetName;
  /**
   * Disable the server build and only output prerendered static assets.
   *
   * When `true`, the server bundle is skipped entirely and only the public directory is produced.
   * Typically used by the `static` preset and its derivatives (e.g., `github-pages`, `vercel-static`).
   *
   * Note: This does not enable prerendering on its own — configure `prerender` options separately.
   *
   * @see https://nitro.build/config#static
   */
  static: boolean;
  /**
   * Log verbosity level.
   *
   * Defaults to `3`, or `1` when a testing environment is detected.
   *
   * @see https://nitro.build/config#loglevel
   * @see https://github.com/unjs/consola
   */
  logLevel: LogLevel;
  /**
   * Server runtime configuration accessible via `useRuntimeConfig()`.
   *
   * Values can be overridden at runtime using environment variables with
   * the `NITRO_` prefix. An alternative prefix can be configured via
   * `runtimeConfig.nitro.envPrefix` or `NITRO_ENV_PREFIX`.
   *
   * **Note:** The `nitro` namespace is reserved for internal use.
   *
   * @example
   * ```ts
   * runtimeConfig: {
   *   apiSecret: "default-secret", // override with NITRO_API_SECRET
   * }
   * ```
   *
   * @see https://nitro.build/config#runtimeconfig
   */
  runtimeConfig: NitroRuntimeConfig;
  /**
   * Project workspace root directory.
   *
   * Auto-detected from the workspace (e.g. pnpm workspace) when not set.
   *
   * @see https://nitro.build/config#workspacedir
   */
  workspaceDir: string;
  /**
   * Project main root directory.
   *
   * @see https://nitro.build/config#rootdir
   */
  rootDir: string;
  /**
   * Server directory for scanning `api/`, `routes/`, `plugins/`, `utils/`,
   * `middleware/`, `modules/`, and `tasks/` folders.
   *
   * Set to `false` to disable automatic directory scanning, `"./"` to use
   * the root directory, or `"./server"` to use a `server/` subdirectory.
   *
   * @default false
   * @see https://nitro.build/config#serverdir
   */
  serverDir: string | false;
  /**
   * Additional directories to scan and auto-register files such as API
   * route handlers.
   *
   * @see https://nitro.build/config#scandirs
   */
  scanDirs: string[];
  /**
   * Directory name to scan for API route handlers.
   *
   * @default "api"
   * @see https://nitro.build/config#apidir
   */
  apiDir: string;
  /**
   * Directory name to scan for route handlers.
   *
   * @default "routes"
   * @see https://nitro.build/config#routesdir
   */
  routesDir: string;
  /**
   * Nitro's temporary working directory for build-related files.
   *
   * @default "node_modules/.nitro"
   * @see https://nitro.build/config#builddir
   */
  buildDir: string;
  /**
   * Output directories for the production bundle.
   *
   * @see https://nitro.build/config#output
   */
  output: {
    /** Production output root directory. */dir: string; /** Server bundle output directory. */
    serverDir: string; /** Public/static assets output directory. */
    publicDir: string;
  };
  /** @deprecated Migrate to `serverDir`. */
  srcDir: string;
  /**
   * Storage mount configuration.
   *
   * Keys are mount-point paths; values specify the unstorage driver and
   * its options.
   *
   * @see https://nitro.build/config#storage
   * @see https://nitro.build/docs/storage
   */
  storage: StorageMounts;
  /**
   * Storage mount overrides for development mode.
   *
   * Useful for swapping production drivers (e.g. Redis) with local
   * alternatives (e.g. filesystem) during development.
   *
   * @see https://nitro.build/config#devstorage
   * @see https://nitro.build/docs/storage
   */
  devStorage: StorageMounts;
  /**
   * Database connection configurations.
   *
   * Requires `experimental.database: true`.
   *
   * @see https://nitro.build/config#database
   * @see https://nitro.build/docs/database
   */
  database: DatabaseConnectionConfigs;
  /**
   * Database connection overrides for development mode.
   *
   * @see https://nitro.build/config#devdatabase
   * @see https://nitro.build/docs/database
   */
  devDatabase: DatabaseConnectionConfigs;
  /**
   * Server-side rendering entry configuration.
   *
   * Points to the main render handler (the file should export an event
   * handler as default). Set to `false` to disable.
   *
   * @see https://nitro.build/config#renderer
   * @see https://nitro.build/docs/renderer
   */
  renderer?: {
    handler?: string;
    static?: boolean;
    template?: string;
  };
  /**
   * Routes that should be server-side rendered.
   */
  ssrRoutes: string[];
  /**
   * Include a static asset handler in the server bundle to serve public assets.
   *
   * - `true` or `"node"` — read assets from the filesystem using Node.js `fs`.
   * - `"deno"` — read assets using Deno file APIs.
   * - `"inline"` — base64-encode assets directly into the server bundle.
   * - `false` — do not serve static assets from the server (rely on a CDN or reverse proxy).
   *
   * Most self-hosted presets (e.g. `node-server`, `bun`) enable this by default.
   *
   * @see https://nitro.build/config#servestatic
   */
  serveStatic: boolean | "node" | "deno" | "inline";
  /**
   * Disable the public output directory entirely.
   *
   * Skips preparing the `.output/public` directory, copying public
   * assets, and prerendering routes.
   *
   * @see https://nitro.build/config#nopublicdir
   */
  noPublicDir: boolean;
  tracingChannel?: undefined | TracingOptions;
  /**
   * Build manifest options.
   */
  manifest?: {
    /** Custom deployment identifier included in the build manifest. */deploymentId?: string;
  };
  /**
   * Built-in feature flags.
   *
   * @see https://nitro.build/config#features
   */
  features: {
    /**
     * Enable runtime hooks for request and response.
     *
     * By default this feature will be enabled if there is at least one nitro plugin.
     */
    runtimeHooks?: boolean;
    /**
     * Enable WebSocket support.
     */
    websocket?: boolean;
  };
  /**
   * Native wasm compatibility/bundling support configuration.
   *
   * Set to `false` to disable.
   *
   * @see https://nitro.build/config#wasm
   * @see https://github.com/unjs/unwasm
   */
  wasm?: false | UnwasmPluginOptions;
  /**
   * OpenAPI specification generation and UI configuration.
   *
   * @see https://nitro.build/config#openapi
   * @see https://nitro.build/docs/openapi
   */
  openAPI?: NitroOpenAPIConfig;
  /**
   * Experimental feature flags.
   *
   * These features are not yet stable and may change in future releases.
   *
   * @see https://nitro.build/config#experimental
   */
  experimental: {
    /**
     * Enable experimental OpenAPI support
     *
     * @see https://nitro.build/docs/openapi
     */
    openAPI?: boolean;
    /**
     * See https://github.com/microsoft/TypeScript/pull/51669
     */
    typescriptBundlerResolution?: boolean;
    /**
     * Enable native async context support for useRequest()
     */
    asyncContext?: boolean;
    /**
     * Set to `false` to disable sourcemap minification in production builds.
     *
     * Sourcemap minification is enabled by default when `sourcemap` is on.
     */
    sourcemapMinify?: false;
    /**
     * Allow env expansion in runtime config
     *
     * @see https://github.com/nitrojs/nitro/pull/2043
     */
    envExpansion?: boolean;
    /**
     * Enable WebSocket upgrade support
     *
     * @deprecated Use `features.websocket` instead.
     */
    websocket?: boolean;
    /**
     * Enable experimental Database support
     *
     * @see https://nitro.build/docs/database
     */
    database?: boolean;
    /**
     * Enable experimental Tasks support
     *
     * @see https://nitro.build/docs/tasks
     */
    tasks?: boolean;
  };
  /**
   * Future features pending a major version to avoid breaking changes.
   *
   * @see https://nitro.build/config#future
   */
  future: {
    /** Opt in to Nitro's native `isr` route rule handling on Vercel and suppress backwards-compatibility warnings for legacy `swr`/`static` route options. */nativeSWR?: boolean;
  };
  /**
   * Server-side asset directories bundled at build time.
   *
   * @see https://nitro.build/config#serverassets
   * @see https://nitro.build/docs/assets#server-assets
   */
  serverAssets: ServerAssetDir[];
  /**
   * Public asset directories served in development and bundled in production.
   *
   * A `public/` directory is added by default when detected.
   *
   * @see https://nitro.build/config#publicassets
   * @see https://nitro.build/docs/assets
   */
  publicAssets: PublicAssetDir[];
  /**
   * Auto-import configuration.
   *
   * Set to `false` to disable auto-imports. Pass an object to customize.
   *
   * @default false
   * @see https://nitro.build/config#imports
   * @see https://github.com/unjs/unimport
   */
  imports: Partial<UnimportPluginOptions> | false;
  /**
   * Nitro modules to extend behavior during initialization.
   *
   * Accepts module path strings, {@link NitroModule} objects, or bare setup functions.
   *
   * @see https://nitro.build/config#modules
   */
  modules?: NitroModuleInput[];
  /**
   * Paths to Nitro runtime plugins.
   *
   * Plugins in the `plugins/` directory are auto-registered.
   *
   * @see https://nitro.build/config#plugins
   * @see https://nitro.build/docs/plugins
   */
  plugins: string[];
  /**
   * Task definitions.
   *
   * Each key is a task name with a `handler` path and optional `description`.
   *
   * @example
   * ```ts
   * tasks: {
   *   "db:migrate": {
   *     handler: "./tasks/db-migrate",
   *     description: "Run database migrations",
   *   },
   * }
   * ```
   *
   * @see https://nitro.build/config#tasks
   * @see https://nitro.build/docs/tasks
   */
  tasks: {
    [name: string]: {
      handler?: string;
      description?: string;
    };
  };
  /**
   * Map of cron expressions to task name(s).
   *
   * @example
   * ```ts
   * scheduledTasks: {
   *   "0 * * * *": "cleanup:temp",
   *   "*​/5 * * * *": ["health:check", "metrics:collect"],
   * }
   * ```
   *
   * @see https://nitro.build/config#scheduledtasks
   * @see https://nitro.build/docs/tasks
   */
  scheduledTasks: {
    [cron: string]: string | string[];
  };
  /**
   * Virtual module definitions.
   *
   * A map from dynamic virtual import names to their contents or an async
   * function that returns them.
   *
   * @see https://nitro.build/config#virtual
   */
  virtual: Record<string, string | (() => string | Promise<string>)>;
  /**
   * Pre-compress public assets and prerendered routes.
   *
   * Generates gzip and brotli (and zstd when available)
   * variants of compressible assets larger than 1024 bytes. Pass an
   * object to selectively enable/disable each encoding.
   *
   * @see https://nitro.build/config#compresspublicassets
   */
  compressPublicAssets: boolean | CompressOptions;
  /**
   * Glob patterns to ignore when scanning directories.
   *
   * @see https://nitro.build/config#ignore
   */
  ignore: string[];
  /**
   * Whether the current build targets development mode.
   *
   * Defaults to `true` during development and `false` for production.
   *
   * @see https://nitro.build/config#dev
   */
  dev: boolean;
  /**
   * Development server options.
   *
   * @see https://nitro.build/config#devserver
   */
  devServer: {
    /** Port number for the dev server. */port?: number; /** Hostname for the dev server. */
    hostname?: string; /** Additional paths to watch for dev server reloads. */
    watch?: string[]; /** Runtime runner to use for the dev server. */
    runner?: RunnerName;
  };
  /**
   * File watcher options for development mode.
   *
   * @see https://nitro.build/config#watchoptions
   * @see https://github.com/paulmillr/chokidar
   */
  watchOptions: ChokidarOptions;
  /**
   * Proxy configuration for the development server.
   *
   * A map of path prefixes to proxy target URLs or options.
   *
   * @example
   * ```ts
   * devProxy: {
   *   "/proxy/test": "http://localhost:3001",
   *   "/proxy/example": { target: "https://example.com", changeOrigin: true },
   * }
   * ```
   *
   * @see https://nitro.build/config#devproxy
   * @see https://github.com/unjs/httpxy
   */
  devProxy: Record<string, string | ProxyServerOptions>;
  /**
   * Build logging behavior.
   *
   * @see https://nitro.build/config#logging
   */
  logging: {
    /** Report compressed bundle sizes after build. */compressedSizes?: boolean; /** Show the build success message. */
    buildSuccess?: boolean;
  };
  /**
   * Server's main base URL prefix.
   *
   * Can also be set via the `NITRO_APP_BASE_URL` environment variable.
   *
   * @default "/"
   * @see https://nitro.build/config#baseurl
   */
  baseURL: string;
  /**
   * Base URL prefix for API routes.
   *
   * @default "/api"
   * @see https://nitro.build/config#apibaseurl
   */
  apiBaseURL: string;
  /**
   * Custom server entry point configuration.
   *
   * Set to `false` to disable the default server entry.
   *
   * @see https://nitro.build/docs/server-entry
   */
  serverEntry: false | {
    handler: string;
    format?: EventHandlerFormat;
  };
  /**
   * Server handler registrations.
   *
   * Handlers in `routes/`, `api/`, and `middleware/` directories are
   * auto-registered when {@link NitroOptions.serverDir | serverDir} is set.
   *
   * @see https://nitro.build/config#handlers
   * @see https://nitro.build/docs/routing
   */
  handlers: NitroEventHandler[];
  /**
   * Development-only event handlers with inline handler functions.
   *
   * Not included in production builds.
   *
   * @see https://nitro.build/config#devhandlers
   */
  devHandlers: NitroDevEventHandler[];
  /**
   * Route rules applied to matching request paths.
   *
   * Supports caching, redirects, proxying, headers, CORS, and more.
   * Rules are matched using rou3 patterns and deep-merged when multiple
   * patterns match.
   *
   * @see https://nitro.build/config#routerules
   * @see https://nitro.build/docs/routing#route-rules
   */
  routeRules: {
    [path: string]: NitroRouteRules;
  };
  /**
   * Inline route definitions.
   *
   * A map from route pattern to handler path or handler options.
   *
   * @see https://nitro.build/config#routes
   */
  routes: Record<string, string | Omit<NitroEventHandler, "route" | "middleware">>;
  /**
   * Path(s) to custom runtime error handler(s).
   *
   * Custom handlers run before the built-in error handler, which is
   * always added as a fallback.
   *
   * @see https://nitro.build/config#errorhandler
   */
  errorHandler: string | string[];
  /**
   * Custom error handler function for development mode.
   *
   * @see https://nitro.build/config#deverrorhandler
   */
  devErrorHandler: NitroErrorHandler;
  /**
   * Prerendering options.
   *
   * Routes specified here are fetched during the build and copied to
   * `.output/public` as static assets.
   *
   * @see https://nitro.build/config#prerender
   */
  prerender: {
    /**
     * Prerender HTML routes within subfolders (`/test` produces `/test/index.html`).
     */
    autoSubfolderIndex?: boolean; /** Maximum number of concurrent prerender requests. */
    concurrency?: number; /** Delay in milliseconds between prerender requests. */
    interval?: number; /** Crawl `<a>` tags in prerendered HTML to discover additional routes. */
    crawlLinks?: boolean; /** Fail the build when a route cannot be prerendered. */
    failOnError?: boolean; /** Patterns (string, RegExp, or function) of routes to skip. */
    ignore?: Array<string | RegExp | ((path: string) => undefined | null | boolean)>; /** Skip prerendering assets without a base URL prefix. */
    ignoreUnprefixedPublicAssets?: boolean; /** Explicit list of routes to prerender. */
    routes?: string[];
    /**
     * Amount of retries. Pass Infinity to retry indefinitely.
     * @default 3
     */
    retry?: number;
    /**
     * Delay between each retry in ms.
     * @default 500
     */
    retryDelay?: number;
  };
  /**
   * Bundler to use for production builds.
   *
   * Auto-detected when not set: `"vite"` if a `vite.config` with the
   * `nitro()` plugin is found, otherwise `"rolldown"` (bundled with Nitro).
   * Use the `NITRO_BUILDER` environment variable as an alternative.
   *
   * @see https://nitro.build/config#builder
   */
  builder?: "rollup" | "rolldown" | "vite";
  /**
   * Additional Rollup configuration.
   *
   * @see https://nitro.build/config#rollupconfig
   */
  rollupConfig?: RollupConfig;
  /**
   * Additional Rolldown configuration.
   *
   * @see https://nitro.build/config#rolldownconfig
   */
  rolldownConfig?: RolldownConfig;
  /**
   * Bundler entry point path.
   *
   * @see https://nitro.build/config#entry
   */
  entry: string;
  /**
   * unenv preset(s) for environment compatibility polyfills.
   *
   * @see https://nitro.build/config#unenv
   * @see https://github.com/unjs/unenv
   */
  unenv: Preset[];
  /**
   * Path aliases for module resolution.
   *
   * @example
   * ```ts
   * alias: {
   *   "~utils": "./src/utils",
   *   "#shared": "./shared",
   * }
   * ```
   *
   * @see https://nitro.build/config#alias
   */
  alias: Record<string, string>;
  /**
   * Minify the production bundle.
   *
   * @see https://nitro.build/config#minify
   */
  minify: boolean;
  /**
   * Bundle all code into a single file instead of separate chunks.
   *
   * When `false`, each route handler becomes a separate chunk loaded
   * on-demand. Some presets enable this by default.
   *
   * @see https://nitro.build/config#inlinedynamicimports
   */
  inlineDynamicImports: boolean;
  /**
   * Enable source map generation.
   *
   * @see https://nitro.build/config#sourcemap
   */
  sourcemap: boolean;
  /**
   * Target a Node.js-compatible runtime.
   *
   * When `true` (default), the bundler targets the `node` platform, prefers
   * Node.js built-in modules, and enables dependency externalization.
   *
   * When `false`, Nitro prepends the `nodeless` unenv preset to polyfill
   * Node.js globals and built-ins for non-Node runtimes (workers, edge, Deno).
   *
   * @see https://nitro.build/config#node
   */
  node: boolean;
  /**
   * OXC options for Rolldown builds (minification and transforms).
   *
   * @see https://nitro.build/config#oxc
   */
  oxc?: OXCOptions;
  /**
   * Build-time string replacements.
   *
   * @see https://nitro.build/config#replace
   */
  replace: Record<string, string | ((id: string) => string)>;
  /**
   * Additional configuration for the Rollup CommonJS plugin.
   *
   * @see https://nitro.build/config#commonjs
   */
  commonJS?: RollupCommonJSOptions;
  /**
   * Custom export conditions for module resolution.
   *
   * @see https://nitro.build/config#exportconditions
   */
  exportConditions?: string[];
  /**
   * Prevent packages from being externalized.
   *
   * Set to `true` to bundle all dependencies, or pass an array of
   * package names or patterns.
   *
   * @see https://nitro.build/config#noexternals
   */
  noExternals?: boolean | (string | RegExp)[];
  /**
   * Additional dependencies to trace and include in the build output.
   *
   * Supports `!pkg` to exclude and `pkg*` for full package trace.
   *
   * @see https://nitro.build/config#tracedeps
   */
  traceDeps?: (string | RegExp)[];
  /**
   * Advanced options for dependency tracing via nf3.
   *
   * @see https://nitro.build/config#traceopts
   * @see https://github.com/nicolo-ribaudo/nf3
   */
  traceOpts?: Pick<ExternalsTraceOptions, "nft" | "traceAlias" | "chmod" | "transform" | "hooks">;
  /**
   * TypeScript configuration options.
   *
   * @see https://nitro.build/config#typescript
   */
  typescript: {
    /** Enable strict TypeScript checks. */strict?: boolean; /** Generate types for runtime config. */
    generateRuntimeConfigTypes?: boolean; /** Generate a `tsconfig.json` in the build directory. */
    generateTsConfig?: boolean; /** Custom tsconfig overrides. */
    tsConfig?: Partial<TSConfig>;
    /**
     * Path of the generated types directory.
     *
     * @default "node_modules/.nitro/types"
     */
    generatedTypesDir?: string;
    /**
     * Path of the generated `tsconfig.json` relative to `typescript.generatedTypesDir`.
     *
     * @default "tsconfig.json"
     */
    tsconfigPath?: string;
  };
  /**
   * Nitro lifecycle hooks.
   *
   * @see https://nitro.build/config#hooks
   * @see https://nitro.build/docs/lifecycle
   * @see https://github.com/unjs/hookable
   */
  hooks: NestedHooks<NitroHooks>;
  /**
   * Preview and deploy command hints (usually filled by deployment presets).
   *
   * @see https://nitro.build/config#commands
   */
  commands: {
    /** Command to preview the production build locally. */preview?: string; /** Command to deploy the production build. */
    deploy?: string;
  };
  /**
   * Metadata about the higher-level framework using Nitro (e.g. Nuxt).
   *
   * Used by presets and included in build info output.
   *
   * @see https://nitro.build/config#framework
   */
  framework: NitroFrameworkInfo;
  /**
   * IIS-specific deployment options.
   */
  iis?: {
    /** Merge with existing IIS `web.config` instead of replacing. */mergeConfig?: boolean; /** Override existing IIS `web.config` entirely. */
    overrideConfig?: boolean;
  };
}
/**
 * User-facing Nitro configuration used in `nitro.config.ts` or
 * `defineNitroConfig()`.
 *
 * All properties are optional and will be merged with defaults and preset
 * values to produce the fully resolved {@link NitroOptions}.
 *
 * @see https://nitro.build/config
 * @see https://nitro.build/docs/configuration
 */
interface NitroConfig extends Partial<Omit<NitroOptions, "routeRules" | "rollupConfig" | "preset" | "compatibilityDate" | "unenv" | "serverDir" | "_config" | "_c12" | "serverEntry" | "renderer" | "output" | "tracingChannel">>, C12InputConfig<NitroConfig> {
  preset?: PresetNameInput;
  /**
   * Customize the preset used as the **fallback** when no `preset` is set and
   * none of the known hosting providers are auto-detected.
   *
   * By default, Nitro falls back to the runtime-based preset (`node`, and
   * `deno` or `bun` when running on those runtimes). An explicit `preset`,
   * the `NITRO_PRESET` environment variable, and auto-detected providers
   * (Vercel, Netlify, Cloudflare Pages, …) all take precedence over this.
   *
   * Accepts a preset name or an inline preset definition.
   *
   * @see https://nitro.build/config#defaultpreset
   */
  defaultPreset?: PresetNameInput | NitroPreset;
  extends?: string | string[] | NitroPreset;
  routeRules?: {
    [path: string]: NitroRouteConfig;
  };
  rollupConfig?: Partial<RollupConfig>;
  compatibilityDate?: CompatibilityDateSpec;
  unenv?: Preset | Preset[];
  serverDir?: boolean | "./" | "./server" | (string & {});
  serverEntry?: string | NitroOptions["serverEntry"];
  renderer?: false | NitroOptions["renderer"];
  output?: Partial<NitroOptions["output"]>;
  tracingChannel?: boolean | TracingOptions;
}
/** Options for loading Nitro configuration via c12. */
interface LoadConfigOptions {
  watch?: boolean;
  c12?: WatchConfigOptions;
  compatibilityDate?: CompatibilityDateSpec;
  dotenv?: boolean | DotenvOptions;
}
/**
 * Configuration for a public asset directory served in development and
 * bundled in production.
 *
 * @see https://nitro.build/config#publicassets
 * @see https://nitro.build/docs/assets
 */
interface PublicAssetDir {
  /** URL prefix under which these assets are served. */
  baseURL?: string;
  /** Fall through to the next handler when the asset is not found. */
  fallthrough?: boolean;
  /** `Cache-Control` max-age value in seconds. */
  maxAge: number;
  /** Filesystem path to the asset directory. */
  dir: string;
  /**
   * Pass `false` to disable ignore patterns when scanning the directory,
   * or pass an array of glob patterns to ignore (overrides global
   * `nitro.ignore` patterns).
   */
  ignore?: false | string[];
}
/**
 * Pre-compression options for public assets and prerendered routes.
 *
 * @see https://nitro.build/config#compresspublicassets
 */
interface CompressOptions {
  /** Enable gzip pre-compression. */
  gzip?: boolean;
  /** Enable brotli pre-compression. */
  brotli?: boolean;
  /** Enable zstd pre-compression. */
  zstd?: boolean;
}
/**
 * Configuration for a server-side asset directory bundled at build time.
 *
 * @see https://nitro.build/config#serverassets
 * @see https://nitro.build/docs/assets#server-assets
 */
interface ServerAssetDir {
  /** Logical name used to access the asset group at runtime. */
  baseName: string;
  /** Glob pattern to filter files within the directory. */
  pattern?: string;
  /** Filesystem path to the asset directory. */
  dir: string;
  /** Glob patterns to ignore when scanning the directory. */
  ignore?: string[];
}
interface TracingOptions {
  srvx?: boolean;
  h3?: boolean;
  unstorage?: boolean;
}
/**
 * Storage mount configuration mapping mount points to driver options.
 *
 * Keys are storage mount-point paths; values specify the unstorage driver
 * and its options.
 *
 * @see https://nitro.build/config#storage
 * @see https://nitro.build/docs/storage
 */
type CustomDriverName = string & {
  _custom?: any;
};
interface StorageMounts {
  [path: string]: {
    driver: BuiltinDriverName | CustomDriverName;
    [option: string]: any;
  };
}
/** Logical database connection name. Defaults to `"default"`. */
type DatabaseConnectionName = "default" | (string & {});
/**
 * Database connection configuration specifying a db0 connector and options.
 *
 * @see https://nitro.build/config#database
 * @see https://nitro.build/docs/database
 */
type DatabaseConnectionConfig = {
  connector: ConnectorName;
  options?: {
    [key: string]: any;
  };
};
/** Map of {@link DatabaseConnectionName} to {@link DatabaseConnectionConfig}. */
type DatabaseConnectionConfigs = Record<DatabaseConnectionName, DatabaseConnectionConfig>;
/** Application-specific runtime configuration. */
interface NitroRuntimeConfigApp {
  [key: string]: any;
}
/**
 * Server runtime configuration accessible via `useRuntimeConfig()`.
 *
 * Values can be overridden at runtime using environment variables with
 * the `NITRO_` prefix. An alternative prefix can be configured via
 * `nitro.envPrefix` or `NITRO_ENV_PREFIX`.
 *
 * @see https://nitro.build/config#runtimeconfig
 */
interface NitroRuntimeConfig {
  nitro?: {
    envPrefix?: string;
    envExpansion?: boolean;
    routeRules?: {
      [path: string]: NitroRouteConfig;
    };
    openAPI?: NitroOpenAPIConfig;
  };
  [key: string]: any;
}
interface NitroImportMeta {
  dev?: boolean;
  preset?: NitroOptions["preset"];
  prerender?: boolean;
  nitro?: boolean;
  server?: boolean;
  client?: boolean;
  baseURL?: string;
  runtimeConfig?: Record<string, any>;
  _asyncContext?: boolean;
  _tasks?: boolean;
  _websocket?: boolean;
}
declare global {
  interface ImportMeta extends NitroImportMeta {}
}
type H3EventFetch = (request: NitroFetchRequest, init?: RequestInit) => Promise<Response>;
type H3Event$Fetch = Base$Fetch<unknown, NitroFetchRequest>;
declare module "srvx" {
  interface ServerRequestContext {
    routeRules?: MatchedRouteRules;
    nitro?: {
      runtimeConfig?: NitroRuntimeConfig;
      errors?: {
        error?: Error;
        context: CapturedErrorContext;
      }[];
    };
    cache?: {
      options?: CacheOptions;
    };
  }
}
export { $Fetch, AssetMeta, AvailableRouterMethod, Base$Fetch, type CacheEntry, type CacheOptions, CachedEventHandlerOptions, CaptureError, CapturedErrorContext, CompressOptions, DatabaseConnectionConfig, DatabaseConnectionConfigs, DatabaseConnectionName, type EnvRunner, EventHandlerFormat, ExtractedRouteMethod, type FetchHandler, H3Event$Fetch, H3EventFetch, HTTPstatus, InternalApi, LoadConfigOptions, MatchedRouteRule, MatchedRouteRules, MatchedRoutes, MiddlewareOf, Nitro, NitroApp, NitroAppPlugin, NitroAsyncContext, NitroBuildInfo, NitroConfig, NitroDevEventHandler, NitroDynamicConfig, NitroErrorHandler, NitroEventHandler, NitroFetchOptions, NitroFetchRequest, NitroFrameworkInfo, NitroHooks, NitroImportMeta, NitroMeta, NitroModule, NitroModuleInput, type NitroOpenAPIConfig, NitroOptions, NitroPreset, NitroPresetMeta$1 as NitroPresetMeta, NitroRouteConfig, NitroRouteMeta, NitroRouteRules, NitroRuntimeConfig, NitroRuntimeConfigApp, NitroRuntimeHooks, NitroTypes, OXCOptions, PrerenderGenerateRoute, PrerenderRoute, PublicAsset, PublicAssetDir, RenderContext, RenderHandler, RenderResponse, type ResponseCacheEntry, RolldownConfig, RollupConfig, type RunnerMessageListener, type RunnerRPCHooks, Serialize, SerializeObject, SerializeTuple, ServerAssetDir, type ServerRequest, Simplify, StorageMounts, Task, TaskContext, TaskEvent, TaskMeta, TaskPayload, TaskResult, TaskRunnerOptions, TracingOptions, TypedInternalResponse, type UpgradeHandler, VercelISRConfig, type WorkerAddress, type WorkerHooks };