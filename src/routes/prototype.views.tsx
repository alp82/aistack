/**
 * PROTOTYPE (#98) — `/prototype/views`.
 *
 * Throwaway route. Three designs for the owner-private view numbers, across
 * three data states, switchable from the bar at the bottom.
 *
 * It runs on fixtures and not on `viewAnalytics.mine`, for two reasons. The
 * reader has to be able to open the link on a phone without signing in, and the
 * three data states have to be reachable side by side — the "open a year" state
 * does not exist in any database yet.
 *
 * Delete this file when #98 is decided. The variants live on in the prototype
 * branch, not in main.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PrototypeSwitcher } from "@/components/PrototypeSwitcher";
import {
	DATA_STATE_LABELS,
	DATA_STATES,
	type DataState,
	fixture,
} from "@/features/settings/prototype/fixtures";
import {
	VARIANT_LABELS,
	VARIANTS,
	VariantA,
	VariantB,
	VariantC,
	type VariantKey,
} from "@/features/settings/prototype/PageVariants";

type Search = { variant: VariantKey; data: DataState };

export const Route = createFileRoute("/prototype/views")({
	component: PrototypeViews,
	validateSearch: (search: Record<string, unknown>): Search => ({
		variant: VARIANTS.includes(search.variant as VariantKey)
			? (search.variant as VariantKey)
			: "A",
		data: DATA_STATES.includes(search.data as DataState)
			? (search.data as DataState)
			: "thin",
	}),
});

function PrototypeViews() {
	const { variant, data: state } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const data = fixture(state, Date.now());

	return (
		<>
			<div className="pb-24">
				{variant === "A" && <VariantA data={data} />}
				{variant === "B" && <VariantB data={data} />}
				{variant === "C" && <VariantC data={data} />}
			</div>
			<PrototypeSwitcher
				axes={[
					{
						name: "Design",
						keys: VARIANTS,
						labels: VARIANT_LABELS,
						current: variant,
						arrowKeys: true,
						onPick: (k) =>
							navigate({ search: { variant: k as VariantKey, data: state } }),
					},
					{
						name: "Data",
						keys: DATA_STATES,
						labels: DATA_STATE_LABELS,
						current: state,
						onPick: (k) =>
							navigate({ search: { variant, data: k as DataState } }),
					},
				]}
			/>
		</>
	);
}
