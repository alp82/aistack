import { WebSocket } from "./web.mjs";
declare class WSError extends Error {
  constructor(...args: any[]);
}
/**
 * A single pub/sub event relayed between crossws instances.
 *
 * This is the minimal unit a sync backplane needs to transport so that a
 * `peer.publish()` (or `adapter.publish()`) on one instance reaches the
 * subscribers connected to every other instance.
 */
interface SyncMessage {
  /**
   * Pub/sub namespace (matches {@link Peer.namespace}).
   *
   * An empty string means "all namespaces" and mirrors a server-side
   * `adapter.publish(topic, data)` call without an explicit `namespace`.
   */
  namespace: string;
  /** Channel / topic name. */
  topic: string;
  /**
   * Message payload.
   *
   * crossws normalizes payloads to a string or `Uint8Array` before handing
   * them to the driver. Encoding for the wire (e.g. base64 for binary over a
   * text transport) is the driver's responsibility.
   */
  data: string | Uint8Array;
}
/**
 * A live connection to a sync backplane, scoped to one crossws instance.
 *
 * Created by a {@link SyncAdapter}. crossws calls {@link SyncDriver.publish}
 * for every local publish and expects {@link SyncDriver.subscribe} to invoke
 * the supplied `deliver` callback for every message originating from *other*
 * instances.
 */
interface SyncDriver {
  /**
   * Start receiving messages relayed from other instances.
   *
   * The driver MUST call `deliver` for every remote message; crossws then
   * fans it out to local subscribers. The driver MUST NOT echo this
   * instance's own publishes back (backplanes like Redis pub/sub echo by
   * default — use the instance `id` from {@link SyncAdapter} to filter).
   */
  subscribe(deliver: (message: SyncMessage) => void): MaybePromise<void>;
  /** Relay a locally-published message to the other instances. */
  publish(message: SyncMessage): MaybePromise<void>;
  /** Optional teardown when the adapter shuts down. */
  close?(): MaybePromise<void>;
}
/**
 * Factory for a {@link SyncDriver}.
 *
 * crossws calls it once per adapter instance and passes a stable random `id`
 * the driver can use for echo suppression.
 */
type SyncAdapter = (ctx: {
  id: string;
}) => SyncDriver;
/**
 * Zero-dependency sync driver built on [`BroadcastChannel`](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel).
 *
 * Bridges instances that share a `BroadcastChannel` registry. On Node.js, Deno
 * and Bun that registry is scoped to a **single process** (it spans the main
 * thread and its worker threads), so this is for in-process worker fan-out and
 * tests — not separate OS processes (e.g. Node `cluster`/PM2 forks), which each
 * have an isolated registry and will silently not sync. (Deno Deploy is the one
 * exception: its `BroadcastChannel` spans isolates.)
 *
 * For multiple processes, hosts or regions you want a networked driver such as
 * {@link redis} or {@link pgsql}.
 *
 * A `channel` name is required: it scopes the cluster, and a shared default
 * would risk silently bridging unrelated servers running on the same host.
 *
 * @example
 * ```js
 * import { broadcastChannel } from "crossws/sync";
 * const adapter = nodeAdapter({ hooks, sync: broadcastChannel({ channel: "my-app" }) });
 * ```
 */
declare function broadcastChannel(opts: {
  channel: string;
}): SyncAdapter;
/**
 * Structural subset of a Redis client used by {@link redis}, covering both
 * [ioredis](https://github.com/redis/ioredis) and
 * [node-redis](https://github.com/redis/node-redis). Kept structural so crossws
 * stays dependency-free.
 *
 * The two clients shape pub/sub differently and {@link redis} bridges them:
 * - **ioredis** — `subscribe(channel)` plus a shared `"message"` event whose
 *   listener receives `(channel, message)`; `duplicate()` returns a ready client.
 * - **node-redis** — `subscribe(channel, listener)` with an inline listener that
 *   receives `(message, channel)`; `duplicate()` returns a client you must
 *   `connect()` first.
 */
interface RedisClientLike {
  publish(channel: string, message: string): unknown;
  /**
   * ioredis: `subscribe(channel)`; node-redis: `subscribe(channel, listener)`
   * (the listener receives `(message, channel)`).
   */
  subscribe(channel: string, listener?: (message: string, channel: string) => void): unknown;
  /** ioredis: shared `"message"` event (listener receives `(channel, message)`). */
  on?(event: "message", listener: (channel: string, message: string) => void): unknown;
  /** ioredis: detach the `"message"` listener on {@link SyncDriver.close}. */
  off?(event: "message", listener: (channel: string, message: string) => void): unknown;
  /** node-redis: a `duplicate()`d client starts disconnected and must `connect()`. */
  connect?(): unknown;
  /** Create a second connection for `SUBSCRIBE` (which blocks the connection). */
  duplicate(): RedisClientLike;
  /** Tear down the dedicated subscriber connection on {@link SyncDriver.close}. */
  quit?(): unknown;
  /** Present (camelCase) only on node-redis — used for auto-detection. */
  pSubscribe?: unknown;
}
/**
 * Networked sync driver over Redis pub/sub — the realistic multi-region
 * backplane. Bring your own client; a dedicated `SUBSCRIBE` connection is
 * derived from it via `duplicate()` (`SUBSCRIBE` blocks the connection it runs
 * on, so it can't share the one used for `PUBLISH`).
 *
 * Works out of the box with both [ioredis](https://github.com/redis/ioredis)
 * and [node-redis](https://github.com/redis/node-redis): the flavor is
 * auto-detected (node-redis exposes camelCase commands such as `pSubscribe`),
 * with an explicit `connector` escape hatch if detection ever guesses wrong.
 *
 * Binary payloads are base64-encoded so they survive Redis's text transport.
 *
 * A `channel` name is required: it scopes the cluster, and a shared default
 * would risk silently bridging unrelated servers on the same Redis instance.
 *
 * Reconnect note: ioredis auto-resubscribes its channels after a dropped
 * connection; node-redis does not restore subscriptions the same way, so a
 * node-redis-backed instance may stop receiving relayed messages after a
 * transient outage. Prefer ioredis where connection resilience matters.
 *
 * @example
 * ```js
 * // ioredis
 * import Redis from "ioredis";
 * import { redis } from "crossws/sync";
 * const adapter = nodeAdapter({ hooks, sync: redis({ client: new Redis(), channel: "my-app" }) });
 * ```
 *
 * @example
 * ```js
 * // node-redis
 * import { createClient } from "redis";
 * import { redis } from "crossws/sync";
 * const client = await createClient().connect();
 * const adapter = nodeAdapter({ hooks, sync: redis({ client, channel: "my-app" }) });
 * ```
 */
declare function redis(opts: {
  /** Redis client used to `PUBLISH`; a subscriber is `duplicate()`d from it. */
  client: RedisClientLike;
  /** Pub/sub channel to relay over. */
  channel: string;
  /**
   * Client flavor. Defaults to auto-detection (node-redis exposes the camelCase
   * `pSubscribe` command; ioredis does not). Set explicitly to override.
   */
  connector?: "ioredis" | "node-redis";
}): SyncAdapter;
/**
 * Structural subset of a PostgreSQL client used by {@link pgsql}, covering
 * both [node-postgres](https://github.com/brianc/node-postgres) (`pg`) and
 * [postgres.js](https://github.com/porsager/postgres). Kept structural so
 * crossws stays dependency-free.
 *
 * The two clients shape `LISTEN`/`NOTIFY` differently and {@link pgsql}
 * bridges them:
 * - **node-postgres** — issue raw `LISTEN`/`pg_notify` via `query()` and receive
 *   a shared `"notification"` event whose listener gets `{ channel, payload }`.
 * - **postgres.js** — dedicated `listen(channel, onnotify)` (resolves to a
 *   handle with `unlisten()`) and `notify(channel, payload)` helpers.
 */
interface PostgresClientLike {
  /** node-postgres: run `LISTEN` / `SELECT pg_notify(...)` / `UNLISTEN`. */
  query?(sql: string, values?: unknown[]): unknown;
  /** node-postgres: shared `"notification"` event for inbound `NOTIFY`s. */
  on?(event: "notification", listener: (msg: {
    channel: string;
    payload?: string;
  }) => void): unknown;
  /** node-postgres: detach the `"notification"` listener on {@link SyncDriver.close}. */
  removeListener?(event: "notification", listener: (msg: {
    channel: string;
    payload?: string;
  }) => void): unknown;
  /**
   * postgres.js: subscribe to a channel; resolves to a handle exposing
   * `unlisten()`. Present only on postgres.js — used for auto-detection.
   */
  listen?(channel: string, onnotify: (payload: string) => void): unknown;
  /** postgres.js: send a `NOTIFY` to a channel. */
  notify?(channel: string, payload: string): unknown;
}
/**
 * Networked sync driver over PostgreSQL [`LISTEN`/`NOTIFY`](https://www.postgresql.org/docs/current/sql-notify.html)
 * — a backplane for clusters that already run Postgres and would rather not add
 * Redis. Bring your own client; unlike Redis `SUBSCRIBE`, Postgres `LISTEN` does
 * not block the connection, so no `duplicate()` is needed: for node-postgres the
 * *same* client both listens and notifies. (postgres.js `listen()` internally
 * reserves its own dedicated connection — that's the client's concern, not ours.)
 *
 * Pass a single, dedicated [`Client`](https://node-postgres.com/apis/client), not
 * a [`Pool`](https://node-postgres.com/apis/pool): pool `query()` runs `LISTEN`
 * on an arbitrary backend that is then returned to the pool, so notifications
 * would never reach a stable listener. A `Pool` is detected and rejected. For the
 * same reason, don't share one client across two `pgsql()` drivers on the same
 * channel — `close()` issues a single `UNLISTEN` that would silence the others.
 *
 * Works out of the box with both [node-postgres](https://github.com/brianc/node-postgres)
 * (`pg`) and [postgres.js](https://github.com/porsager/postgres): the flavor is
 * auto-detected (postgres.js exposes a `listen()` helper; node-postgres does
 * not), with an explicit `connector` escape hatch if detection ever guesses
 * wrong.
 *
 * Binary payloads are base64-encoded so they survive the text `NOTIFY` payload.
 * Note Postgres caps a `NOTIFY` payload at 8000 bytes — keep relayed messages
 * small (this is a transport limit, not a crossws one).
 *
 * A `channel` name is required: it scopes the cluster, so unrelated servers
 * don't silently bridge through the same database. It is used verbatim as the
 * notification channel name.
 *
 * @example
 * ```js
 * // node-postgres (pg)
 * import { Client } from "pg";
 * import { pgsql } from "crossws/sync";
 * const client = new Client();
 * await client.connect();
 * const adapter = nodeAdapter({ hooks, sync: pgsql({ client, channel: "my-app" }) });
 * ```
 *
 * @example
 * ```js
 * // postgres.js
 * import postgresjs from "postgres";
 * import { pgsql } from "crossws/sync";
 * const sql = postgresjs();
 * const adapter = nodeAdapter({ hooks, sync: pgsql({ client: sql, channel: "my-app" }) });
 * ```
 */
declare function pgsql(opts: {
  /** Connected Postgres client used to both `LISTEN` and `NOTIFY`. */
  client: PostgresClientLike;
  /** Notification channel to relay over. */
  channel: string;
  /**
   * Client flavor. Defaults to auto-detection (postgres.js exposes a `listen()`
   * helper; node-postgres does not). Set explicitly to override.
   */
  connector?: "pg" | "postgres.js";
}): SyncAdapter;
/**
 * Install the cluster relay in the **primary** process.
 *
 * Node `cluster` workers can't message each other directly — IPC only flows
 * between each worker and the primary — so the primary must rebroadcast every
 * worker's relay message to the others. Call this once in your primary process
 * (before or after forking) so {@link cluster} drivers running in the workers
 * can reach one another. It is a no-op when called from a worker, so guarding
 * with `cluster.isPrimary` is optional.
 *
 * `node:cluster` is imported lazily so merely importing `crossws/sync` stays
 * runtime-agnostic (it never loads in workerd/Deno where the module is unused).
 *
 * @example
 * ```js
 * import cluster from "node:cluster";
 * import { availableParallelism } from "node:os";
 * import { setupPrimaryCluster } from "crossws/sync";
 *
 * if (cluster.isPrimary) {
 *   setupPrimaryCluster();
 *   for (let i = 0; i < availableParallelism(); i++) cluster.fork();
 * } else {
 *   // ... start your server with `sync: cluster({ channel: "my-app" })`
 * }
 * ```
 */
declare function setupPrimaryCluster(): Promise<void>;
/**
 * Zero-dependency sync driver over Node.js [`cluster`](https://nodejs.org/api/cluster.html)
 * worker IPC — bridges forked processes on a **single host** (e.g. Node
 * `cluster` or PM2 `instances`) without a network backplane.
 *
 * This fills the gap left by {@link broadcastChannel}, whose registry is scoped
 * to one process and silently won't sync across forks. For multiple hosts or
 * regions you still want a networked driver such as {@link redis} or
 * {@link pgsql}.
 *
 * Requires the relay to be installed in the primary via
 * {@link setupPrimaryCluster}; the driver itself runs in the workers. Workers
 * can't message each other directly, so all relay flows worker → primary →
 * workers. Binary payloads are base64-encoded so they survive default JSON IPC
 * serialization (no `serialization: "advanced"` needed).
 *
 * A `channel` name is required: it scopes the cluster and lets multiple apps
 * share one process tree without bridging into each other.
 *
 * @example
 * ```js
 * import cluster from "node:cluster";
 * import { setupPrimaryCluster, cluster as clusterSync } from "crossws/sync";
 *
 * if (cluster.isPrimary) {
 *   setupPrimaryCluster();
 *   cluster.fork();
 *   cluster.fork();
 * } else {
 *   const ws = nodeAdapter({ hooks, sync: clusterSync({ channel: "my-app" }) });
 *   // ... start the server
 * }
 * ```
 */
declare function cluster(opts: {
  channel: string;
}): SyncAdapter;
declare function encodeEnvelope(id: string, msg: SyncMessage): string;
declare function decodeEnvelope(raw: string): {
  id: string;
  msg: SyncMessage;
} | undefined;
/**
 * Names of the built-in sync drivers exported from `crossws/sync`.
 *
 * Useful for automatic integration (e.g. Nitro) that needs to enumerate the
 * available drivers without importing each one.
 */
declare const syncDrivers: readonly ["broadcastChannel", "redis", "pgsql", "cluster"];
/** Name of a built-in sync driver (see {@link syncDrivers}). */
type SyncDriverName = (typeof syncDrivers)[number];
/**
 * Map from a {@link SyncDriverName} to the options object its driver factory
 * accepts — derived from the factory signatures so it stays in sync.
 */
type SyncDriverOptions = {
  broadcastChannel: Parameters<typeof broadcastChannel>[0];
  redis: Parameters<typeof redis>[0];
  pgsql: Parameters<typeof pgsql>[0];
  cluster: Parameters<typeof cluster>[0];
};
declare const kNodeInspect: unique symbol;
interface PeerContext extends Record<string, unknown> {}
interface WaitForDrainOptions {
  /**
   * Resolve once {@link Peer.bufferedAmount} drops to or below this many bytes.
   *
   * @default 0
   */
  threshold?: number;
  /**
   * Polling interval (in milliseconds) used to re-check {@link Peer.bufferedAmount}.
   *
   * @default 100
   */
  pollInterval?: number;
  /**
   * Abort the wait (e.g. `AbortSignal.timeout(ms)`). The returned promise
   * rejects with the signal's `reason`.
   */
  signal?: AbortSignal;
}
interface AdapterInternal {
  ws: unknown;
  request: Request;
  namespace: string;
  peers?: Set<Peer>;
  context?: PeerContext;
  /** Optional sync backplane used to relay publishes to other instances. */
  sync?: SyncDriver;
}
declare abstract class Peer<Internal extends AdapterInternal = AdapterInternal> {
  #private;
  protected _internal: Internal;
  protected _topics: Set<string>;
  protected _id?: string;
  constructor(internal: Internal);
  get context(): PeerContext;
  get namespace(): string;
  /**
   * Unique random [uuid v4](https://developer.mozilla.org/en-US/docs/Glossary/UUID) identifier for the peer.
   */
  get id(): string;
  /** IP address of the peer */
  get remoteAddress(): string | undefined;
  /** upgrade request */
  get request(): Request;
  /**
   * Get the [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) instance.
   *
   * **Note:** crossws adds polyfill for the following properties if native values are not available:
   * - `protocol`: Extracted from the `sec-websocket-protocol` header.
   * - `extensions`: Extracted from the `sec-websocket-extensions` header.
   * - `url`: Extracted from the request URL (http -> ws).
   * */
  get websocket(): Partial<WebSocket>;
  /** All connected peers to the server */
  get peers(): Set<Peer>;
  /** All topics, this peer has been subscribed to. */
  get topics(): Set<string>;
  /**
   * Number of bytes queued for transmission but not yet flushed to the client.
   *
   * Use this to apply backpressure: pause sending while it grows past a high
   * watermark and resume once it drops (or on the `drain` hook). Returns `0` on
   * adapters that do not expose a buffer signal. Refer to the
   * [compatibility table](https://crossws.h3.dev/guide/peer#compatibility).
   */
  get bufferedAmount(): number;
  /**
   * Wait until the send buffer drains to `threshold` bytes (default `0`).
   *
   * Resolves immediately when there is no backpressure (or on adapters that do
   * not expose {@link Peer.bufferedAmount}). Otherwise it polls every
   * `pollInterval` milliseconds until the buffer drains, also resolving early if
   * the connection is no longer open so a send loop never hangs on a dropped
   * client.
   *
   * ```ts
   * for (const chunk of stream) {
   *   peer.send(chunk);
   *   if (peer.bufferedAmount > 1024 * 1024) {
   *     await peer.waitForDrain({ threshold: 256 * 1024 });
   *   }
   * }
   * ```
   */
  waitForDrain(opts?: WaitForDrainOptions): Promise<void>;
  abstract close(code?: number, reason?: string): void;
  /** Abruptly close the connection */
  terminate(): void;
  /**
   * Send an application-level WebSocket ping control frame to the client.
   *
   * Pair with the {@link Hooks.pong} hook (e.g. embedding a timestamp in
   * `data`) to measure round-trip latency, or rely on the {@link Hooks.ping}
   * hook to observe pings the client sends unprompted.
   *
   * `data` is optional and, per RFC 6455, must not exceed 125 bytes (a ping is
   * a control frame); an over-long or otherwise invalid payload is reported via
   * the {@link Hooks.error} hook instead of being sent.
   *
   * **Note:** Not all adapters can send a ping frame; unsupported adapters
   * warn once and no-op. Refer to the
   * [compatibility table](https://crossws.h3.dev/guide/peer#compatibility).
   */
  ping(_data?: unknown): number | void | undefined;
  /** Subscribe to a topic */
  subscribe(topic: string): void;
  /** Unsubscribe from a topic */
  unsubscribe(topic: string): void;
  /** Send a message to the peer. */
  abstract send(data: unknown, options?: {
    compress?: boolean;
  }): number | void | undefined;
  /**
   * Send a message to subscribers of a topic.
   *
   * When a sync backplane is configured, the message is also relayed to the
   * other crossws instances so their subscribers receive it too.
   */
  publish(topic: string, data: unknown, options?: {
    compress?: boolean;
  }): void;
  /**
   * Adapter-specific, relay-free local fan-out to subscribers of a topic
   * (excludes this peer). Implemented by each adapter; used both by
   * {@link Peer.publish} and by the internal cross-instance delivery path.
   *
   * @internal Adapter extension point, not part of the stable public API.
   */
  abstract _publish(topic: string, data: unknown, options?: {
    compress?: boolean;
  }): void;
  toString(): string;
  [Symbol.toPrimitive](): string;
  [Symbol.toStringTag](): "WebSocket";
  [kNodeInspect](): unknown;
}
declare class Message implements Partial<MessageEvent> {
  #private;
  /** Access to the original [message event](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/message_event) if available. */
  readonly event?: MessageEvent;
  /** Access to the Peer that emitted the message. */
  readonly peer?: Peer;
  /** Raw message data (can be of any type). */
  readonly rawData: unknown;
  constructor(rawData: unknown, peer: Peer, event?: MessageEvent);
  /**
   * Unique random [uuid v4](https://developer.mozilla.org/en-US/docs/Glossary/UUID) identifier for the message.
   */
  get id(): string;
  /**
   * Get data as [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) value.
   *
   * If raw data is in any other format or string, it will be automatically converted and encoded.
   */
  uint8Array(): Uint8Array;
  /**
   * Get data as [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) or [SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) value.
   *
   * If raw data is in any other format or string, it will be automatically converted and encoded.
   */
  arrayBuffer(): ArrayBuffer | SharedArrayBuffer;
  /**
   * Get data as [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) value.
   *
   * If raw data is in any other format or string, it will be automatically converted and encoded. */
  blob(): Blob;
  /**
   * Get stringified text version of the message.
   *
   * If raw data is in any other format, it will be automatically converted and decoded.
   */
  text(): string;
  /**
   * Get parsed version of the message text with [`JSON.parse()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse).
   */
  json<T = unknown>(): T;
  /**
   * Message data (value varies based on `peer.websocket.binaryType`).
   */
  get data(): unknown;
  toString(): string;
  [Symbol.toPrimitive](): string;
  [kNodeInspect](): unknown;
}
declare class AdapterHookable {
  #private;
  options: AdapterOptions;
  constructor(options?: AdapterOptions);
  callHook<N extends keyof Hooks>(name: N, arg1: Parameters<Hooks[N]>[0], arg2?: Parameters<Hooks[N]>[1], connection?: object): MaybePromise<ReturnType<Hooks[N]>>;
  upgrade(request: Request & {
    readonly context?: Record<string, unknown>;
  }): Promise<{
    context: PeerContext;
    namespace: string;
    upgradeHeaders?: HeadersInit;
    endResponse?: Response;
    handled?: boolean;
  }>;
  _resolveProtocol(request: Request, upgradeHeaders: HeadersInit | undefined, protocolFromHook: string | undefined): Promise<string | undefined>;
}
declare function defineHooks<T extends Partial<Hooks> = Partial<Hooks>>(hooks: T): T;
type ResolveHooks = (request: Request & {
  readonly context?: PeerContext;
}) => Partial<Hooks> | Promise<Partial<Hooks>>;
type MaybePromise<T> = T | Promise<T>;
interface Hooks {
  /**
   * Upgrading a request to a WebSocket connection.
   *
   * - You can throw a Response to abort the upgrade.
   * - You can return { headers } to modify the response.
   * - You can return { protocol } to accept a WebSocket subprotocol for this
   *   connection (echoed back as `Sec-WebSocket-Protocol`). This is the
   *   per-connection counterpart to the global
   *   {@link AdapterOptions.handleProtocols} option and takes precedence over
   *   it. It should be one of the subprotocols the client offered (the values
   *   in the request's `Sec-WebSocket-Protocol` header).
   * - You can return { namespace } to change the pub/sub namespace.
   * - You can return { context } to provide a custom peer context.
   * - You can return { handled: true } to signal that the upgrade has
   *   already been performed by the hook (e.g. delegated to an external
   *   node-style `(req, socket, head)` handler). The adapter will then
   *   leave the socket alone and skip its own upgrade.
   *
   * @param request
   * @throws {Response}
   */
  upgrade: (request: Request & {
    readonly context?: Record<string, unknown>;
  }) => MaybePromise<{
    headers?: HeadersInit;
    protocol?: string;
    namespace?: string;
    context?: PeerContext;
    handled?: boolean;
  } | Response | void>;
  /** A message is received */
  message: (peer: Peer, message: Message) => MaybePromise<void>;
  /** A socket is opened */
  open: (peer: Peer) => MaybePromise<void>;
  /** A socket is closed */
  close: (peer: Peer, details: {
    code?: number;
    reason?: string;
  }) => MaybePromise<void>;
  /**
   * The send buffer has drained after backpressure, so it is safe to resume
   * sending. Pair with {@link Peer.bufferedAmount} to throttle senders.
   *
   * **Note:** Only emitted by adapters that expose a drain signal. Refer to the
   * [compatibility table](https://crossws.h3.dev/guide/peer#compatibility).
   */
  drain: (peer: Peer) => MaybePromise<void>;
  /** An error occurs */
  error: (peer: Peer, error: WSError) => MaybePromise<void>;
  /**
   * An application-level WebSocket ping control frame was received from the
   * peer (e.g. sent by the client, or by another server via
   * {@link Peer.ping}).
   *
   * **Note:** Only emitted by adapters that surface inbound ping frames.
   * Refer to the [compatibility table](https://crossws.h3.dev/guide/peer#compatibility).
   */
  ping: (peer: Peer, data: Uint8Array) => MaybePromise<void>;
  /**
   * An application-level WebSocket pong control frame was received from the
   * peer, typically in reply to {@link Peer.ping}. Use together with a
   * timestamp embedded in the ping payload to measure round-trip latency.
   *
   * **Note:** Only emitted by adapters that surface inbound pong frames.
   * Refer to the [compatibility table](https://crossws.h3.dev/guide/peer#compatibility).
   */
  pong: (peer: Peer, data: Uint8Array) => MaybePromise<void>;
}
interface AdapterInstance {
  readonly peers: Map<string, Set<Peer>>;
  readonly publish: (topic: string, data: unknown, options?: {
    compress?: boolean;
    namespace?: string;
  }) => void;
  /**
   * Gracefully shut the adapter down: close every connected peer (with the
   * optional `code` / `reason`) and tear down the {@link AdapterInstance.sync}
   * backplane. Any underlying server you created (e.g. an `http.Server` or a
   * `WebSocketServer` passed via options) stays yours to close.
   */
  readonly close: (code?: number, reason?: string) => Promise<void>;
  /**
   * Sync backplane driver, present when an adapter is created with `sync`.
   *
   * Closed automatically by {@link AdapterInstance.close}; it leaves any
   * user-owned client (Redis/Postgres) connected.
   */
  readonly sync?: SyncDriver;
}
/** Context passed to {@link AdapterOptions.onError} describing what failed. */
interface SyncErrorContext {
  /**
   * Which backplane operation failed:
   * - `subscribe` — the initial subscription to the backplane.
   * - `publish` — relaying a local publish out to the other instances.
   * - `delivery` — fanning an inbound remote message out to local subscribers.
   */
  stage: "subscribe" | "publish" | "delivery";
}
interface AdapterOptions {
  resolve?: ResolveHooks;
  getNamespace?: (request: Request) => string;
  hooks?: Partial<Hooks>;
  /**
   * Select the WebSocket subprotocol to accept during the handshake.
   *
   * Browsers that open `new WebSocket(url, protocols)` send their offer in the
   * `Sec-WebSocket-Protocol` request header and **reject the connection** if
   * the server's `101` response doesn't echo one of the offered values back.
   * By default crossws negotiates nothing (a server never claims to speak a
   * protocol the app didn't opt into), so supply this to accept one.
   *
   * Called with the set of subprotocols the client offered and the upgrade
   * request. Return the single subprotocol to accept (must be one of the
   * offered values), or `false`/`undefined` to accept none. Only invoked when
   * the client actually offered at least one subprotocol.
   *
   * This is the global default; the {@link Hooks.upgrade} hook may return
   * `{ protocol }` to override it per connection.
   *
   * @example
   * handleProtocols: (protocols) =>
   *   protocols.has("graphql-transport-ws") ? "graphql-transport-ws" : false
   */
  handleProtocols?: (protocols: Set<string>, request: Request) => MaybePromise<string | false | null | undefined>;
  /**
   * Optional sync backplane to relay pub/sub between multiple crossws
   * instances (e.g. across regions/processes). Opt-in: when absent, pub/sub
   * stays local to the instance, exactly as before.
   */
  sync?: SyncAdapter;
  /**
   * Called when a {@link AdapterOptions.sync} backplane operation fails.
   *
   * Relay is fire-and-forget by design — a flaky backplane never throws into
   * your `publish` call or crashes the process — so this callback is the only
   * way to observe a degraded backplane (for logging, metrics or alerting).
   * Defaults to `console.error`. Has no effect without `sync`.
   */
  onError?: (error: unknown, context: SyncErrorContext) => void;
  /**
   * Close a connection that has stayed idle — no incoming messages and no
   * pong replies — for roughly this many **seconds**. This reclaims peers
   * whose transport died silently ("half-open" sockets: laptop sleep,
   * NAT/mobile idle timeout, power loss, a cut cable) without the TCP stack
   * ever delivering a `FIN`/`RST`, which would otherwise leak forever.
   *
   * Implemented per runtime, but with a single consistent knob:
   * - **Node** — the `ws` library has no built-in liveness, so crossws pings
   *   each peer on this interval and terminates any that miss the pong. Honors
   *   sub-second (fractional) values.
   * - **Bun / Deno / uWebSockets / Bunny** — mapped to the runtime's native
   *   WebSocket idle timeout, which also auto-sends keepalive pings. These
   *   runtimes take **whole seconds**, so a fractional value is rounded down —
   *   a value below `1` may become `0` and disable liveness there; use `>= 1`.
   *
   * Terminated peers surface through the normal `close` hook (Node reports
   * code `1006`), so any `close`/`error` teardown — including
   * `createWebSocketProxy` closing its upstream — runs unchanged.
   *
   * Set to `0` to disable. Defaults to {@link DEFAULT_IDLE_TIMEOUT} (30s) on
   * every runtime — low enough to keep idle connections alive through the
   * typical ~60s reverse-proxy / load-balancer idle timeout, while reclaiming
   * dead sockets promptly. Pings are a few bytes and standards clients auto-pong,
   * so a live connection is never disconnected.
   *
   * @default 30 (seconds)
   */
  idleTimeout?: number;
}
type Adapter<AdapterT extends AdapterInstance = AdapterInstance, Options extends AdapterOptions = AdapterOptions> = (options?: Options) => AdapterT;
declare function defineWebSocketAdapter<AdapterT extends AdapterInstance = AdapterInstance, Options extends AdapterOptions = AdapterOptions>(factory: Adapter<AdapterT, Options>): Adapter<AdapterT, Options>;
export { Adapter, AdapterHookable, AdapterInstance, AdapterInternal, AdapterOptions, Hooks, MaybePromise, Message, Peer, PeerContext, PostgresClientLike, RedisClientLike, ResolveHooks, SyncAdapter, SyncDriver, SyncDriverName, SyncDriverOptions, SyncErrorContext, SyncMessage, WSError, WaitForDrainOptions, broadcastChannel, cluster, decodeEnvelope, defineHooks, defineWebSocketAdapter, encodeEnvelope, pgsql, redis, setupPrimaryCluster, syncDrivers };