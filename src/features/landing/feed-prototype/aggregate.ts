/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * The numbers the pulse band shows, derived from the feed rows.
 *
 * Every series here is DAILY, because a sync lands at most a few times a day
 * per stack and a finer grain would draw noise. The two series that matter:
 *
 *   - `tokensPerDay` — the sum of positive sync deltas that day. This is the
 *     substance: how much measured usage the whole site gained. A first sync
 *     has no delta (nothing to compare to), so it contributes nothing — which
 *     is honest, not a bug. A NEGATIVE delta is real too: a 30-day window
 *     forgets the far end, so a quiet week makes the total fall.
 *   - `eventsPerDay` — how busy the site was. Cheap to move, so it is never
 *     the headline.
 */

import type { DisplayRow } from "./useFeedPrototype";

export type DayPoint = { at: number; value: number };

const DAY_MS = 86_400_000;

function dayStart(at: number): number {
	const d = new Date(at);
	return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function bucket(
	rows: DisplayRow[],
	now: number,
	days: number,
	value: (row: DisplayRow) => number,
): DayPoint[] {
	const today = dayStart(now);
	const totals = new Map<number, number>();
	for (let back = days - 1; back >= 0; back -= 1) {
		totals.set(today - back * DAY_MS, 0);
	}
	for (const row of rows) {
		const key = dayStart(row.at);
		if (!totals.has(key)) continue;
		totals.set(key, (totals.get(key) ?? 0) + value(row));
	}
	return [...totals.entries()]
		.sort((a, b) => a[0] - b[0])
		.map(([at, value]) => ({ at, value }));
}

export function tokensPerDay(
	rows: DisplayRow[],
	now: number,
	days = 14,
): DayPoint[] {
	return bucket(rows, now, days, (row) => Math.max(row.deltaTokens ?? 0, 0));
}

export function eventsPerDay(
	rows: DisplayRow[],
	now: number,
	days = 14,
): DayPoint[] {
	return bucket(rows, now, days, () => 1);
}

export function countPerDay(
	rows: DisplayRow[],
	now: number,
	type: DisplayRow["event"]["type"],
	days = 7,
): DayPoint[] {
	return bucket(
		rows.filter((r) => r.event.type === type),
		now,
		days,
		() => 1,
	);
}

/** Days that actually carry a value. Below three, no chart is honest. */
export function liveDays(points: DayPoint[]): number {
	return points.filter((p) => p.value > 0).length;
}

export type PulseTotals = {
	syncs: number;
	published: number;
	changed: number;
	moved: number;
	stacks: number;
	/** Distinct stacks that have ever appeared in the window shown. */
	stacksSeen: number;
};

/**
 * The usage numbers behind the sync count.
 *
 * Only fields that COMBINE correctly across stacks are here, and each one
 * combines the way its meaning demands:
 *
 *   - Sessions and projects SUM. Two people's sessions are different sessions.
 *   - Models and tools UNION, on the vendor id and the tool name. Two people
 *     running Opus is one model; two people running Bash is one tool. Summing
 *     either would inflate the site with the same name counted twice.
 *
 * Active days is deliberately ABSENT. It is a per-machine count inside a 30-day
 * window, so summing it is meaningless and averaging it hides who is active.
 * It belongs on a row, not in a total.
 *
 * Each stack contributes its LATEST sync in the window, not every sync, or a
 * stack that synced three times would count its sessions three times.
 */
export type UsageTotals = {
	sessions: number;
	projects: number;
	models: number;
	tools: number;
	stacks: number;
};

export function usageFor(
	rows: DisplayRow[],
	windowMinutes: number,
): UsageTotals {
	const latest = new Map<string, DisplayRow>();
	for (const row of rows) {
		if (row.event.type !== "sync.landed") continue;
		if (row.minutesAgo > windowMinutes) continue;
		// Rows arrive newest first, so the first one seen per stack is the latest.
		if (!latest.has(row.stack.slug)) latest.set(row.stack.slug, row);
	}

	const models = new Set<string>();
	const tools = new Set<string>();
	let sessions = 0;
	let projects = 0;

	for (const row of latest.values()) {
		if (row.event.type !== "sync.landed") continue;
		for (const h of row.event.harnesses) {
			sessions += h.sessions;
			projects += h.projects;
		}
		const snap = row.snapshot;
		if (!snap) continue;
		for (const id of snap.modelIds) models.add(id);
		for (const name of snap.toolNames) tools.add(name);
	}

	return {
		sessions,
		projects,
		models: models.size,
		tools: tools.size,
		stacks: latest.size,
	};
}

export function totalsFor(
	rows: DisplayRow[],
	windowMinutes: number,
): PulseTotals {
	const inWindow = rows.filter((r) => r.minutesAgo <= windowMinutes);
	return {
		syncs: inWindow.filter((r) => r.event.type === "sync.landed").length,
		published: inWindow.filter((r) => r.event.type === "stack.published")
			.length,
		changed: inWindow.filter(
			(r) => r.event.type === "stack.composition_changed",
		).length,
		moved: inWindow.reduce(
			(sum, r) => sum + Math.max(r.deltaTokens ?? 0, 0),
			0,
		),
		stacks: new Set(inWindow.map((r) => r.stack.slug)).size,
		stacksSeen: new Set(rows.map((r) => r.stack.slug)).size,
	};
}
