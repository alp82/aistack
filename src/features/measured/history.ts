/**
 * The living stack page's derivations — the series, read as the page reads it.
 *
 * Wayfinder ticket #81 (map #76), building the variant I design locked by #80.
 * Three rules come from the data and not from taste:
 *
 *   1. A SNAPSHOT IS A ROLLING 30-DAY TOTAL, never a daily delta. Two readings
 *      cannot be differenced into "what ran that day": the window slides, so the
 *      difference is days added minus days dropped. Every figure here is a level
 *      and it falls as often as it rises.
 *   2. THE ROWS ARE THE NEWEST READING'S MODELS. A model an older reading
 *      carried and the newest does not gets no row of its own — a 0% bar with a
 *      downward arrow beside it says a listed thing went unused, and positive
 *      claims only (#40) forbids that until the adapter seam covers every
 *      harness the reader runs.
 *   3. THE THIN CASE IS THE ONLY CASE. Two to five readings is what stacks have,
 *      and everything here has to answer at one reading too.
 *
 * Colors come from the shared chart module (#91): the model rows are a
 * categorical set, so they wear the validated palette in slot order and never
 * the page accent.
 */
import type { FunctionReturnType } from "convex/server";
import {
	CHART_PAINTS,
	CHART_SLOT_COUNT,
	type ChartPointInput,
} from "@/features/charts";
import type { api } from "../../../convex/_generated/api";

export type MeasuredHistory = NonNullable<
	FunctionReturnType<typeof api.measured.getHistoryByStackSlug>
>;
export type MeasuredHistoryPoint = MeasuredHistory["points"][number];

/** The id the folded tail carries. Never a model id. */
const REST_ID = "__rest";
const REST_LABEL = "everything else";

/** Below this the bar and the notch would overlap, so the row says it held. */
const MOVED_FLOOR = 0.005;

export type ModelTrail = {
	/** The published vendor id, or `__rest` for the folded tail. */
	readonly id: string;
	/** The catalog name, falling back to the raw vendor id (#33 decision 3). */
	readonly label: string;
	/** The validated palette slot this row wears. */
	readonly paint: string;
	/** Share of tokens at the newest reading. */
	readonly share: number;
	/** Share at the first reading in the window — where the notch sits. */
	readonly first: number;
	/** Share change across the window, in percentage points. */
	readonly driftPoints: number;
	/** True when there are two readings and the share actually moved. */
	readonly moved: boolean;
	/** The share at every reading, oldest first. */
	readonly points: readonly ChartPointInput[];
};

/** The share this id held at one reading. Absent from the mix is zero. */
function shareAt(
	point: MeasuredHistoryPoint,
	id: string,
	kept: readonly string[],
): number {
	if (id === REST_ID) {
		return point.models
			.filter((m) => !kept.includes(m.id))
			.reduce((a, m) => a + m.tokenShare, 0);
	}
	return point.models.find((m) => m.id === id)?.tokenShare ?? 0;
}

/** The fields a row needs from the reading it speaks for. */
export type RankedModel = {
	readonly id: string;
	readonly catalogName: string | null;
	readonly tokenShare: number;
};

/**
 * One row per model of the current reading, each carrying its own trail.
 *
 * THE ROWS COME FROM `models`, NOT FROM THE SERIES. The page renders whole from
 * the current reading and the series only adds history to it, so a page whose
 * history has not arrived yet — or a stack that has synced once — still shows
 * every row, with no notch and no drift.
 *
 * At most `max` rows: the palette has six validated slots and a seventh series
 * would be a hue nobody checked, so the tail folds into one "everything else"
 * row that keeps its share rather than dropping it.
 */
export function modelTrails(
	models: readonly RankedModel[],
	points: readonly MeasuredHistoryPoint[] = [],
	max: number = CHART_SLOT_COUNT,
): ModelTrail[] {
	const ranked = [...models].sort((a, b) => b.tokenShare - a.tokenShare);
	const folds = ranked.length > max;
	const keptModels = folds ? ranked.slice(0, max - 1) : ranked;
	const kept = keptModels.map((m) => m.id);
	const restShare = ranked
		.slice(keptModels.length)
		.reduce((a, m) => a + m.tokenShare, 0);
	const rows: Array<{ id: string; label: string; share: number }> = [
		...keptModels.map((m) => ({
			id: m.id,
			label: m.catalogName ?? m.id,
			share: m.tokenShare,
		})),
		...(folds ? [{ id: REST_ID, label: REST_LABEL, share: restShare }] : []),
	];

	const hasHistory = points.length > 0;
	return rows.map((row, i) => {
		const first = hasHistory ? shareAt(points[0], row.id, kept) : row.share;
		const moved =
			points.length > 1 && Math.abs(row.share - first) >= MOVED_FLOOR;
		return {
			id: row.id,
			label: row.label,
			paint: CHART_PAINTS[i % CHART_PAINTS.length],
			share: row.share,
			first,
			driftPoints: points.length > 1 ? (row.share - first) * 100 : 0,
			moved,
			points: points.map((p) => ({
				at: p.at,
				value: shareAt(p, row.id, kept),
			})),
		};
	});
}

/** The token reading at every sync — the trail behind the headline. */
export function tokenTrail(
	points: readonly MeasuredHistoryPoint[],
): ChartPointInput[] {
	return points.map((p) => ({ at: p.at, value: p.tokens }));
}

/**
 * The move since the previous reading, or null on a first reading.
 *
 * Negative is ordinary: the window forgets its far end, so a quiet week lowers
 * the reading without anything having gone wrong.
 */
export function tokenDelta(
	points: readonly MeasuredHistoryPoint[],
): number | null {
	if (points.length < 2) return null;
	const last = points.at(-1);
	const prev = points.at(-2);
	if (!last || !prev) return null;
	return last.tokens - prev.tokens;
}
