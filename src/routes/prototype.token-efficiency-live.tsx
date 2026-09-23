import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { fmtUSD } from "@/features/measured/copy";
import {
	EfficiencyIntegrationPrototype,
	VARIANT_KEYS,
	type VariantKey,
} from "@/features/usage/prototype/EfficiencyIntegrationPrototype";
import {
	allEight,
	V4_LEVERS,
} from "@/features/usage/prototype/efficiency-insights";
import { api } from "../../convex/_generated/api";

const DEFAULT_SLUG = "alpers-coding-stack-unw0sl";

/**
 * PROTOTYPE - throwaway. All eight insights on the real Stats page, three
 * integrations via `?variant=`. v3 insights come from the local database (a
 * prod mirror) with no owner gate; v4 insights from the local measurement.
 * Delete with convex/prototypeEfficiency.ts.
 */
export const Route = createFileRoute("/prototype/token-efficiency-live")({
	validateSearch: (search: Record<string, unknown>) => ({
		variant: (VARIANT_KEYS as string[]).includes(String(search.variant))
			? (String(search.variant) as VariantKey)
			: ("A" as VariantKey),
		slug:
			typeof search.slug === "string" && search.slug !== ""
				? search.slug
				: DEFAULT_SLUG,
	}),
	head: () => ({
		meta: [
			{ title: "Token efficiency live prototype" },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: Page,
});

function Page() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const { slug } = search;
	const usage = useQuery(api.measured.getUsageByStackSlug, {
		slug,
		range: "30d",
	});
	const stats = useQuery(api.workflow.getStatsByStackSlug, { slug });
	const live = useQuery(api.prototypeEfficiency.live, { slug });
	if (!import.meta.env.DEV) return null;
	if (usage === undefined || stats === undefined || live === undefined)
		return null;
	const insights = allEight(live?.insights ?? []);
	return (
		<>
			<EfficiencyIntegrationPrototype
				variant={search.variant}
				onChange={(next) =>
					navigate({ search: { ...search, ...next }, replace: true })
				}
				usage={usage}
				stats={stats}
				insights={insights}
			/>
			<details className="mx-auto max-w-7xl px-6 pb-40 font-mono text-[11px] text-fg-muted">
				<summary className="cursor-pointer">
					prototype notes: where each insight's data comes from
				</summary>
				<ul className="mt-2 space-y-1">
					{insights.map((i) => (
						<li key={i.id}>
							{i.lever} · {i.harness} · {i.severity} · meter{" "}
							{i.meter.toFixed(2)}
							{i.usd !== null ? ` · ${fmtUSD(i.usd)}` : ""} ·{" "}
							{V4_LEVERS.has(i.lever)
								? "v4 atoms from this machine's local transcripts (2026-09-22)"
								: "v3 atoms from the prod mirror"}
						</li>
					))}
				</ul>
			</details>
		</>
	);
}
