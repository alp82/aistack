// Local transcript analysis -> the measured-layer wire payload.
//
// Wayfinder ticket #37 (map #29), reshaped around the adapter seam by #67
// (map #60). Everything here runs on the user's machine; only the payloads
// returned by `buildPayload` are ever candidates to leave it, and only after
// the approve gate the send channel owns (ticket #41).
//
// Typical use:
//
//   const now = Date.now();
//   const { config } = await loadSyncConfig({ baseUrl });
//   for (const adapter of await detectedAdapters()) {
//     const { aggregate, stats } = await adapter.scan({
//       sinceMs: windowStartMs(now, DEFAULT_WINDOW_DAYS),
//     });
//     const built = buildPayload({
//       aggregate, stats, syncConfig: config, now,
//       windowDays: DEFAULT_WINDOW_DAYS,
//       harnessName: adapter.name,
//       builtinTools: adapter.builtinTools,
//       pricingTableVersion: adapter.pricingTableVersion,
//     });
//   }

import { claudeAdapter } from "./claude/adapter.js";
import { codexAdapter } from "./codex/adapter.js";
import type { HarnessAdapter } from "./types.js";

export { CLAUDE_HARNESS_NAME, claudeAdapter } from "./claude/adapter.js";
export {
	type Aggregate as ClaudeAggregate,
	createAggregate,
	type IngestContext,
	ingestRecord,
} from "./claude/analyzer.js";
export { type ScanOptions, scan, transcriptRoots } from "./claude/scan.js";
export { CODEX_HARNESS_NAME, codexAdapter } from "./codex/adapter.js";
export {
	type Aggregate,
	cleanName,
	type Finalized,
	finalize,
	isDisplaySafeName,
	type ModelRow,
	type ModelUsage,
	newestVersion,
} from "./shared/aggregate.js";
export {
	type Atom,
	BUILTIN_TOOLS,
	BUNDLED_SYNC_CONFIG,
	type CuratedAllowlist,
	EMPTY_OPT_INS,
	type FilteredAtoms,
	type FilterSets,
	filterAtoms,
	type KeptPrivateAtom,
	type LoadedSyncConfig,
	loadSyncConfig,
	NAME_CATEGORIES,
	type NameCategory,
	type OptInNames,
	pluginGroup,
	type SyncConfig,
	type SyncConfigSource,
} from "./shared/allowlist.js";
export { BUNDLED_CURATED_ALLOWLIST } from "./shared/bundled-allowlist.js";
export {
	type BuildPayloadInput,
	type BuiltPayload,
	buildPayload,
	buildSyncBody,
	type MeasuredPayload,
	mergeKeptPrivate,
	type PayloadAtom,
	type PayloadInventory,
	type PayloadModel,
	SCHEMA_VERSION,
	type SyncBody,
	sanitizeModelId,
} from "./shared/payload.js";
export {
	apiEquivalentCost,
	baseModelId,
	CACHE_READ_MULTIPLIER,
	CACHE_WRITE_1H_MULTIPLIER,
	CACHE_WRITE_5M_MULTIPLIER,
	isPricedModel,
	normalizeModel,
	OPENAI_PRICING_TABLE_VERSION,
	PRICING_TABLE_VERSION,
	type PricePeriod,
	priceAt,
	SONNET_5_INTRO_ENDS_MS,
	type TokenCounts,
} from "@aistack/pricing";
export {
	DEFAULT_WINDOW_DAYS,
	type ScanStats,
	windowStartMs,
} from "./shared/window.js";
export type {
	HarnessAdapter,
	HarnessScan,
	HarnessScanOptions,
} from "./types.js";

/**
 * Every harness this build can read, in the order their payloads publish.
 * Registration order is also display order at the gate, so Claude Code — the
 * documented default — stays first.
 */
export const HARNESS_ADAPTERS: readonly HarnessAdapter[] = [
	claudeAdapter,
	codexAdapter,
];

/** The adapters whose log roots exist on this machine. */
export async function detectedAdapters(): Promise<HarnessAdapter[]> {
	const out: HarnessAdapter[] = [];
	for (const adapter of HARNESS_ADAPTERS) {
		if (await adapter.detect()) out.push(adapter);
	}
	return out;
}
