import { SONNET_5_INTRO_ENDS_MS } from "@aistack/pricing";
import { describe, expect, it } from "vitest";
import {
	type Aggregate,
	cleanName,
	createAggregate,
	finalize,
	ingestRecord,
	newestVersion,
	noteRecordBeforeWindow,
	toolResultBytes,
} from "./analyzer.js";
import { assistant, slashCommand, toolUse } from "./fixtures.js";

const ingest = (agg: Aggregate, ...recs: unknown[]) => {
	for (const r of recs) ingestRecord(agg, r, { projectDir: "-home-u-proj" });
};

const row = (agg: Aggregate, modelKey: string) =>
	finalize(agg).models.find((m) => m.modelKey === modelKey);

describe("cumulative-usage dedup", () => {
	it("keeps the LARGEST total, not the first, across a response's records", () => {
		// Claude Code writes one response as several records carrying a cumulative
		// usage snapshot. Keeping the first understates output ~2.1x.
		const agg = createAggregate();
		ingest(
			agg,
			assistant({
				id: "msg_a",
				requestId: "req_a",
				usage: { output_tokens: 100 },
			}),
			assistant({
				id: "msg_a",
				requestId: "req_a",
				usage: { output_tokens: 400 },
			}),
			assistant({
				id: "msg_a",
				requestId: "req_a",
				usage: { output_tokens: 900 },
			}),
		);
		const f = finalize(agg);
		expect(f.models[0].tokens.output).toBe(900);
		expect(f.models[0].messages).toBe(1);
		expect(agg.distinctResponses).toBe(1);
		expect(agg.continuationsFolded).toBe(2);
		expect(agg.supersededByLarger).toBe(2);
	});

	it("is order-independent - a smaller later record does not win", () => {
		const agg = createAggregate();
		ingest(
			agg,
			assistant({
				id: "msg_b",
				requestId: "req_b",
				usage: { output_tokens: 900 },
			}),
			assistant({
				id: "msg_b",
				requestId: "req_b",
				usage: { output_tokens: 100 },
			}),
		);
		expect(finalize(agg).models[0].tokens.output).toBe(900);
	});

	it("counts a same-id/new-requestId record as a replay, not a continuation", () => {
		const agg = createAggregate();
		ingest(
			agg,
			assistant({
				id: "msg_c",
				requestId: "req_1",
				usage: { output_tokens: 50 },
			}),
			assistant({
				id: "msg_c",
				requestId: "req_2",
				usage: { output_tokens: 50 },
			}),
		);
		expect(agg.realReplaysFolded).toBe(1);
		expect(agg.continuationsFolded).toBe(0);
		expect(finalize(agg).models[0].tokens.output).toBe(50);
	});

	it("does not double-count thinking blocks when a replay wins on tokens", () => {
		// A replay that supersedes must not have its content blocks re-counted;
		// thinking/text blocks carry no id to dedup on.
		const agg = createAggregate();
		const content = [{ type: "thinking", thinking: "..." }];
		ingest(
			agg,
			assistant({
				id: "msg_d",
				requestId: "req_1",
				usage: { output_tokens: 10 },
				content,
			}),
			assistant({
				id: "msg_d",
				requestId: "req_2",
				usage: { output_tokens: 99 },
				content,
			}),
			assistant({
				id: "msg_d",
				requestId: "req_2",
				usage: { output_tokens: 99 },
				content,
			}),
		);
		expect(agg.thinkingBlocks).toBe(1);
	});

	it("counts an unkeyed response and records that dedup was unprotected", () => {
		const agg = createAggregate();
		ingest(agg, assistant({ id: null, usage: { output_tokens: 7 } }));
		expect(agg.unkeyedResponses).toBe(1);
		expect(finalize(agg).models[0].tokens.output).toBe(7);
	});
});

describe("iterations[] attribution (#33 decision 9)", () => {
	it("skips a mirror iteration that names the SAME model", () => {
		const agg = createAggregate();
		ingest(
			agg,
			assistant({
				model: "claude-opus-5",
				usage: {
					input_tokens: 2,
					output_tokens: 168,
					cache_read_input_tokens: 66_481,
					iterations: [
						{
							type: "message",
							model: "claude-opus-5",
							input_tokens: 2,
							output_tokens: 168,
							cache_read_input_tokens: 66_481,
						},
					],
				},
			}),
		);
		// Counted once, not twice.
		expect(row(agg, "claude-opus-5")?.tokens.output).toBe(168);
		expect(agg.mirroredIterationTypes.get("message")).toBe(1);
		expect(agg.fallbackAttempts).toBe(0);
	});

	it("attributes a DIFFERENT-model iteration to the model that actually ran it", () => {
		// The real corpus record that forced this rule: top-level usage equals the
		// fallback_message iteration exactly, while a sibling `message` iteration
		// named another model and carried 66,699 tokens recorded nowhere else. The
		// prototype's skip-every-`message` rule dropped them.
		const agg = createAggregate();
		ingest(
			agg,
			assistant({
				model: "claude-opus-5",
				usage: {
					input_tokens: 2,
					output_tokens: 168,
					cache_read_input_tokens: 66_481,
					iterations: [
						{
							type: "message",
							model: "claude-fable-5",
							input_tokens: 2,
							output_tokens: 2,
							cache_read_input_tokens: 64_084,
							cache_creation_input_tokens: 2_613,
						},
						{
							type: "fallback_message",
							model: "claude-opus-5",
							input_tokens: 2,
							output_tokens: 168,
							cache_read_input_tokens: 66_481,
						},
					],
				},
			}),
		);
		const serving = row(agg, "claude-opus-5");
		const firstAttempt = row(agg, "claude-fable-5");
		expect(serving?.tokens.cacheRead).toBe(66_481);
		expect(firstAttempt?.tokens.cacheRead).toBe(64_084);
		expect(firstAttempt?.tokens.cacheWriteUnsplit).toBe(2_613);
		expect(agg.fallbackAttempts).toBe(1);
		// One response is one message even across two models.
		expect(serving?.messages).toBe(1);
		expect(firstAttempt?.messages).toBe(0);
		// Tokens the prototype's skip-every-`message` rule dropped entirely.
		// #33's resolution comment states 66,699; the four fields in its own table
		// sum to 66,701 (2 + 2 + 64,084 + 2,613), so that figure was two tokens
		// light. Immaterial to any conclusion, recorded so the numbers reconcile.
		expect(firstAttempt?.totalTokens).toBe(66_701);
	});

	it("skips a modelless iteration rather than mis-attributing it", () => {
		// The dominant path by a wide margin, and the reason #33's rule cannot be
		// read literally: 63,634 of 63,638 non-advisor iterations in the corpus
		// carry no `model` field, and every one is an exact mirror of top-level
		// usage. Attributing them would double the published tokens and cost.
		const agg = createAggregate();
		ingest(
			agg,
			assistant({
				model: "claude-opus-5",
				usage: {
					output_tokens: 100,
					iterations: [{ type: "message", output_tokens: 100 }],
				},
			}),
		);
		expect(row(agg, "claude-opus-5")?.tokens.output).toBe(100);
		expect(agg.untypedMirrors).toBe(1);
		expect(agg.fallbackAttempts).toBe(0);
	});

	it("prices an advisor iteration under its own model", () => {
		const agg = createAggregate();
		ingest(
			agg,
			assistant({
				model: "claude-sonnet-5",
				usage: {
					output_tokens: 10,
					iterations: [
						{
							type: "advisor_message",
							model: "claude-opus-4-8",
							output_tokens: 500,
						},
					],
				},
			}),
		);
		expect(row(agg, "claude-sonnet-5")?.tokens.output).toBe(10);
		expect(row(agg, "claude-opus-4-8")?.tokens.output).toBe(500);
	});

	it("un-applies a fallback attempt when the response is superseded", () => {
		// The retraction path has to cover the extra entries too, or a folded
		// continuation leaves phantom tokens behind under the first-attempt model.
		const agg = createAggregate();
		const withFallback = (output: number) =>
			assistant({
				id: "msg_f",
				requestId: "req_f",
				model: "claude-opus-5",
				usage: {
					output_tokens: output,
					iterations: [
						{ type: "message", model: "claude-fable-5", output_tokens: output },
					],
				},
			});
		ingest(agg, withFallback(10), withFallback(90));
		expect(row(agg, "claude-opus-5")?.tokens.output).toBe(90);
		expect(row(agg, "claude-fable-5")?.tokens.output).toBe(90);
		expect(agg.fallbackAttempts).toBe(1);
	});
});

describe("cost accumulates at ingest, per record", () => {
	it("prices two responses of one model at DIFFERENT rates across a repricing", () => {
		// finalize() cannot do this: by then the tokens are one summed bucket.
		const agg = createAggregate();
		const oneMTokOut = { output_tokens: 1_000_000 };
		ingest(
			agg,
			assistant({
				model: "claude-sonnet-5",
				timestamp: new Date(SONNET_5_INTRO_ENDS_MS - 86_400_000).toISOString(),
				usage: oneMTokOut,
			}),
			assistant({
				model: "claude-sonnet-5",
				timestamp: new Date(SONNET_5_INTRO_ENDS_MS + 86_400_000).toISOString(),
				usage: oneMTokOut,
			}),
		);
		const f = finalize(agg);
		// $10 at the intro rate + $15 after - not 2 x either rate.
		expect(f.totalCostUSD).toBeCloseTo(25, 6);
		expect(f.models[0].tokens.output).toBe(2_000_000);
	});

	it("surfaces unpriced tokens instead of zeroing them", () => {
		const agg = createAggregate();
		ingest(
			agg,
			assistant({
				model: "claude-unreleased-9",
				usage: { output_tokens: 1_000 },
			}),
			assistant({ model: "claude-opus-5", usage: { output_tokens: 1_000 } }),
		);
		const f = finalize(agg);
		expect(f.unpricedModels).toEqual(["claude-unreleased-9"]);
		expect(f.unpricedTokens).toBe(1_000);
		// The unknown model reports null cost, never $0.00.
		expect(
			f.models.find((m) => m.modelKey === "claude-unreleased-9")?.costUSD,
		).toBeNull();
		expect(f.totalCostUSD).toBeGreaterThan(0);
	});

	it("treats an undated record as unpriced rather than pricing it as today", () => {
		const agg = createAggregate();
		ingest(
			agg,
			assistant({
				model: "claude-opus-5",
				timestamp: "not-a-date",
				usage: { output_tokens: 500 },
			}),
		);
		expect(agg.untimestampedResponses).toBe(1);
		expect(finalize(agg).unpricedTokens).toBe(500);
		expect(finalize(agg).totalCostUSD).toBe(0);
	});

	it("prices fast mode from usage.speed", () => {
		const agg = createAggregate();
		ingest(
			agg,
			assistant({
				model: "claude-opus-5",
				usage: { output_tokens: 1_000_000, speed: "fast" },
			}),
		);
		const f = finalize(agg);
		expect(f.models[0].modelKey).toBe("claude-opus-5#fast");
		expect(f.totalCostUSD).toBeCloseTo(50, 6); // vs $25 standard
	});
});

describe("synthetic and cache accounting", () => {
	it("excludes <synthetic> from inventory but surfaces its tokens", () => {
		const agg = createAggregate();
		ingest(
			agg,
			assistant({ model: "<synthetic>", usage: { output_tokens: 42 } }),
		);
		expect(agg.syntheticRecords).toBe(1);
		expect(agg.syntheticTokens).toBe(42);
		expect(finalize(agg).models).toHaveLength(0);
	});

	it("splits cache writes by TTL and books the residual as unsplit", () => {
		const agg = createAggregate();
		ingest(
			agg,
			assistant({
				usage: {
					cache_creation_input_tokens: 1_000,
					cache_creation: {
						ephemeral_5m_input_tokens: 600,
						ephemeral_1h_input_tokens: 300,
					},
				},
			}),
		);
		const t = finalize(agg).models[0].tokens;
		expect(t.cacheWrite5m).toBe(600);
		expect(t.cacheWrite1h).toBe(300);
		expect(t.cacheWriteUnsplit).toBe(100);
	});

	it("computes cache-hit share over the input token classes only", () => {
		const agg = createAggregate();
		ingest(
			agg,
			assistant({
				usage: {
					input_tokens: 100,
					output_tokens: 9_999_999,
					cache_read_input_tokens: 900,
				},
			}),
		);
		// Output must not dilute the ratio.
		expect(finalize(agg).cacheHitShare).toBeCloseTo(0.9, 6);
	});

	it("reports subagent share from isSidechain", () => {
		const agg = createAggregate();
		ingest(
			agg,
			assistant({ usage: { output_tokens: 250 }, isSidechain: true }),
			assistant({ usage: { output_tokens: 750 } }),
		);
		expect(finalize(agg).sidechainShare).toBeCloseTo(0.25, 6);
	});
});

describe("tool, skill, subagent and slash-command extraction", () => {
	it("dedups tool calls on the globally-unique block id", () => {
		const agg = createAggregate();
		ingest(
			agg,
			assistant({
				id: "m1",
				requestId: "r1",
				content: [toolUse("Bash", {}, "toolu_x")],
			}),
			assistant({
				id: "m2",
				requestId: "r2",
				content: [toolUse("Bash", {}, "toolu_x")],
			}),
		);
		expect(finalize(agg).tools).toEqual([["Bash", 1]]);
	});

	it("skips an id-less tool block rather than collapsing all its calls into one", () => {
		const agg = createAggregate();
		ingest(agg, assistant({ content: [{ type: "tool_use", name: "Bash" }] }));
		expect(agg.toolBlocksWithoutId).toBe(1);
		expect(finalize(agg).tools).toEqual([]);
	});

	it("splits mcp__server__tool into a server and a fully-qualified tool", () => {
		const agg = createAggregate();
		ingest(agg, assistant({ content: [toolUse("mcp__github__create_issue")] }));
		const f = finalize(agg);
		expect(f.mcpServers).toEqual([["github", 1]]);
		expect(f.tools).toEqual([]); // never falls through into built-ins
	});

	it("reads the skill name out of the Skill tool input", () => {
		const agg = createAggregate();
		ingest(
			agg,
			assistant({ content: [toolUse("Skill", { skill: "grilling" })] }),
		);
		const f = finalize(agg);
		expect(f.skills).toEqual([["grilling", 1]]);
		expect(f.tools).toEqual([["Skill", 1]]);
	});

	it("folds the pre-rename Task spelling into Agent and reads subagent_type", () => {
		const agg = createAggregate();
		ingest(
			agg,
			assistant({ content: [toolUse("Task", { subagent_type: "Explore" })] }),
			assistant({ content: [toolUse("Agent", { subagent_type: "Explore" })] }),
		);
		const f = finalize(agg);
		expect(f.tools).toEqual([["Agent", 2]]);
		expect(f.subagents).toEqual([["Explore", 2]]);
	});

	it("defaults a subagent with no type to (default)", () => {
		const agg = createAggregate();
		ingest(agg, assistant({ content: [toolUse("Agent", {})] }));
		expect(finalize(agg).subagents).toEqual([["(default)", 1]]);
	});

	it("extracts slash commands from user turns", () => {
		const agg = createAggregate();
		ingest(
			agg,
			slashCommand("clear"),
			slashCommand("clear"),
			slashCommand("model"),
		);
		expect(finalize(agg).slashCommands).toEqual([
			["clear", 2],
			["model", 1],
		]);
	});
});

describe("cleanName", () => {
	it("neutralizes a bidi override that would reorder the rendered line", () => {
		// CVE-2021-42574. JSON.stringify escapes C0 but not U+202E.
		const cleaned = cleanName("safe\u202Ename");
		expect(cleaned).not.toContain("\u202E");
		expect(cleaned).toBe("safe\uFFFDname");
	});

	it("strips ANSI escape introducers that could rewrite printed totals", () => {
		expect(cleanName("\u001b[2Ktool")).toBe("\uFFFD[2Ktool");
	});

	it("caps length and never returns empty", () => {
		expect(cleanName("x".repeat(200))).toHaveLength(64);
		expect(cleanName("   ")).toBe("(unnamed)");
	});

	it("sanitizes names on the way in, so finalize output is safe by construction", () => {
		const agg = createAggregate();
		ingest(agg, assistant({ content: [toolUse("Ba\u202Esh")] }));
		expect(finalize(agg).tools[0][0]).not.toContain("\u202E");
	});
});

describe("newestVersion", () => {
	it("compares segments numerically, not lexically", () => {
		expect(newestVersion(["2.1.9", "2.1.220", "2.1.100"])).toBe("2.1.220");
	});

	it("ignores unparseable versions and returns null when none are usable", () => {
		expect(newestVersion(["nightly"])).toBeNull();
		expect(newestVersion([])).toBeNull();
	});
});

describe("privacy invariants of the aggregate", () => {
	it("uses the raw cwd as the local project workspace when available", () => {
		const agg = createAggregate();
		ingestRecord(agg, assistant({ cwd: "/work/acme" }), {
			projectDir: "-work-acme",
		});
		expect([...agg.projectDirs]).toEqual(["/work/acme"]);
	});

	it("counts project directories without exposing their names in finalize output", () => {
		const agg = createAggregate();
		ingestRecord(agg, assistant({}), {
			projectDir: "-home-alice-secret-client",
		});
		ingestRecord(agg, assistant({}), { projectDir: "-home-alice-other" });
		const f = finalize(agg);
		expect(f.projects).toBe(2);
		expect(JSON.stringify(f)).not.toContain("secret-client");
	});
});

describe("per-call context (#358)", () => {
	const usage = (input: number, cacheWrite: number, cacheRead: number) => ({
		input_tokens: input,
		output_tokens: 10,
		cache_creation_input_tokens: cacheWrite,
		cache_read_input_tokens: cacheRead,
	});
	const calls = (rows: readonly { calls: number }[] | undefined) =>
		(rows ?? []).reduce((sum, row) => sum + row.calls, 0);

	it("keeps each call's context and splits the first call of a session, subagents apart", () => {
		const agg = createAggregate();
		ingest(
			agg,
			// The first call of the main session: a prefix another session had
			// cached, and the per-session part written fresh.
			assistant({
				id: "msg_1",
				requestId: "req_1",
				sessionId: "sess-ctx",
				usage: usage(127, 21_672, 23_216),
			}),
			// A continuation record of the same response carries the same context.
			assistant({
				id: "msg_1",
				requestId: "req_1",
				sessionId: "sess-ctx",
				usage: usage(127, 21_672, 23_216),
			}),
			assistant({
				id: "msg_2",
				sessionId: "sess-ctx",
				usage: usage(127, 8_121, 44_888),
			}),
			// A subagent call: its own session and its own first call, which
			// stays out of the main first-call sums.
			{
				...assistant({
					id: "msg_3",
					sessionId: "sess-ctx",
					isSidechain: true,
					usage: usage(2, 41_185, 0),
				}),
				agentId: "agent-1",
			},
			// The harness's own pseudo-model is not a call.
			assistant({
				id: "msg_4",
				sessionId: "sess-ctx",
				model: "<synthetic>",
				usage: usage(1, 0, 0),
			}),
		);
		const context = agg.workflow.finish().days[0]?.context;
		expect(context).toBeDefined();
		expect(calls(context?.calls.main)).toBe(2);
		expect(calls(context?.calls.subagents)).toBe(1);
		expect(context?.firstCallCount).toBe(1);
		expect(context?.firstCallHarnessTokens).toBe(23_216);
		expect(context?.firstCallInstructionsTokens).toBe(127 + 21_672);
		expect(context?.maxContext).toBe(127 + 8_121 + 44_888);
		expect(context?.compactions).toBe(0);
		expect(context?.window).toBeUndefined();
	});

	it("does not file a call as first when the session already called before the window", () => {
		const agg = createAggregate();
		noteRecordBeforeWindow(
			agg,
			assistant({
				id: "msg_0",
				sessionId: "sess-old",
				usage: usage(2, 40_000, 0),
			}),
		);
		ingest(
			agg,
			assistant({
				id: "msg_1",
				sessionId: "sess-old",
				usage: usage(100, 500, 90_000),
			}),
		);
		const context = agg.workflow.finish().days[0]?.context;
		expect(calls(context?.calls.main)).toBe(1);
		expect(context?.firstCallCount).toBe(0);
	});

	it("counts a compact_boundary on the day it happened", () => {
		const agg = createAggregate();
		ingest(agg, assistant({ id: "msg_1", sessionId: "sess-c" }), {
			type: "system",
			subtype: "compact_boundary",
			timestamp: "2026-07-20T13:00:00.000Z",
			sessionId: "sess-c",
			compactMetadata: { trigger: "auto", preTokens: 180_000 },
		});
		expect(agg.workflow.finish().days[0]?.context?.compactions).toBe(1);
	});
});

describe("token-efficiency atoms (workflow-aggregates/v4, v5)", () => {
	const usage = (input: number, cacheWrite: number, cacheRead: number) => ({
		input_tokens: input,
		output_tokens: 10,
		cache_creation_input_tokens: cacheWrite,
		cache_read_input_tokens: cacheRead,
	});

	it("splits each call's tokens, counts content blocks, and sizes tool results under the tool's name", () => {
		const agg = createAggregate();
		ingest(
			agg,
			assistant({
				id: "msg_1",
				sessionId: "sess-eff",
				timestamp: "2026-07-20T12:00:00.000Z",
				usage: usage(100, 20_000, 0),
				content: [
					{ type: "thinking", thinking: "SECRET reasoning" },
					{ type: "text", text: "hello" },
					toolUse("Read", { file_path: "/secret/a.ts" }, "toolu_read"),
					toolUse("mcp__acme-billing__query", {}, "toolu_mcp"),
				],
			}),
			{
				type: "user",
				timestamp: "2026-07-20T12:00:05.000Z",
				sessionId: "sess-eff",
				message: {
					content: [
						{
							type: "tool_result",
							tool_use_id: "toolu_read",
							content: "x".repeat(50_000),
						},
						{
							type: "tool_result",
							tool_use_id: "toolu_mcp",
							content: [{ type: "text", text: "y".repeat(2_000) }],
						},
					],
				},
			},
			// A call 20 minutes later rewrites the prefix.
			assistant({
				id: "msg_2",
				sessionId: "sess-eff",
				timestamp: "2026-07-20T12:20:05.000Z",
				usage: usage(50, 21_000, 0),
				content: [{ type: "text", text: "done" }],
			}),
		);
		const efficiency = agg.workflow.finish().days[0]?.efficiency;
		expect(efficiency).toBeDefined();
		expect(efficiency?.callsAfterGap).toBe(1);
		expect(efficiency?.cacheWriteAfterGap).toBe(21_000);
		expect(efficiency?.inputAfterGap).toBe(50);
		expect(efficiency?.orphanCacheWrites).toBe(1);
		expect(efficiency?.blocks).toEqual({ thinking: 1, text: 2 });
		expect(
			efficiency?.toolResults.map((t) => [t.tool, t.results, t.bytes]),
		).toEqual([
			["Read", 1, 50_000],
			// A text block counts its text (v5).
			["mcp", 1, 2_000],
		]);
		expect(JSON.stringify(efficiency)).not.toMatch(/acme|SECRET|secret/);
	});

	it("reads the cache TTL from the write split and marks scripted sessions (v5)", () => {
		const agg = createAggregate();
		const oneHour = (write: number, read: number) => ({
			input_tokens: 10,
			output_tokens: 10,
			cache_creation_input_tokens: write,
			cache_read_input_tokens: read,
			cache_creation: {
				ephemeral_5m_input_tokens: 0,
				ephemeral_1h_input_tokens: write,
			},
		});
		ingest(
			agg,
			assistant({
				id: "msg_h1",
				sessionId: "sess-ttl",
				timestamp: "2026-07-20T12:00:00.000Z",
				usage: oneHour(20_000, 0),
			}),
			// 25 minutes later under a one-hour cache, a write with no read:
			// the prefix was invalidated while the cache was warm.
			assistant({
				id: "msg_h2",
				sessionId: "sess-ttl",
				timestamp: "2026-07-20T12:25:00.000Z",
				usage: oneHour(22_000, 0),
			}),
			{
				...assistant({
					id: "msg_p1",
					sessionId: "sess-script",
					timestamp: "2026-07-20T13:00:00.000Z",
					usage: oneHour(15_000, 0),
				}),
				entrypoint: "sdk-cli",
			},
		);
		const efficiency = agg.workflow.finish().days[0]?.efficiency;
		expect(efficiency?.warmOrphanCacheWrites).toBe(1);
		expect(efficiency?.gapBands?.short.calls).toBe(1);
		expect(efficiency?.headlessSessions).toBe(1);
		// sess-ttl has two calls; the scripted one-call session is left out.
		expect(efficiency?.shortSessions).toBe(1);
	});

	it("counts no bytes for an image block in a tool result (v5)", () => {
		expect(
			toolResultBytes([
				{ type: "image", source: { type: "base64", data: "A".repeat(90_000) } },
				{ type: "text", text: "caption" },
			]),
		).toBe(7);
		expect(toolResultBytes("plain")).toBe(5);
		expect(toolResultBytes(null)).toBe(0);
	});
});
