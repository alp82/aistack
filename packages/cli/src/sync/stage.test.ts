// Staging — wayfinder ticket #41 (map #29). The property that matters: the
// staged bodyJson IS the serialized body, the id is derived from it, and a
// stage that cannot name its destination is blocked before any gate.

import { describe, expect, test } from "vitest";
import type { LoadedSyncConfig, SyncConfig } from "../transcripts/allowlist.js";
import {
	BUNDLED_SYNC_CONFIG,
	EMPTY_OPT_INS,
} from "../transcripts/allowlist.js";
import { ingestRecord } from "../transcripts/analyzer.js";
import { assistant } from "../transcripts/fixtures.js";
import type { ScanStats } from "../transcripts/scan.js";
import { type StageDeps, stageId, stageSync } from "./stage.js";

const NOW = Date.parse("2026-07-30T12:00:00.000Z");

const FETCHED: SyncConfig = {
	allowlist: { mcpServers: [], skills: [], subagents: [], slashCommands: [] },
	publishCost: true,
	optIns: EMPTY_OPT_INS,
	reviewKeptPrivate: true,
	stack: { name: "Alp's Daily Driver", slug: "alps-daily-driver" },
};

const STATS: ScanStats = {
	filesFound: 1,
	filesRead: 1,
	filesSkippedByMtime: 0,
	filesSkippedAsDuplicate: 0,
	filesUnreadable: 0,
};

function deps(
	over: Partial<StageDeps> & { config?: LoadedSyncConfig },
): StageDeps {
	return {
		baseUrl: "https://aistack.to",
		now: () => NOW,
		getTokenImpl: () => "tok_1",
		loadConfigImpl: async () =>
			over.config ?? { config: FETCHED, source: "fetched" },
		scanImpl: async (agg) => {
			ingestRecord(agg, assistant({ timestamp: "2026-07-20T12:00:00.000Z" }), {
				projectDir: "-home-u-p",
			});
			return STATS;
		},
		...over,
	};
}

describe("stageSync", () => {
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

	test("a bundled fallback blocks — the gate cannot name its destination", async () => {
		const staged = await stageSync(
			deps({ config: { config: BUNDLED_SYNC_CONFIG, source: "bundled" } }),
		);
		expect(staged.blockedReason).toContain("destination stack is unknown");
	});

	test("a fetched config without a stack blocks with the re-link instruction", async () => {
		const staged = await stageSync(
			deps({
				config: { config: { ...FETCHED, stack: null }, source: "fetched" },
			}),
		);
		expect(staged.blockedReason).toContain("re-link");
	});
});
