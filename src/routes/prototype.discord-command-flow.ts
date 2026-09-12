import { createFileRoute } from "@tanstack/react-router";
import commandFlow from "@/features/discord/prototype/command-flow.html?raw";

export const Route = createFileRoute("/prototype/discord-command-flow")({
	server: {
		handlers: {
			GET: () =>
				import.meta.env.DEV
					? new Response(commandFlow, {
							headers: {
								"Content-Type": "text/html; charset=utf-8",
								"Cache-Control": "no-store",
							},
						})
					: new Response("Not found", { status: 404 }),
		},
	},
});
