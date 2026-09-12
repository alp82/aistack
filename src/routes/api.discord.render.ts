import { createFileRoute } from "@tanstack/react-router";
import { handleDiscordRender } from "../features/discord/server/render";

export const Route = createFileRoute("/api/discord/render")({
	server: {
		handlers: {
			GET: () =>
				Response.json(
					{
						commit: process.env.SOURCE_COMMIT ?? null,
						ready: (process.env.DISCORD_RENDER_SECRET?.length ?? 0) >= 32,
					},
					{ headers: { "cache-control": "no-store" } },
				),
			POST: ({ request }) => handleDiscordRender(request),
		},
	},
});
