// The adapter seam (#66 decision 6, built in #67).
//
// One adapter per harness. The adapter owns everything up to the aggregate:
// finding the logs, parsing them, usage dedup, model-id normalization, and
// version discovery. Everything after — fail-closed name filtering, payload
// building, pricing lookups, the approve gate, the batch publish — is shared
// and takes the adapter's output plus its declared constants.

import type { Aggregate } from "./shared/aggregate.js";
import type { ScanStats } from "./shared/window.js";

export type HarnessScan = {
	/** The filled fold target; `buildPayload` finalizes and filters it. */
	aggregate: Aggregate;
	stats: ScanStats;
};

export type HarnessScanOptions = {
	/** Only count records with a timestamp at or after this epoch ms. */
	sinceMs: number;
	onProgress?: (files: number) => void;
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
	 * The pinned price-table id stamped into this harness's payloads. Per
	 * harness because the vendors publish their lists separately.
	 */
	readonly pricingTableVersion: string;
	/** True when this harness's log roots exist on this machine. */
	detect(): Promise<boolean>;
	scan(opts: HarnessScanOptions): Promise<HarnessScan>;
}
