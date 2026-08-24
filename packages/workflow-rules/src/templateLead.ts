// The deterministic template lead: `lead-templates/v1`.
//
// Built in #214, and its wording locked in #220 (map #200). The measured
// numbers come from #196: phase-rules/v1 over 464 real sessions across 3
// harnesses, no LLM involved. ADR-0002 rules out an LLM anywhere in this
// surface, so the lead is fixed forms over measured numbers, versioned the
// same way the metric and phase rules are. The forms themselves are spelled
// out under "The template lead" in docs/specs/workflow-surface.md.
//
// THE SESSIONS ARE THE SUBJECT, NEVER THE PERSON. Every classified event is a
// tool call the harness made, so scout at 64% is mostly the agent reading. A
// sentence with no subject lets a reader supply one, and on a profile page
// they supply the person, which is both wrong and the unflattering reading.
// "Most measured time IN THESE SESSIONS" costs three words and fixes it.
// #196 flagged this; #220 answered it. Do not drop the subject.
//
// A line is built from typed PARTS rather than one baked string, because a
// "value" the reader sees highlighted (a bold number, a phase name) is a
// styling decision for whoever renders it (#215's podium, or the CLI's
// plain-text approve-gate preview) - this module owns the words and the
// numbers, not the markup. `renderLeadMarkdown` is the one concrete rendering
// this package ships, and it keeps the spec's example checkable byte for byte.
//
// "An absent measurement drops its sentence" (spec) - each builder returns
// `undefined` when its facts aren't there, and the stat line drops segments
// one at a time before dropping itself.
//
// Local time. The spec used to say start hours render in the READER's own
// time. #220 overturned that: a reader in Tokyo would see the owner's 23:00
// habit as 06:00, which describes nobody. `modalStartHourOwnerLocal` is the
// OWNER's local hour, localized by the caller, and it renders labeled
// "local". Nothing here touches a timezone.

import type { PhaseId } from "./types.js";

export const LEAD_TEMPLATES_V1 = "lead-templates/v1";

/**
 * Within this many percentage points, the top two phases are not ranked.
 * Ranking a one-point gap invents a winner the measurement does not support.
 */
export const LEAD_EVEN_SPLIT_POINTS = 10;

/**
 * Below this many sessions the lead does not print at all. A four-session
 * stack would say "most measured time goes to scout (67%)": true, and
 * meaningless. The session count in the scope line only warns a reader who
 * stops to do the arithmetic.
 */
export const LEAD_MIN_SESSIONS = 20;

export type LeadPart =
	| { kind: "text"; text: string }
	| { kind: "value"; text: string }
	| { kind: "code"; text: string };

/** One of the four lines: `scope`, `mix`, `stats`, `small-print`. */
export type LeadLine = { id: string; parts: readonly LeadPart[] };

export type PhaseLeadFacts = {
	/** Sessions in the window, across every synced harness. */
	sessionCount?: number;
	/** EVERY synced harness, including one the playbook gate held back. */
	harnessCount?: number;
	/**
	 * How many harnesses cleared the playbook gate (20% unknown or less).
	 * Zero withholds the whole lead. Omitted means the caller did not assert
	 * either way, and the lead prints.
	 */
	harnessesPassingGate?: number;
	/** The payload's own rolling window, named in the scope line so one page never carries two. */
	windowDays?: number;
	/** Share of TOTAL measured time (including `unknown`) per phase, summing to 1. */
	phaseShare?: Partial<Record<PhaseId, number>>;
	/** Share of sessions containing at least one verify-phase event. */
	verifySessionShare?: number;
	/**
	 * Share of sessions that stop at least once for a handoff. #220 replaced
	 * the raw event count, which had no denominator, and dropped the median
	 * wait, which measured how fast the human answered rather than the work.
	 */
	handoffSessionShare?: number;
	/** The hour (0-23) most sessions start in, in the OWNER's local time. */
	modalStartHourOwnerLocal?: number;
	/** Defaults to the phase rule set that produced `phaseShare` when omitted. */
	ruleVersion?: string;
};

const txt = (text: string): LeadPart => ({ kind: "text", text });
const val = (text: string): LeadPart => ({ kind: "value", text });
const code = (text: string): LeadPart => ({ kind: "code", text });

const SEP = " · ";

/** Whole percentage points, which is what the reader sees, so the prose never contradicts the number. */
const points = (share: number): number => Math.round(share * 100);
const pct = (share: number): string => `${points(share)}%`;
const localHour = (hour: number): string =>
	`${String(hour).padStart(2, "0")}:00`;
const plural = (n: number, one: string, many: string): string =>
	n === 1 ? one : many;
const capitalize = (s: string): string =>
	s.charAt(0).toUpperCase() + s.slice(1);

const NAMED_PHASES: readonly PhaseId[] = [
	"scout",
	"build",
	"verify",
	"handoff",
];

/** "142 sessions · 3 harnesses · last 30 days" */
function scopeLine(facts: PhaseLeadFacts): LeadLine | undefined {
	const { sessionCount, harnessCount, windowDays } = facts;
	if (!sessionCount || !harnessCount || !windowDays) return undefined;
	return {
		id: "scope",
		parts: [
			val(String(sessionCount)),
			txt(` ${plural(sessionCount, "session", "sessions")}${SEP}`),
			val(String(harnessCount)),
			txt(` ${plural(harnessCount, "harness", "harnesses")}${SEP}last `),
			val(String(windowDays)),
			txt(` ${plural(windowDays, "day", "days")}`),
		],
	};
}

/**
 * "Most measured time in these sessions goes to scout (64%), then build (18%)."
 *
 * Within `LEAD_EVEN_SPLIT_POINTS`, the ranked form is replaced by
 * "Scout (34%) and build (33%) take similar shares of measured time."
 */
function mixLine(facts: PhaseLeadFacts): LeadLine | undefined {
	const { phaseShare } = facts;
	if (!phaseShare) return undefined;
	const ranked = NAMED_PHASES.map((phase) => ({
		phase,
		share: phaseShare[phase],
	}))
		.filter(
			(e): e is { phase: PhaseId; share: number } => e.share !== undefined,
		)
		.sort((a, b) => b.share - a.share);
	const [first, second] = ranked;
	if (!first || !second) return undefined;

	const evenSplit =
		points(first.share) - points(second.share) <= LEAD_EVEN_SPLIT_POINTS;

	return {
		id: "mix",
		parts: evenSplit
			? [
					val(capitalize(first.phase)),
					txt(" ("),
					val(pct(first.share)),
					txt(") and "),
					val(second.phase),
					txt(" ("),
					val(pct(second.share)),
					txt(") take similar shares of measured time."),
				]
			: [
					txt("Most measured time in these sessions goes to "),
					val(first.phase),
					txt(" ("),
					val(pct(first.share)),
					txt("), then "),
					val(second.phase),
					txt(" ("),
					val(pct(second.share)),
					txt(")."),
				],
	};
}

/**
 * "verify in 40% of sessions · handoff in 62% of sessions · most start around 23:00 local"
 *
 * Three figures on one mono line rather than three more sentences: metric
 * cells would give them the weight of the token headline, and they are not
 * that important. Each segment drops on its own.
 */
function statsLine(facts: PhaseLeadFacts): LeadLine | undefined {
	const segments: LeadPart[][] = [];
	if (facts.verifySessionShare !== undefined) {
		segments.push([
			txt("verify in "),
			val(pct(facts.verifySessionShare)),
			txt(" of sessions"),
		]);
	}
	if (facts.handoffSessionShare !== undefined) {
		segments.push([
			txt("handoff in "),
			val(pct(facts.handoffSessionShare)),
			txt(" of sessions"),
		]);
	}
	if (facts.modalStartHourOwnerLocal !== undefined) {
		segments.push([
			txt("most start around "),
			val(localHour(facts.modalStartHourOwnerLocal)),
			txt(" local"),
		]);
	}
	if (segments.length === 0) return undefined;
	return {
		id: "stats",
		parts: segments.flatMap((seg, i) => (i === 0 ? seg : [txt(SEP), ...seg])),
	};
}

/**
 * "7% of measured time unclassified · phase-rules/v1"
 *
 * The unknown bucket never hides, and it prints exactly once. Before #220 it
 * appeared in both the lead and the derivation.
 */
function smallPrintLine(facts: PhaseLeadFacts): LeadLine | undefined {
	const unknown = facts.phaseShare?.unknown;
	if (unknown === undefined) return undefined;
	return {
		id: "small-print",
		parts: [
			val(pct(unknown)),
			txt(` of measured time unclassified${SEP}`),
			code(facts.ruleVersion ?? "phase-rules/v1"),
		],
	};
}

/**
 * The four `lead-templates/v1` lines, in fixed order, with any line whose
 * measurement is absent skipped rather than rendered empty.
 *
 * Two floors withhold the whole lead: fewer than `LEAD_MIN_SESSIONS`
 * sessions, and no harness clearing the playbook gate. Both exist because a
 * mix that unreliable is not worth publishing, and printing it anyway just
 * moves the judgment onto the reader. The rest of the section still renders.
 */
export function renderLeadLines(facts: PhaseLeadFacts): readonly LeadLine[] {
	if (facts.harnessesPassingGate === 0) return [];
	if ((facts.sessionCount ?? 0) < LEAD_MIN_SESSIONS) return [];
	return [
		scopeLine(facts),
		mixLine(facts),
		statsLine(facts),
		smallPrintLine(facts),
	].filter((l): l is LeadLine => l !== undefined);
}

/** Bold values, code-styled rule ids: the exact markdown the spec's example prints. */
export function renderLeadMarkdown(line: LeadLine): string {
	return line.parts
		.map((part) => {
			if (part.kind === "value") return `**${part.text}**`;
			if (part.kind === "code") return `\`${part.text}\``;
			return part.text;
		})
		.join("");
}
