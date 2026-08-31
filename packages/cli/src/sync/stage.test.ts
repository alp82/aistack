// Staging - wayfinder ticket #41 (map #29). The property that matters: the
// staged bodyJson IS the serialized body, the id is derived from it, and a
// stage that cannot name its destination is blocked before any gate.

import {
	activePriceTableIds,
	BUNDLED_PRICE_TABLE_ID,
	setActivePricer,
} from "@aistack/pricing";
import { dayFingerprint } from "@aistack/workflow-rules";
import { describe, expect, test } from "vitest";
import { createAggregate, ingestRecord } from "../harness/claude/analyzer.js";
import { assistant } from "../harness/claude/fixtures.js";
import type {
	LoadedSyncConfig,
	SyncConfig,
} from "../harness/shared/allowlist.js";
import {
	BUILTIN_TOOLS,
	BUNDLED_SYNC_CONFIG,
	EMPTY_OPT_INS,
} from "../harness/shared/allowlist.js";
import type { ScanStats } from "../harness/shared/window.js";
import {
	DEFAULT_WINDOW_DAYS,
	windowStartMs,
} from "../harness/shared/window.js";
import type { HarnessAdapter } from "../harness/types.js";
import { CLI_VERSION } from "../version.js";
import { type StageDeps, stageId, stageSync } from "./stage.js";

const NOW = Date.parse("2026-07-30T12:00:00.000Z");

const FETCHED: SyncConfig = {
	allowlist: { mcpServers: [], skills: [], subagents: [], slashCommands: [] },
	publishCost: true,
	publishWorkflow: true,
	optIns: EMPTY_OPT_INS,
	reviewKeptPrivate: true,
	stack: { name: "Alp's Daily Driver", slug: "alps-daily-driver" },
	autoSync: null,
};

const STATS: ScanStats = {
	filesFound: 1,
	filesRead: 1,
	filesSkippedByMtime: 0,
	filesSkippedAsDuplicate: 0,
	filesUnreadable: 0,
	filesForeign: 0,
	foreignOriginators: new Map(),
	unreadableFiles: [],
	filesZstdUnsupported: 0,
};

function deps(
	over: Partial<StageDeps> & { config?: LoadedSyncConfig },
): StageDeps {
	return {
		baseUrl: "https://aistack.to",
		now: () => NOW,
		getTokenImpl: () => "tok_1",
		getProjectWorkspaceIdImpl: () => "AAAAAAAAAAAAAAAAAAAAAA",
		loadConfigImpl: async () =>
			over.config ?? { config: FETCHED, source: "fetched" },
		adaptersImpl: async () => [FAKE_CLAUDE_ADAPTER],
		fetchManifestImpl: async () => null,
		fetchPricesImpl: async () => null,
		...over,
	};
}

/** A one-record fake Claude adapter, so the stage tests need no filesystem. */
const FAKE_CLAUDE_ADAPTER: HarnessAdapter = {
	name: "claude-code",
	builtinTools: BUILTIN_TOOLS,
	detect: async () => true,
	scan: async () => {
		const aggregate = createAggregate();
		ingestRecord(
			aggregate,
			assistant({ timestamp: "2026-07-20T12:00:00.000Z" }),
			{ projectDir: "-home-u-p" },
		);
		return {
			aggregate,
			stats: STATS,
			workflow: aggregate.workflow.finish(),
			workflowLocal: aggregate.workflowLocal,
		};
	},
};

describe("stageSync", () => {
	test("resolves local project directories to persistent opaque ids", async () => {
		const seen: string[] = [];
		const staged = await stageSync(
			deps({
				getProjectWorkspaceIdImpl: (directory) => {
					seen.push(directory);
					return "BBBBBBBBBBBBBBBBBBBBBB";
				},
			}),
		);
		// Once for the snapshot, once for the day rows (#307); the same id both times.
		expect(new Set(seen)).toEqual(new Set(["-home-u-p"]));
		expect(staged.body.payloads[0].activity.projectKeys).toEqual([
			"BBBBBBBBBBBBBBBBBBBBBB",
		]);
		expect(
			staged.body.measuredDays?.days[0]?.usage?.harnesses[0]?.projectKeys,
		).toEqual(["BBBBBBBBBBBBBBBBBBBBBB"]);
		expect(staged.bodyJson).not.toContain("-home-u-p");
	});

	test("bodyJson is the exact serialization and the id derives from it", async () => {
		const staged = await stageSync(deps({}));
		expect(staged.bodyJson).toBe(JSON.stringify(staged.body));
		expect(staged.id).toBe(stageId(staged.bodyJson));
		expect(staged.blockedReason).toBeNull();
		expect(staged.token).toBe("tok_1");
	});

	test("the switch on puts the kept-private half in the body (#48/#51)", async () => {
		const staged = await stageSync(deps({}));
		expect(staged.body.keptPrivate).toBeDefined();
		const off = await stageSync(
			deps({
				config: {
					config: { ...FETCHED, reviewKeptPrivate: false },
					source: "fetched",
				},
			}),
		);
		expect(off.body.keptPrivate).toBeUndefined();
	});

	// The seed (#102's acceptance, #103's send): the first sync from a machine
	// whose local flag is ON, against a stack with no flag, sets the server
	// flag. The server only seeds an ABSENT field, so the machine sends its own
	// flag on every sync and lets the stack decide whether it means anything.
	test("the machine's own opt-in rides on the body, so a first sync can seed the stack", async () => {
		const staged = await stageSync(
			deps({
				getSettingsImpl: () => ({
					autoSync: { enabled: true, frequencyHours: 12 },
				}),
			}),
		);
		expect(staged.body.autoSync).toEqual({
			enabled: true,
			frequencyHours: 12,
		});
		expect(JSON.parse(staged.bodyJson).autoSync).toEqual({
			enabled: true,
			frequencyHours: 12,
		});
	});

	test("a machine that never opted in sends no flag, and seeds nothing", async () => {
		const staged = await stageSync(deps({ getSettingsImpl: () => ({}) }));
		expect(staged.body.autoSync).toBeUndefined();
	});

	// #102 put `trigger` on the wire; #103 sends it. The stamp rides in the
	// STAGED bytes, so what the gate shows and what the server records agree.
	test("a stage says the sync is manual unless the caller says otherwise", async () => {
		const staged = await stageSync(deps({}));
		expect(staged.body.trigger).toBe("manual");
		expect(JSON.parse(staged.bodyJson).trigger).toBe("manual");
	});

	test("the background run stamps its stage auto", async () => {
		const staged = await stageSync(deps({ trigger: "auto" }));
		expect(staged.body.trigger).toBe("auto");
		expect(JSON.parse(staged.bodyJson).trigger).toBe("auto");
	});

	test("summary and dialog derive from the staged content", async () => {
		const staged = await stageSync(deps({}));
		expect(staged.summary).toContain("Alp's Daily Driver");
		expect(staged.summary).toContain("aistack.to/stacks/alps-daily-driver");
		expect(staged.dialog).toMatch(/^Publish to aistack\? /);
	});

	test("no token blocks with the login instruction", async () => {
		const staged = await stageSync(deps({ getTokenImpl: () => null }));
		expect(staged.blockedReason).toContain("login");
	});

	test("a bundled fallback blocks - the gate cannot name its destination", async () => {
		const staged = await stageSync(
			deps({ config: { config: BUNDLED_SYNC_CONFIG, source: "bundled" } }),
		);
		expect(staged.blockedReason).toContain("destination stack is unknown");
	});

	test("a fetched config without a stack points to the interactive relink flow", async () => {
		const staged = await stageSync(
			deps({
				config: { config: { ...FETCHED, stack: null }, source: "fetched" },
			}),
		);
		expect(staged.blockedReason).toContain(
			"interactive terminal to choose one",
		);
	});

	// #101: detection and the scan read ONE window start, so a harness that
	// counts as detected is exactly a harness with something in the window.
	test("detection gets the same window start the snapshot scan gets", async () => {
		let detectSince: number | null = null;
		const scanSince: number[] = [];
		await stageSync(
			deps({
				adaptersImpl: async (sinceMs) => {
					detectSince = sinceMs;
					return [
						{
							...FAKE_CLAUDE_ADAPTER,
							scan: async (opts) => {
								scanSince.push(opts.sinceMs);
								return FAKE_CLAUDE_ADAPTER.scan(opts);
							},
						},
					];
				},
			}),
		);
		expect(detectSince).toBe(windowStartMs(NOW, DEFAULT_WINDOW_DAYS));
		// The snapshot scan reads the 30-day window; the day scan (#307) reads
		// the whole retention, 400 days when no manifest names one.
		expect(scanSince).toEqual([detectSince, windowStartMs(NOW, 400)]);
	});

	test("the day scan reaches as far as the manifest's retention (#307)", async () => {
		const scanSince: number[] = [];
		await stageSync(
			deps({
				fetchManifestImpl: async () => ({
					retentionDays: 90,
					aggregateVersion: "measured-days/v1",
					days: [],
				}),
				adaptersImpl: async () => [
					{
						...FAKE_CLAUDE_ADAPTER,
						scan: async (opts) => {
							scanSince.push(opts.sinceMs);
							return FAKE_CLAUDE_ADAPTER.scan(opts);
						},
					},
				],
			}),
		);
		expect(scanSince[1]).toBe(windowStartMs(NOW, 90));
	});

	test("no active harness blocks, and the reason names the window", async () => {
		const staged = await stageSync(deps({ adaptersImpl: async () => [] }));
		expect(staged.blockedReason).toContain("No active harness");
		expect(staged.blockedReason).toContain("last 30 days");
	});

	test("stages the measured days in the bytes the gate describes (#213, #307)", async () => {
		const staged = await stageSync(deps({ gitRunnerImpl: () => null }));
		expect(staged.body.measuredDays?.aggregateVersion).toBe("measured-days/v1");
		// The legacy body field is gone: the workflow blocks ride inside the days.
		expect(staged.body.workflow).toBeUndefined();
		const day = staged.body.measuredDays?.days.find(
			(d) => d.date === "2026-07-20",
		);
		expect(day?.usage?.harnesses[0]?.harness).toBe("claude-code");
		expect(day?.usage?.harnesses[0]?.sessions).toBe(1);
		expect(day?.workflow?.date).toBe("2026-07-20");
		expect(staged.bodyJson).toContain('"measuredDays"');
		expect(staged.summary).toContain("workflow  ");
		expect(staged.summary).toContain("days      ");
		expect(staged.days?.mode).toBe("full");
	});

	test("sends only the days the manifest lacks or holds differently (#307)", async () => {
		const full = await stageSync(deps({ gitRunnerImpl: () => null }));
		const held = full.body.measuredDays?.days ?? [];
		expect(held.length).toBeGreaterThan(0);
		const staged = await stageSync(
			deps({
				gitRunnerImpl: () => null,
				fetchManifestImpl: async () => ({
					retentionDays: 400,
					aggregateVersion: "measured-days/v1",
					days: held.map((d) => ({
						date: d.date,
						fingerprint: dayFingerprint(d),
					})),
				}),
			}),
		);
		expect(staged.days?.mode).toBe("diff");
		expect(staged.days?.unchanged).toBe(held.length);
		expect(staged.body.measuredDays?.days).toEqual([]);
		expect(staged.summary).toContain(
			`0 days to publish, ${held.length} unchanged`,
		);
	});

	test("a failing manifest fetch falls back to the whole window (#307)", async () => {
		const staged = await stageSync(
			deps({
				gitRunnerImpl: () => null,
				fetchManifestImpl: async () => {
					throw new Error("network");
				},
			}),
		);
		expect(staged.days?.mode).toBe("full");
		expect(staged.body.measuredDays?.days.length).toBeGreaterThan(0);
	});

	test("publishCost off strips dollars from the days before they are hashed (#307)", async () => {
		const staged = await stageSync(
			deps({
				gitRunnerImpl: () => null,
				config: {
					config: { ...FETCHED, publishCost: false },
					source: "fetched",
				},
			}),
		);
		expect(JSON.stringify(staged.body.measuredDays)).not.toContain('"usd"');
	});

	test("skips the extraction entirely when the switch is off (#213)", async () => {
		// The extraction shells out to `git` per touched repository. Doing that
		// work and discarding it would be the one visible cost of a preference
		// that is supposed to be free.
		let gitCalls = 0;
		const staged = await stageSync(
			deps({
				config: {
					config: { ...FETCHED, publishWorkflow: false },
					source: "fetched",
				},
				gitRunnerImpl: () => {
					gitCalls++;
					return null;
				},
			}),
		);
		expect(gitCalls).toBe(0);
		expect(staged.body.workflow).toBeUndefined();
		for (const day of staged.body.measuredDays?.days ?? []) {
			expect(day.workflow).toBeUndefined();
		}
		expect(staged.body.measuredDays?.days.some((d) => d.usage)).toBe(true);
		expect(staged.summary).toContain("workflow  not published");
	});

	test("stamps the publishing CLI's version on the body (#213)", async () => {
		const staged = await stageSync(deps({ gitRunnerImpl: () => null }));
		expect(staged.body.cliVersion).toBe(CLI_VERSION);
		expect(staged.summary).toContain(`· aistack ${CLI_VERSION}`);
	});

	test("prices against the served table and names it on the gate (#336)", async () => {
		try {
			const staged = await stageSync(
				deps({
					gitRunnerImpl: () => null,
					fetchPricesImpl: async () => ({
						id: "modelPrices/1-deadbeef",
						rows: [
							{
								modelSlug: "claude-opus-5",
								from: 0,
								input: 5,
								output: 25,
								source: "served-src",
							},
						],
					}),
				}),
			);
			expect(staged.prices).toEqual({
				id: "modelPrices/1-deadbeef",
				origin: "served",
			});
			expect(activePriceTableIds()).toEqual([
				"modelPrices/1-deadbeef",
				BUNDLED_PRICE_TABLE_ID,
			]);
			expect(staged.summary).toContain(
				"prices    modelPrices/1-deadbeef from aistack.to",
			);
		} finally {
			setActivePricer(null);
		}
	});

	test("falls back to the bundled table when the fetch fails or the server has none (#336)", async () => {
		const failed = await stageSync(
			deps({
				gitRunnerImpl: () => null,
				fetchPricesImpl: async () => {
					throw new Error("offline");
				},
			}),
		);
		expect(failed.prices).toEqual({
			id: BUNDLED_PRICE_TABLE_ID,
			origin: "bundled",
		});
		expect(activePriceTableIds()).toEqual([BUNDLED_PRICE_TABLE_ID]);
		expect(failed.summary).toContain(
			`prices    ${BUNDLED_PRICE_TABLE_ID} (bundled; the server table was unavailable)`,
		);

		const none = await stageSync(deps({ gitRunnerImpl: () => null }));
		expect(none.prices?.origin).toBe("bundled");
	});
});
