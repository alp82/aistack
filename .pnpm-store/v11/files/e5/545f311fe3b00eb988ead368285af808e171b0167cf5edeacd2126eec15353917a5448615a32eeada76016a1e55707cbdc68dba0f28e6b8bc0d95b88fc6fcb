import { EnvRunner, FetchHandler, NodeUpgradeContext, RPCOptions, RunnerMessageListener, RunnerRPCHooks, UpgradeContext, UpgradeHandler, WorkerAddress, WorkerHooks } from "./_chunks/types.mjs";
import { BaseEnvRunner, EnvRunnerData, VirtualModuleSource, VirtualModules } from "./_chunks/common-base-runner.mjs";
import { DenoProcessEnvRunner } from "./_chunks/deno-process-runner.mjs";
import { MiniflareEnvRunner, MiniflareEnvRunnerOptions, MiniflareExportInfo, TransformResult } from "./_chunks/miniflare-runner.mjs";
import { VercelEnvRunner } from "./_chunks/vercel-runner.mjs";
import { NetlifyEnvRunner } from "./_chunks/netlify-runner.mjs";
import { ServerOptions, ServerPlugin } from "srvx";
import { Hooks } from "crossws";
/**
 * Manages an active `EnvRunner` instance, proxying all calls to it.
 * Supports hot-reload, auto-restart on unexpected exit, and message queueing.
 */
declare class RunnerManager implements EnvRunner, AsyncDisposable {
  private _runner;
  private _messageQueue;
  private _messageListeners;
  private _closed;
  private _reloading;
  private _moduleInvalidated;
  private _pendingModuleReload;
  private _closeListeners;
  private _readyListeners;
  private _readyRejectors;
  constructor(runner?: EnvRunner);
  get ready(): boolean;
  get closed(): boolean;
  get address(): WorkerAddress | undefined;
  /**
   * Replace the active runner with a new one. Closes the previous runner.
   *
   * When called without a runner, a fresh one is created via `_createRunner()`
   * (only available on subclasses with a runner factory, e.g. `EnvServer`).
   */
  reload(runner?: EnvRunner): Promise<void>;
  /** Create a fresh runner for argument-less `reload()`. Overridden by subclasses with a runner factory. */
  protected _createRunner(): EnvRunner | Promise<EnvRunner>;
  fetch: FetchHandler;
  protected _fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;
  /**
   * Lazily satisfy a pending `invalidateModule()` with a single entry reload
   * before serving — concurrent fetches share the same reload. A failed reload
   * keeps the invalidation pending, so the next fetch retries.
   */
  private _flushInvalidation;
  upgrade: UpgradeHandler;
  /**
   * Create a runtime-native WebSocket reverse-proxy plugin for the public srvx
   * server. Attach it via `serve({ plugins: [await manager.wsSrvxPlugin()] })`:
   * on Node it proxies the raw upgrade socket to the worker, and on Bun/Deno it
   * bridges the WebSocket with crossws. The plugin reads the active runner
   * lazily, so it keeps working across hot-reloads.
   */
  wsSrvxPlugin(): Promise<ServerPlugin>;
  sendMessage(message: unknown): void;
  onMessage(listener: RunnerMessageListener): void;
  offMessage(listener: RunnerMessageListener): void;
  waitForReady(timeout?: number): Promise<void>;
  rpc<T = unknown>(name: string, data?: unknown, opts?: {
    timeout?: number;
  }): Promise<T>;
  reloadModule(timeout?: number): Promise<void>;
  /**
   * Invalidate a virtual module on the active runner and mark the manager
   * dirty: the next `fetch()` reloads the entry automatically, so callers
   * don't need to pair the call with an explicit `reloadModule()`.
   */
  invalidateModule(specifier: string, timeout?: number): Promise<void>;
  close(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
  onClose(listener: (runner: EnvRunner, cause?: unknown) => void): void;
  offClose(listener: (runner: EnvRunner, cause?: unknown) => void): void;
  onReady(listener: (runner: EnvRunner, address?: WorkerAddress) => void): void;
  offReady(listener: (runner: EnvRunner, address?: WorkerAddress) => void): void;
  private _internalListener;
  private _attach;
  private _detach;
  private _waitForRunner;
  private _flushQueue;
}
type RunnerName = "node-worker" | "node-process" | "bun-process" | "deno-process" | "self" | "miniflare" | "vercel" | "netlify";
interface LoadRunnerOptions {
  name: string;
  workerEntry?: string;
  hooks?: WorkerHooks;
  data?: EnvRunnerData;
  execArgv?: string[];
  /** Additional runner-specific options (passed through to the runner constructor). */
  [key: string]: unknown;
}
declare function loadRunner(runner: RunnerName, opts: LoadRunnerOptions): Promise<EnvRunner>;
interface EnvServerOptions {
  /** Runner implementation to use (defaults to `"node-worker"`). */
  runner?: RunnerName;
  /** Path to the user entry module (passed as `data.entry`). */
  entry: string;
  /** Runner instance name. */
  name?: string;
  /** Lifecycle hooks. */
  hooks?: WorkerHooks;
  /** Additional data passed to the runner. */
  data?: Record<string, unknown>;
  /** Custom exec arguments (e.g. `--inspect`). */
  execArgv?: string[];
  /** Enable watch mode to auto-reload on entry file changes. */
  watch?: boolean;
  /** Additional paths to watch (directories or files). */
  watchPaths?: string[];
}
declare class EnvServer extends RunnerManager {
  private _opts;
  private _watchers;
  private _reloadTimeout;
  private _reloadListeners;
  private _startPromise;
  runner: Awaited<ReturnType<typeof loadRunner>> | null;
  /** Register a listener called when the runner is reloaded due to a file change. */
  onReload(listener: () => void): void;
  /** Remove a previously registered reload listener. */
  offReload(listener: () => void): void;
  constructor(opts: EnvServerOptions);
  /**
   * Start the server by loading and attaching the runner.
   *
   * Idempotent — concurrent and repeated calls share one startup. Calling
   * `start()` explicitly is optional: the first `fetch()` auto-starts the
   * server. A failed start resets so a later call can retry.
   */
  start(): Promise<this>;
  /**
   * Replace the active runner. When called without an argument, a fresh
   * runner is created from the server options.
   */
  reload(runner?: EnvRunner): Promise<void>;
  close(): Promise<void>;
  /** Auto-start on first fetch so an explicit `start()` call is optional. */
  protected _fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;
  private _start;
  protected _createRunner(): Promise<EnvRunner>;
  private _startWatching;
  private _stopWatching;
  private _scheduleReload;
}
interface AppEntryIPCContext {
  sendMessage: (message: unknown) => void;
}
interface AppEntryIPC {
  onOpen?: (ctx: AppEntryIPCContext) => void | Promise<void>;
  onMessage?: (message: unknown) => void | Promise<void>;
  onClose?: () => void | Promise<void>;
}
interface AppEntry {
  fetch: ServerOptions["fetch"];
  upgrade?: (context: UpgradeContext) => void;
  websocket?: Partial<Hooks>;
  middleware?: ServerOptions["middleware"];
  plugins?: ServerOptions["plugins"];
  ipc?: AppEntryIPC;
}
export { type AppEntry, type AppEntryIPC, type AppEntryIPCContext, BaseEnvRunner, DenoProcessEnvRunner, type EnvRunnerData as DenoProcessEnvRunnerData, type EnvRunner, type EnvRunnerData, EnvServer, type EnvServerOptions, type FetchHandler, type LoadRunnerOptions, MiniflareEnvRunner, type MiniflareEnvRunnerOptions, type MiniflareExportInfo, NetlifyEnvRunner, type NodeUpgradeContext, type RPCOptions, RunnerManager, type RunnerMessageListener, type RunnerName, type RunnerRPCHooks, type TransformResult, type UpgradeContext, type UpgradeHandler, VercelEnvRunner, type VirtualModuleSource, type VirtualModules, type WorkerAddress, type WorkerHooks, loadRunner };