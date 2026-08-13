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
//   const sinceMs = windowStartMs(now, DEFAULT_WINDOW_DAYS);
//   const { config } = await loadSyncConfig({ baseUrl });
//   for (const adapter of await detectedAdapters(sinceMs)) {
//     const { aggregate, stats } = await adapter.scan({ sinceMs });
//     const built = buildPayload({
//       aggregate, stats, syncConfig: config, now,
//       windowDays: DEFAULT_WINDOW_DAYS,
//       harnessName: adapter.name,
//       builtinTools: adapter.builtinTools,
//     });
//   }

import { CLAUDE_HARNESS_NAME, claudeAdapter } from "./claude/adapter.js";
import { CODEX_HARNESS_NAME, codexAdapter } from "./codex/adapter.js";
import { OPENCODE_HARNESS_NAME, opencodeAdapter } from "./opencode/adapter.js";
import { DEFAULT_WINDOW_DAYS, windowStartMs } from "./shared/window.js";
import type { HarnessAdapter } from "./types.js";

export {
	apiEquivalentCost,
	baseModelId,
	CACHE_READ_MULTIPLIER,
	CACHE_WRITE_1H_MULTIPLIER,
	CACHE_WRITE_5M_MULTIPLIER,
	type CacheMultipliers,
	cacheMultipliersFor,
	GOOGLE_PRICING_TABLE_VERSION,
	isLocalModel,
	isPricedModel,
	LOCAL_PRICING_TABLE_VERSION,
	modelKeyFor,
	normalizeModel,
	OPENAI_PRICING_TABLE_VERSION,
	PRICING_TABLE_VERSION,
	PROVIDER_SEPARATOR,
	type PricePeriod,
	priceAt,
	SONNET_5_INTRO_ENDS_MS,
	splitModelKey,
	type TokenCounts,
	vendorModelId,
} from "@aistack/pricing";
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
	OPENCODE_BUILTIN_TOOLS,
	OPENCODE_HARNESS_NAME,
	opencodeAdapter,
} from "./opencode/adapter.js";
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
	type AutoSyncPermission,
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
export { hasRecentFile } from "./shared/recency.js";
export {
	DEFAULT_WINDOW_DAYS,
	type ScanStats,
	windowStartMs,
} from "./shared/window.js";
export type {
	HarnessAdapter,
	HarnessDetectOptions,
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
	opencodeAdapter,
];

/** Display name for a harness discriminator. One name per harness, defined here. */
export function harnessLabel(name: string): string {
	if (name === CLAUDE_HARNESS_NAME) return "Claude Code";
	if (name === CODEX_HARNESS_NAME) return "Codex";
	// The brand spells itself lowercase, so the discriminator IS the label.
	if (name === OPENCODE_HARNESS_NAME) return "opencode";
	return name;
}

/** The detected harnesses as one phrase: "Claude Code or Codex". */
export function harnessListLabel(adapters: readonly HarnessAdapter[]): string {
	return adapters.map((a) => harnessLabel(a.name)).join(" or ");
}

/**
 * The window every detection uses when the caller has no scan in hand. The
 * scan passes its own window start instead, which is the same number.
 */
export function detectionSinceMs(now: number = Date.now()): number {
	return windowStartMs(now, DEFAULT_WINDOW_DAYS);
}

/**
 * The adapters that wrote a transcript inside the window — the machine's LIVE
 * harnesses (#101). A stale one is skipped everywhere this is read: it does not
 * scan, it does not publish, it earns no upsell and it gets no hook.
 */
export async function detectedAdapters(
	sinceMs: number = detectionSinceMs(),
): Promise<HarnessAdapter[]> {
	const out: HarnessAdapter[] = [];
	for (const adapter of HARNESS_ADAPTERS) {
		if (await adapter.detect({ sinceMs })) out.push(adapter);
	}
	return out;
}
