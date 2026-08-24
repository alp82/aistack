import { ServerPlugin } from "./_chunks/types.mjs";
import * as TLS from "node:tls";
/**
 * TLS connection state for the current request.
 *
 * Available when the request was served over TLS. The peer certificate fields are populated only when the server requested a client certificate (`tls.requestCert`) and the client presented one.
 *
 * @note Available only on srvx's Node.js adapter — on Node.js, or on Deno (2.8+) via `node:https`. It is **not** available on Bun: neither native `Bun.serve` nor Bun's `node:http(s)` server exposes the peer certificate to the handler (they enforce `requestCert` / `rejectUnauthorized` at the handshake, but drop the certificate), so unlike Deno the `srvx/node` adapter is not a workaround. Verified against the real Bun runtime (Bun 1.3.14); `bun vitest` without the `--bun` flag silently falls back to Node, which can mask this. See https://github.com/oven-sh/bun/issues/16254
 */
interface ServerRequestTLS {
  /**
   * The client (peer) certificate, if one was requested and presented.
   *
   * Empty object (`{}`) if the peer did not provide a certificate.
   */
  peerCertificate?: TLS.PeerCertificate;
  /**
   * `true` if the peer certificate was signed by one of the trusted CAs.
   */
  authorized?: boolean;
  /**
   * The reason the peer certificate failed verification, if any.
   */
  authorizationError?: Error | string;
  /**
   * The negotiated TLS protocol version, e.g. `"TLSv1.3"`.
   */
  protocol?: string | null;
  /**
   * The negotiated cipher suite.
   */
  cipher?: TLS.CipherNameAndProtocol;
}
declare module "srvx" {
  interface ServerRequest {
    /**
     * TLS connection state, including the client (peer) certificate for mutual TLS.
     *
     * Populated by the {@link mtls} plugin. `undefined` when the request was not served over TLS.
     */
    tls?: ServerRequestTLS | undefined;
  }
}
declare module "./types.ts" {
  interface ServerRequest {
    tls?: ServerRequestTLS | undefined;
  }
}
/**
 * Options for the {@link mtls} plugin.
 */
interface MTLSOptions {
  /**
   * File path(s) or inlined CA certificate(s) in PEM format used to verify client certificates.
   *
   * When set, the well-known Mozilla CAs are replaced by the provided ones.
   */
  ca?: string | string[];
  /**
   * Request a certificate from connecting clients.
   *
   * @default true
   */
  requestCert?: boolean;
  /**
   * Reject the TLS handshake itself when the client certificate is not signed by one of
   * the trusted `ca` certificates — the connection never reaches the `fetch` handler, so
   * checking `request.tls.authorized` in application code is unreachable at this setting.
   *
   * Set to `false` to let the handshake complete regardless and instead expose the
   * unverified certificate via `request.tls` with `authorized: false`, so your handler
   * can decide how to respond.
   *
   * @default true (Node.js default when `requestCert` is enabled)
   */
  rejectUnauthorized?: boolean;
}
/**
 * Mutual TLS (mTLS) plugin for the Node.js adapter.
 *
 * Requests a client certificate during the TLS handshake and exposes it — together
 * with the negotiated protocol and cipher — on {@link ServerRequestTLS | `request.tls`}.
 *
 * Only srvx's Node.js adapter can deliver this (`import { serve } from "srvx/node"`),
 * on Node.js or Deno (via `node:https`). Native `Deno.serve` / `Bun.serve` and Bun's
 * `node:http(s)` server do not expose the peer certificate, so the plugin throws there
 * rather than silently doing nothing. It also requires the server to be configured for
 * TLS (`tls.cert` / `tls.key`) and throws otherwise, since mutual TLS cannot run over
 * plain HTTP.
 *
 * With the default `rejectUnauthorized: true`, unauthenticated clients are rejected
 * during the TLS handshake and never reach the `fetch` handler. Set it to `false` to
 * let every handshake complete and enforce authorization yourself via
 * `request.tls.authorized`, as in the example below.
 *
 * @example
 * ```js
 * import { serve } from "srvx/node";
 * import { mtls } from "srvx/mtls";
 *
 * serve({
 *   tls: { cert, key },
 *   plugins: [mtls({ ca, requestCert: true, rejectUnauthorized: false })],
 *   fetch: (request) => {
 *     if (!request.tls?.authorized) {
 *       return new Response("client certificate required", { status: 401 });
 *     }
 *     return new Response(`Hello, ${request.tls.peerCertificate?.subject?.CN}`);
 *   },
 * });
 * ```
 */
declare function mtls(options?: MTLSOptions): ServerPlugin;
export { MTLSOptions, ServerRequestTLS, mtls };