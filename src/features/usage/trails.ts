/**
 * The model rows: the current range's models, each with the share it held in
 * the previous period as its notch.
 *
 * The snapshot trail is gone (ADR-0011): per-day rows have no series of
 * readings, what they have is the fold of the range before this one, so the
 * notch marks the previous period's share. The trail behind the hover card is
 * those two points and nothing else.
 *
 * Colors come from the shared chart module (#91): the model rows are a
 * categorical set, so they wear the validated palette in slot order and never
 * the page accent.
 */
import type { ChartPointInput } from "@/features/charts";
import { CHART_PAINTS, CHART_SLOT_COUNT } from "@/features/charts";

export type ModelTrail = {
	/** The published vendor id, or `__rest` for the folded tail. */
	readonly id: string;
	/** The catalog name, falling back to the raw vendor id (#33 decision 3). */
	readonly label: string;
	/** The validated palette slot this row wears. */
	readonly paint: string;
	/** Share of tokens in the current range. */
	readonly share: number;
	/** Share in the previous period, where the notch sits. */
	readonly first: number;
	/** Share change across the two periods, in percentage points. */
	readonly driftPoints: number;
	/** True when there is a previous period and the share actually moved. */
	readonly moved: boolean;
	/** The two points, previous then current. */
	readonly points: readonly ChartPointInput[];
};

const REST_ID = "__rest";
const REST_LABEL = "everything else";
const MOVED_FLOOR = 0.005;

type Share = {
	readonly id: string;
	readonly catalogName: string | null;
	readonly tokenShare: number;
};

function shareIn(
	models: readonly Share[] | null,
	id: string,
	kept: readonly string[],
): number | null {
	if (!models) return null;
	if (id === REST_ID) {
		return models
			.filter((m) => !kept.includes(m.id))
			.reduce((a, m) => a + m.tokenShare, 0);
	}
	return models.find((m) => m.id === id)?.tokenShare ?? 0;
}

/**
 * One row per model of the current range, folded past `max` into "everything
 * else". `previousAt` and `currentAt` date the two points of the trail.
 */
export function usageTrails(
	current: readonly Share[],
	previous: readonly Share[] | null,
	currentAt: number,
	previousAt: number,
	max: number = CHART_SLOT_COUNT,
): ModelTrail[] {
	const ranked = [...current].sort((a, b) => b.tokenShare - a.tokenShare);
	const folds = ranked.length > max;
	const keptModels = folds ? ranked.slice(0, max - 1) : ranked;
	const kept = keptModels.map((m) => m.id);
	const restShare = ranked
		.slice(keptModels.length)
		.reduce((a, m) => a + m.tokenShare, 0);
	const rows = [
		...keptModels.map((m) => ({
			id: m.id,
			label: m.catalogName ?? m.id,
			share: m.tokenShare,
		})),
		...(folds ? [{ id: REST_ID, label: REST_LABEL, share: restShare }] : []),
	];
	return rows.map((row, i) => {
		const before = shareIn(previous, row.id, kept);
		const first = before ?? row.share;
		const moved = before !== null && Math.abs(row.share - first) >= MOVED_FLOOR;
		const points: ChartPointInput[] =
			before === null
				? [{ at: currentAt, value: row.share }]
				: [
						{ at: previousAt, value: before },
						{ at: currentAt, value: row.share },
					];
		return {
			id: row.id,
			label: row.label,
			paint: CHART_PAINTS[i % CHART_PAINTS.length],
			share: row.share,
			first,
			driftPoints: before === null ? 0 : (row.share - first) * 100,
			moved,
			points,
		};
	});
}
