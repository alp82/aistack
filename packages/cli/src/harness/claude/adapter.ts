// The Claude Code harness behind the seam (#67). The parsing lives in
// analyzer.ts/scan.ts, unchanged from the single-harness era; this file only
// gives it the adapter shape.

import { stat } from "node:fs/promises";
import { BUILTIN_TOOLS } from "../shared/allowlist.js";
import { PRICING_TABLE_VERSION } from "@aistack/pricing";
import type {
	HarnessAdapter,
	HarnessScan,
	HarnessScanOptions,
} from "../types.js";
import { createAggregate } from "./analyzer.js";
import { scan, transcriptRoots } from "./scan.js";

export const CLAUDE_HARNESS_NAME = "claude-code";

async function exists(p: string): Promise<boolean> {
	try {
		await stat(p);
		return true;
	} catch {
		return false;
	}
}

export const claudeAdapter: HarnessAdapter = {
	name: CLAUDE_HARNESS_NAME,
	builtinTools: BUILTIN_TOOLS,
	pricingTableVersion: PRICING_TABLE_VERSION,

	async detect(): Promise<boolean> {
		for (const root of transcriptRoots()) {
			if (await exists(root)) return true;
		}
		return false;
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
