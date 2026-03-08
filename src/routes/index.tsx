import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import { LandingPageShell } from "@/features/landing/LandingPageShell";
import type { LandingStackPreview } from "@/features/landing/sections/FeaturedStacksSection";

export const Route = createFileRoute("/")({
	component: IndexRoute,
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.stacks.listPublished, {}),
		);
	},
	head: () => ({
		meta: [
			{
				title: "AI Stack - Command line signal from real builder stacks",
			},
			{
				name: "description",
				content:
					"Track the AI stacks indie builders run in production. Compare costs, clone workflows, and ship with less guesswork.",
			},
			{
				property: "og:title",
				content: "AI Stack - What real builders use to ship",
			},
			{
				property: "og:description",
				content:
					"Track the AI stacks indie builders run in production. Compare costs, clone workflows, and ship with less guesswork.",
			},
			{
				property: "og:image",
				content: "https://aistack.to/banners/aistack.png",
			},
			{
				property: "og:image:width",
				content: "802",
			},
			{
				property: "og:image:height",
				content: "438",
			},
			{
				property: "og:url",
				content: "https://aistack.to",
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:site_name",
				content: "AI Stack",
			},
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:title",
				content: "AI Stack - Command line signal from real builder stacks",
			},
			{
				name: "twitter:description",
				content:
					"Track the AI stacks indie builders run in production. Compare costs, clone workflows, and ship with less guesswork.",
			},
			{
				name: "twitter:image",
				content: "https://aistack.to/banners/aistack.png",
			},
			{
				name: "twitter:site",
				content: "@alperortac",
			},
			{
				name: "twitter:creator",
				content: "@alperortac",
			},
			{
				name: "keywords",
				content:
					"AI stacks, AI workflows, startup operations, indie builders, AI tooling costs, command line productivity",
			},
			{
				name: "author",
				content: "Alper Ortac",
			},
			{
				name: "robots",
				content: "index, follow",
			},
			{
				name: "googlebot",
				content: "index, follow",
			},
		],
	}),
});

function IndexRoute() {
	const stacks = (useQuery(api.stacks.listPublished) ??
		[]) as LandingStackPreview[];
	const userStack = useQuery(api.stacks.getUserStack);

	return <LandingPageShell stacks={stacks} userStack={userStack} />;
}
