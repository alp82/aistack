import { createFileRoute } from "@tanstack/react-router";

const convexSiteUrl =
	process.env.VITE_CONVEX_SITE_URL || process.env.VITE_CONVEX_URL;

if (!convexSiteUrl) {
	throw new Error("VITE_CONVEX_SITE_URL is required for CLI proxy routes");
}

const convexOrigin = new URL(convexSiteUrl).origin;

export const Route = createFileRoute("/api/cli/projects/$shortId")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const resp = await fetch(
					`${convexOrigin}/api/cli/projects/${params.shortId}`,
					{
						method: "GET",
						headers: { "Content-Type": "application/json" },
					},
				);
				return new Response(resp.body, {
					status: resp.status,
					headers: { "Content-Type": "application/json" },
				});
			},
		},
	},
});
