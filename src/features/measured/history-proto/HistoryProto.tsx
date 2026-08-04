/**
 * PROTOTYPE - throwaway. Wayfinder ticket #80 (map #76).
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
import { TIPS, type TipKey } from "./TokenTips";
import { VARIANT_A_NAME, VariantA } from "./VariantA";
import { VARIANT_B_NAME, VariantB } from "./VariantB";
import { VARIANT_C_NAME, VariantC } from "./VariantC";
import { VARIANT_D_NAME, VariantD } from "./VariantD";
import { VARIANT_E_NAME, VariantE } from "./VariantE";
import { VARIANT_F_NAME, VariantF } from "./VariantF";
import {
	VARIANT_G_NAME,
	VARIANT_H_NAME,
	VARIANT_I_NAME,
	VariantG,
	VariantH,
	VariantI,
} from "./VariantsGHI";

/**
 * Round two starts at D. The owner picked C's direction and locked the headline
 * (tokens leading, spend under it, one hover area over both - see MetricBlock),
 * so D, E and F share that block and differ only in how much space the model
 * mix earns. A, B and C stay listed for comparison.
 */
const ROUND_TWO = {
	D: VariantD,
	E: VariantE,
	F: VariantF,
	// Round three: E's structure with the emphasis inverted - solid current
	// bars in front, history receding.
	G: VariantG,
	H: VariantH,
	I: VariantI,
} as const;

const VARIANT_AXIS: ProtoAxis = {
	param: "proto",
	title: "variant",
	options: [
		// `off` stays first so it is the default: a stack page with no `?proto=`
		// must still render the shipped section.
		{ key: "off", label: "shipped today (no history)" },
		{ key: "G", label: VARIANT_G_NAME },
		{ key: "H", label: VARIANT_H_NAME },
		{ key: "I", label: VARIANT_I_NAME },
		{ key: "E", label: `round 2 · ${VARIANT_E_NAME}` },
		{ key: "D", label: `round 2 · ${VARIANT_D_NAME}` },
		{ key: "F", label: `round 2 · ${VARIANT_F_NAME}` },
		{ key: "A", label: `round 1 · ${VARIANT_A_NAME}` },
		{ key: "B", label: `round 1 · ${VARIANT_B_NAME}` },
		{ key: "C", label: `round 1 · ${VARIANT_C_NAME}` },
	],
};

const DATA_AXIS: ProtoAxis = {
	param: "d",
	title: "data",
	options: DATASETS.map((d) => ({ key: d.key, label: d.label })),
};

/**
 * Round four. The headline popup is its own question now: six ways to make a
 * token count tangible. It is a third axis rather than six more variants,
 * because the page layout does not change with it.
 */
const TIP_AXIS: ProtoAxis = {
	param: "tip",
	title: "tooltip",
	options: [
		{ key: "shuffle", label: "shuffle: one at a time, roll for another" },
		...TIPS.map((t) => ({ key: t.key, label: t.label })),
	],
};

const AXES = [VARIANT_AXIS, DATA_AXIS, TIP_AXIS];

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
	// `shuffle` is the default: the popup deals from a shuffled deck and the
	// dice on the block advance it. Any other value pins one framing.
	const tip = axes.tip === "shuffle" ? undefined : (axes.tip as TipKey);
	const points = toPoints(readingsFor(dataset));

	const RoundTwo = ROUND_TWO[variant as keyof typeof ROUND_TWO];

	return (
		<>
			{RoundTwo ? (
				<RoundTwo
					index={index}
					anchor={MEASURED_ANCHOR}
					points={points}
					tip={tip}
				/>
			) : variant === "A" ? (
				<VariantA index={index} anchor={MEASURED_ANCHOR} points={points} />
			) : variant === "B" ? (
				<VariantB index={index} anchor={MEASURED_ANCHOR} points={points} />
			) : variant === "C" ? (
				<VariantC index={index} anchor={MEASURED_ANCHOR} points={points} />
			) : (
				<MeasuredSection index={index} slug={slug} isOwner={isOwner} />
			)}
			<PrototypeSwitcher
				axes={AXES}
				value={axes}
				onChange={set}
				note={
					variant === "off"
						? "wayfinder #80 · ← → variant · ↑ ↓ data · click for tooltip"
						: "wayfinder #80 · FIXTURE DATA, not this stack"
				}
			/>
		</>
	);
}
