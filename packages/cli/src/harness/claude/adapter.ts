// The Claude Code harness behind the seam (#67). The parsing lives in
// analyzer.ts/scan.ts, unchanged from the single-harness era; this file only
// gives it the adapter shape.

import { BUILTIN_TOOLS } from "../shared/allowlist.js";
import { PRICING_TABLE_VERSION } from "../shared/pricing.js";
import { hasRecentFile } from "../shared/recency.js";
import type {
	HarnessAdapter,
	HarnessDetectOptions,
	HarnessScan,
	HarnessScanOptions,
} from "../types.js";
import { createAggregate } from "./analyzer.js";
import { isTranscriptFile, scan, transcriptRoots } from "./scan.js";

export const CLAUDE_HARNESS_NAME = "claude-code";

export const claudeAdapter: HarnessAdapter = {
	name: CLAUDE_HARNESS_NAME,
	builtinTools: BUILTIN_TOOLS,
	pricingTableVersion: PRICING_TABLE_VERSION,

	async detect(opts: HarnessDetectOptions): Promise<boolean> {
		return hasRecentFile(
			opts.roots ?? transcriptRoots(),
			isTranscriptFile,
			opts.sinceMs,
		);
	},

	async scan(opts: HarnessScanOptions): Promise<HarnessScan> {
		const aggregate = createAggregate();
		const stats = await scan(aggregate, {
			sinceMs: opts.sinceMs,
			...(opts.onProgress ? { onProgress: opts.onProgress } : {}),
		});
		return { aggregate, stats };
	},
};
