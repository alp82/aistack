/**
 * The workflow rows' vocabulary, paints and number formats. Since #307 the
 * rows render inside the Actual Usage section (`src/features/usage`).
 *
 * Wayfinder tickets #215 and #286 (map #200), spec `docs/specs/workflow-surface.md`.
 *
 * NO SENTENCE HERE IS DRAFTED (ADR-0002). Every string is fixed, and every
 * number it wraps comes from a versioned rule the CLI or the server ran.
 *
 * NOTHING ABOUT RULES OR CONSENT PRINTS (#277). The rule ids, the fit, the
 * coverage and the provenance footer all left the page with #286. They stay in
 * the API for a reader who wants them.
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
export type WindowId = WorkflowView["window"]["id"];

export const MONO_LABEL =
	"font-mono text-[11px] font-semibold uppercase tracking-[0.25em]";

/** The one sentence that answers "what is measured time?" (#220's second marker). */
export const MEASURED_TIME_NOTE =
	"Measured time is the time recorded tool calls account for, each event holding the gap to the next one, capped at 5 minutes. It is not wall-clock time, and it is not billed time.";

/** The three windows the selector offers, in the order it prints them (#277). */
export const WINDOWS: readonly { id: WindowId; label: string }[] = [
	{ id: "30d", label: "30 days" },
	{ id: "7d", label: "7 days" },
	{ id: "24h", label: "24 hours" },
];

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

/** The four phases the lead's bar rescales to 100 (#284). */
export const NAMED_PHASES: readonly PhaseId[] = [
	"scout",
	"build",
	"verify",
	"handoff",
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
// Paints the pictures share. The accent carries every single-series picture;
// a share of the accent is the accent at a lower opacity, so a re-pointed
// stack accent recolors the whole section at once.
// ---------------------------------------------------------------------------

export const ACCENT = "var(--accent-lime)";
export const ACCENT_REST = "var(--bg-panel)";
export const ACCENT_DIM = "var(--bg-panel-elevated)";

export function accentAt(opacity: number): string {
	return `color-mix(in oklab, var(--accent-lime) ${Math.round(opacity * 100)}%, transparent)`;
}

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

export function fmtCount(value: number): string {
	return Math.round(value).toLocaleString("en-US");
}

export function fmtMinutes(minutes: number): string {
	return `${fmtNumber(minutes)} min`;
}

/** Seconds as the reader says them: "45s", "2.5 min", "1.2 h". */
export function fmtSeconds(seconds: number): string {
	if (seconds < 60) return `${fmtNumber(seconds)}s`;
	if (seconds < 3600) return fmtMinutes(seconds / 60);
	return `${fmtNumber(seconds / 3600)} h`;
}

export function fmtLines(lines: number): string {
	const abs = Math.abs(lines);
	if (abs >= 1_000_000) return `${fmtNumber(lines / 1_000_000)}M`;
	if (abs >= 10_000) return `${Math.round(lines / 1000)}k`;
	if (abs >= 1000) return `${fmtNumber(lines / 1000)}k`;
	return lines.toLocaleString("en-US");
}

/** A row's headline figure, in the unit its own rule declared. */
export function fmtRowValue(row: Pick<WorkflowRow, "unit" | "value">): string {
	switch (row.unit) {
		case "share":
			return fmtPercent(row.value);
		case "minutes":
			return fmtMinutes(row.value);
		case "hour":
			return `${String(Math.round(row.value)).padStart(2, "0")}:00`;
		default:
			return fmtNumber(row.value);
	}
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

/** "claude-opus-5" as the row prints it: the vendor prefix and a date suffix dropped. */
export function shortModel(model: string): string {
	return model.replace(/^claude-/, "").replace(/-\d{8}$/, "");
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
 * A UTC cell shifted into the owner's local time. Without an offset the cell
 * stays where it is, in UTC.
 */
export function shiftCell(
	weekdayUtc: number,
	hourUtc: number,
	offsetMinutes: number | null | undefined,
): { weekday: number; hour: number } {
	const minutes = weekdayUtc * 24 * 60 + hourUtc * 60 + (offsetMinutes ?? 0);
	const week = 7 * 24 * 60;
	const wrapped = ((minutes % week) + week) % week;
	return {
		weekday: Math.floor(wrapped / (24 * 60)),
		hour: Math.floor((wrapped % (24 * 60)) / 60),
	};
}

export function localHour(
	hourUtc: number,
	offsetMinutes: number | null | undefined,
): number {
	return shiftCell(0, hourUtc, offsetMinutes).hour;
}

// ---------------------------------------------------------------------------
// Languages merge by name the way GitHub does (#284, decision 5): `.js` and
// `.mjs` are JavaScript, `.ts` and `.tsx` are TypeScript. An extension with no
// name keeps its extension, dot included, so it still reads as a file type.
// ---------------------------------------------------------------------------

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
	js: "JavaScript",
	mjs: "JavaScript",
	cjs: "JavaScript",
	jsx: "JavaScript",
	ts: "TypeScript",
	mts: "TypeScript",
	cts: "TypeScript",
	tsx: "TypeScript",
	py: "Python",
	rb: "Ruby",
	rs: "Rust",
	go: "Go",
	java: "Java",
	kt: "Kotlin",
	swift: "Swift",
	c: "C",
	h: "C",
	cc: "C++",
	cpp: "C++",
	hpp: "C++",
	cs: "C#",
	php: "PHP",
	sh: "Shell",
	bash: "Shell",
	zsh: "Shell",
	fish: "Shell",
	sql: "SQL",
	html: "HTML",
	css: "CSS",
	scss: "SCSS",
	json: "JSON",
	yaml: "YAML",
	yml: "YAML",
	toml: "TOML",
	md: "Markdown",
	mdx: "Markdown",
	vue: "Vue",
	svelte: "Svelte",
};

export function languageOf(extension: string): string {
	const bare = extension.replace(/^\./, "").toLowerCase();
	return LANGUAGE_BY_EXTENSION[bare] ?? `.${bare}`;
}
