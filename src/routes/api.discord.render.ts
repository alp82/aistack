import { createFileRoute } from "@tanstack/react-router";
import { handleDiscordRender } from "../features/discord/server/render";

export const Route = createFileRoute("/api/discord/render")({
	server: { handlers: { POST: ({ request }) => handleDiscordRender(request) } },
});
