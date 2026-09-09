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
});
