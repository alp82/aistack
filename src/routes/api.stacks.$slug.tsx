import { createFileRoute } from "@tanstack/react-router";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { clientIp, ipFromForwardedFor } from "../lib/client-ip";

// Re-exported so existing importers and tests keep one import site while the
// rule itself lives in one place (#78).
export { clientIp, ipFromForwardedFor };

const convexUrl = process.env.VITE_CONVEX_URL;

if (!convexUrl) {
	throw new Error("VITE_CONVEX_URL is required for the public stacks API");
}

const convex = new ConvexHttpClient(convexUrl);

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
