import type { ReactNode } from "react";
import { ACCENT, type WorkflowView } from "@/features/workflow/copy";
import { routing, skills, startProfile } from "@/features/workflow/derive";
import { cn } from "@/lib/utils";
import type { UsageReading } from "./copy";

/**
 * The picture behind each closed topic row (#356, prototype v37): one history
 * or profile chart per topic, drawn at row height and faded. It is decoration
 * and hidden from the accessible tree; the summary line carries the figures.
 *
 * Each topic draws the shape a reader would expect of it, so the rows do not
 * all read as the same tinted slab:
 *
 *   - Time: session starts by hour, 24 bars.
 *   - Code: tokens per calendar day of the window, or commit additions per
 *     day when the git ledger has them.
 *   - Models: main-loop tokens by model, one bar per model.
 *   - Harness: tokens by harness, one bar per harness.
 *   - Skills: skill calls, one bar per skill.
 *
 * Nothing here ranks; bars keep the order their source hands them. A profile
 * (hours, days) fills the row; a categorical set (models, harnesses, skills)
 * draws narrow bars at the row's right end, away from the summary text, so
 * three bars never become three slabs.
 */
export function topicWatermark(
	topic: string,
	view: WorkflowView | null | undefined,
	usage: UsageReading | null,
	series: readonly { date: string; tokens: number }[],
): ReactNode {
	const hasView = view !== null && view !== undefined && view.window.days > 0;
	switch (topic) {
		case "time":
			return hasView ? <Bars values={startProfile(view)} /> : null;
		case "code": {
			const days = hasView ? view.section.gitDays : [];
			if (days.length > 0) {
				return (
					<Bars
						values={calendar(
							days.map((day) => ({ date: day.date, value: day.additions })),
						)}
					/>
				);
			}
			return series.length > 1 ? (
				<Bars
					values={calendar(
						series.map((point) => ({ date: point.date, value: point.tokens })),
					)}
				/>
			) : null;
		}
		case "models": {
			if (!hasView) return null;
			const route = routing(view);
			return route.main.length > 0 ? (
				<Bars
					values={route.main.map((entry) => entry.value)}
					paints={route.main.map((entry) => route.paintOf(entry.name))}
					gap
				/>
			) : null;
		}
		case "harness": {
			const harnesses = usage?.harnesses ?? [];
			return harnesses.length > 0 ? (
				<Bars values={harnesses.map((h) => h.totalTokens)} gap />
			) : null;
		}
		case "skills": {
			if (!hasView) return null;
			const rows = skills(view).slice(0, 12);
			return rows.length > 0 ? (
				<Bars values={rows.map((row) => row.value)} gap />
			) : null;
		}
		default:
			return null;
	}
}

/**
 * Every calendar day between the first and last dated value, in order, with a
 * zero for a day that has no reading. A gap is part of the picture.
 */
function calendar(
	points: readonly { date: string; value: number }[],
): number[] {
	const byDate = new Map(points.map((point) => [point.date, point.value]));
	const dates = [...byDate.keys()].sort();
	const first = dates[0];
	const last = dates[dates.length - 1];
	if (first === undefined || last === undefined) return [];
	const values: number[] = [];
	const cursor = new Date(`${first}T00:00:00Z`);
	const end = new Date(`${last}T00:00:00Z`);
	while (cursor.getTime() <= end.getTime()) {
		const date = cursor.toISOString().slice(0, 10);
		values.push(byDate.get(date) ?? 0);
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}
	return values;
}

/**
 * Bars scaled to the tallest, bottom-aligned, at the row's full height. A
 * profile fills the width; a categorical set (`gap`) draws fixed-width bars
 * from the right edge.
 */
function Bars({
	values,
	paints,
	gap = false,
}: {
	values: readonly number[];
	paints?: readonly string[];
	gap?: boolean;
}) {
	const tallest = Math.max(...values, 0) || 1;
	return (
		<span
			className={cn(
				"flex h-full w-full items-end",
				gap ? "justify-end gap-1.5 pr-12" : "gap-px",
			)}
		>
			{values.map((value, index) => (
				<i
					// biome-ignore lint/suspicious/noArrayIndexKey: positional, one bar per source slot
					key={index}
					className={cn("block min-h-px", gap ? "w-7" : "flex-1")}
					style={{
						height: `${Math.round((value / tallest) * 100)}%`,
						background: paints?.[index] ?? ACCENT,
					}}
				/>
			))}
		</span>
	);
}
