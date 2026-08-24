// The adapter seam (#66 decision 6, built in #67).
//
// One adapter per harness. The adapter owns everything up to the aggregate:
// finding the logs, parsing them, usage dedup, model-id normalization, and
// version discovery. Everything after - fail-closed name filtering, payload
// building, pricing lookups, the approve gate, the batch publish - is shared
// and takes the adapter's output plus its declared constants.

import type {
	HarnessWorkflowAggregate,
	WorkflowLocalSources,
} from "../workflow/reducer.js";
import type { Aggregate } from "./shared/aggregate.js";
import type { ScanStats } from "./shared/window.js";

export type HarnessScan = {
	/** The filled fold target; `buildPayload` finalizes and filters it. */
	aggregate: Aggregate;
	stats: ScanStats;
	/** Privacy-safe workflow aggregates. Raw event graphs stay inside the reducer. */
	workflow: HarnessWorkflowAggregate;
	/** Local path keys for Git extraction. Never serialize this value. */
	workflowLocal: WorkflowLocalSources;
};

export type HarnessScanOptions = {
	/** Only count records with a timestamp at or after this epoch ms. */
	sinceMs: number;
	onProgress?: (files: number) => void;
};

export type HarnessDetectOptions = {
	/**
	 * The harness counts as present only when it wrote a transcript at or after
	 * this epoch ms. Callers pass the window start the scan uses, so "detected"
	 * and "in window" are the same number by construction (#101).
	 */
	sinceMs: number;
	/** Override the discovered roots. Tests only. */
	roots?: string[];
};

export interface HarnessAdapter {
	/** The payload discriminator: `"claude-code"` | `"codex"`. */
	readonly name: string;
	/**
	 * Fail-closed literal set of this harness's vendor-assigned tool names.
	 * Anything observed outside it publishes only as a per-category count.
	 */
	readonly builtinTools: ReadonlySet<string>;
	/**
	 * True when this harness wrote a transcript inside the sync window. A log
	 * root that merely exists is NOT detection (#101): a months-old install
	 * leaves one behind forever, and it used to scan, publish, ask and hook.
	 */
	detect(opts: HarnessDetectOptions): Promise<boolean>;
	scan(opts: HarnessScanOptions): Promise<HarnessScan>;
}
