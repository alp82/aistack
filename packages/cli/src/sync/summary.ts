// The approve gate's two beats, as text.
//
// Wayfinder ticket #41 (map #29), shape fixed by the spike #35 and the copy
// locked in #48. Beat one is the FULL summary, printed as ordinary scrollable
// transcript output. Beat two is the SHORT elicitation message - it must stay
// short, or `Accept` falls below the fold and the gate times out (#35, 1H).
//
// Everything here derives from the exact bytes that will be sent (`body`),
// plus the local-only kept-private list that deliberately never enters them.
// Nothing in this file is accepted as a caller-supplied argument beside the
// payload - the spike promoted that from a caution to a demonstrated property.

import {
	foldWorkflowDays,
	type MeasuredDay,
	WORKFLOW_AGGREGATES_V2,
} from "@aistack/workflow-rules";
import { HARNESS_ADAPTERS, harnessLabel } from "../harness/index.js";
import type {
	KeptPrivateAtom,
	NameCategory,
	SyncConfig,
	SyncConfigSource,
} from "../harness/shared/allowlist.js";
import { NAME_CATEGORIES } from "../harness/shared/allowlist.js";
import type {
	MeasuredPayload,
	PayloadMeasuredDays,
	SyncBody,
} from "../harness/shared/payload.js";
import type { ScanStats } from "../harness/shared/window.js";
import type { DaySelection } from "../usage/diff.js";

export type GateContext = {
	/** The exact request body a publish would send. */
	body: SyncBody;
	/** The local-only review list - never inside any payload (#44). */
	keptPrivate: Record<NameCategory, KeptPrivateAtom[]>;
	config: SyncConfig;
	source: SyncConfigSource;
	/** Web origin for the URLs the gate prints, e.g. https://aistack.to */
	baseUrl: string;
	/**
	 * Terminal width the preview wraps to. Absent means 80, which is what a
	 * pipe or a test gets: the gate must render the same way everywhere except
	 * for where the lines break.
	 */
	width?: number;
	/**
	 * Per-harness scan stats, keyed by harness name - the LOCAL-ONLY detail
	 * behind the payload's bare coverage counts (#75): unreadable file names,
	 * error classes, foreign-file originators. Like `keptPrivate`, it rides
	 * beside the body and never inside it.
	 */
	scanStats?: Record<string, ScanStats>;
	/**
	 * How the day rows in `body.measuredDays` were chosen (#307). The rows in
	 * the bytes are the ones going; this says how many the server already held
	 * unchanged, which the bytes cannot say.
	 */
	days?: DaySelection;
};

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** `4.27B`, `40.7M`, `216k`, `950` - three significant digits, like #40. */
export function fmtTokens(n: number): string {
	const sig = (v: number): string => {
		const s = v.toPrecision(3);
		return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
	};
	if (n >= 1e9) return `${sig(n / 1e9)}B`;
	if (n >= 1e6) return `${sig(n / 1e6)}M`;
	if (n >= 1e3) return `${sig(n / 1e3)}k`;
	return String(n);
}

/** `≈$5,840` - whole dollars; the ≈ and "at API prices" wording are #37's. */
export function fmtUSD(n: number): string {
	return `≈$${Math.round(n).toLocaleString("en-US")}`;
}

const fmtPct = (share: number): string => `${(share * 100).toFixed(1)}%`;

/**
 * `2026-08-10 21:03 UTC` - the publish receipt's stamp (#130). Milliseconds
 * and the ISO `T`/`Z` machine form dropped: the last thing a person reads
 * should be the result, not a receipt.
 */
export function fmtReceivedAt(ms: number): string {
	return `${new Date(ms).toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

/**
 * The dollar figure the gate names, or `null` when none may render.
 *
 * Mirrors the public display's rule (#46): a dollar figure never renders
 * without its pricing table. Summing only the models that carry the field
 * matches what actually goes up - an unpriceable model publishes tokens, not
 * dollars.
 */
export function totalUSD(payload: MeasuredPayload): number | null {
	let sum = 0;
	let any = false;
	for (const m of payload.models) {
		if (m.apiEquivalentUSD === undefined) continue;
		// The citation may sit on the model (#136) or, in the old single-vendor
		// shape, on the payload. A figure neither cites stays unrendered.
		if (m.pricingTable === undefined && payload.pricingTable === null) continue;
		sum += m.apiEquivalentUSD;
		any = true;
	}
	return any ? sum : null;
}

/** DISTINCT kept-private names, from the send bytes (`inventory.withheld`). */
export function withheldCount(payload: MeasuredPayload): number {
	const w = payload.inventory.withheld;
	return (
		w.builtinTools + w.mcpServers + w.skills + w.subagents + w.slashCommands
	);
}

// ---------------------------------------------------------------------------
// Beat two - the elicitation message. Copy locked in #48; keep it SHORT.
// ---------------------------------------------------------------------------

export function buildGateDialog(ctx: GateContext): string {
	const { payloads, keptPrivate } = ctx.body;
	const tokens = payloads.reduce((a, p) => a + p.activity.totalTokens, 0);
	const usds = payloads
		.map((p) => totalUSD(p))
		.filter((u): u is number => u !== null);
	const usd = usds.length > 0 ? usds.reduce((a, b) => a + b, 0) : null;
	const days = payloads[0]?.window.days ?? 0;
	const facts = [
		`${fmtTokens(tokens)} tokens`,
		`${days} days`,
		...(usd === null ? [] : [fmtUSD(usd)]),
	].join(" · ");

	const n = payloads.reduce((a, p) => a + withheldCount(p), 0);
	const lines = [`Publish to aistack? ${facts}`];
	if (n > 0) {
		lines.push(
			keptPrivate === undefined
				? `${n} name${n === 1 ? "" : "s"} stay${n === 1 ? "s" : ""} on this machine`
				: `${n} name${n === 1 ? "" : "s"} go${n === 1 ? "es" : ""} up for you to review`,
		);
	}
	return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Beat one - the full summary, transcript output.
// ---------------------------------------------------------------------------

const CATEGORY_LABEL: Record<NameCategory, string> = {
	builtinTools: "tools",
	mcpServers: "mcp",
	skills: "skills",
	subagents: "agents",
	slashCommands: "commands",
};

// ---------------------------------------------------------------------------
// Wrapping.
//
// EVERY PUBLISHED NAME STAYS ON SCREEN. This is the consent surface, so a name
// that goes up is a name the person reads first - the inventory rows are never
// truncated to a count the way the kept-private list is, because that list is
// the opposite case: those names do NOT leave the machine.
//
// What changed in #217 is only where the lines break. An unwrapped inventory
// row ran to several hundred characters and the terminal broke it mid-name,
// which reads as noise rather than as a list someone can check.
// ---------------------------------------------------------------------------

/** The label column every harness line shares: `window    30 days · ...`. */
const LABEL_WIDTH = 10;
const DEFAULT_WIDTH = 80;

/** Wrap to the caller's terminal, clamped to a width a list stays readable at. */
export function wrapWidth(width: number | undefined): number {
	return Math.min(110, Math.max(60, width ?? DEFAULT_WIDTH));
}

/**
 * One labelled row, wrapped with a hanging indent under its own label.
 *
 * Breaks on spaces only, and the callers join names with ", ", so a name is
 * never split across two lines.
 */
export function wrapRow(
	head: string,
	continuation: string,
	text: string,
	width: number,
): string[] {
	const limit = Math.max(24, width - continuation.length);
	const lines: string[] = [];
	let line = "";
	for (const word of text.split(" ")) {
		if (line === "") {
			line = word;
			continue;
		}
		if (`${line} ${word}`.length > limit) {
			lines.push(line);
			line = word;
		} else {
			line = `${line} ${word}`;
		}
	}
	if (line !== "") lines.push(line);
	return lines.map((l, i) => (i === 0 ? head : continuation) + l);
}

/** Kept-private rows for the gate: one row per group, then singles (#48). */
export function keptPrivateRows(
	keptPrivate: Record<NameCategory, KeptPrivateAtom[]>,
): Array<{ label: string; names: number }> {
	const groups = new Map<string, number>();
	const singles: string[] = [];
	for (const category of NAME_CATEGORIES) {
		for (const atom of keptPrivate[category]) {
			if (atom.group === null) singles.push(atom.name);
			else groups.set(atom.group, (groups.get(atom.group) ?? 0) + 1);
		}
	}
	const rows = [...groups].map(([label, names]) => ({ label, names }));
	for (const name of singles) rows.push({ label: name, names: 1 });
	rows.sort((a, b) => b.names - a.names || a.label.localeCompare(b.label));
	return rows;
}

/**
 * How many kept-private rows the gate names before it counts the rest.
 *
 * Three, not six (#217). These names do NOT leave the machine, which is what
 * makes truncating them safe here and unsafe for the published inventory.
 */
const KEPT_PRIVATE_ROWS_SHOWN = 3;

// The harness display names live with the harness names themselves (#101), so
// one harness has one label everywhere. Re-exported: this module is where the
// gate's renderers reach for it.
export { harnessLabel };

/** How many unreadable files get named before the list truncates. */
const UNREADABLE_FILES_SHOWN = 5;

/**
 * The local-only lines behind the bare coverage counts (#75). Everything here
 * stays on this machine: relative paths, error classes, and originator names
 * never enter the payload.
 */
export function scanNoteLines(stats: ScanStats, label: string): string[] {
	const out: string[] = [];
	const shown = stats.unreadableFiles.slice(0, UNREADABLE_FILES_SHOWN);
	for (const f of shown) {
		out.push(`          ${f.path} (${f.reason})`);
	}
	if (stats.unreadableFiles.length > shown.length) {
		out.push(
			`          ...${stats.unreadableFiles.length - shown.length} more`,
		);
	}
	if (stats.filesZstdUnsupported > 0) {
		out.push(
			`          ${stats.filesZstdUnsupported} compressed rollout${stats.filesZstdUnsupported === 1 ? "" : "s"} need Node 22.15 or newer`,
		);
	}
	if (stats.filesForeign > 0) {
		const origins = [...stats.foreignOriginators]
			.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
			.map(([name, n]) => (n > 1 ? `${name} ×${n}` : name))
			.join(", ");
		out.push(
			`skipped   ${stats.filesForeign} file${stats.filesForeign === 1 ? "" : "s"} not written by ${label} (originators: ${origins})`,
		);
	}
	return out;
}

/**
 * One harness's payload block: window, activity, cost, models, inventory.
 *
 * ONE ALIGNED BLOCK, NO EMPTY HEADINGS (#217). Every row hangs off the same
 * label column, and a section with nothing in it is not announced: a bare
 * `models` heading over nothing said only that the code has a models section.
 * A harness that publishes no names says THAT, in one line, because silence
 * there would read as a harness that was never scanned.
 */
function payloadBlock(
	payload: MeasuredPayload,
	width: number,
	ownWindow: boolean,
	stats?: ScanStats,
): string[] {
	const out: string[] = [];
	// The header is unconditional (#130): the `searched` line above names four
	// harnesses, so an unlabeled block would be unreadable even when only one
	// harness was found. It also CARRIES the activity and the cost, which each
	// held a line of their own until #217 - three lines saying one harness's
	// totals, repeated per harness, was most of a preview nobody read.
	const label = `${harnessLabel(payload.harness.name)}${payload.harness.version ? ` ${payload.harness.version}` : ""}`;
	const days = payload.activity.activeDayDates.length;
	const usd = totalUSD(payload);
	const totals = [
		`${payload.activity.sessions} session${payload.activity.sessions === 1 ? "" : "s"}`,
		`${days} active day${days === 1 ? "" : "s"}`,
		`${fmtTokens(payload.activity.totalTokens)} tokens`,
	];
	// Wrapped, because the merged header is the longest line in the block and a
	// narrow terminal would otherwise break it mid-figure.
	// The header is a SECTION, the way `collect` prints one: the harness name in
	// caps and its session count. The totals hang under it as the `usage` row,
	// with the cost at the end of that row. `at API prices` stays: it is the
	// qualifier that makes the figure a lower bound rather than a bill (#93).
	out.push(`${label.toUpperCase()} ${payload.activity.sessions}`);

	// A harness that measured nothing says so in its usage row and stops - not
	// even a cost, because there is nothing to price. It still gets its header,
	// because a scanned harness reading as an absent one is the mistake #130
	// fixed.
	if (payload.activity.totalTokens === 0) {
		out.push(`usage     ${totals.slice(1).join(" · ")}`);
		return out;
	}
	out.push(
		...wrapRow(
			"usage     ",
			" ".repeat(LABEL_WIDTH),
			`${totals.slice(1).join(" · ")} · ${usd === null ? "cost not published" : `${fmtUSD(usd)} at API prices`}`,
			width,
		),
	);

	// Only when this harness read a different window from the rest.
	if (ownWindow) {
		out.push(
			`window    ${payload.window.days} days · ${payload.window.from} → ${payload.window.to}`,
		);
	}

	// Coverage is silent when clean; a degraded scan is named as a floor (#40).
	const cov = payload.coverage;
	if (cov.filesUnreadable > 0 || cov.linesFailed > 0) {
		out.push(
			`coverage  ${cov.filesUnreadable} files unreadable · ${cov.linesFailed} lines failed · this reading is a floor`,
		);
	}
	// Local-only detail behind those counts (#75): file names, error classes,
	// and the foreign-file line. Printed, never sent.
	if (stats) {
		out.push(...scanNoteLines(stats, harnessLabel(payload.harness.name)));
	}

	// The models are one row, wrapped: `id share ≈$` per model, joined with
	// dots. A harness that reports no model prints nothing.
	//
	// A MODEL UNDER ONE PERCENT ROLLS UP. Four entries where two carry 99.9% of
	// the tokens is a row that hides its own headline. The rolled figure keeps
	// its dollars only when every model in it published one, the same rule a
	// single entry follows: a sum missing a term would understate without
	// saying so.
	const shown = payload.models.filter((m) => m.tokenShare >= MODEL_ROLLUP);
	const rolled = payload.models.filter((m) => m.tokenShare < MODEL_ROLLUP);
	const entry = (name: string, share: number, dollars: number | undefined) =>
		`${name} ${fmtPct(share)}${usd !== null && dollars !== undefined ? ` ${fmtUSD(dollars)}` : ""}`;
	const entries = shown.map((m) =>
		entry(m.id, m.tokenShare, m.apiEquivalentUSD),
	);
	if (rolled.length > 0) {
		const priced = rolled.every((m) => m.apiEquivalentUSD !== undefined);
		entries.push(
			entry(
				`+${rolled.length} more`,
				rolled.reduce((a, m) => a + m.tokenShare, 0),
				priced
					? rolled.reduce((a, m) => a + (m.apiEquivalentUSD ?? 0), 0)
					: undefined,
			),
		);
	}
	if (entries.length > 0) {
		out.push(
			...wrapRow(
				"models    ",
				" ".repeat(LABEL_WIDTH),
				entries.join(" · "),
				width,
			),
		);
	}

	// The inventory. The counts line is the glance, the rows underneath are the
	// consent: every name that publishes is printed.
	const filled = NAME_CATEGORIES.filter(
		(category) => payload.inventory[category].length > 0,
	);
	if (filled.length === 0) {
		out.push(`${"publishes".padEnd(LABEL_WIDTH)}no names from this harness`);
		return out;
	}
	out.push(
		`${"publishes".padEnd(LABEL_WIDTH)}${filled
			.map(
				(category) =>
					`${payload.inventory[category].length} ${CATEGORY_LABEL[category]}`,
			)
			.join(" · ")}`,
	);
	// The names indent under their own category label, so a wrapped row and the
	// row above it start in the same column. `commands` is the longest label and
	// still needs a gap after it, which is why the width is its length plus one.
	const subLabel = Math.max(
		...filled.map((category) => CATEGORY_LABEL[category].length),
	);
	const subIndent = " ".repeat(2 + subLabel + 1);
	for (const category of filled) {
		const names = payload.inventory[category].map((a) => a.name).join(", ");
		out.push(
			...wrapRow(
				`  ${CATEGORY_LABEL[category].padEnd(subLabel)} `,
				subIndent,
				names,
				width,
			),
		);
	}
	return out;
}

/** The rule between sections, the width `collect` draws it at. */
const DIVIDER = "─".repeat(40);

/** Token share below which a model joins the rolled-up row (#217). */
const MODEL_ROLLUP = 0.01;

const PHASE_ORDER = ["scout", "build", "verify", "handoff", "unknown"] as const;

/**
 * The workflow section, as the gate describes it (#213).
 *
 * Everything here is read out of `body.workflow` - the exact bytes a publish
 * sends - for the reason the whole file exists: the person approves a sentence
 * about the bytes, not a sentence about what the code meant to send.
 *
 * The last line names the switch, the way the kept-private block does. A
 * default-on opt-out has to be visible before the first upload, or it is not an
 * opt-out.
 */
function workflowBlock(
	workflowDays: NonNullable<MeasuredDay["workflow"]>[],
	utcOffsetMinutes: number,
	host: string,
): string[] {
	const out: string[] = [];
	const folded = foldWorkflowDays(workflowDays, {
		aggregateVersion: WORKFLOW_AGGREGATES_V2,
		utcOffsetMinutes,
	});
	const harnesses = folded?.harnesses ?? [];
	const withPlaybook = harnesses.filter((h) => h.phase);
	const sessions = harnesses.reduce((a, h) => a + h.sessions, 0);
	const ruleVersions = [
		...new Set(withPlaybook.map((h) => h.phase?.ruleVersion ?? "")),
	].filter(Boolean);

	out.push(
		`workflow  ${harnesses.length} harness${harnesses.length === 1 ? "" : "es"} · ${sessions} sessions · ${WORKFLOW_AGGREGATES_V2}`,
	);
	const first = folded?.dates[0];
	const last = folded?.dates.at(-1);
	out.push(
		`          ${workflowDays.length} day${workflowDays.length === 1 ? "" : "s"}${first && last ? ` · ${first} to ${last}` : ""}`,
	);

	const seconds = PHASE_ORDER.map((phase) =>
		withPlaybook.reduce((a, h) => a + (h.phase?.phaseSec[phase] ?? 0), 0),
	);
	const total = seconds.reduce((a, b) => a + b, 0);
	if (total > 0) {
		const mix = PHASE_ORDER.map(
			(phase, i) => `${phase} ${fmtPct((seconds[i] ?? 0) / total)}`,
		).join(" · ");
		out.push(`          ${mix} · ${ruleVersions.join(", ")}`);
	}

	const git = folded?.git;
	out.push(
		`git       ${git?.commits ?? 0} commits · ${fmtTokens((git?.additions ?? 0) + (git?.removals ?? 0))} lines changed`,
	);
	// The kept-private block points at a control the owner can click, because
	// #48 shipped one. This line NAMES the switch and stops there: the owner
	// control is #215's, and directions to a control that does not exist yet
	// would be the one false sentence in a preview built to be exact. Extend
	// this line with the location when #215 lands it.
	out.push(`          (Publish workflow is on for ${host})`);
	return out;
}

/**
 * The day counts (#307): "31 days to publish, 369 unchanged" against a
 * manifest, "400 days to publish" on a fresh machine or an old server.
 */
export function daysLine(
	measuredDays: PayloadMeasuredDays,
	selection?: DaySelection,
): string {
	const n = measuredDays.days.length;
	const head = `${n} day${n === 1 ? "" : "s"} to publish`;
	const unchanged = selection?.unchanged ?? 0;
	return unchanged > 0 ? `${head}, ${unchanged} unchanged` : head;
}

function daysBlock(
	measuredDays: PayloadMeasuredDays,
	selection?: DaySelection,
): string[] {
	const out = [`days      ${daysLine(measuredDays, selection)}`];
	const first = measuredDays.days[0]?.date;
	const last = measuredDays.days.at(-1)?.date;
	const usageDays = measuredDays.days.filter((d) => d.usage).length;
	if (first && last) {
		out.push(
			`          ${first} to ${last} · ${usageDays} with usage · ${measuredDays.aggregateVersion}`,
		);
	}
	return out;
}

export function buildGateSummary(ctx: GateContext): string {
	const { body, keptPrivate, config, source, baseUrl } = ctx;
	const { payloads } = body;
	const host = baseUrl.replace(/^https?:\/\//, "");
	const out: string[] = [];

	if (config.stack === null) {
		out.push("to        (no linked stack; publish is unavailable)");
	} else {
		out.push(
			`to        ${config.stack.name} · ${host}/stacks/${config.stack.slug}`,
		);
	}

	// What the CLI LOOKED FOR, in search order - a claim about the CLI, never
	// about the person's behavior, so it stays inside #40 (#130). Without it, a
	// harness the scan misses reads identically to a harness never installed.
	// The client version rides here because it travels (#213) and because one
	// fact about the CLI does not earn a line of its own.
	out.push(
		`searched  ${HARNESS_ADAPTERS.map((a) => harnessLabel(a.name).toLowerCase()).join(", ")}`,
	);

	// THE WINDOW IS THE SYNC'S, NOT EACH HARNESS'S (#217). Every payload carries
	// the same one, so printing it per harness said the same sentence three
	// times. A harness that somehow read a different window keeps its own line
	// inside its block rather than being silently folded into this one.
	const windows = new Set(
		payloads.map(
			(p) => `${p.window.days} days · ${p.window.from} → ${p.window.to}`,
		),
	);
	if (windows.size === 1) {
		out.push(
			`window    ${[...windows][0]}${body.cliVersion ? ` · aistack ${body.cliVersion}` : ""}`,
		);
	}

	// One block per detected harness, each under its own header.
	const width = wrapWidth(ctx.width);
	for (const payload of payloads) {
		const stats = ctx.scanStats?.[payload.harness.name];
		out.push("", DIVIDER, "");
		out.push(...payloadBlock(payload, width, windows.size > 1, stats));
	}

	// Everything that is not a harness: the day rows, the workflow, git, and the
	// kept-private count, under one section.
	out.push("", DIVIDER, "", "ALSO PUBLISHING");

	// The day rows (#307): how many go and how many the server already holds.
	// The counts are the sync's one plain sentence about diff-only publishing.
	if (body.measuredDays) {
		out.push(...daysBlock(body.measuredDays, ctx.days));
	}

	// In the bytes, so it is in the preview (#78's rule, applied to #213). Off
	// prints as plainly as `cost not published` does, and for the same reason: a
	// section the owner declined is a fact about this send, not an absence.
	const workflowDays = (body.measuredDays?.days ?? []).flatMap((d) =>
		d.workflow ? [d.workflow] : [],
	);
	if (!config.publishWorkflow || !body.measuredDays) {
		out.push("workflow  not published");
	} else if (workflowDays.length === 0) {
		out.push("workflow  on, no changed day to publish");
	} else {
		out.push(
			...workflowBlock(workflowDays, body.measuredDays.utcOffsetMinutes, host),
		);
	}

	// Kept private is ONE ROW: the count, the first few names, and the rest as
	// a count. Truncating is safe here and unsafe for the inventory above: these
	// names do NOT leave the machine (#217). The switch is still named before
	// the first upload (#48), on the row under it.
	const n = payloads.reduce((a, p) => a + withheldCount(p), 0);
	if (n > 0) {
		const rows = keptPrivateRows(keptPrivate);
		const shown = rows.slice(0, KEPT_PRIVATE_ROWS_SHOWN);
		const examples = shown
			.map((r) => (r.names > 1 ? `${r.label} ×${r.names}` : r.label))
			.join(", ");
		const more =
			rows.length > shown.length
				? `, ...${rows.length - shown.length} more`
				: "";
		out.push(`private   ${n} name${n === 1 ? "" : "s"} · ${examples}${more}`);
		if (body.keptPrivate !== undefined && config.stack !== null) {
			out.push(
				`          they go up for you to review at ${host}/stacks/${config.stack.slug}/changes`,
			);
			out.push(
				"          (turn off: Review kept-private names, on your stack)",
			);
		} else {
			out.push("          they stay on this machine");
		}
	}

	// Named at the gate because it is in the bytes (#78). It is not measurement
	// and not a name, but the rule is that the preview describes what goes, so a
	// field nobody can see in the preview does not get to ride along.
	if (body.autoSync !== undefined) {
		out.push(
			`auto-sync ${body.autoSync.enabled ? `on, about every ${body.autoSync.frequencyHours}h` : "off"}`,
		);
	}

	if (source === "bundled") {
		out.push("");
		out.push(
			"! could not fetch your settings from aistack - using the bundled list.",
		);
		out.push(
			"  This publishes less: no cost, no ticked names, nothing staged for review.",
		);
	}

	return out.join("\n");
}
