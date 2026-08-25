/**
 * The Workflow section's vocabulary, paints and number formats.
 *
 * Wayfinder ticket #215 (map #200), spec `docs/specs/workflow-surface.md`.
 *
 * NO SENTENCE HERE IS DRAFTED (ADR-0002). Every string is fixed, and every
 * number it wraps comes from a versioned rule the CLI or the server ran. The
 * section computes nothing of its own.
 */

import type { PhaseId } from "@aistack/workflow-rules";
import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../convex/_generated/api";

export type WorkflowView = NonNullable<
	FunctionReturnType<typeof api.workflow.getWorkflowByStackSlug>
>;
export type WorkflowRow = WorkflowView["rows"][number];
export type WorkflowKit = WorkflowView["kit"][number];
export type HarnessReading = WorkflowView["section"]["harnesses"][number];

export const WORKFLOW_ANCHOR = "section-workflow";

/** Position 04 in the settled page order (#193). Placed by ticket #217. */
export const KICKER = "// measured";
export const TITLE = "Workflow";

export const MONO_LABEL =
	"font-mono text-[11px] font-semibold uppercase tracking-[0.25em]";

/** Under every receipt card, and under any pair the page prints side by side. */
export const NO_CAUSE_CLAIMED = "measured together, no cause claimed";

/** The one sentence that answers "what is measured time?" (#220's second marker). */
export const MEASURED_TIME_NOTE =
	"Measured time is the time recorded tool calls account for, each event holding the gap to the next one, capped at 5 minutes. It is not wall-clock time, and it is not billed time.";

// ---------------------------------------------------------------------------
// Phases.
//
// FOUR NAMED PHASES PLUS A VISIBLE UNKNOWN (spec, "Phases"). The paints are
// validated palette slots, never the page accent: five series is categorical
// color, and categorical color has to stay fixed across stacks. Verify keeps
// the violet slot it wore in the anatomy prototype - a green verify would read
// as a pass mark the data does not claim.
// ---------------------------------------------------------------------------

export const PHASE_ORDER: readonly PhaseId[] = [
	"scout",
	"build",
	"verify",
	"handoff",
	"unknown",
];

export const PHASE_PAINT: Record<PhaseId, string> = {
	scout: "var(--chart-4, #4278d2)",
	build: "var(--chart-1, #69a621)",
	verify: "var(--chart-2, #9e71fd)",
	handoff: "var(--chart-3, #c21977)",
	unknown: "var(--bg-panel-elevated, #1b1f24)",
};

/** The card the first phase name opens. One card, all four phases (#220). */
export const PHASE_GLOSSARY: readonly { phase: PhaseId; text: string }[] = [
	{ phase: "scout", text: "reading and searching before the change" },
	{ phase: "build", text: "editing files and running the change" },
	{ phase: "verify", text: "tests, type checks, linters, review skills" },
	{ phase: "handoff", text: "the exchange at a blocking human gate" },
	{
		phase: "unknown",
		text: "recorded events no rule classifies, printed rather than hidden",
	},
];

// ---------------------------------------------------------------------------
// Numbers.
// ---------------------------------------------------------------------------

export function fmtPercent(share: number): string {
	return `${Math.round(share * 100)}%`;
}

/** One decimal, and no trailing `.0`: "2.8", "1", "12.5". */
export function fmtNumber(value: number): string {
	return value
		.toLocaleString("en-US", { maximumFractionDigits: 1 })
		.replace(/\.0$/, "");
}

export function fmtMinutes(minutes: number): string {
	return `${fmtNumber(minutes)} min`;
}

export function fmtLines(lines: number): string {
	if (Math.abs(lines) >= 1000) return `${fmtNumber(lines / 1000)}k`;
	return lines.toLocaleString("en-US");
}

/** A row's headline figure, in the unit its own rule declared. */
export function fmtRowValue(row: Pick<WorkflowRow, "unit" | "value">): string {
	switch (row.unit) {
		case "share":
			return fmtPercent(row.value);
		case "minutes":
			return fmtMinutes(row.value);
		default:
			return fmtNumber(row.value);
	}
}

/** The typical band the rule declared, in the row's own unit. */
export function fmtBand(row: WorkflowRow): string {
	const low = fmtRowValue({ unit: row.unit, value: row.band.low });
	const high = fmtRowValue({ unit: row.unit, value: row.band.high });
	return `${low} to ${high}`;
}

export const HARNESS_LABELS: Record<string, string> = {
	"claude-code": "Claude Code",
	codex: "Codex",
	opencode: "opencode",
	"pi-mono": "Pi",
};

export function harnessLabelOf(name: string): string {
	return HARNESS_LABELS[name] ?? name;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * A weekday index as the reading stores it (0 = Sunday, `Date.getUTCDay`),
 * rendered on a Monday-first row.
 */
export function weekdayLabel(weekdayUtc: number): string {
	return WEEKDAYS[(weekdayUtc + 6) % 7] ?? "";
}

export function hourLabel(hour: number): string {
	return `${String(hour).padStart(2, "0")}:00`;
}

/**
 * A row's short display name, from its rule id.
 *
 * The rules give a row one `label`, which is the fragment completing
 * "<value> <label>" - a caption, not a name. The rule id is the only stable
 * short name either pool carries, and it was already chosen to read as one.
 */
export function rowName(ruleId: string): string {
	return ruleId.replace(/-/g, " ");
}

/**
 * Each component body's own kicker, keyed by its rule id.
 *
 * The strings live here rather than inline in the JSX because a text node
 * opening with `//` reads as a comment to the linter, and the measured section
 * already keeps its kickers in its own `copy.ts`.
 */
export const BODY_KICKERS: Record<string, string> = {
	"phase-playbook": "// the playbook · how the sessions run",
	"model-routing": "// model routing · who runs on what",
	kit: "// the kit · skills and mcp servers",
	delegation: "// delegation · main loop to subagents",
	"git-ledger": "// the git ledger · what the commits carried",
	"coding-languages": "// coding languages · changed lines by file type",
	"activity-heatmap": "// when the work happens",
};
