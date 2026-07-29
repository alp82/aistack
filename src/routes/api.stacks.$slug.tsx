import { createFileRoute } from "@tanstack/react-router";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const convexUrl = process.env.VITE_CONVEX_URL;

if (!convexUrl) {
	throw new Error("VITE_CONVEX_URL is required for the public stacks API");
}

const convex = new ConvexHttpClient(convexUrl);

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
 * Resolve the best available client IP for rate-limiting:
 *
 * 1. Prefer the rightmost X-Forwarded-For hop — Coolify's Traefik APPENDS the
 *    real client IP in prod, so this is the trusted value when running behind
 *    the proxy.
 * 2. Fall back to the real TCP connection IP exposed by srvx (`request.ip` or
 *    `request.runtime.node.req.socket.remoteAddress`). This is per-client and
 *    meaningful for local dev / direct non-proxied access.
 * 3. Return null only when neither source is resolvable — the caller SHOULD
 *    then respond 400.
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

export function rateLimitHeaders(rl: {
	limit: number;
	remaining: number;
	retryAfterSeconds: number;
}): Record<string, string> {
	return {
		"RateLimit-Limit": String(rl.limit),
		"RateLimit-Remaining": String(rl.remaining),
		"RateLimit-Reset": String(rl.retryAfterSeconds),
	};
}

function jsonError(
	status: number,
	message: string,
	extraHeaders?: Record<string, string>,
): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
			...extraHeaders,
		},
	});
}

export const Route = createFileRoute("/api/stacks/$slug")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				const ip = clientIp(request);
				if (!ip) return jsonError(400, "Could not determine client address");
				try {
					// Namespaced, because the same table now also holds bearer-token
					// buckets (#52) and two kinds of caller must never collide.
					const rl = await convex.mutation(api.rateLimit.checkApiRateLimit, {
						key: `ip:${ip}`,
					});
					if (!rl.allowed) {
						return jsonError(429, "Rate limit exceeded", {
							...rateLimitHeaders(rl),
							"Retry-After": String(rl.retryAfterSeconds),
						});
					}

					const summary = await convex.query(api.stacks.getPublicSummary, {
						slug: params.slug,
					});
					if (!summary) {
						return jsonError(404, "Stack not found", rateLimitHeaders(rl));
					}

					return new Response(JSON.stringify(summary), {
						status: 200,
						headers: {
							"Content-Type": "application/json",
							"Cache-Control":
								"public, max-age=300, stale-while-revalidate=3600",
							"Access-Control-Allow-Origin": "*",
							...rateLimitHeaders(rl),
						},
					});
				} catch (error) {
					console.error("[api/stacks/$slug] request failed", error);
					return jsonError(500, "Internal error");
				}
			},
			OPTIONS: async () =>
				new Response(null, {
					status: 204,
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Methods": "GET, OPTIONS",
						"Access-Control-Max-Age": "86400",
					},
				}),
		},
	},
});
