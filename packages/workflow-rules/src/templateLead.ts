// The deterministic template lead: `lead-templates/v1`.
//
// Wayfinder ticket #214 (map #200). The five sentence forms and their
// proof-of-life numbers come from ticket #196: run over 464 real sessions
// across 3 harnesses with no LLM involved, all five read correctly.
// ADR-0002 rules out an LLM anywhere in this surface, so the lead is fixed
// sentence forms over measured numbers, versioned the same way the metric
// and phase rules are.
//
// A sentence is built from typed PARTS rather than one baked string, because
// a "value" the reader sees highlighted (a bold number, a phase name) is a
// styling decision for whoever renders it (ticket #215's podium, or the
// CLI's plain-text approve-gate preview) - this module only owns the words
// and the numbers, not the markup. `renderLeadMarkdown` is the one
// concrete rendering this package ships, and it exists to keep the proof in
// #196 checkable byte for byte.
//
// "An absent measurement drops its sentence" (spec) - each sentence builder
// returns `undefined` when the facts it needs aren't there, and the missing
// sentence is skipped rather than rendered with a placeholder.
//
// Local time. "Start hours are stored in UTC and rendered in the reader's
// own time, so a public page never shows a stranger a UTC clock" (spec) -
// `modalStartHourLocal` is therefore the CALLER's job to localize before
// calling this module; nothing here touches a timezone.

import type { PhaseId } from "./types.js";

export const LEAD_TEMPLATES_V1 = "lead-templates/v1";

export type LeadPart =
	| { kind: "text"; text: string }
	| { kind: "value"; text: string }
	| { kind: "code"; text: string };

export type LeadSentence = { id: string; parts: readonly LeadPart[] };

export type PhaseLeadFacts = {
	sessionCount?: number;
	harnessCount?: number;
	/** Share of TOTAL measured time (including `unknown`) per phase, summing to 1. */
	phaseShare?: Partial<Record<PhaseId, number>>;
	/** Share of sessions containing at least one verify-phase event. */
	verifySessionShare?: number;
	/** Raw count of handoff (blocking human-gate) events across every session. */
	handoffCount?: number;
	handoffMedianWaitMinutes?: number;
	/** The hour (0-23) most sessions start in, already localized by the caller. */
	modalStartHourLocal?: number;
	/** Defaults to the phase rule set that produced `phaseShare` when omitted. */
	ruleVersion?: string;
};

const txt = (text: string): LeadPart => ({ kind: "text", text });
const val = (text: string): LeadPart => ({ kind: "value", text });
const code = (text: string): LeadPart => ({ kind: "code", text });

const pct = (share: number): string => `${Math.round(share * 100)}%`;
const localHour = (hour: number): string =>
	`${String(hour).padStart(2, "0")}:00`;
const minutes = (m: number): string => `${Math.round(m)} min`;

const NAMED_PHASES: readonly PhaseId[] = [
	"scout",
	"build",
	"verify",
	"handoff",
];

/** "Across N sessions on H harnesses, PHASE1 takes the largest share of measured time (P1%), then PHASE2 (P2%)." */
function phaseMixSentence(facts: PhaseLeadFacts): LeadSentence | undefined {
	const { sessionCount, harnessCount, phaseShare } = facts;
	if (!sessionCount || !harnessCount || !phaseShare) return undefined;
	const ranked = NAMED_PHASES.map((phase) => ({
		phase,
		share: phaseShare[phase],
	})).filter(
		(e): e is { phase: PhaseId; share: number } => e.share !== undefined,
	);
	ranked.sort((a, b) => b.share - a.share);
	const first = ranked[0];
	const second = ranked[1];
	if (!first || !second) return undefined;
	return {
		id: "phase-mix",
		parts: [
			txt("Across "),
			val(String(sessionCount)),
			txt(" sessions on "),
			val(String(harnessCount)),
			txt(" harnesses, "),
			val(first.phase),
			txt(" takes the largest share of measured time ("),
			val(pct(first.share)),
			txt("), then "),
			val(second.phase),
			txt(" ("),
			val(pct(second.share)),
			txt(")."),
		],
	};
}

/** "A verify step shows up in P% of sessions." */
function verifyPresenceSentence(
	facts: PhaseLeadFacts,
): LeadSentence | undefined {
	if (facts.verifySessionShare === undefined) return undefined;
	return {
		id: "verify-presence",
		parts: [
			txt("A verify step shows up in "),
			val(pct(facts.verifySessionShare)),
			txt(" of sessions."),
		],
	};
}

/** "Work stops at a human gate N times, with a median wait of M min." */
function handoffWaitSentence(facts: PhaseLeadFacts): LeadSentence | undefined {
	if (!facts.handoffCount || facts.handoffMedianWaitMinutes === undefined)
		return undefined;
	return {
		id: "handoff-wait",
		parts: [
			txt("Work stops at a human gate "),
			val(String(facts.handoffCount)),
			txt(" times, with a median wait of "),
			val(minutes(facts.handoffMedianWaitMinutes)),
			txt("."),
		],
	};
}

/** "Most sessions start around HH:00." */
function startHourSentence(facts: PhaseLeadFacts): LeadSentence | undefined {
	if (facts.modalStartHourLocal === undefined) return undefined;
	return {
		id: "start-hour",
		parts: [
			txt("Most sessions start around "),
			val(localHour(facts.modalStartHourLocal)),
			txt("."),
		],
	};
}

/** "The rules leave U% of measured time unclassified (`rule-version`)." */
function unknownShareSentence(facts: PhaseLeadFacts): LeadSentence | undefined {
	const unknown = facts.phaseShare?.unknown;
	if (unknown === undefined) return undefined;
	return {
		id: "unknown-share",
		parts: [
			txt("The rules leave "),
			val(pct(unknown)),
			txt(" of measured time unclassified ("),
			code(facts.ruleVersion ?? "phase-rules/v1"),
			txt(")."),
		],
	};
}

/**
 * The five `lead-templates/v1` forms, in fixed order, with any sentence
 * whose measurement is absent skipped rather than rendered empty.
 */
export function renderLeadSentences(
	facts: PhaseLeadFacts,
): readonly LeadSentence[] {
	return [
		phaseMixSentence(facts),
		verifyPresenceSentence(facts),
		handoffWaitSentence(facts),
		startHourSentence(facts),
		unknownShareSentence(facts),
	].filter((s): s is LeadSentence => s !== undefined);
}

/** Bold values, code-styled rule ids - the exact markdown form #196 proved against real data. */
export function renderLeadMarkdown(sentence: LeadSentence): string {
	return sentence.parts
		.map((part) => {
			if (part.kind === "value") return `**${part.text}**`;
			if (part.kind === "code") return `\`${part.text}\``;
			return part.text;
		})
		.join("");
}
