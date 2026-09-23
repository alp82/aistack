import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	EfficiencySettingsPrototype,
	VARIANT_KEYS,
	type VariantKey,
} from "@/features/usage/prototype/EfficiencySettingsPrototype";
import {
	allEight,
	everyInsight,
} from "@/features/usage/prototype/efficiency-insights";
import { api } from "../../convex/_generated/api";

const DEFAULT_SLUG = "alpers-coding-stack-unw0sl";

/** PROTOTYPE - throwaway. The settings page as the home, with its two doors. Dev only. */
export const Route = createFileRoute("/prototype/token-efficiency-settings")({
	validateSearch: (search: Record<string, unknown>) => ({
		variant: (VARIANT_KEYS as string[]).includes(String(search.variant))
			? (String(search.variant) as VariantKey)
			: ("K" as VariantKey),
		slug:
			typeof search.slug === "string" && search.slug !== ""
				? search.slug
				: DEFAULT_SLUG,
	}),
	head: () => ({
		meta: [
			{ title: "Token efficiency settings prototype" },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: Page,
});

function Page() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const live = useQuery(api.prototypeEfficiency.live, { slug: search.slug });
	if (!import.meta.env.DEV) return null;
	if (live === undefined) return null;
	const insights = live?.insights ?? [];
	return (
		<EfficiencySettingsPrototype
			variant={search.variant}
			insights={allEight(insights)}
			all={everyInsight(insights)}
			onChange={(next) =>
				navigate({ search: { ...search, ...next }, replace: true })
			}
		/>
	);
}
