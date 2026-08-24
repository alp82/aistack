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
	playbookHarnessCount: 2,
	phaseShare: {
		scout: 0.64,
		build: 0.18,
		verify: 0.06,
		handoff: 0.05,
		unknown: 0.07,
	},
	verifySessionShare: 0.4,
	handoffSessionShare: 0.62,
	modalStartHourOwnerLocal: 23,
	ruleVersion: "phase-rules/v1",
};

describe("renderLeadSentences: the locked lead reproduces byte for byte", () => {
	it("renders the four lines in their locked order", () => {
		const sentences = renderLeadSentences(PROOF_FACTS).map(renderLeadMarkdown);
		expect(sentences).toEqual([
			"**464** sessions · **3** harnesses · last 30 days",
			"Most measured time in these sessions goes to **scout** (**64%**), then **build** (**18%**).",
			"verify in **40%** of sessions · handoff in **62%** of sessions · most start around **23:00** local",
			"**7%** of measured time unclassified · `phase-rules/v1`",
		]);
	});
});

describe("renderLeadSentences: eligibility gates", () => {
	it("withholds the lead below 20 sessions", () => {
		expect(renderLeadSentences({ ...PROOF_FACTS, sessionCount: 19 })).toEqual(
			[],
		);
	});

	it("withholds the lead when no harness passes the playbook gate", () => {
		expect(
			renderLeadSentences({ ...PROOF_FACTS, playbookHarnessCount: 0 }),
		).toEqual([]);
	});
});

describe("renderLeadSentences: phase mix forms", () => {
	it("uses the similar-share form for a close top two", () => {
		const facts: PhaseLeadFacts = {
			...PROOF_FACTS,
			phaseShare: {
				scout: 0.34,
				build: 0.33,
				verify: 0.18,
				handoff: 0.08,
				unknown: 0.07,
			},
		};
		const sentence = renderLeadSentences(facts).find(
			(line) => line.id === "phase-mix",
		);
		expect(sentence && renderLeadMarkdown(sentence)).toBe(
			"**Scout** (**34%**) and **build** (**33%**) take similar shares of measured time.",
		);
	});

	it("includes a top two exactly 10 points apart", () => {
		const facts: PhaseLeadFacts = {
			...PROOF_FACTS,
			phaseShare: {
				scout: 0.45,
				build: 0.35,
				verify: 0.1,
				handoff: 0.05,
				unknown: 0.05,
			},
		};
		const sentence = renderLeadSentences(facts).find(
			(line) => line.id === "phase-mix",
		);
		expect(sentence && renderLeadMarkdown(sentence)).toBe(
			"**Scout** (**45%**) and **build** (**35%**) take similar shares of measured time.",
		);
	});
});

describe("renderLeadSentences: an absent measurement drops its sentence", () => {
	it("drops the phase-mix sentence with fewer than two named phases", () => {
		const facts: PhaseLeadFacts = {
			sessionCount: 20,
			harnessCount: 1,
			playbookHarnessCount: 1,
			phaseShare: { scout: 0.9, unknown: 0.1 },
		};
		const ids = renderLeadSentences(facts).map((s) => s.id);
		expect(ids).not.toContain("phase-mix");
	});

	it("drops the stats line with no verify-presence data", () => {
		const facts: PhaseLeadFacts = {
			...PROOF_FACTS,
			verifySessionShare: undefined,
		};
		const ids = renderLeadSentences(facts).map((s) => s.id);
		expect(ids).not.toContain("stats");
	});

	it("drops the stats line with no handoff-presence data", () => {
		const facts: PhaseLeadFacts = {
			...PROOF_FACTS,
			handoffSessionShare: undefined,
		};
		const ids = renderLeadSentences(facts).map((s) => s.id);
		expect(ids).not.toContain("stats");
	});

	it("drops the stats line with no owner-local modal hour", () => {
		const facts: PhaseLeadFacts = {
			...PROOF_FACTS,
			modalStartHourOwnerLocal: undefined,
		};
		const ids = renderLeadSentences(facts).map((s) => s.id);
		expect(ids).not.toContain("stats");
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
