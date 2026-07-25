import { createFileRoute } from "@tanstack/react-router";

const convexSiteUrl =
	process.env.VITE_CONVEX_SITE_URL || process.env.VITE_CONVEX_URL;

if (!convexSiteUrl) {
	throw new Error("VITE_CONVEX_SITE_URL is required for CLI proxy routes");
}

const convexOrigin = new URL(convexSiteUrl).origin;

/**
 * POST /api/cli/sync — publish one approved measured-layer snapshot.
 *
 * Wayfinder ticket #38 (map #29). A thin proxy to the Convex HTTP action, same
 * shape as the other `/api/cli/*` routes, so the sync client talks to one
 * origin regardless of which send channel #35 picks.
 *
 * Deliberately NOT rate-limited here: this path is bearer-authenticated, and
 * the token itself is the budget. The public `/api/sync-config` is the one that
 * needs the IP-keyed limiter.
 */
export const Route = createFileRoute("/api/cli/sync")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const body = await request.text();
				const headers: Record<string, string> = {
					"Content-Type": "application/json",
				};
				const auth = request.headers.get("Authorization");
				if (auth) headers.Authorization = auth;

				try {
					const resp = await fetch(`${convexOrigin}/api/cli/sync`, {
						method: "POST",
						headers,
						body,
					});
					const respBody = await resp.text();
					return new Response(respBody, {
						status: resp.status,
						headers: {
							"Content-Type":
								resp.headers.get("Content-Type") ?? "application/json",
						},
					});
				} catch (err) {
					const message = err instanceof Error ? err.message : String(err);
					return new Response(
						JSON.stringify({
							error: `Proxy → Convex (${convexOrigin}) failed: ${message}`,
						}),
						{
							status: 502,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			},
		},
	},
});
