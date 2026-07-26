// Local transcript analysis -> the measured-layer wire payload.
//
// Wayfinder ticket #37 (map #29). Everything here runs on the user's machine;
// only the object returned by `buildPayload` is ever a candidate to leave it, and
// only after the approve gate the send channel owns (ticket #41).
//
// Typical use:
//
//   const now = Date.now();
//   const agg = createAggregate();
//   const stats = await scan(agg, { sinceMs: windowStartMs(now, DEFAULT_WINDOW_DAYS) });
//   const { config } = await loadSyncConfig({ baseUrl });
//   const { payload } = buildPayload({
//     aggregate: agg, stats, syncConfig: config, now, windowDays: DEFAULT_WINDOW_DAYS,
//   });

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
} from "./allowlist.js";
export {
	type Aggregate,
	cleanName,
	createAggregate,
	type Finalized,
	finalize,
	type IngestContext,
	ingestRecord,
	isDisplaySafeName,
	type ModelRow,
	type ModelUsage,
	newestVersion,
} from "./analyzer.js";
export { BUNDLED_CURATED_ALLOWLIST } from "./bundled-allowlist.js";
export {
	buildPayload,
	HARNESS_NAME,
	type MeasuredPayload,
	type PayloadAtom,
	type PayloadInventory,
	type PayloadModel,
	SCHEMA_VERSION,
	sanitizeModelId,
} from "./payload.js";
export {
	apiEquivalentCost,
	baseModelId,
	CACHE_READ_MULTIPLIER,
	CACHE_WRITE_1H_MULTIPLIER,
	CACHE_WRITE_5M_MULTIPLIER,
	isPricedModel,
	normalizeModel,
	PRICING_TABLE_VERSION,
	type PricePeriod,
	priceAt,
	SONNET_5_INTRO_ENDS_MS,
	type TokenCounts,
} from "./pricing.js";
export {
	type ScanOptions,
	type ScanStats,
	scan,
	transcriptRoots,
	windowStartMs,
} from "./scan.js";

/** Rolling window locked by the owner in the #32 prototype resolution. */
export const DEFAULT_WINDOW_DAYS = 30;
