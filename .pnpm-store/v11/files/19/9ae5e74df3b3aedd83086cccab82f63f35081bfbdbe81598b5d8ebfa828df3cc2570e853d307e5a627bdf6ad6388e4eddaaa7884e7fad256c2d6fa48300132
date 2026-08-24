import { Adapter, AdapterInstance, AdapterInternal, AdapterOptions, Hooks, Message, Peer, PeerContext, ResolveHooks, SyncAdapter, SyncDriver, SyncErrorContext, SyncMessage, WSError, WaitForDrainOptions, defineHooks, defineWebSocketAdapter } from "./_chunks/adapter.mjs";
import { ServerWithWSOptions, WSOptions } from "./_chunks/_types.mjs";
interface WebSocketProxyOptions {
  /**
   * Target WebSocket URL to proxy to (`ws://` or `wss://`).
   *
   * A `ws+unix://<socketPath>:<pathname>` target is also supported out of the
   * box for proxying to a Unix-socket upstream on Node, Bun, and Deno (no custom
   * {@link WebSocket} constructor required) — crossws dials it through the
   * matching per-runtime `crossws/websocket` client. See the guide for details.
   *
   * Can be a static string/URL or a function that resolves the target dynamically
   * based on the incoming {@link Peer}. The resolver may be **async** (return a
   * promise) — useful when the upstream address isn't known yet at connect time
   * (e.g. a worker that's still booting or being hot-reloaded). Client frames
   * sent in the meantime are buffered (bounded by {@link maxBufferSize}) and a
   * non-zero {@link connectTimeout} also covers the resolution, so a resolver
   * that never settles closes the peer with `1011` rather than hanging. With
   * `connectTimeout: 0` (timeout disabled) a never-settling resolver leaves the
   * peer open until {@link maxBufferSize} is hit (`1009`), so pair an unbounded
   * timeout with your own resolver deadline.
   */
  target: string | URL | ((peer: Peer) => string | URL | Promise<string | URL>);
  /**
   * Subprotocol(s) to offer the upstream during the handshake.
   *
   * - `true` (default) — forward the client's `sec-websocket-protocol` verbatim.
   * - `false` — offer no subprotocol upstream.
   * - `string` / `string[]` — offer a fixed subprotocol (or list) upstream,
   *   regardless of what the client requested.
   * - `Record<string, string>` — rewrite map applied to the client's offered
   *   tokens: a token that matches a key is swapped for its value; tokens not
   *   in the map are forwarded verbatim.
   * - function — resolve the upstream subprotocol(s) per {@link Peer}. Return a
   *   string, an array of strings, or `undefined` to offer none. Useful when the
   *   rewrite depends on more than the token value alone.
   *
   * Note: this controls only what is offered to the *upstream*. The subprotocol
   * echoed back to the *client* remains the first token the client offered (per
   * RFC 6455, the selected protocol must be one the client proposed).
   *
   * @default true
   */
  forwardProtocol?: boolean | string | string[] | Record<string, string> | ((peer: Peer) => string | string[] | undefined | void);
  /**
   * Maximum number of bytes buffered per peer while the upstream connection
   * is still opening. If exceeded, the peer is closed with code `1009`
   * (Message Too Big). Set to `0` to disable the limit.
   *
   * @default 1048576 (1 MiB)
   */
  maxBufferSize?: number;
  /**
   * Milliseconds to wait for the upstream WebSocket handshake to complete.
   * If the upstream does not open within the timeout, the peer is closed
   * with code `1011`. Set to `0` to disable the timeout.
   *
   * @default 10000
   */
  connectTimeout?: number;
  /**
   * Milliseconds of **client→proxy** inactivity after which both the peer
   * and the upstream connection are closed (peer close code `1001`).
   *
   * The timer is reset by every inbound frame the client sends and is
   * unaffected by upstream→client traffic. This is driven by real application frames, so
   * it reclaims a connection whose client vanished behind such an
   * intermediary and left the upstream socket dangling.
   *
   * Only enable this for protocols where the client is expected to send
   * traffic periodically (e.g. a heartbeat / keepalive message). For
   * server-push-only protocols where the client may be legitimately silent,
   * leave it disabled or it will close idle-but-live connections.
   *
   * @default 0 (disabled)
   */
  clientIdleTimeout?: number;
  /**
   * Custom `WebSocket` constructor used to dial the upstream. Useful when
   * the runtime does not expose a global `WebSocket` (Node.js < 22) or
   * when you want to use a different client implementation (e.g. `ws`,
   * `undici`, a mock for tests).
   *
   * @default globalThis.WebSocket
   */
  WebSocket?: typeof WebSocket;
  /**
   * Extra headers to send on the upstream handshake. Can be a static
   * object or a resolver called per peer.
   *
   * Useful to forward identity from the incoming request (`cookie`,
   * `authorization`, `origin`), or to inject a shared secret the
   * upstream expects.
   *
   * > [!NOTE]
   * > The WHATWG global `WebSocket` constructor does not accept custom
   * > headers — this option is only honored by `WebSocket` constructors
   * > that take a third options argument (e.g. `ws`, `undici`). Pass
   * > one via the {@link WebSocket} option to use it.
   *
   * @example
   * ```ts
   * createWebSocketProxy({
   *   target: "wss://backend.example.com",
   *   WebSocket: WsFromNodeWs,
   *   headers: (peer) => ({
   *     cookie: peer.request.headers.get("cookie") ?? "",
   *     "x-forwarded-for": peer.remoteAddress ?? "",
   *   }),
   * });
   * ```
   */
  headers?: HeadersInit | ((peer: Peer) => HeadersInit | undefined | void);
  /**
   * Extra options merged into the upstream `WebSocket` constructor's third
   * argument, as a static object or a per-peer resolver.
   *
   * This is the escape hatch for runtime- or client-specific dialing options
   * that the WHATWG `WebSocket` signature doesn't cover — e.g. Deno's unstable
   * `client` (to dial a Unix socket or use a custom `Deno.HttpClient`), or the
   * `ws`/`undici` `createConnection`/`dispatcher`/`agent` options.
   *
   * Merged with {@link headers}: keys returned here are spread first, then the
   * resolved `headers` option is applied on top (so a dedicated `headers`
   * option wins over a `headers` key returned here).
   *
   * > [!NOTE]
   * > Only honored by `WebSocket` constructors that accept a third options
   * > argument. The WHATWG global browser constructor ignores it; Deno and Bun
   * > extend the signature with their own options.
   *
   * @example Proxy to a Unix socket on Deno
   * ```ts
   * createWebSocketProxy({
   *   // Deno's WebSocket rejects the `ws+unix:` scheme, so keep a plain
   *   // `ws://` target and redirect the transport via the `client` option.
   *   target: (peer) => `ws://localhost${new URL(peer.request.url).pathname}`,
   *   webSocketOptions: () => ({
   *     client: Deno.createHttpClient({
   *       proxy: { transport: "unix", path: "/run/worker.sock" },
   *     }),
   *   }),
   * });
   * ```
   */
  webSocketOptions?: Record<string, unknown> | ((peer: Peer) => Record<string, unknown> | undefined | void);
}
/**
 * Create a set of crossws hooks that proxy incoming WebSocket connections
 * to an upstream `ws://` or `wss://` target.
 *
 * @example
 * ```ts
 * import { createWebSocketProxy } from "crossws";
 *
 * const hooks = createWebSocketProxy("wss://echo.websocket.org");
 * ```
 */
declare function createWebSocketProxy(target: WebSocketProxyOptions["target"] | WebSocketProxyOptions): Partial<Hooks>;
export { type Adapter, type AdapterInstance, type AdapterInternal, type AdapterOptions, type Hooks, type Message, type Peer, type PeerContext, type ResolveHooks, type ServerWithWSOptions, type SyncAdapter, type SyncDriver, type SyncErrorContext, type SyncMessage, type WSError, type WSOptions, type WaitForDrainOptions, type WebSocketProxyOptions, createWebSocketProxy, defineHooks, defineWebSocketAdapter };