import { describe, expect, it } from "vitest";
import {
	LEAD_EVEN_SPLIT_POINTS,
	LEAD_MIN_SESSIONS,
	type PhaseLeadFacts,
	renderLeadLines,
	renderLeadMarkdown,
} from "./templateLead.js";

// The example printed in "The template lead" in docs/specs/workflow-surface.md,
// locked by #220. The phase shares are the ones #196 measured over real history.
const SPEC_FACTS: PhaseLeadFacts = {
	sessionCount: 142,
	harnessCount: 3,
	harnessesPassingGate: 2,
	windowDays: 30,
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

const render = (facts: PhaseLeadFacts) =>
	renderLeadLines(facts).map(renderLeadMarkdown);

describe("renderLeadLines: the locked example reproduces byte for byte", () => {
	it("renders the four lines from the spec, in order", () => {
		expect(render(SPEC_FACTS)).toEqual([
			"**142** sessions · **3** harnesses · last **30** days",
			"Most measured time in these sessions goes to **scout** (**64%**), then **build** (**18%**).",
			"verify in **40%** of sessions · handoff in **62%** of sessions · most start around **23:00** local",
			"**7%** of measured time unclassified · `phase-rules/v1`",
		]);
	});

	it("labels the four lines so a renderer can style each one", () => {
		expect(renderLeadLines(SPEC_FACTS).map((l) => l.id)).toEqual([
			"scope",
			"mix",
			"stats",
			"small-print",
		]);
	});
});

describe("renderLeadLines: the sessions are the subject, never the person", () => {
	it("puts the sessions in the subject slot of the mix sentence", () => {
		const mix = render(SPEC_FACTS)[1] ?? "";
		expect(mix).toContain("in these sessions");
	});

	it("never publishes how long the human took to answer a handoff", () => {
		const whole = render(SPEC_FACTS).join("\n");
		expect(whole).not.toMatch(/wait/i);
		expect(whole).not.toMatch(/min\b/);
	});

	it("names the handoff figure as a share of sessions, not a raw count", () => {
		const stats = render(SPEC_FACTS)[2] ?? "";
		expect(stats).toContain("handoff in **62%** of sessions");
	});
});

describe("renderLeadLines: the unknown share prints once, in small print", () => {
	it("keeps the unknown share out of the mix sentence", () => {
		expect(render(SPEC_FACTS)[1] ?? "").not.toContain("unclassified");
	});

	it("pairs the unknown share with the rule id on the last line", () => {
		expect(render(SPEC_FACTS)[3] ?? "").toBe(
			"**7%** of measured time unclassified · `phase-rules/v1`",
		);
	});

	it("falls back to phase-rules/v1 when no rule version is given", () => {
		expect(
			render({ ...SPEC_FACTS, ruleVersion: undefined })[3] ?? "",
		).toContain("`phase-rules/v1`");
	});
});

describe("renderLeadLines: a close top two never gets ranked", () => {
	const close: PhaseLeadFacts = {
		...SPEC_FACTS,
		phaseShare: {
			scout: 0.34,
			build: 0.33,
			verify: 0.13,
			handoff: 0.13,
			unknown: 0.07,
		},
	};

	it("prints the even-split form inside the threshold", () => {
		expect(render(close)[1] ?? "").toBe(
			"**Scout** (**34%**) and **build** (**33%**) take similar shares of measured time.",
		);
	});

	it("prints the ranked form once the gap clears the threshold", () => {
		const gap = LEAD_EVEN_SPLIT_POINTS + 1;
		const wide: PhaseLeadFacts = {
			...SPEC_FACTS,
			phaseShare: { scout: 0.4, build: (40 - gap) / 100, unknown: 0.07 },
		};
		expect(render(wide)[1] ?? "").toContain("goes to **scout**");
	});

	it("treats a gap exactly on the threshold as an even split", () => {
		const onEdge: PhaseLeadFacts = {
			...SPEC_FACTS,
			phaseShare: {
				scout: 0.4,
				build: (40 - LEAD_EVEN_SPLIT_POINTS) / 100,
				unknown: 0.07,
			},
		};
		expect(render(onEdge)[1] ?? "").toContain("take similar shares");
	});
});

describe("renderLeadLines: the floors withhold the whole lead", () => {
	it("prints nothing below the session floor", () => {
		const thin: PhaseLeadFacts = {
			...SPEC_FACTS,
			sessionCount: LEAD_MIN_SESSIONS - 1,
		};
		expect(renderLeadLines(thin)).toEqual([]);
	});

	it("prints at the session floor exactly", () => {
		const atFloor: PhaseLeadFacts = {
			...SPEC_FACTS,
			sessionCount: LEAD_MIN_SESSIONS,
		};
		expect(renderLeadLines(atFloor).length).toBeGreaterThan(0);
	});

	it("prints nothing when no harness passes the playbook gate", () => {
		expect(renderLeadLines({ ...SPEC_FACTS, harnessesPassingGate: 0 })).toEqual(
			[],
		);
	});

	it("still prints when the gate result is not asserted", () => {
		const facts: PhaseLeadFacts = {
			...SPEC_FACTS,
			harnessesPassingGate: undefined,
		};
		expect(renderLeadLines(facts).length).toBeGreaterThan(0);
	});
});

describe("renderLeadLines: the scope line counts every synced harness", () => {
	it("counts all harnesses, including one the playbook gate held back", () => {
		expect(render(SPEC_FACTS)[0] ?? "").toContain("**3** harnesses");
	});

	it("uses singular nouns for a one-session, one-harness stack", () => {
		const solo: PhaseLeadFacts = {
			...SPEC_FACTS,
			sessionCount: 1,
			harnessCount: 1,
			windowDays: 1,
		};
		// Below the session floor, so ask the scope line for itself.
		expect(
			renderLeadMarkdown({
				id: "scope",
				parts:
					renderLeadLines({ ...solo, sessionCount: LEAD_MIN_SESSIONS })[0]
						?.parts ?? [],
			}),
		).toBe("**20** sessions · **1** harness · last **1** day");
	});
});

describe("renderLeadLines: an absent measurement drops its line or segment", () => {
	it("drops one stat segment and keeps the rest of the line", () => {
		const facts: PhaseLeadFacts = {
			...SPEC_FACTS,
			verifySessionShare: undefined,
		};
		expect(render(facts)[2] ?? "").toBe(
			"handoff in **62%** of sessions · most start around **23:00** local",
		);
	});

	it("drops the whole stat line when no segment survives", () => {
		const facts: PhaseLeadFacts = {
			...SPEC_FACTS,
			verifySessionShare: undefined,
			handoffSessionShare: undefined,
			modalStartHourOwnerLocal: undefined,
		};
		expect(renderLeadLines(facts).map((l) => l.id)).not.toContain("stats");
	});

	it("drops the mix line with fewer than two named phases", () => {
		const facts: PhaseLeadFacts = {
			...SPEC_FACTS,
			phaseShare: { scout: 0.9, unknown: 0.1 },
		};
		expect(renderLeadLines(facts).map((l) => l.id)).not.toContain("mix");
	});

	it("drops the mix and the small print with no phase share at all", () => {
		const ids = renderLeadLines({ ...SPEC_FACTS, phaseShare: undefined }).map(
			(l) => l.id,
		);
		expect(ids).not.toContain("mix");
		expect(ids).not.toContain("small-print");
	});

	it("drops the scope line with no window", () => {
		const facts: PhaseLeadFacts = { ...SPEC_FACTS, windowDays: undefined };
		expect(renderLeadLines(facts).map((l) => l.id)).not.toContain("scope");
	});

	it("renders nothing at all for empty facts", () => {
		expect(renderLeadLines({})).toEqual([]);
	});
});
