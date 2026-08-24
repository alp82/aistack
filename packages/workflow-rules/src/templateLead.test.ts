import { describe, expect, it } from "vitest";
import {
	type PhaseLeadFacts,
	renderLeadMarkdown,
	renderLeadSentences,
} from "./templateLead.js";

// The exact aggregate #196 ran phase-rules/v1 over: 464 real sessions across
// 3 harnesses. https://github.com/alp82/aistack/issues/196
const PROOF_FACTS: PhaseLeadFacts = {
	sessionCount: 464,
	harnessCount: 3,
	phaseShare: {
		scout: 0.64,
		build: 0.18,
		verify: 0.06,
		handoff: 0.05,
		unknown: 0.07,
	},
	verifySessionShare: 0.4,
	handoffCount: 437,
	handoffMedianWaitMinutes: 24,
	modalStartHourLocal: 23,
	ruleVersion: "phase-rules/v1",
};

describe("renderLeadSentences: the #196 proof reproduces byte for byte", () => {
	it("renders all five forms in order, matching the proof's markdown exactly", () => {
		const sentences = renderLeadSentences(PROOF_FACTS).map(renderLeadMarkdown);
		expect(sentences).toEqual([
			"Across **464** sessions on **3** harnesses, **scout** takes the largest share of measured time (**64%**), then **build** (**18%**).",
			"A verify step shows up in **40%** of sessions.",
			"Work stops at a human gate **437** times, with a median wait of **24 min**.",
			"Most sessions start around **23:00**.",
			"The rules leave **7%** of measured time unclassified (`phase-rules/v1`).",
		]);
	});
});

describe("renderLeadSentences: an absent measurement drops its sentence", () => {
	it("drops the phase-mix sentence with fewer than two named phases", () => {
		const facts: PhaseLeadFacts = {
			sessionCount: 10,
			harnessCount: 1,
			phaseShare: { scout: 0.9, unknown: 0.1 },
		};
		const ids = renderLeadSentences(facts).map((s) => s.id);
		expect(ids).not.toContain("phase-mix");
	});

	it("drops the verify sentence with no verify-presence data", () => {
		const facts: PhaseLeadFacts = {
			...PROOF_FACTS,
			verifySessionShare: undefined,
		};
		const ids = renderLeadSentences(facts).map((s) => s.id);
		expect(ids).not.toContain("verify-presence");
	});

	it("drops the handoff sentence when there were zero handoff events", () => {
		const facts: PhaseLeadFacts = {
			...PROOF_FACTS,
			handoffCount: 0,
			handoffMedianWaitMinutes: undefined,
		};
		const ids = renderLeadSentences(facts).map((s) => s.id);
		expect(ids).not.toContain("handoff-wait");
	});

	it("drops the start-hour sentence with no modal hour", () => {
		const facts: PhaseLeadFacts = {
			...PROOF_FACTS,
			modalStartHourLocal: undefined,
		};
		const ids = renderLeadSentences(facts).map((s) => s.id);
		expect(ids).not.toContain("start-hour");
	});

	it("drops the unknown-share sentence with no phase share at all", () => {
		const facts: PhaseLeadFacts = { ...PROOF_FACTS, phaseShare: undefined };
		const ids = renderLeadSentences(facts).map((s) => s.id);
		expect(ids).not.toContain("unknown-share");
		expect(ids).not.toContain("phase-mix");
	});

	it("renders nothing at all for empty facts", () => {
		expect(renderLeadSentences({})).toEqual([]);
	});
});

describe("renderLeadSentences: unknown-share falls back to phase-rules/v1 when ruleVersion is omitted", () => {
	it("names phase-rules/v1 by default", () => {
		const facts: PhaseLeadFacts = { ...PROOF_FACTS, ruleVersion: undefined };
		const sentence = renderLeadSentences(facts).find(
			(s) => s.id === "unknown-share",
		);
		expect(sentence && renderLeadMarkdown(sentence)).toContain(
			"`phase-rules/v1`",
		);
	});
});
