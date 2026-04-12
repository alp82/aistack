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

				const resp = await fetch(`${convexOrigin}/api/cli/projects/collect`, {
					method: "POST",
					headers,
					body,
				});
				return new Response(resp.body, {
					status: resp.status,
					headers: { "Content-Type": "application/json" },
				});
			},
		},
	},
});
