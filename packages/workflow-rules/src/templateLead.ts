// The deterministic template lead: `lead-templates/v1`.
//
// Wayfinder tickets #214 and #267 (map #200). The four line forms use the
// wording locked in ticket #220 over the proof from ticket #196.
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
// "An absent measurement drops its sentence" (spec). Each line builder
// returns `undefined` when the facts it needs aren't present.
//
// Start hours are stored in UTC and rendered in the owner's local time.
// `modalStartHourOwnerLocal` is the caller's job to localize before calling
// this module. This module doesn't touch a timezone.

import type { PhaseId } from "./types.js";

export const LEAD_TEMPLATES_V1 = "lead-templates/v1";
export const MIN_LEAD_SESSION_COUNT = 20;
export const EVEN_SPLIT_THRESHOLD = 0.1;

export type LeadPart =
	| { kind: "text"; text: string }
	| { kind: "value"; text: string }
	| { kind: "code"; text: string };

export type LeadSentence = { id: string; parts: readonly LeadPart[] };

export type PhaseLeadFacts = {
	sessionCount?: number;
	harnessCount?: number;
	/** Harnesses whose phase data passes the playbook unknown-share gate. */
	playbookHarnessCount?: number;
	/** Share of TOTAL measured time (including `unknown`) per phase, summing to 1. */
	phaseShare?: Partial<Record<PhaseId, number>>;
	/** Share of sessions containing at least one verify-phase event. */
	verifySessionShare?: number;
	/** Share of sessions containing at least one handoff-phase event. */
	handoffSessionShare?: number;
	/** The owner's local hour (0-23) when most sessions start. */
	modalStartHourOwnerLocal?: number;
	/** Defaults to the phase rule set that produced `phaseShare` when omitted. */
	ruleVersion?: string;
};

const txt = (text: string): LeadPart => ({ kind: "text", text });
const val = (text: string): LeadPart => ({ kind: "value", text });
const code = (text: string): LeadPart => ({ kind: "code", text });

const pct = (share: number): string => `${Math.round(share * 100)}%`;
const localHour = (hour: number): string =>
	`${String(hour).padStart(2, "0")}:00`;
const phaseAtSentenceStart = (phase: PhaseId): string =>
	`${phase[0].toUpperCase()}${phase.slice(1)}`;

const NAMED_PHASES: readonly PhaseId[] = [
	"scout",
	"build",
	"verify",
	"handoff",
];

/** "N sessions · H harnesses · last 30 days" */
function scopeSentence(facts: PhaseLeadFacts): LeadSentence | undefined {
	const { sessionCount, harnessCount } = facts;
	if (!sessionCount || !harnessCount) return undefined;
	return {
		id: "scope",
		parts: [
			val(String(sessionCount)),
			txt(" sessions · "),
			val(String(harnessCount)),
			txt(" harnesses · last 30 days"),
		],
	};
}

/** "Most measured time in these sessions goes to PHASE1 (P1%), then PHASE2 (P2%)." */
function phaseMixSentence(facts: PhaseLeadFacts): LeadSentence | undefined {
	const { phaseShare } = facts;
	if (!phaseShare) return undefined;
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
	if (first.share - second.share <= EVEN_SPLIT_THRESHOLD + Number.EPSILON) {
		return {
			id: "phase-mix",
			parts: [
				val(phaseAtSentenceStart(first.phase)),
				txt(" ("),
				val(pct(first.share)),
				txt(") and "),
				val(second.phase),
				txt(" ("),
				val(pct(second.share)),
				txt(") take similar shares of measured time."),
			],
		};
	}
	return {
		id: "phase-mix",
		parts: [
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

/** "verify in V% of sessions · handoff in H% of sessions · most start around HH:00 local" */
function statsSentence(facts: PhaseLeadFacts): LeadSentence | undefined {
	const { verifySessionShare, handoffSessionShare, modalStartHourOwnerLocal } =
		facts;
	if (
		verifySessionShare === undefined ||
		handoffSessionShare === undefined ||
		modalStartHourOwnerLocal === undefined
	) {
		return undefined;
	}
	return {
		id: "stats",
		parts: [
			txt("verify in "),
			val(pct(verifySessionShare)),
			txt(" of sessions · handoff in "),
			val(pct(handoffSessionShare)),
			txt(" of sessions · most start around "),
			val(localHour(modalStartHourOwnerLocal)),
			txt(" local"),
		],
	};
}

/** "U% of measured time unclassified · rule-version" */
function unknownShareSentence(facts: PhaseLeadFacts): LeadSentence | undefined {
	const unknown = facts.phaseShare?.unknown;
	if (unknown === undefined) return undefined;
	return {
		id: "unknown-share",
		parts: [
			val(pct(unknown)),
			txt(" of measured time unclassified · "),
			code(facts.ruleVersion ?? "phase-rules/v1"),
		],
	};
}

/**
 * The four `lead-templates/v1` lines in fixed order.
 */
export function renderLeadSentences(
	facts: PhaseLeadFacts,
): readonly LeadSentence[] {
	if ((facts.sessionCount ?? 0) < MIN_LEAD_SESSION_COUNT) return [];
	if (!facts.playbookHarnessCount) return [];
	return [
		scopeSentence(facts),
		phaseMixSentence(facts),
		statsSentence(facts),
		unknownShareSentence(facts),
	].filter((s): s is LeadSentence => s !== undefined);
}

/** Bold values and code-styled rule IDs for checking exact template copy. */
export function renderLeadMarkdown(sentence: LeadSentence): string {
	return sentence.parts
		.map((part) => {
			if (part.kind === "value") return `**${part.text}**`;
			if (part.kind === "code") return `\`${part.text}\``;
			return part.text;
		})
		.join("");
}
