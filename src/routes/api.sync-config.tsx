import { createFileRoute } from "@tanstack/react-router";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { clientIp, rateLimitHeaders } from "./api.stacks.$slug";

const convexUrl = process.env.VITE_CONVEX_URL;
const convexSiteUrl = process.env.VITE_CONVEX_SITE_URL || convexUrl;

if (!convexUrl || !convexSiteUrl) {
	throw new Error("VITE_CONVEX_URL is required for the sync-config API");
}

const convex = new ConvexHttpClient(convexUrl);
const convexOrigin = new URL(convexSiteUrl).origin;

/**
 * GET /api/sync-config — what a sync client fetches immediately before it
 * builds a payload.
 *
 * Wayfinder ticket #38 (map #29), decision 4 of the wire-format grilling #33.
 * Two halves with different auth requirements:
 *
 *   - The ALLOWLIST is public. Fail-closed name filtering only means something
 *     if it runs before the send, so a client must be able to fetch it without
 *     credentials — and it is not secret, since the approve gate renders every
 *     name it will publish anyway.
 *   - `publishCost` is a STACK-level preference, so it needs to know which
 *     stack. The bearer is therefore OPTIONAL: present and valid, the response
 *     carries the bound stack's preference and name; absent, it fails closed to
 *     `publishCost: false`, matching the client's bundled default.
 *
 * Rate-limited on the same IP-keyed `apiRateLimits` limiter as
 * `/api/stacks/{slug}`, and with the same load-bearing precondition about which
 * X-Forwarded-For hop is trustworthy — see `clientIp` in that module.
 */
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

export const Route = createFileRoute("/api/sync-config")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const ip = clientIp(request);
				if (!ip) return jsonError(400, "Could not determine client address");
				try {
					const rl = await convex.mutation(api.rateLimit.checkApiRateLimit, {
						ip,
					});
					if (!rl.allowed) {
						return jsonError(429, "Rate limit exceeded", {
							...rateLimitHeaders(rl),
							"Retry-After": String(rl.retryAfterSeconds),
						});
					}

					// Forwarded to the Convex action rather than resolved here: the
					// bearer must be checked against `cliTokens`, which is an internal
					// query and deliberately not reachable from a public client.
					const headers: Record<string, string> = {};
					const auth = request.headers.get("Authorization");
					if (auth) headers.Authorization = auth;

					const resp = await fetch(`${convexOrigin}/api/cli/sync-config`, {
						headers,
					});
					const body = await resp.text();
					return new Response(body, {
						status: resp.status,
						headers: {
							"Content-Type": "application/json",
							// Short cache, and only when anonymous: the authenticated
							// response carries a per-stack preference and must never be
							// served to another caller from a shared cache.
							"Cache-Control": auth
								? "private, no-store"
								: "public, max-age=300, stale-while-revalidate=3600",
							"Access-Control-Allow-Origin": "*",
							...rateLimitHeaders(rl),
						},
					});
				} catch (error) {
					console.error("[api/sync-config] request failed", error);
					return jsonError(500, "Internal error");
				}
			},
			OPTIONS: async () =>
				new Response(null, {
					status: 204,
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Methods": "GET, OPTIONS",
						"Access-Control-Allow-Headers": "Authorization, Content-Type",
						"Access-Control-Max-Age": "86400",
					},
				}),
		},
	},
});
