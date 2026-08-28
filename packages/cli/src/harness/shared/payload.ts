// The wire payload builder - the only thing in this module that decides what
// leaves the machine.
//
// Wayfinder ticket #37 (map #29). Shape fixed by the wire-format grilling #33;
// nothing here is open design.
//
// Two invariants this file is responsible for:
//   1. FAIL-CLOSED NAMES. Every freeform name is matched against an allowlist
//      before it can reach the payload; unmatched names publish only as
//      per-category counts (#33 decisions 2-4). Model ids are the sole exempt
//      class (decision 3) and are charset/length sanitized instead.
//   2. COST IS ABSENT, NOT ZEROED. With `publishCost` off, the cost fields are
//      not in the payload at all (#33 decision 11) - there is nothing to
//      "reveal" server-side, because nothing was transmitted.

import { baseModelId, pricingTableFor } from "@aistack/pricing";
import type { MeasuredDay, WorkflowDay } from "@aistack/workflow-rules";
import { MEASURED_DAYS_V1 } from "@aistack/workflow-rules";
import type { WorkflowExtraction } from "../../workflow/index.js";
import {
	type Aggregate,
	cleanName,
	type Finalized,
	finalize,
	type ModelRow,
} from "./aggregate.js";
import {
	type Atom,
	filterAtoms,
	type KeptPrivateAtom,
	NAME_CATEGORIES,
	type NameCategory,
	type SyncConfig,
} from "./allowlist.js";
import { type ScanStats, windowStartMs } from "./window.js";

export const SCHEMA_VERSION = 2;

export type PayloadModel = {
	/** Vendor-assigned id, sanitized. `catalogSlug` is resolved SERVER-side at read time. */
	id: string;
	tokenShare: number;
	tokens: {
		input: number;
		output: number;
		cacheWrite: number;
		cacheRead: number;
		/**
		 * The cache-write TTL breakdown (#213). The three sum to `cacheWrite`,
		 * which stays the total.
		 *
		 * The analyzer has held this split since #126 and the wire merged it, so
		 * the backend's read-time repricer had to charge every write at the cheap
		 * 5-minute rate - about 8% low for Claude Code. Absent only when this
		 * harness reports no cache writes at all.
		 */
		cacheWriteTtl?: {
			fiveMinute: number;
			oneHour: number;
			/** Writes the harness reported with no TTL. Priced at the 5-minute rate. */
			unsplit: number;
		};
	};
	apiEquivalentUSD?: number;
	/**
	 * The table that produced `apiEquivalentUSD` - present exactly when the
	 * dollars are (#136). Per model, not per payload: one opencode payload mixes
	 * vendors, so a single top-level id would cite one table for dollars drawn
	 * from two.
	 */
	pricingTable?: string;
};

export type PayloadAtom = {
	name: string;
	callShare: number;
	/**
	 * The absolute invocation count behind the share (#213). Its denominator is
	 * `inventory.calls` for the same category, NOT the sum of the published
	 * atoms: shares are computed over every observed call, withheld ones
	 * included, and the count keeps that property.
	 */
	calls: number;
};

export type PayloadInventory = {
	builtinTools: PayloadAtom[];
	mcpServers: PayloadAtom[];
	skills: PayloadAtom[];
	subagents: PayloadAtom[];
	slashCommands: PayloadAtom[];
	/** DISTINCT names withheld per category, so the gap in the shares is explained. */
	withheld: {
		builtinTools: number;
		mcpServers: number;
		skills: number;
		subagents: number;
		slashCommands: number;
	};
	/**
	 * Every observed call per category, withheld names included (#213) - the
	 * denominator the shares were computed over. Withheld calls are this total
	 * minus the published counts, so the absolute figures explain their own gap
	 * the way `withheld` explains the shares'.
	 */
	calls: {
		builtinTools: number;
		mcpServers: number;
		skills: number;
		subagents: number;
		slashCommands: number;
	};
};

export type MeasuredPayload = {
	schemaVersion: 2;
	/** Client clock. The server stamps its own `receivedAt` (#33 decision 6). */
	capturedAt: number;
	window: { days: number; from: string; to: string };
	harness: { name: string; version: string | null };
	/**
	 * The one table the models' citations agree on, or `null` - when
	 * `publishCost` is off, when nothing priced, and when a mixed-vendor payload
	 * cites several tables (the per-model `pricingTable` fields carry the truth,
	 * and joining them here would blow the server's 64-character name bound).
	 */
	pricingTable: string | null;
	activity: {
		sessions: number;
		/** Sorted UTC dates inside the declared window. */
		activeDayDates: string[];
		/** Sorted project workspace identifiers. Project paths never travel. */
		projectKeys: string[];
		totalTokens: number;
		cacheHitShare: number;
		subagentShare: number;
	};
	models: PayloadModel[];
	inventory: PayloadInventory;
	coverage: {
		filesScanned: number;
		filesUnreadable: number;
		linesParsed: number;
		linesFailed: number;
	};
	excludedTokens: { unpriced: number; synthetic: number };
};

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

/**
 * Model ids are exempt from the allowlist (#33 decision 3) precisely because
 * they are vendor-assigned: on the day a new Claude model ships, fail-closing it
 * would make its tokens silently vanish from every sync and understate cost with
 * no visible cause. Exempt is not unchecked, though - the id still becomes a
 * database key and a rendered string, so charset and length are bounded here.
 */
const MODEL_ID_UNSAFE_RE = /[^A-Za-z0-9._:-]+/g;
const MODEL_ID_MAX = 64;

export function sanitizeModelId(id: string): string {
	const collapsed = cleanName(id)
		.replace(MODEL_ID_UNSAFE_RE, "-")
		.replace(/^-+|-+$/g, "");
	if (collapsed.length === 0) return "unknown";
	return collapsed.length > MODEL_ID_MAX
		? collapsed.slice(0, MODEL_ID_MAX)
		: collapsed;
}

const round4 = (n: number): number => Math.round(n * 10_000) / 10_000;
const round2 = (n: number): number => Math.round(n * 100) / 100;
const utcDate = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

const toAtoms = (pairs: ReadonlyArray<readonly [string, number]>): Atom[] =>
	pairs.map(([name, count]) => ({ name, count }));

/**
 * Shares are computed over ALL observed calls, including withheld ones.
 *
 * Renormalizing over only the allowlisted atoms would make the published shares
 * sum to 1.0 and read as a complete inventory - a withheld MCP server carrying
 * 90% of the calls would leave no trace. Keeping the true denominator means the
 * shares sum to less than 1 exactly when something was withheld, and the
 * `withheld` counts say how many things.
 */
function buildCategory(
	observed: ReadonlyArray<readonly [string, number]>,
	curated: ReadonlySet<string>,
	optIns: readonly string[],
	denominator: number,
): { atoms: PayloadAtom[]; withheld: number; keptPrivate: KeptPrivateAtom[] } {
	// The union is where #42 decision 1 lands: a name publishes if it is curated
	// OR the owner ticked it. Filtering itself is unchanged - still client-side,
	// still fail-closed, still before the send. What moves is who judged the name.
	const publishable = new Set([...curated, ...optIns]);
	const {
		allowed: kept,
		keptPrivate,
		withheld,
	} = filterAtoms(toAtoms(observed), { publishable, curated });
	return {
		atoms: kept.map((a) => ({
			name: a.name,
			callShare: denominator ? round4(a.count / denominator) : 0,
			calls: a.count,
		})),
		withheld,
		keptPrivate,
	};
}

const sumCounts = (pairs: ReadonlyArray<readonly [string, number]>): number => {
	let n = 0;
	for (const [, c] of pairs) n += c;
	return n;
};

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

type ModelGroup = {
	id: string;
	totalTokens: number;
	input: number;
	output: number;
	cacheWrite: number;
	cacheWrite5m: number;
	cacheWrite1h: number;
	cacheWriteUnsplit: number;
	cacheRead: number;
	costUSD: number;
	unpricedTokens: number;
	anyUnpriceable: boolean;
	/** The table citing this group's rates; every row shares it (one base model). */
	table: string | null;
};

/**
 * Collapse the analyzer's pricing keys into vendor-assigned ids.
 *
 * The analyzer prices fast mode under a synthetic `claude-opus-5#fast` key
 * because it bills at a different rate ($10/$50 vs $5/$25). That suffix is OURS,
 * not the vendor's, so publishing it would hand the server an id that cannot
 * resolve against the models catalog - the exact silent-disappearance failure
 * decision 3 exists to prevent. The rows are therefore merged back onto the base
 * id here. Cost stays exact because it was already accumulated per response at
 * the fast rate; what is lost is the fast-mode share itself, which the payload
 * has no field for and which is a candidate for a later schema bump.
 */
function groupModels(rows: readonly ModelRow[]): ModelGroup[] {
	const groups = new Map<string, ModelGroup>();
	for (const r of rows) {
		const id = sanitizeModelId(baseModelId(r.modelKey));
		let g = groups.get(id);
		if (!g) {
			g = {
				id,
				totalTokens: 0,
				input: 0,
				output: 0,
				cacheWrite: 0,
				cacheWrite5m: 0,
				cacheWrite1h: 0,
				cacheWriteUnsplit: 0,
				cacheRead: 0,
				costUSD: 0,
				unpricedTokens: 0,
				anyUnpriceable: false,
				table: null,
			};
			groups.set(id, g);
		}
		g.table ??= pricingTableFor(r.modelKey);
		g.totalTokens += r.totalTokens;
		g.input += r.tokens.input;
		g.output += r.tokens.output;
		g.cacheWrite5m += r.tokens.cacheWrite5m;
		g.cacheWrite1h += r.tokens.cacheWrite1h;
		g.cacheWriteUnsplit += r.tokens.cacheWriteUnsplit;
		g.cacheWrite +=
			r.tokens.cacheWrite5m +
			r.tokens.cacheWrite1h +
			r.tokens.cacheWriteUnsplit;
		g.cacheRead += r.tokens.cacheRead;
		g.costUSD += r.costUSD ?? 0;
		g.unpricedTokens += r.unpricedTokens;
		if (r.costUSD === null) g.anyUnpriceable = true;
	}
	return [...groups.values()].sort(
		(a, b) => b.totalTokens - a.totalTokens || a.id.localeCompare(b.id),
	);
}

function buildModels(
	rows: readonly ModelRow[],
	totalTokens: number,
	publishCost: boolean,
): PayloadModel[] {
	return groupModels(rows).map((g) => {
		const model: PayloadModel = {
			id: g.id,
			tokenShare: totalTokens ? round4(g.totalTokens / totalTokens) : 0,
			tokens: {
				input: g.input,
				output: g.output,
				cacheWrite: g.cacheWrite,
				cacheRead: g.cacheRead,
				// All three or none (#213), so a reader never sees half a
				// breakdown. Omitted when there were no cache writes at all -
				// three zeros state nothing the total does not already state.
				...(g.cacheWrite > 0
					? {
							cacheWriteTtl: {
								fiveMinute: g.cacheWrite5m,
								oneHour: g.cacheWrite1h,
								unsplit: g.cacheWriteUnsplit,
							},
						}
					: {}),
			},
		};
		// Absent, not zero: a partially-priced model reporting a dollar figure
		// would understate without saying so. `excludedTokens.unpriced` carries
		// the tokens that were left out. Dollars and their citation travel
		// together (#136) - a figure without its table may not render anywhere.
		if (
			publishCost &&
			!g.anyUnpriceable &&
			g.unpricedTokens === 0 &&
			g.table !== null
		) {
			model.apiEquivalentUSD = round2(g.costUSD);
			model.pricingTable = g.table;
		}
		return model;
	});
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

export type BuildPayloadInput = {
	aggregate: Aggregate;
	stats: ScanStats;
	syncConfig: SyncConfig;
	/** Client clock, epoch ms. The same value used to derive the scan window. */
	now: number;
	windowDays: number;
	/** The adapter's payload discriminator, e.g. `"claude-code"` (#66). */
	harnessName: string;
	/** The adapter's fail-closed vendor tool set (#66 decision 3). */
	builtinTools: ReadonlySet<string>;
	/** Resolve one local project directory to its persistent opaque id. */
	projectWorkspaceId: (directory: string) => string;
};

export type BuiltPayload = {
	payload: MeasuredPayload;
	/** The same numbers unfiltered, for the local report and the approve gate. */
	finalized: Finalized;
	/**
	 * Every observed name that will NOT publish, by category - the gate's review
	 * list (#42 decision 1, wired in #44).
	 *
	 * This is the one thing here that is deliberately NOT in the payload. It is
	 * the list of names the user has not agreed to publish, so it stays on the
	 * machine; the payload carries only the per-category COUNT.
	 */
	keptPrivate: Record<NameCategory, KeptPrivateAtom[]>;
};

export function buildPayload(input: BuildPayloadInput): BuiltPayload {
	const {
		aggregate: agg,
		stats,
		syncConfig,
		now,
		windowDays,
		harnessName,
		builtinTools,
		projectWorkspaceId,
	} = input;
	const finalized = finalize(agg);
	const { publishCost, allowlist, optIns } = syncConfig;

	const fromMs = windowStartMs(now, windowDays);
	const from = utcDate(fromMs);
	const to = utcDate(now);

	// Limited to the reported window rather than copied from the aggregate: a
	// clock-skewed, imported, or restored transcript dated in the future would
	// otherwise put an impossible date in a deterministic payload.
	const activeDayDates = [...agg.activeDays]
		.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= from && d <= to)
		.sort();
	const projectKeys = [
		...new Set(
			[...agg.projectDirs].map((directory) => projectWorkspaceId(directory)),
		),
	].sort();
	if (
		projectKeys.length > 1_000 ||
		projectKeys.some((key) => !/^[A-Za-z0-9_-]{22}$/.test(key))
	) {
		throw new Error(
			"Project workspace identifiers must be 22-character base64url strings",
		);
	}

	// One denominator per category, held rather than inlined: each is both the
	// divisor for its shares and the total the payload publishes (#213), and the
	// two must be the same number or the absolute counts would not add up.
	const observedCalls = {
		builtinTools: finalized.totalToolCalls,
		mcpServers: sumCounts(finalized.mcpServers),
		skills: sumCounts(finalized.skills),
		subagents: sumCounts(finalized.subagents),
		slashCommands: sumCounts(finalized.slashCommands),
	};
	const builtins = buildCategory(
		finalized.tools,
		builtinTools,
		optIns.builtinTools,
		observedCalls.builtinTools,
	);
	const mcp = buildCategory(
		finalized.mcpServers,
		new Set(allowlist.mcpServers),
		optIns.mcpServers,
		observedCalls.mcpServers,
	);
	const skills = buildCategory(
		finalized.skills,
		new Set(allowlist.skills),
		optIns.skills,
		observedCalls.skills,
	);
	const subagents = buildCategory(
		finalized.subagents,
		new Set(allowlist.subagents),
		optIns.subagents,
		observedCalls.subagents,
	);
	const slash = buildCategory(
		finalized.slashCommands,
		new Set(allowlist.slashCommands),
		optIns.slashCommands,
		observedCalls.slashCommands,
	);

	const models = buildModels(
		finalized.models,
		finalized.totalTokens,
		publishCost,
	);
	// The citation lives on each model (#136). The top-level field survives for
	// readers of the old shape and states the one table everything agrees on -
	// never a false single citation over a mixed payload.
	const citedTables = [
		...new Set(models.flatMap((m) => (m.pricingTable ? [m.pricingTable] : []))),
	];

	const payload: MeasuredPayload = {
		schemaVersion: SCHEMA_VERSION,
		capturedAt: now,
		window: { days: windowDays, from, to },
		harness: {
			name: harnessName,
			version:
				finalized.harnessVersion === null
					? null
					: sanitizeModelId(finalized.harnessVersion),
		},
		pricingTable: citedTables.length === 1 ? citedTables[0] : null,
		activity: {
			sessions: finalized.sessions,
			activeDayDates,
			projectKeys,
			totalTokens: finalized.totalTokens,
			cacheHitShare: round4(finalized.cacheHitShare),
			subagentShare: round4(finalized.sidechainShare),
		},
		models,
		inventory: {
			builtinTools: builtins.atoms,
			mcpServers: mcp.atoms,
			skills: skills.atoms,
			subagents: subagents.atoms,
			slashCommands: slash.atoms,
			withheld: {
				builtinTools: builtins.withheld,
				mcpServers: mcp.withheld,
				skills: skills.withheld,
				subagents: subagents.withheld,
				slashCommands: slash.withheld,
			},
			calls: observedCalls,
		},
		coverage: {
			filesScanned: stats.filesRead,
			filesUnreadable: stats.filesUnreadable,
			linesParsed: agg.lines - agg.parseErrors,
			linesFailed: agg.parseErrors,
		},
		excludedTokens: {
			unpriced: finalized.unpricedTokens,
			synthetic: agg.syntheticTokens,
		},
	};

	return {
		payload,
		finalized,
		keptPrivate: {
			builtinTools: builtins.keptPrivate,
			mcpServers: mcp.keptPrivate,
			skills: skills.keptPrivate,
			subagents: subagents.keptPrivate,
			slashCommands: slash.keptPrivate,
		},
	};
}

/**
 * What `POST /api/cli/sync` takes: one sealed payload PER DETECTED HARNESS,
 * one unsealed half shared across them (#66 decision 5). The batch is atomic
 * server-side, so two harnesses cannot wipe each other's staged names - which
 * is what two sequential per-harness publishes would have done, because the
 * staged list is a whole-list replace per stack.
 */
export type SyncBody = {
	payloads: MeasuredPayload[];
	keptPrivate?: Record<NameCategory, KeptPrivateAtom[]>;
	/**
	 * The machine's standing auto-sync opt-in (#78). Not measurement and not a
	 * name - it is the one bit of local state the backend cannot otherwise see,
	 * and `auto_sync_enabled` has nothing to fire on without it.
	 *
	 * It rides BESIDE the payloads, never inside one: the payload validator is
	 * closed, and that closedness is the privacy claim.
	 */
	autoSync?: { enabled: boolean; frequencyHours: number };
	/**
	 * How this sync fired (#102, sent by #103). `auto` means a SessionStart hook
	 * ran it with nobody watching; `manual` means a human typed the command.
	 *
	 * The server stamps `lastAutoSyncAt` from it, so the web switch can tell
	 * on-and-working from on-but-never-fired. It rides beside the payloads for
	 * the same reason `autoSync` does: the payload validator is closed.
	 */
	trigger?: SyncTrigger;
	/**
	 * The measured days (#307, ADR-0010): one row per UTC date holding the
	 * usage half and the workflow half under ONE version, `measured-days/v1`.
	 * Only the dates the server lacks or holds differently ride here, plus
	 * today; the manifest decides.
	 *
	 * It rides BESIDE the payloads for the reasons the workflow section did: the
	 * Git half is per machine, not per harness, and the closed payload
	 * validator is the privacy claim (#33). Each consent bit strips its own
	 * half on the machine: `publishWorkflow` off means no day carries a
	 * `workflow` block, `publishCost` off means no model carries `usd`.
	 */
	measuredDays?: PayloadMeasuredDays;
	/**
	 * The workflow section of the wire before #307. This CLI no longer sets it;
	 * the workflow blocks ride inside `measuredDays`. The field stays so an old
	 * body still type-checks.
	 */
	workflow?: PayloadWorkflow;
	/**
	 * The version of this CLI (#213).
	 *
	 * It answers one operational question that had no answer: how many machines
	 * are still on an old wire. `cliVersion` reached PostHog and nothing else,
	 * so no query over published rows could count them - which is the exact
	 * question a wire bump asks.
	 */
	cliVersion?: string;
};

/**
 * The workflow section as it goes on the wire (#285): per-day rows of
 * combinable atoms, plus the machine's clock. `WorkflowExtraction` is already
 * that shape, and nothing local survives it, so the wire type restates it
 * rather than deriving it: the two ends must describe the same bytes.
 */
export type PayloadWorkflow = {
	aggregateVersion: string;
	utcOffsetMinutes: number;
	days: WorkflowDay[];
};

/**
 * Put an extraction on the legacy `workflow` body field. The CLI no longer
 * sends that field (#307); this stays for the server-side contract test that
 * checks the day shape against the validator.
 */
export function toPayloadWorkflow(
	extraction: WorkflowExtraction,
): PayloadWorkflow {
	return {
		aggregateVersion: extraction.aggregateVersion,
		utcOffsetMinutes: extraction.utcOffsetMinutes,
		days: extraction.days,
	};
}

/** The day rows on the wire (#307), plus the machine's clock. */
export type PayloadMeasuredDays = {
	aggregateVersion: typeof MEASURED_DAYS_V1;
	/** Minutes EAST of UTC, as `PayloadWorkflow` carried it (#218). */
	utcOffsetMinutes: number;
	days: MeasuredDay[];
};

/**
 * Apply both consent bits to the day rows. Idempotent and pure, so the stage
 * runs it BEFORE fingerprinting (the fingerprint must hash the bytes that go)
 * and `buildSyncBody` runs it again as the last line of defense.
 *
 * `publishWorkflow` off drops every `workflow` block. `publishCost` off drops
 * `usd` and `pricingTable` from every model. A config the machine could not
 * fetch reads as both off.
 */
export function applyDayConsent(
	days: readonly MeasuredDay[],
	syncConfig: Pick<SyncConfig, "publishCost" | "publishWorkflow">,
): MeasuredDay[] {
	return days.map((day) => {
		const { workflow, usage, ...rest } = day;
		const out: MeasuredDay = { ...rest };
		if (usage) {
			out.usage = syncConfig.publishCost
				? usage
				: {
						harnesses: usage.harnesses.map((h) => ({
							...h,
							models: h.models.map(
								({ usd: _usd, pricingTable: _table, ...model }) => model,
							),
						})),
					};
		}
		if (workflow && syncConfig.publishWorkflow) out.workflow = workflow;
		return out;
	});
}

/** The two ways a sync can fire. Absent on an old CLI, and that reads as manual. */
export type SyncTrigger = "manual" | "auto";

/**
 * Union the per-harness kept-private lists into the one list the wire carries.
 *
 * One list, not one per harness, because consent is per NAME (#66 decision 5):
 * the owner ticks "alp-river", not "alp-river as seen by Codex". Counts merge
 * by (category, name); the group survives from whichever harness saw it first.
 */
export function mergeKeptPrivate(
	halves: ReadonlyArray<Record<NameCategory, KeptPrivateAtom[]>>,
): Record<NameCategory, KeptPrivateAtom[]> {
	const out = {} as Record<NameCategory, KeptPrivateAtom[]>;
	for (const category of NAME_CATEGORIES) {
		const merged = new Map<string, KeptPrivateAtom>();
		for (const half of halves) {
			for (const atom of half[category]) {
				const held = merged.get(atom.name);
				if (held) held.count += atom.count;
				else merged.set(atom.name, { ...atom });
			}
		}
		out[category] = [...merged.values()].sort(
			(a, b) => b.count - a.count || a.name.localeCompare(b.name),
		);
	}
	return out;
}

/**
 * Assemble the request body from the built payloads, one per detected harness.
 *
 * The two halves ride in ONE request (#48): a second call would let them drift
 * against a newer snapshot. They stay SEPARATE objects because the payload's
 * validator is closed and rejects any extra key - that closedness is the privacy
 * claim, so a kept-private name may sit beside the payloads and never inside one.
 *
 * The switch is read from the sync config the server just served. Off - or a
 * config the machine could not fetch, which reads as off - sends the payloads
 * alone and the names stay on the machine.
 */
export function buildSyncBody(
	built: readonly BuiltPayload[],
	syncConfig: SyncConfig,
	autoSync?: { enabled: boolean; frequencyHours: number },
	trigger: SyncTrigger = "manual",
	measuredDays?: PayloadMeasuredDays,
	cliVersion?: string,
): SyncBody {
	const payloads = built.map((b) => b.payload);
	const base: SyncBody = autoSync
		? { payloads, autoSync, trigger }
		: { payloads, trigger };
	// THE CONSENT GATES, APPLIED HERE TOO (#213, #307). The stage already
	// stripped what the owner declined before it fingerprinted the days; this
	// pass is idempotent and keeps the promise even for a caller that did not.
	const withDays: SyncBody = measuredDays
		? {
				...base,
				measuredDays: {
					aggregateVersion: MEASURED_DAYS_V1,
					utcOffsetMinutes: measuredDays.utcOffsetMinutes,
					days: applyDayConsent(measuredDays.days, syncConfig),
				},
			}
		: base;
	const withVersion: SyncBody = cliVersion
		? { ...withDays, cliVersion }
		: withDays;
	if (!syncConfig.reviewKeptPrivate) return withVersion;
	return {
		...withVersion,
		keptPrivate: mergeKeptPrivate(built.map((b) => b.keptPrivate)),
	};
}
