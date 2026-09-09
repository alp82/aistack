import { hasRecentFile } from "../shared/recency.js";
import type { HarnessAdapter } from "../types.js";
import { createAggregate } from "./analyzer.js";
import { isGrokEvidenceFile, scan, sessionRoots } from "./scan.js";

export const GROK_HARNESS_NAME = "grok-build";
export const GROK_BUILTIN_TOOLS: ReadonlySet<string> = new Set([
	"run_terminal_command",
	"read_file",
	"write_file",
	"search",
	"web_search",
]);

export const grokAdapter: HarnessAdapter = {
	name: GROK_HARNESS_NAME,
	builtinTools: GROK_BUILTIN_TOOLS,
	detect: (opts) =>
		hasRecentFile(
			opts.roots ?? sessionRoots(),
			isGrokEvidenceFile,
			opts.sinceMs,
		),
	async scan(opts) {
		const aggregate = createAggregate();
		const result = await scan(aggregate, opts);
		return {
			aggregate,
			stats: result.stats,
			workflow: aggregate.workflow.finish(),
			workflowLocal: aggregate.workflowLocal,
			scanComplete: result.complete,
			sessionDates: result.sessionDates,
		};
	},
};
