import { createFileRoute } from "@tanstack/react-router";

const convexSiteUrl =
	process.env.VITE_CONVEX_SITE_URL || process.env.VITE_CONVEX_URL;

if (!convexSiteUrl) {
	throw new Error("VITE_CONVEX_SITE_URL is required for CLI proxy routes");
}

const convexOrigin = new URL(convexSiteUrl).origin;

/** Authenticated day manifest used to send only changed measured days. */
export async function manifestGet({
	request,
}: {
	request: Request;
}): Promise<Response> {
	const headers: Record<string, string> = { Accept: "application/json" };
	const auth = request.headers.get("Authorization");
	if (auth) headers.Authorization = auth;
	try {
		const response = await fetch(`${convexOrigin}/api/cli/sync-manifest`, {
			headers,
		});
		return new Response(await response.text(), {
			status: response.status,
			headers: {
				"Content-Type":
					response.headers.get("Content-Type") ?? "application/json",
				"Cache-Control": "private, no-store",
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return Response.json(
			{ error: `Manifest proxy failed: ${message}` },
			{ status: 502 },
		);
	}
}

export const Route = createFileRoute("/api/cli/sync-manifest")({
	server: {
		handlers: {
			GET: manifestGet,
		},
	},
});
