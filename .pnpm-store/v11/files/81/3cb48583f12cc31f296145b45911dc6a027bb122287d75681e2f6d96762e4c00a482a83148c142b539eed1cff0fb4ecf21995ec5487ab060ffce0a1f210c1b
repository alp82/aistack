import { EnvRunner, RunnerMessageListener, WorkerAddress, WorkerHooks } from "./types.mjs";
import { IncomingMessage } from "node:http";
import { Socket } from "node:net";
/**
 * Source for a virtual module: either a literal ES module string or a factory
 * that returns one (sync or async).
 *
 * Factories are evaluated **once on the host side** before the worker is spawned
 * (functions can't cross the `workerData`/`JSON` boundary, and Node's synchronous
 * load hook can't await), so the worker always receives plain strings. See
 * {@link resolveVirtualModules}.
 */
type VirtualModuleSource = string | (() => string | Promise<string>);
/** Virtual modules as a `specifier => source` map. */
type VirtualModules = Record<string, VirtualModuleSource>;
interface EnvRunnerData {
  name?: string;
  /**
   * Virtual modules as a `specifier => source` map.
   *
   * Registered as Node.js ESM customization hooks in the worker so the entry
   * (and its dependencies) can `import` them, e.g.
   * `{ "#virtual-import": "export const foo = 1" }`.
   *
   * Each source may be a string or a factory `() => string | Promise<string>`.
   * Factories are evaluated once on the host before the worker is spawned (so the
   * worker always receives plain strings).
   *
   * Supported by the `node-worker`, `node-process`, `bun-process`,
   * `deno-process`, `vercel`, `netlify`, and `miniflare` runners.
   */
  virtual?: VirtualModules;
  [key: string]: unknown;
}
declare abstract class BaseEnvRunner implements EnvRunner, AsyncDisposable {
  closed: boolean;
  protected _name: string;
  protected _workerEntry: string;
  protected _data?: EnvRunnerData;
  protected _virtualSources?: VirtualModules;
  protected _hooks: Partial<WorkerHooks>;
  protected _address?: WorkerAddress;
  protected _messageListeners: Set<(data: unknown) => void>;
  protected _pendingRequests: Set<(cause?: unknown) => void>;
  protected _virtualResolved?: Promise<void>;
  constructor(opts: {
    name: string;
    workerEntry: string;
    hooks?: WorkerHooks;
    data?: EnvRunnerData;
  });
  get ready(): boolean;
  get address(): WorkerAddress | undefined;
  fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;
  upgrade(context: {
    node: {
      req: IncomingMessage;
      socket: Socket;
      head: any;
    };
  }): Promise<void>;
  abstract sendMessage(message: unknown): void;
  onMessage(listener: RunnerMessageListener): void;
  offMessage(listener: RunnerMessageListener): void;
  waitForReady(timeout?: number): Promise<void>;
  rpc<T = unknown>(name: string, data?: unknown, opts?: {
    timeout?: number;
  }): Promise<T>;
  reloadModule(timeout?: number): Promise<void>;
  /**
   * Invalidate a virtual module so the next `reloadModule()` re-evaluates it.
   * A factory-valued `data.virtual` source is re-run on the host and the fresh
   * source is shipped to the worker along with the invalidation. Rejects when
   * the specifier is not a registered virtual module.
   */
  invalidateModule(specifier: string, timeout?: number): Promise<void>;
  close(cause?: unknown): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
  /**
   * Resolve a relative fetch input (e.g. `"/path"`) against a placeholder
   * `http://localhost` origin so it parses as a full URL. The origin is a
   * placeholder — requests are dispatched to the worker address regardless.
   */
  protected _resolveFetchInput(input: string | URL | Request): string | URL | Request;
  protected _handleMessage(message: any): void;
  /**
   * Send a message and await a matching response message. Shared by `rpc()`,
   * `reloadModule()`, and `invalidateModule()`. Rejects on timeout, on a
   * response carrying an `error`, and promptly when the runner closes mid-wait
   * (instead of letting callers wait out the timeout on a dead worker).
   */
  protected _request<T = unknown>(message: unknown, opts: {
    match: (msg: any) => boolean;
    timeout: number;
    timeoutError: string;
    send?: (message: unknown) => void;
  }): Promise<T>;
  /**
   * Resolve any factory-valued `data.virtual` sources to strings before the
   * worker is spawned. Returns a pending promise only when there is async work
   * to do (a factory is present); otherwise returns `undefined` so subclasses can
   * keep their synchronous spawn path. Factories must be resolved here because
   * functions can't cross the worker boundary and the load hook can't await.
   */
  protected _resolveVirtualData(): Promise<void> | undefined;
  /**
   * Re-run a factory-valued virtual source on the host and sync the resolved
   * `data.virtual` map. Returns the fresh source, or `undefined` when the
   * source is a plain string or unknown (nothing to re-evaluate).
   */
  protected _refreshVirtualSource(specifier: string): Promise<string | undefined>;
  /**
   * Run a subclass spawn callback after `data.virtual` is resolved.
   * Synchronous when no factory-valued source is present; otherwise defers
   * `init` until factories resolve. A throwing/rejecting factory closes the
   * runner with the error as cause instead of leaving an unhandled rejection.
   */
  protected _initWithVirtualData(init: () => void): void;
  protected _closeSocket(): Promise<void>;
  protected abstract _hasRuntime(): boolean;
  protected abstract _closeRuntime(): Promise<void>;
  protected abstract _runtimeType(): string;
}
export { BaseEnvRunner, EnvRunnerData, VirtualModuleSource, VirtualModules };