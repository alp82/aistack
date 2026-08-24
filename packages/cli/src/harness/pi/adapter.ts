// The pi coding agent behind the harness seam (#66 decision 6) - wayfinder
// ticket #126 (map #121). The payload discriminator is the catalog slug,
// `pi-mono` (the repo is earendil-works/pi-mono; the binary is `pi`).

import { hasRecentFile } from "../shared/recency.js";
import type {
	HarnessAdapter,
	HarnessDetectOptions,
	HarnessScan,
	HarnessScanOptions,
} from "../types.js";
import { createAggregate } from "./analyzer.js";
import { isSessionFile, scan, sessionRoots } from "./scan.js";

export const PI_HARNESS_NAME = "pi-mono";

/**
 * pi's vendor-assigned tool surface - seven names, published in the vendor's
 * own docs (usage.md §tools). Same fail-closed mechanism as the other
 * adapters: a literal set, never a pattern. Everything outside it comes from
 * a user extension and publishes only as a per-category count. pi has no MCP,
 * no subagents and no skill tool by explicit vendor design, so those
 * categories stay absent rather than zero (#40).
 */
export const PI_BUILTIN_TOOLS: ReadonlySet<string> = new Set([
	"read",
	"bash",
	"edit",
	"write",
	"grep",
	"find",
	"ls",
]);

export const piAdapter: HarnessAdapter = {
	name: PI_HARNESS_NAME,
	builtinTools: PI_BUILTIN_TOOLS,

	async detect(opts: HarnessDetectOptions): Promise<boolean> {
		return hasRecentFile(
			opts.roots ?? sessionRoots(),
			isSessionFile,
			opts.sinceMs,
		);
	},

	async scan(opts: HarnessScanOptions): Promise<HarnessScan> {
		const aggregate = createAggregate();
		const stats = await scan(aggregate, {
			sinceMs: opts.sinceMs,
			...(opts.onProgress ? { onProgress: opts.onProgress } : {}),
		});
		return { aggregate, stats, workflow: aggregate.workflow.finish() };
	},
};
