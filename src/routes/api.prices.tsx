import { createFileRoute } from "@tanstack/react-router";

const convexSiteUrl =
	process.env.VITE_CONVEX_SITE_URL || process.env.VITE_CONVEX_URL;

if (!convexSiteUrl) {
	throw new Error("VITE_CONVEX_SITE_URL is required for CLI proxy routes");
}

const convexOrigin = new URL(convexSiteUrl).origin;

/** Public price table consumed by the CLI before it scans. */
export async function pricesGet(): Promise<Response> {
	try {
		const response = await fetch(`${convexOrigin}/api/prices`, {
			headers: { Accept: "application/json" },
		});
		return new Response(await response.text(), {
			status: response.status,
			headers: {
				"Content-Type":
					response.headers.get("Content-Type") ?? "application/json",
				"Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return Response.json(
			{ error: `Price proxy failed: ${message}` },
			{ status: 502 },
		);
	}
}

export const Route = createFileRoute("/api/prices")({
	server: {
		handlers: {
			GET: pricesGet,
		},
	},
});
