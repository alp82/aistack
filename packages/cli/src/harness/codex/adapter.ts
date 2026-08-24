// The Codex CLI harness behind the seam (#66 decision 6, built in #67).

import { hasRecentFile } from "../shared/recency.js";
import type {
	HarnessAdapter,
	HarnessDetectOptions,
	HarnessScan,
	HarnessScanOptions,
} from "../types.js";
import { createAggregate } from "./analyzer.js";
import { isRolloutFile, rolloutRoots, scan } from "./scan.js";

export const CODEX_HARNESS_NAME = "codex";

/**
 * Codex's vendor-assigned tool surface, as observed in rollouts and pinned in
 * the Codex source (#65 §4). Same fail-closed mechanism as Claude's
 * BUILTIN_TOOLS: a literal set, never a pattern - an unknown-but-real
 * built-in withheld as a count is a small loss; an unknown-and-user-named
 * tool published verbatim is the leak this prevents. The last four are the
 * stable synthetic names the analyzer assigns to non-`function_call` items.
 *
 * Codex v1 publishes builtinTools and mcpServers ONLY (#66 decision 3):
 * slash commands verifiably never reach rollouts, and the skill/subagent
 * surfaces are unverified - those categories ship as empty arrays, absorbed
 * with no schema change if a later Codex version logs them.
 */
export const CODEX_BUILTIN_TOOLS: ReadonlySet<string> = new Set([
	"apply_patch",
	"exec_command",
	"grep_command",
	"list_dir",
	"read_file",
	"request_user_input",
	"shell",
	"unified_exec",
	"update_plan",
	"view_image",
	"write_stdin",
	// synthetic names for non-function_call response items
	"local_shell",
	"web_search",
	"tool_search",
]);

export const codexAdapter: HarnessAdapter = {
	name: CODEX_HARNESS_NAME,
	builtinTools: CODEX_BUILTIN_TOOLS,

	async detect(opts: HarnessDetectOptions): Promise<boolean> {
		return hasRecentFile(
			opts.roots ?? rolloutRoots(),
			isRolloutFile,
			opts.sinceMs,
		);
	},

	async scan(opts: HarnessScanOptions): Promise<HarnessScan> {
		const aggregate = createAggregate();
		const stats = await scan(aggregate, {
			sinceMs: opts.sinceMs,
			...(opts.onProgress ? { onProgress: opts.onProgress } : {}),
		});
		return {
			aggregate,
			stats,
			workflow: aggregate.workflow.finish(),
			workflowLocal: aggregate.workflowLocal,
		};
	},
};
