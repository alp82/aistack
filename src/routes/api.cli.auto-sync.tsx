import { createFileRoute } from "@tanstack/react-router";

const convexSiteUrl =
	process.env.VITE_CONVEX_SITE_URL || process.env.VITE_CONVEX_URL;

if (!convexSiteUrl) {
	throw new Error("VITE_CONVEX_SITE_URL is required for CLI proxy routes");
}

const convexOrigin = new URL(convexSiteUrl).origin;

/**
 * POST /api/cli/auto-sync — a machine sets the auto-sync permission on its
 * bound stack.
 *
 * Wayfinder ticket #102 (map #76), from #100 decision 2. A thin proxy to the
 * Convex HTTP action, the same shape as `/api/cli/sync`, so the CLI keeps
 * talking to one origin.
 *
 * Deliberately NOT rate-limited here, like the sync route: this path is
 * bearer-authenticated and the token itself is the budget.
 */
export const Route = createFileRoute("/api/cli/auto-sync")({
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
					const resp = await fetch(`${convexOrigin}/api/cli/auto-sync`, {
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
