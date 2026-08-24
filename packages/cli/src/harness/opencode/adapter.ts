// The opencode harness behind the seam (#66 decision 6) - wayfinder ticket
// #124 (map #121).

import type {
	HarnessAdapter,
	HarnessDetectOptions,
	HarnessScan,
	HarnessScanOptions,
} from "../types.js";
import { createAggregate, OPENCODE_BUILTIN_TOOLS } from "./analyzer.js";
import { detectOpencode, scan } from "./scan.js";

export const OPENCODE_HARNESS_NAME = "opencode";

export { OPENCODE_BUILTIN_TOOLS } from "./analyzer.js";

export const opencodeAdapter: HarnessAdapter = {
	name: OPENCODE_HARNESS_NAME,
	builtinTools: OPENCODE_BUILTIN_TOOLS,

	async detect(opts: HarnessDetectOptions): Promise<boolean> {
		return detectOpencode({
			sinceMs: opts.sinceMs,
			...(opts.roots ? { roots: opts.roots } : {}),
		});
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
