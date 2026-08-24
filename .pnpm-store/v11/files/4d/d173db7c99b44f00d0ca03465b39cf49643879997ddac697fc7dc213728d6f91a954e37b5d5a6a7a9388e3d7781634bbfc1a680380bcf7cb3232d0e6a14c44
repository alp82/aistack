import { Hooks, MaybePromise } from "./adapter.mjs";
import { BunOptions } from "./bun.mjs";
import { BunnyOptions } from "./bunny.mjs";
import { CloudflareOptions } from "./cloudflare.mjs";
import { DenoOptions } from "./deno.mjs";
import { NodeOptions } from "./node.mjs";
import { SSEOptions } from "./sse.mjs";
import { Server, ServerOptions, ServerPlugin, ServerRequest } from "srvx";
type WSOptions = Partial<Hooks> & {
  /**
   * Resolve the WebSocket hooks for an incoming request.
   *
   * When omitted, hooks are resolved by calling the server's `fetch` handler
   * and reading the `crossws` property off the returned `Response`. Provide
   * `resolve` only to customize routing (e.g. resolve hooks without invoking
   * the app). The default is skipped when inline hooks are passed directly
   * (e.g. `ws({ message })`), which run with zero per-event overhead instead.
   */
  resolve?: (req: ServerRequest) => Partial<Hooks> | Promise<Partial<Hooks>>;
  options?: {
    bun?: BunOptions;
    bunny?: BunnyOptions;
    deno?: DenoOptions;
    node?: NodeOptions;
    sse?: SSEOptions;
    cloudflare?: CloudflareOptions;
  };
};
/**
 * Value the app `fetch` handler may return for a WebSocket upgrade request when
 * the default resolver is used. Either:
 * - a `Response` carrying hooks on its `crossws` property (the srvx convention),
 *   or
 * - a plain `{ crossws, headers }` object with the hooks and optional headers to
 *   send on the WebSocket handshake response.
 *
 * Returning a normal `Response` (no `crossws`) is always valid — the connection
 * simply upgrades without hooks.
 */
type WSUpgradeResult = (Response & {
  crossws?: Partial<Hooks>;
}) | {
  crossws?: Partial<Hooks>;
  headers?: HeadersInit;
};
type ServerWithWSOptions = Omit<ServerOptions, "fetch"> & {
  fetch: (request: ServerRequest) => MaybePromise<WSUpgradeResult>;
  websocket?: WSOptions;
};
export { ServerWithWSOptions, WSOptions };