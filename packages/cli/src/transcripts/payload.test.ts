import { describe, expect, it } from "vitest";
import { BUNDLED_SYNC_CONFIG, type SyncConfig } from "./allowlist.js";
import { createAggregate, ingestRecord } from "./analyzer.js";
import { assistant, slashCommand, toolUse } from "./fixtures.js";
import {
	buildPayload,
	type MeasuredPayload,
	sanitizeModelId,
} from "./payload.js";
import { PRICING_TABLE_VERSION } from "./pricing.js";
import type { ScanStats } from "./scan.js";

const NOW = Date.UTC(2026, 6, 25, 12, 0, 0); // 2026-07-25

const CLEAN_STATS: ScanStats = {
	filesFound: 12,
	filesRead: 10,
	filesSkippedByMtime: 2,
	filesSkippedAsDuplicate: 0,
	filesUnreadable: 0,
};

const config = (over: Partial<SyncConfig> = {}): SyncConfig => ({
	publishCost: true,
	allowlist: {
		mcpServers: ["github"],
		skills: ["grilling"],
		subagents: ["Explore"],
		slashCommands: ["clear"],
	},
	...over,
});

function build(
	records: unknown[],
	opts: {
		syncConfig?: SyncConfig;
		stats?: ScanStats;
		windowDays?: number;
	} = {},
): MeasuredPayload {
	const agg = createAggregate();
	for (const r of records)
		ingestRecord(agg, r, { projectDir: "-home-u-secret-client" });
	return buildPayload({
		aggregate: agg,
		stats: opts.stats ?? CLEAN_STATS,
		syncConfig: opts.syncConfig ?? config(),
		now: NOW,
		windowDays: opts.windowDays ?? 30,
	}).payload;
}

// ---------------------------------------------------------------------------
// The invariant this ticket exists to establish
// ---------------------------------------------------------------------------

describe("fail-closed names: an invented name CANNOT reach the payload", () => {
	// The prototype's equivalent run confirmed it could — `toolCalls` was a
	// catch-all, so anything unclassified fell THROUGH into the payload.
	const hostile = [
		// A plausible-looking but invented built-in tool name.
		assistant({ content: [toolUse("AcmeInternalDeploy")] }),
		// A private MCP server named after a client.
		assistant({ content: [toolUse("mcp__acme-billing-prod__charge")] }),
		// A private Skill named after an unreleased project.
		assistant({
			content: [toolUse("Skill", { skill: "project-glasswing-launch" })],
		}),
		// A subagent named after an internal system.
		assistant({
			content: [toolUse("Agent", { subagent_type: "payroll-migrator" })],
		}),
		// A private slash command.
		slashCommand("deploy-acme-prod"),
		// Names carrying a bidi override and an ANSI introducer.
		assistant({ content: [toolUse("Ba\u202Esh")] }),
		assistant({ content: [toolUse("mcp__git\u001bhub__x")] }),
		// A name long enough to blow a column, and one that is only whitespace.
		assistant({ content: [toolUse("Skill", { skill: "z".repeat(400) })] }),
		assistant({ content: [toolUse("Skill", { skill: "   " })] }),
		// One genuinely allowlisted atom of each class, so the test proves
		// filtering rather than an empty payload.
		assistant({ content: [toolUse("Bash")] }),
		assistant({ content: [toolUse("mcp__github__create_issue")] }),
		assistant({ content: [toolUse("Skill", { skill: "grilling" })] }),
		assistant({ content: [toolUse("Agent", { subagent_type: "Explore" })] }),
		slashCommand("clear"),
	];

	const payload = build(hostile);
	const wire = JSON.stringify(payload);

	it.each([
		"AcmeInternalDeploy",
		"acme-billing-prod",
		"project-glasswing-launch",
		"payroll-migrator",
		"deploy-acme-prod",
		"secret-client",
		"zzzz",
	])("does not leak %s anywhere in the payload", (needle) => {
		expect(wire).not.toContain(needle);
	});

	it("publishes only the allowlisted names, per category", () => {
		// Ordered by call count: Skill fired 4x (one allowed, three withheld
		// skills), Agent 2x, Bash once.
		expect(payload.inventory.builtinTools.map((a) => a.name)).toEqual([
			"Skill",
			"Agent",
			"Bash",
		]);
		expect(payload.inventory.mcpServers.map((a) => a.name)).toEqual(["github"]);
		expect(payload.inventory.skills.map((a) => a.name)).toEqual(["grilling"]);
		expect(payload.inventory.subagents.map((a) => a.name)).toEqual(["Explore"]);
		expect(payload.inventory.slashCommands.map((a) => a.name)).toEqual([
			"clear",
		]);
	});

	it("accounts for every withheld name as a count", () => {
		expect(payload.inventory.withheld).toEqual({
			builtinTools: 2, // AcmeInternalDeploy + the mangled Ba<bidi>sh
			mcpServers: 2, // acme-billing-prod + the mangled git<esc>hub
			skills: 3, // the private one, the overlong one, the blank one
			subagents: 1,
			slashCommands: 1,
		});
	});

	it("carries no control or bidi characters at all", () => {
		expect(wire).not.toMatch(
			// biome-ignore lint/suspicious/noControlCharactersInRegex: asserting their absence is the point
			/[\u0000-\u001f\u007f-\u009f\u202a-\u202e]/,
		);
	});

	it("never publishes a raw invocation count, only shares", () => {
		// Counts are the map's designated post-P0 headroom metric (#33).
		for (const category of Object.values(payload.inventory)) {
			if (!Array.isArray(category)) continue;
			for (const atom of category) {
				expect(Object.keys(atom).sort()).toEqual(["callShare", "name"]);
			}
		}
	});
});

describe("share denominators include withheld atoms", () => {
	it("leaves the allowed shares summing to less than 1 when something is withheld", () => {
		// Renormalizing over the allowed atoms only would make a payload that
		// withheld a 90%-of-calls MCP server look like a complete inventory.
		const payload = build([
			assistant({ content: [toolUse("Skill", { skill: "grilling" })] }),
			...Array.from({ length: 9 }, () =>
				assistant({ content: [toolUse("Skill", { skill: "acme-private" })] }),
			),
		]);
		expect(payload.inventory.skills).toEqual([
			{ name: "grilling", callShare: 0.1 },
		]);
		expect(payload.inventory.withheld.skills).toBe(1);
	});
});

describe("model ids are the exempt class (#33 decision 3)", () => {
	it("publishes an UNKNOWN model verbatim, keeping its tokens", () => {
		// Fail-closing the vendor class would make a new model's tokens silently
		// vanish on release day and understate cost with no visible cause.
		const payload = build([
			assistant({
				model: "claude-unreleased-9",
				usage: { output_tokens: 1_000 },
			}),
		]);
		expect(payload.models.map((m) => m.id)).toEqual(["claude-unreleased-9"]);
		expect(payload.models[0].tokens.output).toBe(1_000);
		expect(payload.activity.totalTokens).toBe(1_000);
	});

	it("omits cost for an unpriced model instead of reporting $0.00", () => {
		const payload = build([
			assistant({
				model: "claude-unreleased-9",
				usage: { output_tokens: 1_000 },
			}),
		]);
		expect(payload.models[0]).not.toHaveProperty("apiEquivalentUSD");
		expect(payload.excludedTokens.unpriced).toBe(1_000);
	});

	it("does not carry catalogSlug — that is resolved server-side at read time", () => {
		const payload = build([assistant({ model: "claude-opus-5" })]);
		expect(payload.models[0]).not.toHaveProperty("catalogSlug");
	});

	it("merges fast mode back onto the vendor id so the catalog can resolve it", () => {
		// `#fast` is OUR suffix; publishing it would yield catalogSlug: null for a
		// model that is in the catalog. Cost stays exact — it accumulated at the
		// fast rate during ingest.
		const payload = build([
			assistant({
				model: "claude-opus-5",
				usage: { output_tokens: 1_000_000, speed: "fast" },
			}),
			assistant({
				model: "claude-opus-5",
				usage: { output_tokens: 1_000_000 },
			}),
		]);
		expect(payload.models).toHaveLength(1);
		expect(payload.models[0].id).toBe("claude-opus-5");
		expect(payload.models[0].tokens.output).toBe(2_000_000);
		expect(payload.models[0].apiEquivalentUSD).toBeCloseTo(75, 2); // $50 fast + $25 standard
	});
});

describe("sanitizeModelId", () => {
	it("keeps a normal vendor id untouched", () => {
		expect(sanitizeModelId("claude-opus-4-8")).toBe("claude-opus-4-8");
	});

	it("collapses disallowed characters and trims the result", () => {
		// Dots are legal in a model id (`claude-3.5`) and this value is never used
		// as a path, so `..` is left alone rather than special-cased.
		expect(sanitizeModelId("claude opus/../5")).toBe("claude-opus-..-5");
		expect(sanitizeModelId("--weird--")).toBe("weird");
	});

	it("bounds length and never returns empty", () => {
		expect(sanitizeModelId("a".repeat(200)).length).toBeLessThanOrEqual(64);
		expect(sanitizeModelId("a".repeat(200))).toMatch(/^a+$/);
		expect(sanitizeModelId("!!!")).toBe("unknown");
	});
});

describe("publishCost is an absence, not a zero (#33 decision 11)", () => {
	const records = [
		assistant({ model: "claude-opus-5", usage: { output_tokens: 1_000_000 } }),
	];

	it("includes cost and names the pricing table when on", () => {
		const payload = build(records, {
			syncConfig: config({ publishCost: true }),
		});
		expect(payload.pricingTable).toBe(PRICING_TABLE_VERSION);
		expect(payload.models[0].apiEquivalentUSD).toBeCloseTo(25, 2);
	});

	it("omits the cost field entirely and nulls the table when off", () => {
		const payload = build(records, {
			syncConfig: config({ publishCost: false }),
		});
		expect(payload.pricingTable).toBeNull();
		expect(payload.models[0]).not.toHaveProperty("apiEquivalentUSD");
		// tokenShare still carries the inventory story.
		expect(payload.models[0].tokenShare).toBe(1);
		expect(JSON.stringify(payload)).not.toContain("apiEquivalentUSD");
	});

	it("defaults to withholding cost when the config could not be fetched", () => {
		const payload = build(records, { syncConfig: BUNDLED_SYNC_CONFIG });
		expect(payload.pricingTable).toBeNull();
		expect(payload.models[0]).not.toHaveProperty("apiEquivalentUSD");
	});
});

describe("coverage block (#33 decision 10)", () => {
	it("reports scan health in the payload, not only the terminal report", () => {
		const agg = createAggregate();
		agg.lines = 1_000;
		agg.parseErrors = 7;
		const { payload } = buildPayload({
			aggregate: agg,
			stats: { ...CLEAN_STATS, filesRead: 42, filesUnreadable: 3 },
			syncConfig: config(),
			now: NOW,
			windowDays: 30,
		});
		expect(payload.coverage).toEqual({
			filesScanned: 42,
			filesUnreadable: 3,
			linesParsed: 993,
			linesFailed: 7,
		});
	});
});

describe("window and activity", () => {
	it("reports a 30-day window inclusive of today", () => {
		const payload = build([]);
		expect(payload.window).toEqual({
			days: 30,
			from: "2026-06-26",
			to: "2026-07-25",
		});
		expect(payload.capturedAt).toBe(NOW);
	});

	it("counts active days only inside the reported window", () => {
		// A clock-skewed, imported, or restored transcript dated in the future
		// would otherwise push activeDays past `days`.
		const payload = build(
			[
				assistant({ timestamp: "2026-07-25T01:00:00.000Z" }),
				assistant({ timestamp: "2026-07-24T01:00:00.000Z" }),
				assistant({ timestamp: "2026-05-01T01:00:00.000Z" }), // before the window
				assistant({ timestamp: "2027-01-01T01:00:00.000Z" }), // impossible future
			],
			{ windowDays: 30 },
		);
		expect(payload.activity.activeDays).toBe(2);
	});

	it("publishes project COUNT only, never a directory name", () => {
		const agg = createAggregate();
		ingestRecord(agg, assistant({}), { projectDir: "-home-u-acme-secret" });
		ingestRecord(agg, assistant({}), { projectDir: "-home-u-other" });
		const { payload } = buildPayload({
			aggregate: agg,
			stats: CLEAN_STATS,
			syncConfig: config(),
			now: NOW,
			windowDays: 30,
		});
		expect(payload.activity.projects).toBe(2);
		expect(JSON.stringify(payload)).not.toContain("acme-secret");
	});

	it("reports the newest observed harness version", () => {
		const payload = build([
			assistant({ version: "2.1.9" }),
			assistant({ version: "2.1.220" }),
		]);
		expect(payload.harness).toEqual({
			name: "claude-code",
			version: "2.1.220",
		});
	});

	it("reports a null harness version rather than inventing one", () => {
		expect(build([assistant({})]).harness.version).toBeNull();
	});
});

describe("empty scan", () => {
	it("produces a well-formed payload with zeroed shares and no NaN", () => {
		const payload = build([]);
		expect(payload.models).toEqual([]);
		expect(payload.activity.totalTokens).toBe(0);
		expect(payload.activity.cacheHitShare).toBe(0);
		expect(payload.activity.subagentShare).toBe(0);
		expect(JSON.stringify(payload)).not.toContain("null,null");
		expect(JSON.stringify(payload)).not.toContain("NaN");
	});
});
