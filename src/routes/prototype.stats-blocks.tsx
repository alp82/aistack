import { createFileRoute } from "@tanstack/react-router";
import {
	StatsBlocksPrototype,
	VARIANT_KEYS,
	type VariantKey,
} from "@/features/usage/prototype/StatsBlocksPrototype";

const DEFAULT_SLUG = "alpers-coding-stack-unw0sl";
const KNOWN = [DEFAULT_SLUG, "brilliant-insane-xg5pfo", "abernier-mbp2-ok7asp"];

/** A slug without its short ID (an old prototype URL) resolves to the full one. */
function fullSlug(slug: unknown): string {
	if (typeof slug !== "string" || slug === "") return DEFAULT_SLUG;
	return KNOWN.find((known) => known.startsWith(`${slug}-`)) ?? slug;
}

/** PROTOTYPE - throwaway (#463, map #462). Dev only. */
export const Route = createFileRoute("/prototype/stats-blocks")({
	validateSearch: (search: Record<string, unknown>) => ({
		variant: (VARIANT_KEYS as string[]).includes(String(search.variant))
			? (String(search.variant) as VariantKey)
			: ("A" as VariantKey),
		slug: fullSlug(search.slug),
	}),
	head: () => ({
		meta: [
			{ title: "Stats blocks prototype" },
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
		<StatsBlocksPrototype
			{...search}
			onChange={(next) =>
				navigate({ search: { ...search, ...next }, replace: true })
			}
		/>
	);
}
