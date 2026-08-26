import type { ReactNode } from "react";
import {
	ACCENT,
	accentAt,
	fmtLines,
	fmtNumber,
	fmtPercent,
	fmtRowValue,
	fmtSeconds,
	PHASE_PAINT,
	shortModel,
	type WorkflowRow,
	type WorkflowView,
} from "./copy";
import {
	delegation,
	effortShares,
	hourProfile,
	languages,
	namedPhaseMix,
	peakOf,
	playbookOf,
	routing,
	skills,
	startProfile,
	turnHistogram,
} from "./derive";
import {
	DotRow,
	FillStrip,
	HourCells,
	MiniBars,
	type Segment,
	Strip,
	shadeSegments,
} from "./parts";

/**
 * What a row's head says: the figure in the accent, the short caption that
 * completes the sentence, and the picture (#284, decision 1).
 *
 * "Languages 32% TypeScript, then JavaScript at 27%." The name is the row's,
 * the figure is the server's value where the rule's unit is the one a reader
 * wants, and the caption is a fixed template over the same folded atoms the
 * body draws. A row this file does not know prints its rule's own value and
 * label, so a new row is never headless.
 *
 * NOTHING HERE RANKS. The order and the podium arrive placed.
 */
export type RowHead = {
	figure: string;
	caption: string;
	picture: (wide: boolean) => ReactNode;
};

export function rowHead(row: WorkflowRow, view: WorkflowView): RowHead {
	const head = HEADS[row.rowId]?.(row, view);
	return (
		head ?? {
			figure: fmtRowValue(row),
			caption: row.label,
			picture: (wide) =>
				row.unit === "share" ? (
					<FillStrip share={row.value} wide={wide} label={row.label} />
				) : (
					<span className={wide ? "block h-3.5" : "block h-3 w-[76px]"} />
				),
		}
	);
}

const HEADS: Record<
	string,
	(row: WorkflowRow, view: WorkflowView) => RowHead | undefined
> = {
	"component:activity-heatmap": (row, view) => {
		const cells = hourProfile(view);
		return {
			figure: fmtPercent(row.value),
			caption: "of activity in the 3 busiest hours",
			picture: (wide) => (
				<HourCells cells={cells} wide={wide} label="activity by hour" />
			),
		};
	},

	"component:start-hours": (row, view) => {
		const cells = startProfile(view);
		return {
			figure: fmtRowValue(row),
			caption: "is the most common start hour",
			picture: () => (
				<MiniBars
					values={cells}
					lit={peakOf(cells)}
					label="session starts by hour"
				/>
			),
		};
	},

	"metric:late-night-commits": (row) => ({
		figure: fmtPercent(row.value),
		caption: "of commits between 23:00 and 03:00",
		picture: (wide) => (
			<FillStrip share={row.value} wide={wide} label="late-night share" />
		),
	}),

	"component:phase-playbook": (row, view) => {
		const playbook = playbookOf(view);
		const shares = playbook
			? playbook.tracks[1].phaseShare
			: Object.fromEntries(
					namedPhaseMix(view).map((entry) => [entry.phase, entry.share]),
				);
		const segments: Segment[] = (
			["scout", "build", "verify", "handoff"] as const
		).map((phase) => ({
			key: phase,
			value: shares[phase] ?? 0,
			paint: PHASE_PAINT[phase],
			label: phase,
		}));
		return {
			figure: `${fmtNumber(row.value)} min`,
			caption: "median session",
			picture: (wide) => (
				<Strip segments={segments} wide={wide} label="time by phase" />
			),
		};
	},

	"component:git-ledger": (_row, view) => {
		const git = view.section.git;
		return {
			figure: `+${fmtLines(git.additions)}`,
			caption: `added, ${fmtLines(git.removals)} removed`,
			picture: (wide) => (
				<Strip
					wide={wide}
					label="additions against removals"
					segments={[
						{
							key: "additions",
							value: git.additions,
							paint: ACCENT,
							label: "additions",
						},
						{
							key: "removals",
							value: git.removals,
							paint: "var(--destructive-fill)",
							label: "removals",
						},
					]}
				/>
			),
		};
	},

	"component:coding-languages": (_row, view) => {
		const { rows, total } = languages(view);
		const first = rows[0];
		const second = rows[1];
		if (!first || total <= 0) return undefined;
		const segments = shadeSegments(
			rows.map((entry) => ({
				key: entry.name,
				value: entry.value,
				label: entry.name,
			})),
			total,
		);
		return {
			figure: fmtPercent(first.value / total),
			caption: second
				? `${first.name}, then ${second.name} at ${fmtPercent(second.value / total)}`
				: first.name,
			picture: (wide) => (
				<Strip segments={segments} wide={wide} label="lines by language" />
			),
		};
	},

	"component:kit": (_row, view) => {
		const rows = skills(view);
		const first = rows[0];
		if (!first) return undefined;
		const segments = shadeSegments(
			rows.map((entry) => ({
				key: entry.name,
				value: entry.value,
				label: entry.name,
			})),
			1,
		);
		return {
			figure: first.name,
			caption: `is the most used skill, ${fmtPercent(first.value)} of calls`,
			picture: (wide) => (
				<Strip segments={segments} wide={wide} label="calls by skill" />
			),
		};
	},

	"component:model-routing": (_row, view) => {
		const route = routing(view);
		const first = route.main[0];
		if (!first || route.mainTokens <= 0) return undefined;
		const segments: Segment[] = route.main.map((entry) => ({
			key: entry.name,
			value: entry.value,
			paint: route.paintOf(entry.name),
			label: shortModel(entry.name),
		}));
		return {
			figure: fmtPercent(first.value / route.mainTokens),
			caption: `of main-loop tokens on ${shortModel(first.name)}`,
			picture: (wide) => (
				<Strip
					segments={segments}
					wide={wide}
					label="main-loop tokens by model"
				/>
			),
		};
	},

	"component:delegation": (_row, view) => {
		const held = delegation(view);
		if (!held) return undefined;
		return {
			figure: fmtPercent(held.subagentShare),
			caption: "of tool calls run in subagents",
			picture: (wide) => (
				<Strip
					wide={wide}
					label="main loop against subagents"
					segments={delegationSegments(held.subagentShare)}
				/>
			),
		};
	},

	"metric:effort-levels": (_row, view) => {
		const shares = effortShares(view);
		return {
			figure: fmtPercent(shares.high),
			caption: `high, ${fmtPercent(shares.medium)} medium, ${fmtPercent(shares.low)} low`,
			picture: (wide) => (
				<Strip
					wide={wide}
					label="turns by effort level"
					segments={effortSegments(shares)}
				/>
			),
		};
	},

	"metric:thinking-share": (row) => ({
		figure: fmtPercent(row.value),
		caption: "of response tokens",
		picture: (wide) => (
			<FillStrip share={row.value} wide={wide} label="thinking share" />
		),
	}),

	"metric:turn-duration": (row, view) => {
		const histogram = turnHistogram(view);
		return {
			figure:
				histogram.medianSeconds === undefined
					? fmtRowValue(row)
					: `~${fmtSeconds(Math.round(histogram.medianSeconds))}`,
			caption: "median turn",
			picture: () => (
				<MiniBars
					values={histogram.buckets.map((bucket) => bucket.turns)}
					lit={histogram.median}
					label="turns by length"
				/>
			),
		};
	},

	"metric:question-back-share": (row) => ({
		figure: fmtPercent(row.value),
		caption: "of turns end with a question",
		picture: (wide) => (
			<FillStrip share={row.value} wide={wide} label="question share" />
		),
	}),

	"metric:web-searches-per-active-day": (row) => ({
		figure: fmtNumber(row.value),
		caption: "per active day",
		picture: (wide) => (
			<DotRow lit={row.value} big={wide} label="searches on a typical day" />
		),
	}),

	"metric:parallel-projects": (row) => ({
		figure: fmtNumber(row.value),
		caption: "on a typical active day",
		picture: (wide) => (
			<DotRow lit={row.value} big={wide} label="projects on a typical day" />
		),
	}),
};

export function delegationSegments(subagentShare: number): Segment[] {
	return [
		{
			key: "main",
			value: 1 - subagentShare,
			paint: ACCENT,
			label: "main loop",
		},
		{
			key: "subagents",
			value: subagentShare,
			paint: accentAt(0.4),
			label: "subagents",
		},
	];
}

export function effortSegments(
	shares: Record<"low" | "medium" | "high", number>,
): Segment[] {
	return [
		{ key: "low", value: shares.low, paint: accentAt(0.3), label: "low" },
		{
			key: "medium",
			value: shares.medium,
			paint: accentAt(0.6),
			label: "medium",
		},
		{ key: "high", value: shares.high, paint: ACCENT, label: "high" },
	];
}
