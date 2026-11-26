// Staging - wayfinder ticket #41 (map #29). The property that matters: the
// staged bodyJson IS the serialized body, the id is derived from it, and a
// stage that cannot name its destination is blocked before any gate.

import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
	activePriceTableIds,
	BUNDLED_PRICE_TABLE_ID,
	setActivePricer,
} from "@aistack/pricing";
import { dayFingerprint, foldUsageDays } from "@aistack/workflow-rules";
import { describe, expect, test, vi } from "vitest";
import { getProjectWorkspaceId } from "../config.js";
import { createAggregate, ingestRecord } from "../harness/claude/analyzer.js";
import { assistant } from "../harness/claude/fixtures.js";
import { grokAdapter } from "../harness/grok/adapter.js";
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

test("uses an adapter's shared window read without changing staged measurements", async () => {
	const expected = await stageSync(deps({}));
	const scan = vi.fn(FAKE_CLAUDE_ADAPTER.scan);
	const scanWindows = vi.fn(
		async (
			options: Parameters<NonNullable<HarnessAdapter["scanWindows"]>>[0],
		) => Promise.all(options.map((opts) => FAKE_CLAUDE_ADAPTER.scan(opts))),
	);
	const actual = await stageSync(
		deps({
			adaptersImpl: () => [{ ...FAKE_CLAUDE_ADAPTER, scan, scanWindows }],
		}),
	);
	expect(scan).not.toHaveBeenCalled();
	expect(scanWindows).toHaveBeenCalledTimes(1);
	expect(
		scanWindows.mock.calls[0][0].map((opts) => [
			opts.sinceMs,
			opts.publishWorkflow,
		]),
	).toEqual([
		[windowStartMs(NOW, 30), false],
		[windowStartMs(NOW, 400), true],
	]);
	expect(actual.bodyJson).toBe(expected.bodyJson);
});

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
	test("defers unresolved Claude workspace aliases during a partial read, keeping resolved IDs", async () => {
		const aggregate = createAggregate();
		const date = "2026-07-20";
		ingestRecord(aggregate, assistant({ timestamp: `${date}T12:00:00Z` }), {
			projectDir: "claude-project:/synthetic/first/project",
		});
		ingestRecord(aggregate, assistant({ timestamp: `${date}T12:00:00Z` }), {
			projectDir: "/synthetic/resolved",
		});
		const resolve = (directory: string) =>
			directory.startsWith("claude-project:") ? "A".repeat(22) : "B".repeat(22);
		const staged = await stageSync(
			deps({
				adaptersImpl: () => [
					{
						...FAKE_CLAUDE_ADAPTER,
						scan: async () => ({
							aggregate,
							stats: STATS,
							scanComplete: false,
							workflow: aggregate.workflow.finish(),
							workflowLocal: aggregate.workflowLocal,
						}),
					},
				],
				config: {
					config: { ...FETCHED, publishWorkflow: false },
					source: "fetched",
				},
				getSettingsImpl: () => ({}),
				getProjectWorkspaceIdImpl: resolve,
			}),
		);
		expect(staged.body.measuredDays?.partialHarnesses).toEqual(["claude-code"]);
		expect(
			staged.body.measuredDays?.days[0]?.usage?.harnesses[0],
		).toMatchObject({
			projectKeys: ["B".repeat(22)],
			workspaceEvidenceIncomplete: true,
		});
		expect(staged.bodyJson).not.toContain("/synthetic/");
	});
	test("corrects a previously synced flat Claude day with observed records and no workspace or usage", async () => {
		const date = "2026-07-20";
		const aggregate = createAggregate();
		ingestRecord(
			aggregate,
			{ type: "progress", timestamp: `${date}T12:00:00Z` },
			{},
		);
		const heldDay = {
			date,
			usage: {
				harnesses: [
					{
						harness: "claude-code",
						sessions: 0,
						projectKeys: ["A".repeat(22)],
						models: [],
						subagentTokens: 0,
						excludedTokens: { unpriced: 0, synthetic: 0 },
					},
				],
			},
		};
		const staged = await stageSync(
			deps({
				adaptersImpl: () => [
					{
						...FAKE_CLAUDE_ADAPTER,
						scan: async () => ({
							aggregate,
							stats: STATS,
							workflow: aggregate.workflow.finish(),
							workflowLocal: aggregate.workflowLocal,
						}),
					},
				],
				config: {
					config: { ...FETCHED, publishWorkflow: false },
					source: "fetched",
				},
				getSettingsImpl: () => ({}),
				fetchManifestImpl: async () => ({
					retentionDays: 400,
					aggregateVersion: "measured-days/v1",
					days: [{ date, fingerprint: dayFingerprint(heldDay) }],
				}),
			}),
		);
		expect(staged.body.measuredDays?.days).toEqual([
			{
				date,
				usage: {
					harnesses: [{ ...heldDay.usage.harnesses[0], projectKeys: [] }],
				},
			},
		]);
	});
	test.each([
		{ trigger: "manual", dense: false },
		{ trigger: "manual", dense: true },
		{ trigger: "auto", dense: true },
	] as const)(
		"stages 1,001 distinct workspaces in $trigger sync (dense day: $dense)",
		async ({ trigger, dense }) => {
			const aggregate = createAggregate();
			for (let i = 0; i < 1_001; i++) {
				const day = dense || i < 1_000 ? "20" : "21";
				ingestRecord(
					aggregate,
					assistant({
						timestamp: `2026-07-${day}T12:00:00.000Z`,
						sessionId: `synthetic-session-${i}`,
					}),
					{ projectDir: `/synthetic/workspace-${i}` },
				);
			}
			const projectWorkspaceId = (directory: string) =>
				createHash("sha256").update(directory).digest("base64url").slice(0, 22);
			const adapter = {
				...FAKE_CLAUDE_ADAPTER,
				scan: async () => ({
					aggregate,
					stats: STATS,
					workflow: aggregate.workflow.finish(),
					workflowLocal: aggregate.workflowLocal,
				}),
			};
			const input = deps({
				trigger,
				adaptersImpl: () => [adapter],
				getProjectWorkspaceIdImpl: projectWorkspaceId,
				getSettingsImpl: () => ({}),
				config: {
					config: { ...FETCHED, publishWorkflow: false },
					source: "fetched",
				},
			});
			const staged = await stageSync(input);
			expect(staged.blockedReason).toBeNull();
			expect(staged.body.trigger).toBe(trigger);
			expect(staged.body.payloads[0]).toMatchObject({
				schemaVersion: 1,
				activity: {
					projects: 1_001,
					activeDays: dense ? 1 : 2,
					sessions: 1_001,
				},
			});
			expect(staged.bodyJson).not.toContain("/synthetic/");
			expect(staged.bodyJson).not.toContain("synthetic-session-");
			const days = staged.body.measuredDays?.days ?? [];
			const keys = [...aggregate.projectDirs].map(projectWorkspaceId).sort();
			expect(
				foldUsageDays(
					days.flatMap(({ date, usage }) => (usage ? [{ date, usage }] : [])),
				).projectKeys,
			).toEqual(keys);
			if (dense) {
				expect(days[0]?.usage?.harnesses[0]).toMatchObject({
					projectKeys: [],
					projectKeysPacked: keys.join(""),
				});
			} else {
				expect(
					days.map((day) => day.usage?.harnesses[0].projectKeys.length),
				).toEqual([1_000, 1]);
				expect(staged.bodyJson).not.toContain("projectKeysPacked");
			}
			const repeat = await stageSync({
				...input,
				fetchManifestImpl: async () => ({
					retentionDays: 400,
					aggregateVersion: "measured-days/v1",
					days: days.map((day) => ({
						date: day.date,
						fingerprint: dayFingerprint(day),
					})),
				}),
			});
			expect(repeat.body.measuredDays?.days).toEqual([]);
			expect(repeat.days?.unchanged).toBe(days.length);
		},
	);

	test("stages Grok history without turning each session into a project workspace", async () => {
		const home = await mkdtemp(join(tmpdir(), "grok-stage-"));
		const root = join(home, "sessions");
		const cwd = resolve("/synthetic/repo with spaces");
		const workspace = join(root, encodeURIComponent(cwd));
		const projectId = (directory: string) =>
			createHash("sha256")
				.update(directory)
				.digest()
				.subarray(0, 16)
				.toString("base64url");
		try {
			for (let i = 0; i <= 1_000; i++) {
				const sessionId = `session-${i}`;
				const session = join(workspace, sessionId);
				await mkdir(session, { recursive: true });
				await writeFile(
					join(session, "usage.json"),
					JSON.stringify({
						sessionId,
						turns: [
							{
								endedAt: "2026-07-20T12:00:00.000Z",
								primaryModelId: "grok",
								inputTokens: 4,
								outputTokens: 1,
							},
						],
					}),
				);
			}
			vi.stubEnv("GROK_HOME", home);
			const staged = await stageSync(
				deps({
					adaptersImpl: () => [grokAdapter],
					getProjectWorkspaceIdImpl: projectId,
					getSettingsImpl: () => ({}),
					config: {
						config: { ...FETCHED, publishWorkflow: false },
						source: "fetched",
					},
				}),
			);
			expect(staged.body.payloads[0]).toMatchObject({
				schemaVersion: 2,
				activity: { projectKeys: [projectId(cwd)] },
			});
			const usage = staged.body.measuredDays?.days[0]?.usage?.harnesses[0];
			expect(usage?.projectKeys).toEqual([projectId(cwd)]);
			expect(usage?.sessions).toBe(1_001);
			expect(staged.bodyJson).not.toContain(cwd);
			expect(staged.bodyJson).not.toContain("session-0");
		} finally {
			vi.unstubAllEnvs();
			await rm(home, { recursive: true, force: true });
		}
	});

	test("restages a held Grok day with an old session-based id and preserves local ids", async () => {
		const home = await mkdtemp(join(tmpdir(), "grok-stage-manifest-"));
		const cwd = resolve("/synthetic/repo");
		const session = join(
			home,
			"sessions",
			encodeURIComponent(cwd),
			"legacy-session",
		);
		const projectFile = join(home, "projects.json");
		const workspaceId = "AAAAAAAAAAAAAAAAAAAAAA";
		const legacyId = "BBBBBBBBBBBBBBBBBBBBBB";
		const storedProjects = JSON.stringify({
			[cwd]: { workspaceId, excluded: [".env"] },
			[session]: { workspaceId: legacyId },
		});
		try {
			await mkdir(session, { recursive: true });
			await writeFile(projectFile, storedProjects);
			await writeFile(
				join(session, "usage.json"),
				JSON.stringify({
					sessionId: "legacy-session",
					turns: ["2026-07-19", "2026-07-20"].map((date) => ({
						endedAt: `${date}T12:00:00Z`,
						primaryModelId: "grok",
						inputTokens: 4,
						outputTokens: 1,
					})),
				}),
			);
			vi.stubEnv("GROK_HOME", home);
			const input = deps({
				adaptersImpl: () => [grokAdapter],
				getProjectWorkspaceIdImpl: (directory) =>
					getProjectWorkspaceId(directory, { file: projectFile }),
				getSettingsImpl: () => ({}),
				config: {
					config: { ...FETCHED, publishWorkflow: false },
					source: "fetched",
				},
			});
			const full = await stageSync(input);
			const held = structuredClone(full.body.measuredDays?.days ?? []);
			expect(held.map((day) => day.date)).toEqual(["2026-07-19", "2026-07-20"]);
			const oldReading = held[0].usage?.harnesses[0];
			expect(oldReading?.projectKeys).toEqual([workspaceId]);
			if (oldReading) oldReading.projectKeys = [legacyId];
			const corrected = await stageSync({
				...input,
				fetchManifestImpl: async () => ({
					retentionDays: 400,
					aggregateVersion: "measured-days/v1",
					days: held.map((day) => ({
						date: day.date,
						fingerprint: dayFingerprint(day),
					})),
				}),
			});
			expect(corrected.body.measuredDays?.days).toEqual(
				full.body.measuredDays?.days.slice(0, 1),
			);
			expect(corrected.body.measuredDays?.partialHarnesses).toBeUndefined();
			expect(corrected.days?.unchanged).toBe(1);
			expect(await readFile(projectFile, "utf8")).toBe(storedProjects);
		} finally {
			vi.unstubAllEnvs();
			await rm(home, { recursive: true, force: true });
		}
	});

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
		// The stage reuses the resolved ID in the snapshot and the day rows.
		expect(seen).toEqual(["-home-u-p"]);
		expect(staged.body.payloads[0]).toMatchObject({
			schemaVersion: 2,
			activity: { projectKeys: ["BBBBBBBBBBBBBBBBBBBBBB"] },
		});
		expect(
			staged.body.measuredDays?.days[0]?.usage?.harnesses[0]?.projectKeys,
		).toEqual(["BBBBBBBBBBBBBBBBBBBBBB"]);
		expect(staged.bodyJson).not.toContain("-home-u-p");
	});

	// The terminal draws one row per step from these events (#420). Every
	// harness gets a waiting row before any is checked, each network read is
	// its own step, and a harness ends done with its file count.
	test("emits one step per unit of work, in the order the board draws them", async () => {
		const events: string[] = [];
		const staged = await stageSync(
			deps({
				onEvent: (event) => {
					events.push(
						event.kind === "step"
							? `${event.id} ${event.state}`
							: `${event.id} ${event.done}/${event.total ?? "?"}`,
					);
				},
			}),
		);
		expect(staged.blockedReason).toBeNull();
		expect(events.slice(0, 3)).toEqual([
			"prices running",
			"settings running",
			"manifest running",
		]);
		expect(events).toContain("harness:claude-code waiting");
		expect(
			events.filter((e) => e.startsWith("harness:claude-code")).at(-1),
		).toBe("harness:claude-code done");
		expect(events.at(-1)).toBe("review done");
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
		expect(staged.dialog).toMatch(/^Publish to aistack\?(?:\n|$)/);
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
		const detectSince: number[] = [];
		const scanSince: number[] = [];
		await stageSync(
			deps({
				adaptersImpl: () => [
					{
						...FAKE_CLAUDE_ADAPTER,
						detect: async (opts) => {
							detectSince.push(opts.sinceMs);
							return true;
						},
						scan: async (opts) => {
							scanSince.push(opts.sinceMs);
							return FAKE_CLAUDE_ADAPTER.scan(opts);
						},
					},
				],
			}),
		);
		// A harness active in the snapshot window is historical by inclusion,
		// so the second detect is skipped.
		expect(detectSince).toEqual([windowStartMs(NOW, DEFAULT_WINDOW_DAYS)]);
		// The snapshot scan reads the 30-day window; the day scan (#307) reads
		// the whole retention, 400 days when no manifest names one.
		expect(scanSince).toEqual([
			windowStartMs(NOW, DEFAULT_WINDOW_DAYS),
			windowStartMs(NOW, 400),
		]);
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
		expect(staged.blockedReason).toContain("No supported harness transcript");
		expect(staged.blockedReason).toContain("last 400 days");
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

test("Cursor corrections rebuild a former date and partial reads publish observed usage", async () => {
	let complete = true;
	const adapter: HarnessAdapter = {
		...FAKE_CLAUDE_ADAPTER,
		name: "cursor",
		async scan(options) {
			return {
				...(await FAKE_CLAUDE_ADAPTER.scan(options)),
				scanComplete: complete,
				sessionDates: new Map([
					["synthetic-cursor-session", new Set(["2026-07-19", "2026-07-20"])],
				]),
			};
		},
	};
	const input = deps({
		baseUrl: "https://cursor-date-test.invalid",
		adaptersImpl: async () => [adapter],
		config: {
			config: { ...FETCHED, publishWorkflow: false },
			source: "fetched",
		},
	});
	const staged = await stageSync(input);
	expect(staged.body.measuredDays?.days.map((day) => day.date)).toContain(
		"2026-07-19",
	);
	expect(
		staged.body.measuredDays?.days.find((day) => day.date === "2026-07-19")
			?.usage,
	).toBeUndefined();
	complete = false;
	const incomplete = await stageSync(input);
	expect(incomplete.body.measuredDays?.days.map((day) => day.date)).toEqual([
		"2026-07-20",
	]);
	expect(
		incomplete.body.measuredDays?.days[0].usage?.harnesses[0].models.length,
	).toBeGreaterThan(0);
	// Only the harness whose scan was incomplete is named partial.
	expect(incomplete.body.measuredDays?.partial).toBe(true);
	expect(incomplete.body.measuredDays?.partialHarnesses).toEqual(["cursor"]);
	expect(staged.body.measuredDays?.partialHarnesses).toBeUndefined();
	expect(incomplete.summary).toContain(
		"coverage  partial history: publishing the dated evidence available",
	);
	expect(incomplete.summary).toContain(
		"Previously recorded evidence is retained; missing usage is not estimated.",
	);
});
