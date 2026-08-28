// The gate's two beats - wayfinder ticket #41 (map #29).
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
import type {
	MeasuredPayload,
	PayloadMeasuredDays,
	SyncBody,
} from "../harness/shared/payload.js";
import { emptyScanStats } from "../harness/shared/window.js";
import type { DaySelection } from "../usage/diff.js";
import {
	buildGateDialog,
	buildGateSummary,
	fmtReceivedAt,
	fmtTokens,
	fmtUSD,
	type GateContext,
	keptPrivateRows,
	scanNoteLines,
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
		schemaVersion: 2,
		capturedAt: 1_753_800_000_000,
		window: { days: 30, from: "2026-06-30", to: "2026-07-30" },
		harness: { name: "claude-code", version: "2.1.220" },
		pricingTable: "2026-07",
		activity: {
			sessions: 382,
			activeDayDates: ["2026-07-01", "2026-07-02", "2026-07-30"],
			projectKeys: ["AAAAAAAAAAAAAAAAAAAAAA"],
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
			builtinTools: [{ name: "Bash", callShare: 0.4, calls: 400 }],
			mcpServers: [],
			skills: [{ name: "grilling", callShare: 0.1, calls: 12 }],
			subagents: [],
			slashCommands: [],
			withheld: {
				builtinTools: 0,
				mcpServers: 2,
				skills: 10,
				subagents: 47,
				slashCommands: 8,
			},
			calls: {
				builtinTools: 1000,
				mcpServers: 30,
				skills: 120,
				subagents: 90,
				slashCommands: 20,
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

/** The day rows as `buildSyncBody` would have put them in the bytes (#213, #285, #307). */
function measuredDays(
	over: Partial<PayloadMeasuredDays> = {},
): PayloadMeasuredDays {
	return {
		aggregateVersion: "measured-days/v1",
		utcOffsetMinutes: 120,
		days: [
			{
				date: "2026-08-21",
				usage: {
					harnesses: [
						{
							harness: "claude-code",
							sessions: 3,
							projectKeys: [],
							models: [],
							subagentTokens: 0,
							excludedTokens: { unpriced: 0, synthetic: 0 },
						},
					],
				},
				workflow: {
					date: "2026-08-21",
					harnesses: [
						{
							harness: "claude-code",
							sessions: 142,
							startHours: [{ hourUtc: 21, sessions: 142 }],
							phase: {
								ruleVersion: "phase-rules/v1",
								sessions: 142,
								phaseSec: {
									scout: 640,
									build: 180,
									verify: 60,
									handoff: 50,
									unknown: 70,
								},
								phaseEvents: {
									scout: 64,
									build: 18,
									verify: 6,
									handoff: 5,
									unknown: 7,
								},
								waitingSec: 120,
								idleSec: 300,
								sessionsWithVerify: 40,
								sessionsWithHandoff: 60,
								bucketRuleVersion: "log-buckets/v1",
								lengths: [],
							},
							activity: [{ weekdayUtc: 5, hourUtc: 23, events: 17 }],
						},
					],
					git: {
						testFileRuleVersion: "test-files/v2",
						commitSetRuleVersion: "commit-set/v1",
						fileTypeRuleVersion: "file-types/v2",
						commits: 214,
						lateNightCommits: 30,
						additions: 9_000,
						removals: 3_400,
						changedLinesPerCommit: [40, 12],
						testFileCommits: 5,
						changedLinesByExtension: [{ extension: ".ts", changedLines: 500 }],
						withheldExtensionLines: 20,
						weekdayHourCells: [{ weekdayUtc: 5, hourUtc: 23, commits: 3 }],
					},
					parallelProjects: 2,
				},
			},
		],
		...over,
	};
}

function ctx(over: {
	payload?: Partial<MeasuredPayload>;
	withKeptPrivateHalf?: boolean;
	keptPrivate?: Record<NameCategory, KeptPrivateAtom[]>;
	config?: Partial<SyncConfig>;
	source?: "fetched" | "bundled";
	measuredDays?: PayloadMeasuredDays;
	days?: DaySelection;
	cliVersion?: string;
}): GateContext {
	const p = payload(over.payload);
	const base: SyncBody = over.withKeptPrivateHalf
		? { payloads: [p], keptPrivate: over.keptPrivate ?? NO_KEPT_PRIVATE }
		: { payloads: [p] };
	const body: SyncBody = {
		...base,
		...(over.measuredDays ? { measuredDays: over.measuredDays } : {}),
		...(over.cliVersion ? { cliVersion: over.cliVersion } : {}),
	};
	return {
		body,
		...(over.days ? { days: over.days } : {}),
		keptPrivate: over.keptPrivate ?? NO_KEPT_PRIVATE,
		config: {
			allowlist: {
				mcpServers: [],
				skills: [],
				subagents: [],
				slashCommands: [],
			},
			publishCost: true,
			publishWorkflow: true,
			autoSync: null,
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

	test("the received stamp drops the milliseconds and the T/Z machine form (#130)", () => {
		expect(fmtReceivedAt(Date.UTC(2026, 7, 10, 21, 3, 44, 123))).toBe(
			"2026-08-10 21:03 UTC",
		);
	});
});

describe("totalUSD - never a dollar without its pricing table (#46)", () => {
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

describe("beat two - the dialog (binding copy, #48)", () => {
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

	test("stays two lines - a long dialog is an unanswerable gate (#35 1H)", () => {
		const dialog = buildGateDialog(ctx({ withKeptPrivateHalf: true }));
		expect(dialog.split("\n").length).toBeLessThanOrEqual(2);
	});
});

describe("beat one - the summary", () => {
	test("counts active days from the dates in the payload", () => {
		// The totals ride on the harness header line since #217.
		expect(buildGateSummary(ctx({}))).toContain(
			"382 sessions · 3 active days · 4.27B tokens",
		);
	});

	test("the searched line names every harness this build looks for (#130)", () => {
		const summary = buildGateSummary(ctx({}));
		const lines = summary.split("\n");
		const toIdx = lines.findIndex((l) => l.startsWith("to        "));
		expect(lines[toIdx + 1]).toBe("searched  claude code, codex, opencode, pi");
	});

	test("the harness header prints even for a single harness (#130)", () => {
		// A `searched` line naming four harnesses followed by one unlabeled block
		// is unreadable, so the header is unconditional - an intentional output
		// change for every single-harness user.
		expect(buildGateSummary(ctx({}))).toContain("- Claude Code 2.1.220");
	});

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
		// 67 from inventory.withheld even though the local list has 4 names -
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
			"coverage  3 files unreadable · 12 lines failed · this reading is a floor",
		);
	});

	test("local scan notes name unreadable files and foreign rollouts (#75)", () => {
		const stats = emptyScanStats();
		stats.filesUnreadable = 1;
		stats.unreadableFiles.push({
			path: "2026/07/28/rollout-x.jsonl",
			reason: "ENOENT",
		});
		stats.filesForeign = 3;
		stats.foreignOriginators.set("codexmate", 2);
		stats.foreignOriginators.set("(none)", 1);
		const lines = scanNoteLines(stats, "Codex");
		expect(lines).toContain("          2026/07/28/rollout-x.jsonl (ENOENT)");
		expect(lines).toContain(
			"skipped   3 files not written by Codex (originators: codexmate ×2, (none))",
		);
	});

	test("scan notes render inside the harness block when stats ride in the context", () => {
		const stats = emptyScanStats();
		stats.filesForeign = 1;
		stats.foreignOriginators.set("impostor", 1);
		const summary = buildGateSummary({
			...ctx({}),
			scanStats: { "claude-code": stats },
		});
		expect(summary).toContain(
			"skipped   1 file not written by Claude Code (originators: impostor)",
		);
	});

	test("scan notes report .zst rollouts an old runtime cannot read", () => {
		const stats = emptyScanStats();
		stats.filesZstdUnsupported = 2;
		expect(scanNoteLines(stats, "Codex")).toContain(
			"          2 compressed rollouts need Node 22.15 or newer",
		);
	});

	test("a bundled fallback names itself and the publishing-less consequence", () => {
		const summary = buildGateSummary(
			ctx({ source: "bundled", config: { stack: null } }),
		);
		expect(summary).toContain("using the bundled list");
		expect(summary).toContain("publishes less");
		expect(summary).toContain("no linked stack; publish is unavailable");
	});

	test("a dollar figure never renders without its pricing table, per model either", () => {
		const summary = buildGateSummary(ctx({ payload: { pricingTable: null } }));
		expect(summary).not.toContain("≈$");
	});
});

describe("the workflow section at the gate (#213, #307)", () => {
	test("names the section, its rule versions, and the switch", () => {
		// The staged bytes ARE what a publish sends, so every field in them gets
		// a line here. A default-on opt-out that the preview never mentions is
		// not an opt-out.
		const out = buildGateSummary(ctx({ measuredDays: measuredDays() }));
		expect(out).toContain("workflow  1 harness · 142 sessions");
		expect(out).toContain("workflow-aggregates/v2");
		expect(out).toContain("phase-rules/v1");
		expect(out).toContain("          1 day · 2026-08-21 to 2026-08-21");
		expect(out).toContain("git       214 commits · 12.4k lines changed");
		// It NAMES the switch without directing the owner to a control that does
		// not exist yet - #215 builds the owner controls.
		expect(out).toContain("Publish workflow is on for aistack.to");
	});

	test("prints the phase mix the section would publish", () => {
		const out = buildGateSummary(ctx({ measuredDays: measuredDays() }));
		expect(out).toContain("scout 64.0%");
		expect(out).toContain("unknown 7.0%");
	});

	test("says so plainly when the section is not published", () => {
		// Mirrors `cost not published`: a section the owner declined is a fact
		// about this send, not an absence the preview can leave out.
		const out = buildGateSummary(
			ctx({ measuredDays: measuredDays(), config: { publishWorkflow: false } }),
		);
		expect(out).toContain("workflow  not published");
		expect(buildGateSummary(ctx({}))).toContain("workflow  not published");
	});

	test("says when the switch is on but no changed day carries a block", () => {
		const days = measuredDays();
		const out = buildGateSummary(
			ctx({
				measuredDays: {
					...days,
					days: days.days.map(({ workflow: _w, ...d }) => d),
				},
			}),
		);
		expect(out).toContain("workflow  on, no changed day to publish");
	});

	test("names the publishing CLI, because it is in the bytes", () => {
		const out = buildGateSummary(ctx({ cliVersion: "0.8.0" }));
		expect(out).toContain("· aistack 0.8.0");
	});

	test("keeps beat two short - the workflow section adds no line", () => {
		// `Accept` falls below the fold if the dialog grows (#35, 1H).
		const dialog = buildGateDialog(ctx({ measuredDays: measuredDays() }));
		expect(dialog.split("\n").length).toBeLessThanOrEqual(2);
		expect(dialog).not.toContain("workflow");
	});
});

describe("the day counts at the gate (#307)", () => {
	test("states the counts plainly against a manifest", () => {
		const days = measuredDays();
		const out = buildGateSummary(
			ctx({
				measuredDays: days,
				days: { send: days.days, unchanged: 369, skipped: [], mode: "diff" },
			}),
		);
		expect(out).toContain("days      1 day to publish, 369 unchanged");
		expect(out).toContain(
			"2026-08-21 to 2026-08-21 · 1 with usage · measured-days/v1",
		);
	});

	test("a fresh machine or an old server sends the whole window", () => {
		const days = measuredDays();
		const out = buildGateSummary(
			ctx({
				measuredDays: days,
				days: { send: days.days, unchanged: 0, skipped: [], mode: "full" },
			}),
		);
		expect(out).toContain("days      1 day to publish\n");
		expect(out).not.toContain("unchanged");
	});

	test("prints no day line when the body carries no days", () => {
		expect(buildGateSummary(ctx({}))).not.toContain("days      ");
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

/**
 * The preview a person actually reads (#217).
 *
 * The first real end-to-end sync produced ninety lines, with headings over
 * empty sections and inventory rows several hundred characters wide that the
 * terminal broke mid-name. These hold the shape that replaced it. The rule the
 * fix had to keep: EVERY PUBLISHED NAME STAYS ON SCREEN. This is the consent
 * surface, so nothing that goes up may be summarized away.
 */
describe("the preview stays readable", () => {
	const MANY_TOOLS = [
		"Bash",
		"Edit",
		"Read",
		"Write",
		"WebFetch",
		"TaskUpdate",
		"Agent",
		"Skill",
		"ToolSearch",
		"TaskCreate",
		"SendUserFile",
		"WebSearch",
		"Monitor",
		"TaskStop",
		"Artifact",
		"TaskOutput",
		"EnterWorktree",
	];

	function withTools() {
		return ctx({
			payload: {
				inventory: {
					builtinTools: MANY_TOOLS.map((name) => ({
						name,
						callShare: 0.01,
						calls: 10,
					})),
					mcpServers: [],
					skills: [{ name: "grilling", callShare: 0.1, calls: 12 }],
					subagents: [],
					slashCommands: [],
					withheld: {
						builtinTools: 0,
						mcpServers: 0,
						skills: 0,
						subagents: 0,
						slashCommands: 0,
					},
					calls: {
						builtinTools: 1000,
						mcpServers: 0,
						skills: 120,
						subagents: 0,
						slashCommands: 0,
					},
				},
			},
		});
	}

	test("no line runs past the terminal", () => {
		const summary = buildGateSummary({ ...withTools(), width: 80 });
		for (const line of summary.split("\n")) {
			expect(line.length).toBeLessThanOrEqual(80);
		}
	});

	test("every published name is still printed, wrapped not truncated", () => {
		const summary = buildGateSummary({ ...withTools(), width: 80 });
		for (const name of MANY_TOOLS) {
			expect(summary).toContain(name);
		}
		expect(summary).not.toMatch(/tools.*more\b/);
	});

	test("counts the inventory before listing it", () => {
		const summary = buildGateSummary({ ...withTools(), width: 80 });
		expect(summary).toContain("publishes 17 tools · 1 skills");
	});

	test("a harness that publishes no names says so, once", () => {
		const summary = buildGateSummary(
			ctx({
				payload: {
					inventory: {
						builtinTools: [],
						mcpServers: [],
						skills: [],
						subagents: [],
						slashCommands: [],
						withheld: {
							builtinTools: 0,
							mcpServers: 0,
							skills: 0,
							subagents: 0,
							slashCommands: 0,
						},
						calls: {
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
		expect(summary).toContain("publishes no names from this harness");
		// The empty headings that used to stand over nothing.
		expect(summary).not.toContain("what publishes");
	});

	test("a harness with no models prints no models rows at all", () => {
		const summary = buildGateSummary(ctx({ payload: { models: [] } }));
		expect(summary.split("\n").filter((l) => l.startsWith("models"))).toEqual(
			[],
		);
	});

	test("the model table hangs off the label column", () => {
		const summary = buildGateSummary(ctx({}));
		const lines = summary.split("\n");
		const first = lines.findIndex((l) => l.startsWith("models"));
		expect(first).toBeGreaterThan(-1);
		// The second model sits under the first, not under a heading.
		expect(lines[first + 1]).toMatch(/^ {10}claude-opus-5/);
	});

	test("a wrapped row lines up under its own first name", () => {
		// `commands` is the longest label and used to run straight into the first
		// name, and the continuation sat two columns off from the row above it.
		const summary = buildGateSummary({ ...withTools(), width: 80 });
		const lines = summary.split("\n");
		const head = lines.findIndex((l) => l.startsWith("  tools "));
		expect(head).toBeGreaterThan(-1);
		const firstName = (lines[head] as string).indexOf("Bash");
		const continued = lines[head + 1] as string;
		expect(continued.search(/\S/)).toBe(firstName);
	});

	test("one harness costs a handful of lines, not a screen", () => {
		// The first real sync printed ninety. The inventory names are the floor
		// here, and they stay: everything else is what got cut.
		const block = buildGateSummary({ ...withTools(), width: 100 })
			.split("\n\n")
			.find((b) => b.startsWith("- Claude Code"));
		expect(block?.split("\n").length).toBeLessThanOrEqual(8);
	});

	test("a harness that measured nothing is one line", () => {
		const summary = buildGateSummary(
			ctx({
				payload: {
					activity: {
						sessions: 1,
						activeDayDates: ["2026-07-01"],
						projectKeys: [],
						totalTokens: 0,
						cacheHitShare: 0,
						subagentShare: 0,
					},
				},
			}),
		);
		const block = summary
			.split("\n\n")
			.find((b) => b.startsWith("- Claude Code"));
		expect(block?.split("\n")).toHaveLength(1);
		// Nothing to price, so no cost line either.
		expect(block).not.toContain("cost");
	});

	test("rolls up a model under one percent, keeping its dollars", () => {
		// A four-model table where two carry 99.9% of the tokens hides its own
		// headline. The rolled row keeps the dollars because every model in it
		// published one.
		const summary = buildGateSummary(
			ctx({
				payload: {
					models: [
						{
							id: "claude-opus-5",
							tokenShare: 0.99,
							tokens: { input: 1, output: 2, cacheWrite: 3, cacheRead: 4 },
							apiEquivalentUSD: 100,
						},
						{
							id: "claude-haiku-4-5",
							tokenShare: 0.008,
							tokens: { input: 1, output: 2, cacheWrite: 3, cacheRead: 4 },
							apiEquivalentUSD: 1,
						},
						{
							id: "claude-sonnet-5",
							tokenShare: 0.002,
							tokens: { input: 1, output: 2, cacheWrite: 3, cacheRead: 4 },
							apiEquivalentUSD: 1,
						},
					],
				},
			}),
		);
		expect(summary).toContain("+2 more");
		expect(summary).toContain("claude-opus-5");
		expect(summary).not.toContain("claude-haiku-4-5");
	});

	test("the window is the sync's, printed once", () => {
		const summary = buildGateSummary(ctx({}));
		expect(summary.split("window").length - 1).toBe(1);
	});

	test("wraps to a wider terminal when it has one", () => {
		const narrow = buildGateSummary({ ...withTools(), width: 60 });
		const wide = buildGateSummary({ ...withTools(), width: 110 });
		expect(wide.split("\n").length).toBeLessThan(narrow.split("\n").length);
	});
});
