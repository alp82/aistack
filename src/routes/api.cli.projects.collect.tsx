import { createFileRoute } from "@tanstack/react-router";

const convexSiteUrl =
	process.env.VITE_CONVEX_SITE_URL || process.env.VITE_CONVEX_URL;

if (!convexSiteUrl) {
	throw new Error("VITE_CONVEX_SITE_URL is required for CLI proxy routes");
}

const convexOrigin = new URL(convexSiteUrl).origin;

export const Route = createFileRoute("/api/cli/projects/collect")({
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
					const resp = await fetch(`${convexOrigin}/api/cli/projects/collect`, {
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
