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
	sort: "updated" as SortOption,
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
			["updated", "upvotes", "newest", "price_low", "price_high"] as const,
			"updated",
		),
		page: coercePage(search.page),
	}),
	search: { middlewares: [stripSearchParams(LANDING_SEARCH_DEFAULTS)] },
	// The band ships in the first HTML like the featured stacks do: the pulse is
	// what a first-time visitor reads above the fold, and it should not wait for
	// a hydrated client.
	loader: async ({ context }) => {
		const [stacks, band] = await Promise.all([
			context.queryClient.ensureQueryData(
				convexQuery(api.stacks.listPublic, {}),
			),
			context.queryClient.ensureQueryData(
				convexQuery(api.activityFeed.band, {}),
			),
		]);
		return { stacks, band };
	},
	head: () => ({
		meta: seoMeta({
			title: "AI Stack - See What Real Builders Use to Ship",
			description:
				"Explore the AI stacks indie builders run in production. Compare tools, costs, and workflows, then build your own.",
			url: "/",
			keywords:
				"AI stacks, AI tools, AI workflows, indie builders, AI tooling costs, developer tools",
		}),
	}),
});

function IndexRoute() {
	// Both reads fall back to the loader snapshot, so the server and the
	// hydrating client render the SAME page. Reading the live query alone left
	// the SSR HTML without the featured stacks - a hydration mismatch that made
	// React regenerate the tree and remount the route (double-running the
	// hero's counter).
	const { stacks: loadedStacks, band: loadedBand } = Route.useLoaderData();
	const stacks = (useQuery(api.stacks.listPublic) ??
		loadedStacks) as LandingStackPreview[];
	const me = useQuery(api.creators.getMe);
	const band = useQuery(api.activityFeed.band, {}) ?? loadedBand;

	return (
		<>
			<JsonLd
				data={{
					type: "WebSite",
					description:
						"Explore the AI stacks indie builders run in production. Compare tools, costs, and workflows.",
				}}
			/>
			<LandingPageShell stacks={stacks} me={me} band={band} />
		</>
	);
}
