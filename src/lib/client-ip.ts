// Resolving the real client address behind the edge proxy.
//
// Lifted out of `src/routes/api.stacks.$slug.tsx` by #78 (map #76): the view
// counter needs the same address the public API rate-limits on, and two copies
// of this rule would eventually disagree.

/**
 * Behind Coolify's Traefik edge proxy, which APPENDS the real client
 * connection IP as the last X-Forwarded-For entry. Read the rightmost
 * (trusted) hop, never the client-controlled leftmost one.
 *
 * Precondition: this is trustworthy only as long as Traefik is the sole
 * terminating proxy and is NOT configured to trust or preserve a
 * client-supplied X-Forwarded-For header (i.e. forwardedHeaders.trustedIPs /
 * insecure mode must remain off). If a CDN or additional proxy is ever placed
 * in front of Traefik, the rightmost hop is no longer guaranteed to be the
 * real client IP and this selection must be revisited.
 */
export function ipFromForwardedFor(
	request: Request | string | undefined,
): string | null {
	const xff =
		typeof request === "string" || request === undefined
			? request
			: request.headers.get("x-forwarded-for");
	if (!xff) return null;
	const hops = xff.split(",");
	for (let i = hops.length - 1; i >= 0; i--) {
		const hop = hops[i]?.trim();
		if (hop) return hop;
	}
	return null;
}

/**
 * Narrow interface covering the srvx ServerRequest extensions present at
 * runtime (srvx v0.11.x). Casting to this instead of `any` keeps strict-mode
 * happy while still letting us reach the peer address fields.
 */
interface SrvxRequest {
	ip?: string;
	runtime?: {
		node?: {
			req?: {
				socket?: {
					remoteAddress?: string;
				};
			};
		};
	};
}

/**
 * Resolve the best available client IP:
 *
 * 1. Prefer the rightmost X-Forwarded-For hop — Coolify's Traefik APPENDS the
 *    real client IP in prod, so this is the trusted value when running behind
 *    the proxy.
 * 2. Fall back to the real TCP connection IP exposed by srvx (`request.ip` or
 *    `request.runtime.node.req.socket.remoteAddress`). This is per-client and
 *    meaningful for local dev / direct non-proxied access.
 * 3. Return null only when neither source is resolvable.
 *
 * Degraded case: if deployed behind Traefik but XFF is somehow absent, the
 * peer address would be Traefik's own IP, collapsing all traffic into one
 * bucket. The documented precondition is that Traefik always sets XFF, so
 * this path is acceptable and not expected in production.
 */
export function clientIp(request: Request): string | null {
	const fromXff = ipFromForwardedFor(request);
	if (fromXff !== null) return fromXff;

	const sr = request as unknown as SrvxRequest;
	return sr.ip ?? sr.runtime?.node?.req?.socket?.remoteAddress ?? null;
}
