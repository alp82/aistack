import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import {
	grokCacheScope,
	loadGrokDateHints,
	mapToHints,
	saveGrokDateHints,
} from "./grokDateCache.js";

test("Grok date hints are server, stack and machine scoped and expire outside retention", async () => {
	const file = path.join(
		await mkdtemp(path.join(tmpdir(), "grok-cache-")),
		"cache.json",
	);
	const a = grokCacheScope("https://a", "stack", "token-a");
	const b = grokCacheScope("https://a", "stack", "token-b");
	saveGrokDateHints(
		a,
		mapToHints(
			new Map([["session", new Set(["2025-01-01", "2026-09-08"])]]),
			"2026-01-01",
		),
		file,
	);
	expect(loadGrokDateHints(a, file)).toEqual({ session: ["2026-09-08"] });
	expect(loadGrokDateHints(b, file)).toEqual({});
});
