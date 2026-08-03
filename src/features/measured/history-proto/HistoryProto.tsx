/**
 * PROTOTYPE — throwaway. Wayfinder ticket #80 (map #76).
 *
 * Three variants of section 01 ("Actual Usage") once the stack page shows its
 * measured HISTORY and not only its newest snapshot. Mounted on the real
 * `/stacks/$slug` route in place of `MeasuredSection`, so each variant is judged
 * against the real header, the real accent preset and the real sections either
 * side of it.
 *
 *   /stacks/<slug>?proto=A          chart-first
 *   /stacks/<slug>?proto=B&d=real   log-first
 *   /stacks/<slug>?proto=C&d=month  number-first
 *
 * `proto=off` (the default) renders the shipped section untouched.
 *
 * Data comes from `fixtures.ts`, not from Convex: no query returns a series yet,
 * and the whole point of the second axis is flipping between densities the real
 * table cannot supply (1, 2, 7-real, 35, 130 readings). The `d=real` dataset is
 * the production history verbatim, copied on 2026-08-04.
 */
import {
	type ProtoAxis,
	PrototypeSwitcher,
	useProtoAxes,
} from "@/components/PrototypeSwitcher";
import { MEASURED_ANCHOR } from "../copy";
import { MeasuredSection } from "../MeasuredSection";
import { DATASETS, type DatasetKey, readingsFor, toPoints } from "./fixtures";
import { VARIANT_A_NAME, VariantA } from "./VariantA";
import { VARIANT_B_NAME, VariantB } from "./VariantB";
import { VARIANT_C_NAME, VariantC } from "./VariantC";

const VARIANT_AXIS: ProtoAxis = {
	param: "proto",
	title: "variant",
	options: [
		{ key: "off", label: "shipped today (no history)" },
		{ key: "A", label: VARIANT_A_NAME },
		{ key: "B", label: VARIANT_B_NAME },
		{ key: "C", label: VARIANT_C_NAME },
	],
};

const DATA_AXIS: ProtoAxis = {
	param: "d",
	title: "data",
	options: DATASETS.map((d) => ({ key: d.key, label: d.label })),
};

const AXES = [VARIANT_AXIS, DATA_AXIS];

export function MeasuredHistoryProto({
	index,
	slug,
	isOwner,
}: {
	index: number;
	slug: string;
	isOwner: boolean;
}) {
	const [axes, set] = useProtoAxes(AXES);
	const variant = axes.proto ?? "off";
	const dataset = (axes.d ?? "real") as DatasetKey;
	const points = toPoints(readingsFor(dataset));

	return (
		<>
			{variant === "off" ? (
				<MeasuredSection index={index} slug={slug} isOwner={isOwner} />
			) : variant === "A" ? (
				<VariantA index={index} anchor={MEASURED_ANCHOR} points={points} />
			) : variant === "B" ? (
				<VariantB index={index} anchor={MEASURED_ANCHOR} points={points} />
			) : (
				<VariantC index={index} anchor={MEASURED_ANCHOR} points={points} />
			)}
			<PrototypeSwitcher
				axes={AXES}
				value={axes}
				onChange={set}
				note={
					variant === "off"
						? "wayfinder #80 · ← → variant · ↑ ↓ data"
						: "wayfinder #80 · FIXTURE DATA, not this stack"
				}
			/>
		</>
	);
}
