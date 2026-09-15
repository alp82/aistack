import { createFileRoute } from "@tanstack/react-router";
import {
	DiscordRepliesPrototype,
	defaultReplyVariant,
} from "@/features/discord/prototype/DiscordRepliesPrototype";

export const Route = createFileRoute("/prototype/discord-replies")({
	validateSearch: (search: Record<string, unknown>) => ({
		variant: ["A", "B", "C"].includes(String(search.variant))
			? String(search.variant)
			: defaultReplyVariant(String(search.example ?? "total")),
		example: typeof search.example === "string" ? search.example : "total",
	}),
	head: () => ({
		meta: [
			{ title: "Discord replies prototype" },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: Page,
});

function Page() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	if (!import.meta.env.DEV) return null;
	return (
		<DiscordRepliesPrototype
			{...search}
			onChange={(next) =>
				navigate({ search: { ...search, ...next }, replace: true })
			}
		/>
	);
}
