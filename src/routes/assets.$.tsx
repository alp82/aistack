import { createFileRoute } from "@tanstack/react-router";

// The static server answers every file that exists under /assets before the
// router runs, so this route only sees hashed files from an older deploy.
// Without it the router renders a page with status 200, and a browser or a
// crawler's renderer receives HTML where it expected JavaScript.
function missingAsset(): Response {
	return new Response("Not found", {
		status: 404,
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "no-store",
		},
	});
}

export const Route = createFileRoute("/assets/$")({
	server: {
		handlers: {
			GET: missingAsset,
			HEAD: missingAsset,
		},
	},
});
