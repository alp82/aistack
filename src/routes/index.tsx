import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { JsonLd } from "@/components/JsonLd";
import { LandingPageShell } from "@/features/landing/LandingPageShell";
import type {
	LandingStackPreview,
	SortOption,
} from "@/features/landing/sections/FeaturedStacksSection";
import { coerceEnum, coercePage, coerceString } from "@/lib/searchParams";
import { seoMeta } from "@/lib/seo";
import { api } from "../../convex/_generated/api";

export const LANDING_SEARCH_DEFAULTS = {
	filter: "all",
	sort: "upvotes" as SortOption,
	page: 1,
};

export const Route = createFileRoute("/")({
	component: IndexRoute,
	validateSearch: (
		search: Record<string, unknown>,
	): { filter?: string; sort?: SortOption; page?: number } => ({
		filter: coerceString(search.filter, "all"),
		sort: coerceEnum(
			search.sort,
			["upvotes", "newest", "price_low", "price_high"] as const,
			"upvotes",
		),
		page: coercePage(search.page),
	}),
	search: { middlewares: [stripSearchParams(LANDING_SEARCH_DEFAULTS)] },
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.stacks.listPublished, {}),
		);
	},
	head: () => ({
		meta: seoMeta({
			title: "AI Stack - See What Real Builders Use to Ship",
			description:
				"Explore the AI stacks indie builders run in production. Compare tools, costs, and workflows — then build your own.",
			url: "/",
			keywords:
				"AI stacks, AI tools, AI workflows, indie builders, AI tooling costs, developer tools",
		}),
	}),
});

function IndexRoute() {
	const stacks = (useQuery(api.stacks.listPublished) ??
		[]) as LandingStackPreview[];
	const userStack = useQuery(api.stacks.getUserStack);

	return (
		<>
			<JsonLd
				data={{
					type: "WebSite",
					description:
						"Explore the AI stacks indie builders run in production. Compare tools, costs, and workflows.",
				}}
			/>
			<LandingPageShell stacks={stacks} userStack={userStack} />
		</>
	);
}
