import { PRICING_TABLE_VERSION } from "@aistack/pricing";
import { describe, expect, it } from "vitest";
import {
	cleanName,
	createAggregate,
	ingestRecord,
	isDisplaySafeName,
} from "../claude/analyzer.js";
import { assistant, slashCommand, toolUse } from "../claude/fixtures.js";
import {
	BUILTIN_TOOLS,
	BUNDLED_SYNC_CONFIG,
	EMPTY_OPT_INS,
	type OptInNames,
	type SyncConfig,
} from "./allowlist.js";
import {
	buildPayload,
	buildSyncBody,
	type MeasuredPayload,
	sanitizeModelId,
} from "./payload.js";
import type { ScanStats } from "./window.js";

const NOW = Date.UTC(2026, 6, 25, 12, 0, 0); // 2026-07-25

const CLEAN_STATS: ScanStats = {
	filesFound: 12,
	filesRead: 10,
	filesSkippedByMtime: 2,
	filesSkippedAsDuplicate: 0,
	filesUnreadable: 0,
	filesForeign: 0,
	foreignOriginators: new Map(),
	unreadableFiles: [],
	filesZstdUnsupported: 0,
};

const HARNESS_PARAMS = {
	harnessName: "claude-code",
	builtinTools: BUILTIN_TOOLS,
	pricingTableVersion: PRICING_TABLE_VERSION,
} as const;

const config = (over: Partial<SyncConfig> = {}): SyncConfig => ({
	publishCost: true,
	autoSync: null,
	allowlist: {
		mcpServers: ["github"],
		skills: ["grilling"],
		subagents: ["Explore"],
		slashCommands: ["clear"],
	},
	optIns: EMPTY_OPT_INS,
	reviewKeptPrivate: false,
	stack: null,
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
		...HARNESS_PARAMS,
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

// ---------------------------------------------------------------------------
// Per-stack opt-ins (#42 decision 1, wired in #44)
// ---------------------------------------------------------------------------

describe("a ticked name publishes; the same name unticked does not", () => {
	const records = [
		assistant({
			content: [toolUse("Skill", { skill: "alp-river:crossfire" })],
		}),
		assistant({ content: [toolUse("mcp__acme-billing-prod__charge")] }),
	];

	const ticked = (over: Partial<OptInNames>): SyncConfig =>
		config({ optIns: { ...EMPTY_OPT_INS, ...over } });

	it("keeps the name private with no opt-ins — the state before the gate", () => {
		const payload = build(records);
		expect(payload.inventory.skills).toEqual([]);
		expect(payload.inventory.withheld.skills).toBe(1);
	});

	it("publishes it once the owner has ticked it", () => {
		const payload = build(records, {
			syncConfig: ticked({ skills: ["alp-river:crossfire"] }),
		});
		expect(payload.inventory.skills.map((a) => a.name)).toEqual([
			"alp-river:crossfire",
		]);
		expect(payload.inventory.withheld.skills).toBe(0);
	});

	it("ticks are per class — a skill tick does not free an MCP server", () => {
		const payload = build(records, {
			syncConfig: ticked({ skills: ["acme-billing-prod"] }),
		});
		expect(payload.inventory.mcpServers).toEqual([]);
		expect(payload.inventory.withheld.mcpServers).toBe(1);
	});

	it("reverts to kept-private when the config fetch failed", () => {
		// The bundled fallback carries no opt-ins, so an offline sync publishes
		// strictly less than an online one — never more.
		const payload = build(records, { syncConfig: BUNDLED_SYNC_CONFIG });
		expect(payload.inventory.skills).toEqual([]);
		expect(payload.inventory.mcpServers).toEqual([]);
	});
});

describe("the gate's review list", () => {
	it("returns every kept-private name with its plugin group, outside the payload", () => {
		const agg = createAggregate();
		for (const r of [
			assistant({
				content: [toolUse("Skill", { skill: "alp-river:crossfire" })],
			}),
			assistant({ content: [toolUse("Skill", { skill: "grilling" })] }),
			assistant({ content: [toolUse("mcp__acme-billing-prod__charge")] }),
		])
			ingestRecord(agg, r, { projectDir: "-home-u-secret-client" });

		const built = buildPayload({
			aggregate: agg,
			stats: CLEAN_STATS,
			syncConfig: config(),
			now: NOW,
			windowDays: 30,
			...HARNESS_PARAMS,
		});

		expect(built.keptPrivate.skills).toEqual([
			{ name: "alp-river:crossfire", count: 1, group: "alp-river" },
		]);
		expect(built.keptPrivate.mcpServers.map((a) => a.name)).toEqual([
			"acme-billing-prod",
		]);
		// The names the user has NOT agreed to publish stay on the machine; the
		// payload carries only the count.
		expect(JSON.stringify(built.payload)).not.toContain("alp-river");
		expect(built.payload.inventory.withheld.skills).toBe(1);
	});
});

describe("buildSyncBody — the unsealed half (#48)", () => {
	const built = () => {
		const agg = createAggregate();
		for (const r of [
			assistant({
				content: [toolUse("Skill", { skill: "alp-river:crossfire" })],
			}),
		])
			ingestRecord(agg, r, { projectDir: "-home-u-secret-client" });
		return buildPayload({
			aggregate: agg,
			stats: CLEAN_STATS,
			syncConfig: config(),
			now: NOW,
			windowDays: 30,
			...HARNESS_PARAMS,
		});
	};

	it("sends the payload alone when the switch is off", () => {
		const body = buildSyncBody([built()], config({ reviewKeptPrivate: false }));
		expect(body.keptPrivate).toBeUndefined();
		expect(JSON.stringify(body)).not.toContain("alp-river");
	});

	it("sends the names beside the payload, never inside it, when it is on", () => {
		const body = buildSyncBody([built()], config({ reviewKeptPrivate: true }));
		expect(body.keptPrivate?.skills).toEqual([
			{ name: "alp-river:crossfire", count: 1, group: "alp-river" },
		]);
		// The closed payload validator is the privacy claim (#38/#45). The name
		// rides in the request, outside the object that validator guards.
		expect(JSON.stringify(body.payloads)).not.toContain("alp-river");
	});

	it("keeps the names home when the config could not be fetched", () => {
		// The bundled fallback fails closed on this exactly like publishCost and
		// optIns: losing the network transmits LESS.
		const body = buildSyncBody([built()], BUNDLED_SYNC_CONFIG);
		expect(body.keptPrivate).toBeUndefined();
	});
});

describe("plugin-wrapper normalization end to end (#42 decision 5)", () => {
	it("publishes the curated inner segment, never the plugin's name", () => {
		const payload = build(
			[
				assistant({
					content: [toolUse("mcp__plugin_acme-secret_stripe__pay")],
				}),
			],
			{
				syncConfig: config({
					allowlist: {
						mcpServers: ["stripe"],
						skills: [],
						subagents: [],
						slashCommands: [],
					},
				}),
			},
		);
		expect(payload.inventory.mcpServers.map((a) => a.name)).toEqual(["stripe"]);
		expect(JSON.stringify(payload)).not.toContain("acme-secret");
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

describe("every string in a built payload clears the server's bound (#45)", () => {
	// The server states what a payload string may be and REJECTS a snapshot that
	// breaks the bar rather than rewriting it (convex/lib/names.ts). So this is a
	// liveness test, not a safety one: the safety half lives on the server, and
	// what is asserted here is that our own client can never trip it.
	//
	// The names are ticked, so the hostile strings genuinely reach the payload
	// instead of being withheld — otherwise the assertion would pass vacuously.
	const bidiTool = cleanName("Ba\u202Esh");
	const overlongSkill = cleanName("z".repeat(400));

	const payload = build(
		[
			assistant({ content: [toolUse("Ba\u202Esh")] }),
			assistant({ content: [toolUse("Skill", { skill: "z".repeat(400) })] }),
			assistant({ content: [toolUse("Skill", { skill: "   " })] }),
			assistant({
				model: "claude opus/../5\u0000",
				usage: { output_tokens: 10 },
			}),
			assistant({ model: "a".repeat(200), usage: { output_tokens: 10 } }),
		],
		{
			syncConfig: config({
				optIns: {
					...EMPTY_OPT_INS,
					builtinTools: [bidiTool, "Skill"],
					skills: [overlongSkill, "(unnamed)"],
				},
			}),
		},
	);

	it("carried the hostile names through, so the bound is under real load", () => {
		expect(payload.inventory.builtinTools.map((a) => a.name)).toContain(
			bidiTool,
		);
		expect(payload.inventory.skills.map((a) => a.name)).toContain(
			overlongSkill,
		);
		expect(payload.models.length).toBeGreaterThan(1);
	});

	it("every inventory name is display-safe and within 64 characters", () => {
		for (const category of Object.values(payload.inventory)) {
			if (!Array.isArray(category)) continue;
			for (const atom of category) {
				expect(isDisplaySafeName(atom.name)).toBe(true);
			}
		}
	});

	it("every model id is within the vendor charset the server enforces", () => {
		for (const model of payload.models) {
			expect(model.id).toMatch(/^[A-Za-z0-9._:-]+$/);
			expect(model.id.length).toBeLessThanOrEqual(64);
		}
	});

	it("bounds the strings that are not names either", () => {
		// harness.name and pricingTable land on the same public page from the same
		// payload, so the server holds them to the same bar.
		expect(isDisplaySafeName(payload.harness.name)).toBe(true);
		if (payload.harness.version !== null) {
			expect(isDisplaySafeName(payload.harness.version)).toBe(true);
		}
		if (payload.pricingTable !== null) {
			expect(isDisplaySafeName(payload.pricingTable)).toBe(true);
		}
		expect(payload.window.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(payload.window.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
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
			...HARNESS_PARAMS,
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
			...HARNESS_PARAMS,
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
