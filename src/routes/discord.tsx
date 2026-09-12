import { createFileRoute } from "@tanstack/react-router";
import { DiscordGuidePage } from "@/features/discord/DiscordGuidePage";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/discord")({
	component: DiscordGuidePage,
	head: () => ({
		meta: seoMeta({
			title: "Discord Bot Guide - AI Stack",
			description:
				"Add AI Stack to Discord, explore your AI usage with five commands, compare creators, and find setup help.",
			url: "/discord",
		}),
		links: [{ rel: "canonical", href: "https://aistack.to/discord" }],
	}),
});
