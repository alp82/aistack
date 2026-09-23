import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	EfficiencyHomePrototype,
	VARIANT_KEYS,
	type VariantKey,
} from "@/features/usage/prototype/EfficiencyHomePrototype";
import { allEight } from "@/features/usage/prototype/efficiency-insights";
import { api } from "../../convex/_generated/api";

const DEFAULT_SLUG = "alpers-coding-stack-unw0sl";
const DEFAULT_HANDLE = "alperortac";

/** PROTOTYPE - throwaway. Where the owner-only insights live. Dev only. */
export const Route = createFileRoute("/prototype/token-efficiency-home")({
	validateSearch: (search: Record<string, unknown>) => ({
		variant: (VARIANT_KEYS as string[]).includes(String(search.variant))
			? (String(search.variant) as VariantKey)
			: ("D" as VariantKey),
		slug:
			typeof search.slug === "string" && search.slug !== ""
				? search.slug
				: DEFAULT_SLUG,
		handle:
			typeof search.handle === "string" && search.handle !== ""
				? search.handle
				: DEFAULT_HANDLE,
	}),
	head: () => ({
		meta: [
			{ title: "Token efficiency home prototype" },
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
	return (
		<EfficiencyHomePrototype
			variant={search.variant}
			handle={search.handle}
			insights={allEight(live?.insights ?? [])}
			onChange={(next) =>
				navigate({ search: { ...search, ...next }, replace: true })
			}
		/>
	);
}
