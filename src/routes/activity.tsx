/**
 * PROTOTYPE ROUTE — throwaway. Wayfinder ticket #96 (map #76).
 *
 * The dedicated activity page behind the band's "all activity" button.
 * `/activity` is a PLACEHOLDER name — the route name is one of the ticket's
 * open questions. Variants switch via `?variant=` (C, F, G, H), density via
 * `?density=` (real, grown).
 */

import { createFileRoute } from "@tanstack/react-router";
import { Switcher } from "@/features/activity-proto/Switcher";
import { useActivityPrototype } from "@/features/activity-proto/useActivityPrototype";
import { VariantC } from "@/features/activity-proto/VariantC";
import { VariantF } from "@/features/activity-proto/VariantF";
import { VariantG } from "@/features/activity-proto/VariantG";
import { VariantH } from "@/features/activity-proto/VariantH";

export const Route = createFileRoute("/activity")({
	component: ActivityPrototype,
	head: () => ({
		meta: [{ title: "Activity — PROTOTYPE (#96)" }],
	}),
});

function ActivityPrototype() {
	const { variant, density, rows, ready, cycle, setDensity, inject } =
		useActivityPrototype();

	if (!ready) return <div className="min-h-screen bg-bg-canvas" />;

	return (
		<>
			{variant === "C" ? <VariantC rows={rows} /> : null}
			{variant === "F" ? <VariantF rows={rows} /> : null}
			{variant === "G" ? <VariantG rows={rows} /> : null}
			{variant === "H" ? <VariantH rows={rows} /> : null}
			<Switcher
				variant={variant}
				density={density}
				rowCount={rows.length}
				onCycle={cycle}
				onDensity={setDensity}
				onInject={inject}
			/>
		</>
	);
}
