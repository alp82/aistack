import {
	bucketMid,
	bucketRange,
	buildPlaybook,
	type EffortLevel,
	medianBucket,
	type PhaseId,
	type Playbook,
	type WorkflowReading,
} from "@aistack/workflow-rules";
import { CHART_PAINTS } from "@/features/charts";
import {
	fmtSeconds,
	languageOf,
	localHour,
	NAMED_PHASES,
	shiftCell,
	type WorkflowView,
} from "./copy";

/**
 * The arithmetic the heads and the bodies share, over the folded window.
 *
 * Wayfinder ticket #286 (map #200). The server folded the days and computed
 * every row's figure; what is left here is the shape each picture needs
 * (a ranked list, a 24-cell profile, a share of a total) read off the same
 * atoms. Nothing here ranks rows or decides placement.
 */

export type Ranked = { name: string; value: number };

export function sumBy<T>(
	rows: readonly T[],
	value: (row: T) => number,
): number {
	return rows.reduce((sum, row) => sum + value(row), 0);
}

/** Fold `{name, value}` pairs into one ranked list, largest first. */
export function rank(entries: readonly Ranked[]): Ranked[] {
	const byName = new Map<string, number>();
	for (const entry of entries) {
		byName.set(entry.name, (byName.get(entry.name) ?? 0) + entry.value);
	}
	return [...byName.entries()]
		.map(([name, value]) => ({ name, value }))
		.filter((row) => row.value > 0)
		.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// The clock.
// ---------------------------------------------------------------------------

/** Recorded events per owner-local hour, across every harness. */
export function hourProfile(view: WorkflowView): number[] {
	const cells = new Array<number>(24).fill(0);
	for (const harness of view.section.harnesses) {
		for (const cell of harness.activity) {
			const hour = localHour(cell.hourUtc, view.utcOffsetMinutes);
			cells[hour] = (cells[hour] ?? 0) + cell.events;
		}
	}
	return cells;
}

/** Session starts per owner-local hour, across every harness. */
export function startProfile(view: WorkflowView): number[] {
	const cells = new Array<number>(24).fill(0);
	for (const harness of view.section.harnesses) {
		for (const row of harness.startHours) {
			const hour = localHour(row.hourUtc, view.utcOffsetMinutes);
			cells[hour] = (cells[hour] ?? 0) + row.sessions;
		}
	}
	return cells;
}

export function peakOf(cells: readonly number[]): number {
	let peak = 0;
	cells.forEach((value, index) => {
		if (value > (cells[peak] ?? 0)) peak = index;
	});
	return peak;
}

export type HeatSeries = "sessions" | "commits";

/** The week grid for one series, shifted into the owner's local time. */
export function heatCells(
	view: WorkflowView,
	series: HeatSeries,
): Map<string, number> {
	const cells = new Map<string, number>();
	const add = (weekdayUtc: number, hourUtc: number, count: number): void => {
		const shifted = shiftCell(weekdayUtc, hourUtc, view.utcOffsetMinutes);
		const key = `${shifted.weekday}-${shifted.hour}`;
		cells.set(key, (cells.get(key) ?? 0) + count);
	};
	if (series === "sessions") {
		for (const harness of view.section.harnesses) {
			for (const cell of harness.activity) {
				add(cell.weekdayUtc, cell.hourUtc, cell.events);
			}
		}
	} else {
		for (const cell of view.section.git.weekdayHourCells) {
			add(cell.weekdayUtc, cell.hourUtc, cell.commits);
		}
	}
	return cells;
}

// ---------------------------------------------------------------------------
// Phases and the playbook.
// ---------------------------------------------------------------------------

/** The four named phases rescaled to 100, from the lead's own shares. */
export function namedPhaseMix(
	view: WorkflowView,
): { phase: PhaseId; share: number }[] {
	const shares = view.lead.phaseShare;
	if (!shares) return [];
	const known = sumBy(NAMED_PHASES, (phase) => shares[phase]);
	if (known <= 0) return [];
	return NAMED_PHASES.map((phase) => ({
		phase,
		share: shares[phase] / known,
	}));
}

export function playbookOf(view: WorkflowView): Playbook | undefined {
	return buildPlaybook(view.section as WorkflowReading);
}

// ---------------------------------------------------------------------------
// Git.
// ---------------------------------------------------------------------------

/** Changed lines by language, merged by name, and the total the shares divide by. */
export function languages(view: WorkflowView): {
	rows: Ranked[];
	total: number;
} {
	const git = view.section.git;
	const rows = rank(
		git.changedLinesByExtension.map((row) => ({
			name: languageOf(row.extension),
			value: row.changedLines,
		})),
	);
	// The withheld lines belong in the denominator: a stack whose top language is
	// unapproved would otherwise read as more concentrated than it is.
	const total = sumBy(rows, (row) => row.value) + git.withheldExtensionLines;
	return { rows, total };
}

// ---------------------------------------------------------------------------
// The kit, the models and the subagents.
// ---------------------------------------------------------------------------

export function skills(view: WorkflowView): Ranked[] {
	return rank(
		view.kit.flatMap((harness) =>
			harness.skills.map((atom) => ({
				name: atom.name,
				value: atom.callShare,
			})),
		),
	);
}

export function mcpServers(view: WorkflowView): Ranked[] {
	return rank(
		view.kit.flatMap((harness) =>
			harness.mcpServers.map((atom) => ({
				name: atom.name,
				value: atom.callShare,
			})),
		),
	);
}

export function subagentTypes(view: WorkflowView): Ranked[] {
	return rank(
		view.kit.flatMap((harness) =>
			harness.subagents.map((atom) => ({
				name: atom.name,
				value: atom.callShare,
			})),
		),
	);
}

export type Routing = {
	main: Ranked[];
	subagents: Ranked[];
	mainTokens: number;
	subagentTokens: number;
	/** ONE PALETTE ACROSS BOTH ROWS: a model wears the same paint everywhere. */
	paintOf: (model: string) => string;
	models: string[];
};

export function routing(view: WorkflowView): Routing {
	const harnesses = view.section.harnesses.filter((h) => h.routing);
	const main = rank(
		harnesses.flatMap((h) =>
			(h.routing?.main ?? []).map((row) => ({
				name: row.model,
				value: row.tokens,
			})),
		),
	);
	const subagents = rank(
		harnesses.flatMap((h) =>
			(h.routing?.subagents ?? []).map((row) => ({
				name: row.model,
				value: row.tokens,
			})),
		),
	);
	const models = rank([...main, ...subagents]).map((row) => row.name);
	return {
		main,
		subagents,
		mainTokens: sumBy(main, (row) => row.value),
		subagentTokens: sumBy(subagents, (row) => row.value),
		models,
		paintOf: (model) => {
			const index = models.indexOf(model);
			return index < 0
				? "var(--bg-panel-elevated)"
				: (CHART_PAINTS[index % CHART_PAINTS.length] as string);
		},
	};
}

export function delegation(view: WorkflowView): {
	mainCalls: number;
	subagentCalls: number;
	subagentShare: number;
	widestFanOut: number;
	mostSubagents: number;
} | null {
	const rows = view.section.harnesses
		.map((harness) => harness.delegation)
		.filter((row): row is NonNullable<typeof row> => row !== undefined);
	if (rows.length === 0) return null;
	const mainCalls = sumBy(rows, (row) => row.mainToolCalls);
	const subagentCalls = sumBy(rows, (row) => row.subagentToolCalls);
	const calls = mainCalls + subagentCalls;
	return {
		mainCalls,
		subagentCalls,
		subagentShare: calls > 0 ? subagentCalls / calls : 0,
		widestFanOut: Math.max(...rows.map((row) => row.widestFanOut)),
		mostSubagents: Math.max(...rows.map((row) => row.mostSubagents)),
	};
}

// ---------------------------------------------------------------------------
// Effort, thinking and turn length: the three rows that waited on #285.
// ---------------------------------------------------------------------------

export const EFFORT_SHOWN: readonly EffortLevel[] = ["low", "medium", "high"];

/** Share of turns per effort level, over the turns that carry a level. */
export function effortShares(view: WorkflowView): Record<EffortLevel, number> {
	const turns: Record<EffortLevel, number> = {
		low: 0,
		medium: 0,
		high: 0,
		other: 0,
	};
	for (const harness of view.section.harnesses) {
		for (const row of harness.effort ?? []) turns[row.level] += row.turns;
	}
	const total = turns.low + turns.medium + turns.high + turns.other;
	return {
		low: total > 0 ? turns.low / total : 0,
		medium: total > 0 ? turns.medium / total : 0,
		high: total > 0 ? turns.high / total : 0,
		other: total > 0 ? turns.other / total : 0,
	};
}

/** Thinking share per harness, or null for a harness that records none. */
export function thinkingByHarness(
	view: WorkflowView,
): { harness: string; share: number | null }[] {
	return view.section.harnesses.map((harness) => ({
		harness: harness.harness,
		share:
			harness.thinking && harness.thinking.responseTokens > 0
				? harness.thinking.thinkingTokens / harness.thinking.responseTokens
				: null,
	}));
}

export type TurnHistogram = {
	buckets: { bucket: number; turns: number; label: string }[];
	/** Index into `buckets` of the median bucket. */
	median: number | undefined;
	medianSeconds: number | undefined;
};

/** The turn-length histogram over every harness, merged by bucket. */
export function turnHistogram(view: WorkflowView): TurnHistogram {
	const byBucket = new Map<number, number>();
	for (const harness of view.section.harnesses) {
		for (const row of harness.turnDurations?.buckets ?? []) {
			byBucket.set(row.bucket, (byBucket.get(row.bucket) ?? 0) + row.turns);
		}
	}
	if (byBucket.size === 0)
		return { buckets: [], median: undefined, medianSeconds: undefined };
	const low = Math.min(...byBucket.keys());
	const high = Math.max(...byBucket.keys());
	const buckets: TurnHistogram["buckets"] = [];
	for (let bucket = low; bucket <= high; bucket++) {
		const range = bucketRange(bucket);
		buckets.push({
			bucket,
			turns: byBucket.get(bucket) ?? 0,
			// The label is the bucket's lower bound, so the axis reads as a ladder
			// of round marks (1s, 2s, 4s, 8s, 16s, 32s, 1 min) instead of ranges.
			label: bucket <= 0 ? `<${fmtSeconds(1)}` : fmtSeconds(range.low),
		});
	}
	const medianAt = medianBucket(
		buckets.map((row) => ({ bucket: row.bucket, count: row.turns })),
	);
	const median =
		medianAt === undefined
			? undefined
			: buckets.findIndex((row) => row.bucket === medianAt);
	return {
		buckets,
		median: median === -1 ? undefined : median,
		medianSeconds: medianAt === undefined ? undefined : bucketMid(medianAt),
	};
}

export function questionShare(view: WorkflowView): number | null {
	let asked = 0;
	let turns = 0;
	for (const harness of view.section.harnesses) {
		if (!harness.questions) continue;
		asked += harness.questions.asked;
		turns += harness.questions.turns;
	}
	return turns > 0 ? asked / turns : null;
}
