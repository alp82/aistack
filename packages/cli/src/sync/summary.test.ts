// The gate's two beats — wayfinder ticket #41 (map #29).
//
// The copy under test is BINDING (#48): the owner fixed the exact strings, so
// these tests hold sentences, not just numbers.

import { describe, expect, test } from "vitest";
import type {
	KeptPrivateAtom,
	NameCategory,
	SyncConfig,
} from "../harness/shared/allowlist.js";
import { EMPTY_OPT_INS } from "../harness/shared/allowlist.js";
import type { MeasuredPayload, SyncBody } from "../harness/shared/payload.js";
import {
	buildGateDialog,
	buildGateSummary,
	fmtTokens,
	fmtUSD,
	type GateContext,
	keptPrivateRows,
	totalUSD,
	withheldCount,
} from "./summary.js";

const NO_KEPT_PRIVATE: Record<NameCategory, KeptPrivateAtom[]> = {
	builtinTools: [],
	mcpServers: [],
	skills: [],
	subagents: [],
	slashCommands: [],
};

function payload(over: Partial<MeasuredPayload> = {}): MeasuredPayload {
	return {
		schemaVersion: 1,
		capturedAt: 1_753_800_000_000,
		window: { days: 30, from: "2026-06-30", to: "2026-07-30" },
		harness: { name: "claude-code", version: "2.1.220" },
		pricingTable: "2026-07",
		activity: {
			sessions: 382,
			activeDays: 28,
			projects: 12,
			totalTokens: 4_270_000_000,
			cacheHitShare: 0.945,
			subagentShare: 0.344,
		},
		models: [
			{
				id: "claude-fable-5",
				tokenShare: 0.351,
				tokens: { input: 1, output: 2, cacheWrite: 3, cacheRead: 4 },
				apiEquivalentUSD: 2051.25,
			},
			{
				id: "claude-opus-5",
				tokenShare: 0.2,
				tokens: { input: 1, output: 2, cacheWrite: 3, cacheRead: 4 },
				apiEquivalentUSD: 3788.5,
			},
		],
		inventory: {
			builtinTools: [{ name: "Bash", callShare: 0.4 }],
			mcpServers: [],
			skills: [{ name: "grilling", callShare: 0.1 }],
			subagents: [],
			slashCommands: [],
			withheld: {
				builtinTools: 0,
				mcpServers: 2,
				skills: 10,
				subagents: 47,
				slashCommands: 8,
			},
		},
		coverage: {
			filesScanned: 3047,
			filesUnreadable: 0,
			linesParsed: 216_545,
			linesFailed: 0,
		},
		excludedTokens: { unpriced: 0, synthetic: 0 },
		...over,
	};
}

function ctx(over: {
	payload?: Partial<MeasuredPayload>;
	withKeptPrivateHalf?: boolean;
	keptPrivate?: Record<NameCategory, KeptPrivateAtom[]>;
	config?: Partial<SyncConfig>;
	source?: "fetched" | "bundled";
}): GateContext {
	const p = payload(over.payload);
	const body: SyncBody = over.withKeptPrivateHalf
		? { payloads: [p], keptPrivate: over.keptPrivate ?? NO_KEPT_PRIVATE }
		: { payloads: [p] };
	return {
		body,
		keptPrivate: over.keptPrivate ?? NO_KEPT_PRIVATE,
		config: {
			allowlist: {
				mcpServers: [],
				skills: [],
				subagents: [],
				slashCommands: [],
			},
			publishCost: true,
			optIns: EMPTY_OPT_INS,
			reviewKeptPrivate: false,
			stack: { name: "Alp's Daily Driver", slug: "alps-daily-driver" },
			...over.config,
		},
		source: over.source ?? "fetched",
		baseUrl: "https://aistack.to",
	};
}

const KEPT: Record<NameCategory, KeptPrivateAtom[]> = {
	builtinTools: [],
	mcpServers: [{ name: "internal-proxy", count: 40, group: null }],
	skills: [
		{ name: "alp-river:deploy", count: 12, group: "alp-river" },
		{ name: "alp-river:review", count: 3, group: "alp-river" },
	],
	subagents: [{ name: "stripe", count: 1, group: null }],
	slashCommands: [],
};

describe("formatting", () => {
	test("tokens use three significant digits like the public display", () => {
		expect(fmtTokens(4_270_000_000)).toBe("4.27B");
		expect(fmtTokens(40_700_000)).toBe("40.7M");
		expect(fmtTokens(216_545)).toBe("217k");
		expect(fmtTokens(950)).toBe("950");
	});

	test("dollars are whole with a ≈", () => {
		expect(fmtUSD(5839.75)).toBe("≈$5,840");
	});
});

describe("totalUSD — never a dollar without its pricing table (#46)", () => {
	test("sums the per-model figures", () => {
		expect(totalUSD(payload())).toBeCloseTo(5839.75);
	});

	test("null when pricingTable is null, even if models carry figures", () => {
		expect(totalUSD(payload({ pricingTable: null }))).toBeNull();
	});

	test("null when no model carries a figure", () => {
		const p = payload();
		for (const m of p.models) m.apiEquivalentUSD = undefined;
		expect(totalUSD(p)).toBeNull();
	});
});

describe("beat two — the dialog (binding copy, #48)", () => {
	test("the locked shape: facts line, then the review line", () => {
		expect(buildGateDialog(ctx({ withKeptPrivateHalf: true }))).toBe(
			"Publish to aistack? 4.27B tokens · 30 days · ≈$5,840\n" +
				"67 names go up for you to review",
		);
	});

	test("names staying local say so instead", () => {
		expect(buildGateDialog(ctx({}))).toBe(
			"Publish to aistack? 4.27B tokens · 30 days · ≈$5,840\n" +
				"67 names stay on this machine",
		);
	});

	test("cost off drops the dollar, never zeroes it", () => {
		const dialog = buildGateDialog(ctx({ payload: { pricingTable: null } }));
		expect(dialog).toContain("Publish to aistack? 4.27B tokens · 30 days\n");
		expect(dialog).not.toContain("$");
	});

	test("zero withheld names drops the second line entirely", () => {
		const dialog = buildGateDialog(
			ctx({
				payload: {
					inventory: {
						...payload().inventory,
						withheld: {
							builtinTools: 0,
							mcpServers: 0,
							skills: 0,
							subagents: 0,
							slashCommands: 0,
						},
					},
				},
			}),
		);
		expect(dialog).toBe("Publish to aistack? 4.27B tokens · 30 days · ≈$5,840");
	});

	test("stays two lines — a long dialog is an unanswerable gate (#35 1H)", () => {
		const dialog = buildGateDialog(ctx({ withKeptPrivateHalf: true }));
		expect(dialog.split("\n").length).toBeLessThanOrEqual(2);
	});
});

describe("beat one — the summary", () => {
	test("names the destination and the changes URL before any send", () => {
		const summary = buildGateSummary(
			ctx({ withKeptPrivateHalf: true, keptPrivate: KEPT }),
		);
		expect(summary).toContain(
			"to        Alp's Daily Driver · aistack.to/stacks/alps-daily-driver",
		);
		expect(summary).toContain(
			"publish them at aistack.to/stacks/alps-daily-driver/changes",
		);
	});

	test("names the switch before the first upload (#48)", () => {
		const summary = buildGateSummary(
			ctx({ withKeptPrivateHalf: true, keptPrivate: KEPT }),
		);
		expect(summary).toContain("Review kept-private names");
	});

	test("kept private renders grouped rows with name counts, per the locked copy", () => {
		const summary = buildGateSummary(ctx({ keptPrivate: KEPT }));
		expect(summary).toContain("kept private: 67 names");
		expect(summary).toMatch(/alp-river\s+2/);
		expect(summary).toMatch(/stripe\s+1/);
		// The half is NOT in the body, so the names stay local and say so.
		expect(summary).toContain("they stay on this machine");
	});

	test("withheld count derives from the send bytes, not the local list", () => {
		// 67 from inventory.withheld even though the local list has 4 names —
		// the sentence the user approves must describe the bytes.
		expect(withheldCount(payload())).toBe(67);
	});

	test("cost line reads 'not published' when the table is absent", () => {
		const summary = buildGateSummary(ctx({ payload: { pricingTable: null } }));
		expect(summary).toContain("cost      not published");
		expect(summary).not.toContain("$");
	});

	test("coverage is silent when clean and a floor when degraded (#40)", () => {
		expect(buildGateSummary(ctx({}))).not.toContain("coverage");
		const degraded = buildGateSummary(
			ctx({
				payload: {
					coverage: {
						filesScanned: 10,
						filesUnreadable: 3,
						linesParsed: 100,
						linesFailed: 12,
					},
				},
			}),
		);
		expect(degraded).toContain(
			"coverage  3 files unreadable · 12 lines failed — this reading is a floor",
		);
	});

	test("a bundled fallback names itself and the publishing-less consequence", () => {
		const summary = buildGateSummary(
			ctx({ source: "bundled", config: { stack: null } }),
		);
		expect(summary).toContain("using the bundled list");
		expect(summary).toContain("publishes less");
		expect(summary).toContain("no linked stack — publish is unavailable");
	});

	test("a dollar figure never renders without its pricing table, per model either", () => {
		const summary = buildGateSummary(ctx({ payload: { pricingTable: null } }));
		expect(summary).not.toContain("≈$");
	});
});

describe("keptPrivateRows", () => {
	test("groups collapse to one row counting NAMES, singles count 1", () => {
		expect(keptPrivateRows(KEPT)).toEqual([
			{ label: "alp-river", names: 2 },
			{ label: "internal-proxy", names: 1 },
			{ label: "stripe", names: 1 },
		]);
	});
});
