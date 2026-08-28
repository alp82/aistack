/**
 * The days path's model rows: the current range's models, each with the share
 * it held in the previous period as its notch.
 *
 * `modelTrails` in `src/features/measured/history.ts` draws the notch from the
 * FIRST SNAPSHOT of a series. Per-day rows have no snapshot series; what they
 * have is the fold of the range before this one, so the notch here marks the
 * previous period's share. The trail behind the hover card is those two points
 * and nothing else.
 */
import type { ChartPointInput } from "@/features/charts";
import { CHART_PAINTS, CHART_SLOT_COUNT } from "@/features/charts";
import type { ModelTrail } from "@/features/measured/history";

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
