import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { createAggregate } from "./analyzer.js";
import { scan } from "./scan.js";

describe("Grok Build scanner", () => {
	test("reads only known workspace/session levels and does not follow directory symlinks", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "grok-scan-"));
		const session = path.join(root, "encoded-workspace", "session-a");
		await mkdir(session, { recursive: true });
		await writeFile(
			path.join(session, "usage.json"),
			JSON.stringify({
				sessionId: "s",
				turns: [
					{
						endedAt: "2026-09-08T00:00:00Z",
						primaryModelId: "unpriced-grok",
						inputTokens: 4,
						outputTokens: 1,
					},
				],
			}),
		);
		await symlink(session, path.join(root, "linked-workspace"));
		const aggregate = createAggregate();
		const result = await scan(aggregate, { roots: [root], sinceMs: 0 });
		expect(result.complete).toBe(true);
		expect(aggregate.byModel.get("unpriced-grok")?.input).toBe(4);
		expect(aggregate.distinctResponses).toBe(1);
		expect(result.sessionDates.get("s")).toEqual(new Set(["2026-09-08"]));
	});

	test("stable malformed lines are skipped without making the scan incomplete", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "grok-scan-"));
		const session = path.join(root, "hash", "session");
		await mkdir(session, { recursive: true });
		await writeFile(path.join(session, "updates.jsonl"), "{bad json}\n");
		const aggregate = createAggregate();
		const result = await scan(aggregate, { roots: [root] });
		expect(result.complete).toBe(true);
		expect(aggregate.parseErrors).toBe(1);
	});

	test("resolves configured xAI aliases and keeps routed aliases unpriced", async () => {
		const home = await mkdtemp(path.join(tmpdir(), "grok-home-"));
		const root = path.join(home, "sessions");
		for (const [workspace, model] of [
			["native", "my-grok"],
			["gateway", "my-gateway"],
		] as const) {
			const session = path.join(root, workspace, "session");
			await mkdir(session, { recursive: true });
			await writeFile(
				path.join(session, "usage.json"),
				JSON.stringify({
					sessionId: workspace,
					turns: [
						{
							endedAt: "2026-09-08T00:00:00Z",
							primaryModelId: model,
							inputTokens: 4,
							outputTokens: 1,
						},
					],
				}),
			);
		}
		await writeFile(
			path.join(home, "config.toml"),
			'\n[model.my-grok]\nmodel = "grok-4.6"\n\n[model.my-gateway]\nmodel = "grok-4.6"\nbase_url = "https://gateway.example/v1"\n',
		);
		const aggregate = createAggregate();
		await scan(aggregate, { roots: [root], sinceMs: 0 });
		expect(aggregate.byModel.get("grok-4.6")?.input).toBe(4);
		expect(aggregate.byModel.get("my-gateway")?.input).toBe(4);
	});

	test("keeps child workflow without double-counting child usage", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "grok-scan-"));
		const child = path.join(root, "workspace", "child");
		await mkdir(child, { recursive: true });
		await writeFile(
			path.join(child, "summary.json"),
			JSON.stringify({
				sessionId: "child",
				parent_session_id: "parent",
				cwd: "/private/project",
			}),
		);
		await writeFile(
			path.join(child, "updates.jsonl"),
			[
				{
					timestamp: 1_767_306_617,
					params: {
						sessionId: "child",
						update: {
							sessionUpdate: "tool_call",
							toolCallId: "call",
							_meta: { "x.ai/tool": { name: "read_file" } },
						},
					},
				},
				{
					timestamp: 1_767_306_618,
					params: {
						sessionId: "child",
						update: {
							sessionUpdate: "turn_completed",
							prompt_id: "prompt",
							usage: {
								modelUsage: { "grok-4": { inputTokens: 10, outputTokens: 2 } },
							},
						},
					},
				},
			]
				.map((value) => JSON.stringify(value))
				.join("\n"),
		);
		await writeFile(
			path.join(child, "events.jsonl"),
			`${JSON.stringify({ type: "tool_completed", tool_call_id: "call", ts: "2026-01-01T00:00:18Z" })}\n`,
		);

		const aggregate = createAggregate();
		await scan(aggregate, { roots: [root], sinceMs: 0 });
		const day = aggregate.workflow.finish().days[0];
		expect(aggregate.distinctResponses).toBe(0);
		expect(day?.delegation?.subagentToolCalls).toBe(1);
		expect(day?.delegation?.mostSubagents).toBe(1);
		expect(JSON.stringify(day)).not.toContain("private");
	});

	test("streams a large updates file through the normal scanner", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "grok-scan-large-"));
		const session = path.join(root, "workspace", "session");
		await mkdir(session, { recursive: true });
		const turns = 25_000;
		const row = JSON.stringify({
			timestamp: 1_767_306_618,
			params: {
				sessionId: "large-session",
				update: {
					sessionUpdate: "turn_completed",
					usage: {
						modelUsage: {
							"grok-4.6": { inputTokens: 10, outputTokens: 2 },
						},
					},
				},
			},
		});
		await writeFile(
			path.join(session, "updates.jsonl"),
			`${row}\n`.repeat(turns),
		);

		const aggregate = createAggregate();
		const result = await scan(aggregate, { roots: [root], sinceMs: 0 });

		expect(result.complete).toBe(true);
		expect(aggregate.distinctResponses).toBe(turns);
		expect(aggregate.byModel.get("grok-4.6")?.input).toBe(turns * 10);
		expect(result.sessionDates.get("large-session")).toEqual(
			new Set(["2026-01-01"]),
		);
	});
});

describe("Grok retained per-call context", () => {
	test("reads individual inference calls, preserves them after log rotation, and leaves usage totals alone", async () => {
		const home = await mkdtemp(path.join(tmpdir(), "grok-context-"));
		const root = path.join(home, "sessions");
		const session = path.join(root, "workspace", "s");
		await mkdir(session, { recursive: true });
		await mkdir(path.join(home, "logs"));
		const ts = new Date().toISOString();
		await writeFile(
			path.join(session, "summary.json"),
			JSON.stringify({ sessionId: "s", cwd: "/private/project" }),
		);
		await writeFile(
			path.join(session, "usage.json"),
			JSON.stringify({
				sessionId: "s",
				turns: [
					{
						endedAt: ts,
						primaryModelId: "grok-4.6-build",
						inputTokens: 120000,
						outputTokens: 100,
					},
				],
			}),
		);
		const log = (tokens: number, loop: number, sid = "s") =>
			JSON.stringify({
				ts,
				src: "shell",
				pid: 42,
				sid,
				msg: "shell.turn.inference_done",
				ctx: {
					loop_index: loop,
					prompt_tokens: tokens,
					cached_prompt_tokens: 10000,
					completion_tokens: 50,
					private_extra: "never retain me",
				},
			});
		await writeFile(
			path.join(home, "logs", "unified.jsonl"),
			[log(40000, 0), log(80000, 1), log(999999, 2, "unknown")].join("\n") +
				"\n",
		);
		const first = createAggregate();
		expect(
			(
				await scan(first, {
					roots: [root],
					contextCacheDir: path.join(home, "cache"),
				})
			).complete,
		).toBe(true);
		const context = first.workflow.finish().days[0]?.context;
		expect(context?.calls.main.reduce((sum, row) => sum + row.calls, 0)).toBe(
			2,
		);
		expect(context?.maxContext).toBe(80000);
		expect(context?.firstCallCount).toBe(0);
		expect(first.byModel.get("grok-4.6-build")?.input).toBe(120000);
		await writeFile(
			path.join(home, "logs", "unified.jsonl"),
			`${log(80000, 1)}\n`,
		);
		const second = createAggregate();
		expect(
			(
				await scan(second, {
					roots: [root],
					contextCacheDir: path.join(home, "cache"),
				})
			).complete,
		).toBe(true);
		expect(second.workflow.finish().days[0]?.context).toEqual(context);
		await writeFile(
			path.join(home, "cache", `${ts.slice(0, 10)}.jsonl`),
			'{"partial":',
		);
		const damaged = await scan(createAggregate(), {
			roots: [root],
			contextCacheDir: path.join(home, "cache"),
		});
		expect(damaged.complete).toBe(false);
		expect(damaged.stats.filesUnreadable).toBeGreaterThan(0);
	});
});
