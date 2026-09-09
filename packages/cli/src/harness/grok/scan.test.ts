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
				.map(JSON.stringify)
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
});
