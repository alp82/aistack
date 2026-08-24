import { WorkerHooks } from "./types.mjs";
import { BaseEnvRunner, EnvRunnerData } from "./common-base-runner.mjs";
import { IncomingMessage } from "node:http";
import { Socket } from "node:net";
/** Raw (snake_case) Wrangler config object, mirroring `wrangler.json` contents. */
type WranglerInlineConfig = Record<string, unknown>;
/** Result from a module transform (compatible with Vite's `TransformResult`). */
interface TransformResult {
  code: string;
}
/** Detected or declared export for auto-wiring Durable Object / Entrypoint bindings. */
interface MiniflareExportInfo {
  type?: "DurableObject" | "WorkerEntrypoint" | "class";
}
interface MiniflareEnvRunnerOptions {
  name: string;
  hooks?: WorkerHooks;
  data?: EnvRunnerData;
  /** Options passed directly to the Miniflare constructor. */
  miniflareOptions?: Record<string, unknown>;
  /**
   * Optional module transform callback. When provided, the module fallback
   * service calls this instead of reading raw files from disk.
   *
   * This enables integration with Vite's transform pipeline — pass
   * `environment.transformRequest` to get TS/JSX/etc. compiled on the fly.
   *
   * @param id - Absolute file path of the module to transform
   * @returns Transformed code, or null/undefined to fall back to raw disk read
   */
  transformRequest?: (id: string) => Promise<TransformResult | null | undefined>;
  /**
   * Declare named exports (Durable Objects, WorkerEntrypoints) to auto-wire
   * bindings and generate re-exports in the wrapper module.
   *
   * When set to `true`, `export class` declarations are auto-detected from
   * the entry file. When set to a record, the listed exports are used
   * (merged with auto-detected ones). Disabled by default.
   */
  exports?: Record<string, MiniflareExportInfo> | boolean;
  /**
   * When `true`, the Miniflare instance is cached and reused across runner
   * swaps (e.g. via `RunnerManager.reload()`). `close()` tears down IPC but
   * keeps Miniflare alive. Call `dispose()` to fully destroy it.
   */
  persistent?: boolean;
  /** Wrap the user's `fetch` in a try/catch that returns structured JSON error responses. Default: `true`. */
  captureErrors?: boolean;
  /**
   * Export conditions for bare-specifier module resolution in the module
   * fallback service. Ensures packages with conditional exports (e.g.
   * `"workerd"`) resolve to the correct entry instead of the Node.js one.
   *
   * Defaults to `["workerd", "worker"]`.
   */
  exportConditions?: string[];
  /**
   * Load a Cloudflare `wrangler` config to populate Miniflare options
   * (compatibility date/flags and bindings: `vars`, KV, R2, D1, Durable
   * Objects, queues).
   *
   * - `true` — auto-discover `wrangler.{json,jsonc,toml}` next to the entry
   *   file, then in the current working directory.
   * - `string` — explicit path to a wrangler config file.
   * - `object` — an inline raw (snake_case) wrangler config, as you would
   *   write in `wrangler.json` (no file needed). A config file is still
   *   auto-discovered (next to the entry, then cwd) and the inline config is
   *   merged on top of it (inline wins per key, binding records merge,
   *   `compatibilityFlags` are unioned).
   *
   * The installed `wrangler` package is preferred (full fidelity: TOML,
   * `env` inheritance, `.dev.vars`, every binding type; an inline config is
   * normalized through a short-lived temp file). When `wrangler` is not
   * installed, a built-in minimal reader handles plain JSON files and inline
   * objects (common fields only) and a one-time warning is logged. JSONC and
   * TOML files without `wrangler` are skipped with a warning. Values from
   * `miniflareOptions` always win over config-derived ones; binding records
   * (e.g. `bindings`) merge per key and `compatibilityFlags` are unioned.
   */
  wrangler?: boolean | string | WranglerInlineConfig;
  /**
   * Wrangler environment (`--env`) to select when loading the config.
   * Defaults to the `CLOUDFLARE_ENV` environment variable.
   */
  wranglerEnv?: string;
}
declare class MiniflareEnvRunner extends BaseEnvRunner {
  #private;
  constructor(opts: MiniflareEnvRunnerOptions);
  /** Dispose all persistent Miniflare instances from the cache. */
  static disposeAll(): Promise<void>;
  /** Fully dispose the Miniflare instance (even if persistent). */
  dispose(): Promise<void>;
  fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;
  sendMessage(message: unknown): void;
  /**
   * Hot-reload the user entry module without recreating the Miniflare instance.
   *
   * Sends `reload-module` event over the WebSocket. The worker wrapper uses
   * `unsafeEvalBinding` to re-import the entry with a cache-busting query string
   * and responds with `module-reloaded` when done.
   */
  reloadModule(timeout?: number): Promise<void>;
  /**
   * Invalidate a virtual module so the next `reloadModule()` re-evaluates it.
   *
   * Host-side only (no worker round-trip): the module fallback service serves
   * virtual sources from a live map, so re-running a factory source and
   * bumping the per-specifier versions — the module plus its transitive
   * virtual importers — is enough. Import specifiers in re-served module code
   * are rewritten to the versioned form, giving workerd fresh module
   * identities (it caches by name). A `persistent` instance is evicted from
   * the cache, since its served sources no longer match the cache key.
   */
  invalidateModule(specifier: string, _timeout?: number): Promise<void>;
  protected _hasRuntime(): boolean;
  protected _runtimeType(): string;
  protected _closeRuntime(): Promise<void>;
  upgrade(context: {
    node: {
      req: IncomingMessage;
      socket: Socket;
      head: any;
    };
  }): Promise<void>;
}
export { MiniflareEnvRunner, MiniflareEnvRunnerOptions, MiniflareExportInfo, TransformResult, WranglerInlineConfig };