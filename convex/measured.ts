import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import {
  AutoSyncState,
  MeasuredPayload,
  PublishedNameCategory,
  ReconcileAtomKind,
} from './schema'
import { captureServerEvent } from './analytics'
import { emitActivityEvent } from './activity'
import { extractShortId } from './lib/ids'
import {
  MODEL_ID_MAX,
  NAME_MAX,
  isDisplaySafeName,
  isSanitizedModelId,
} from './lib/names'

/**
 * The measured layer — append-only snapshots published by the sync client, plus
 * the reconcile state that sits over the authored<->measured overlap.
 *
 * Wayfinder ticket #38 (map #29). Shape and semantics fixed by the wire-format
 * grilling #33; the payload is produced by packages/cli/src/transcripts (#37).
 *
 * Three invariants worth stating up front, because each one is a decision that
 * looks like an omission:
 *
 *   1. NOTHING IS UPDATED. A snapshot is inserted and never touched again. The
 *      "current" measured layer is a query for the newest row, not a column.
 *   2. `catalogSlug` IS RESOLVED AT READ TIME, never stored. A model that isn't
 *      in the catalog today resolves for free the day it is added, with no
 *      republish — which is why decision 3 could exempt model ids from the
 *      allowlist without their tokens silently vanishing.
 *   3. THE SERVER CLOCK DECIDES FRESHNESS. `capturedAt` comes from the client
 *      and orders the series; `receivedAt` is ours and is what the living-stacks
 *      bar trusts.
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/** Payload schema versions this deployment accepts. */
const SUPPORTED_SCHEMA_VERSIONS = [1]

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

/** The client emits date-only UTC (`toISOString().slice(0, 10)`). */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Say what a string in the payload may be (#45).
 *
 * The closed `MeasuredPayload` validator says which FIELDS a snapshot may
 * carry — #38 called that closedness the privacy claim. It cannot say what may
 * be inside a `v.string()`, and before #42 it did not have to: only names the
 * curated list already knew could reach here. #42 made arbitrary user-supplied
 * names a designed feature, so the public stack page now renders strings we
 * have never seen, on purpose. This states the bound those strings have.
 *
 * Two things it deliberately is NOT:
 *
 *   - NOT a re-check against the curated allowlist. That would defeat #42
 *     decision 1, which exists so a user can publish a name we never listed.
 *     Which names publish is judged on the machine, before the send, and stays
 *     there.
 *   - NOT a sanitizer. A violation REJECTS the snapshot. Rewriting a name
 *     server-side would publish a string the owner never saw at the approve
 *     gate, and snapshots are immutable, so there is no taking it back. A
 *     payload that trips this is a broken client, and the HTTP layer surfaces
 *     the reason as a 400.
 *
 * EVERY client-supplied string is covered, not only the five inventory
 * categories: `harness.name` and `pricingTable` are rendered on the same public
 * page from the same untrusted payload, so bounding the names and leaving those
 * open would close the hole only where it was noticed.
 *
 * `catalogSlug` and `catalogName` are NOT bounded here, because they are not in
 * the payload at all — `resolveModels` reads them from our own models catalog at
 * read time. They are a different trust class (admin-authored, not client-sent),
 * and asserting them inside a query would turn a catalog typo into a public page
 * that throws. Their bound belongs on the catalog write path, if anywhere.
 */
function checkPayloadStrings(
  payload: Doc<'measuredSnapshots'>['payload']
): void {
  const requireName = (value: string, where: string): void => {
    if (!isDisplaySafeName(value)) {
      throw new Error(
        `${where} must be 1-${NAME_MAX} characters and carry no control or bidi characters`
      )
    }
  }

  requireName(payload.harness.name, 'harness.name')
  if (payload.harness.version !== null) {
    requireName(payload.harness.version, 'harness.version')
  }
  if (payload.pricingTable !== null) {
    requireName(payload.pricingTable, 'pricingTable')
  }

  for (const key of ['from', 'to'] as const) {
    if (!ISO_DATE_RE.test(payload.window[key])) {
      throw new Error(`window.${key} must be an ISO date (YYYY-MM-DD)`)
    }
  }

  payload.models.forEach((model, i) => {
    if (!isSanitizedModelId(model.id)) {
      throw new Error(
        `models[${i}].id must be 1-${MODEL_ID_MAX} characters of A-Z a-z 0-9 . _ : -`
      )
    }
  })

  for (const category of NAME_CATEGORIES) {
    payload.inventory[category].forEach((atom, i) => {
      requireName(atom.name, `inventory.${category}[${i}].name`)
    })
  }
}

/**
 * Shared insert path.
 *
 * A plain function, not a mutation the other mutation calls: routing this
 * through `ctx.runMutation(internal.measured.publishSnapshot, ...)` makes
 * `measured.ts` reference its own module through the generated API, and TS
 * resolves that circularity by degrading the entire `internal` type to `any` —
 * which silently breaks inference in unrelated files (it took out `ctx.db.get`
 * narrowing across four other test files before this was extracted).
 */
async function insertSnapshot(
  ctx: MutationCtx,
  stackId: Id<'stacks'>,
  payload: Doc<'measuredSnapshots'>['payload']
): Promise<{ snapshotId: Id<'measuredSnapshots'>; receivedAt: number }> {
  if (!SUPPORTED_SCHEMA_VERSIONS.includes(payload.schemaVersion)) {
    throw new Error(`Unsupported payload schemaVersion ${payload.schemaVersion}`)
  }
  // Here rather than in either mutation: this is the one path into the table, so
  // a future caller cannot acquire authority over a stack and skip the bound.
  checkPayloadStrings(payload)

  const receivedAt = Date.now()
  const snapshotId = await ctx.db.insert('measuredSnapshots', {
    stackId,
    // Ordering key. Deliberately NOT clamped to the server clock: a skewed
    // client would otherwise have its ordering silently rewritten, and the
    // divergence between the two timestamps is itself a signal worth keeping.
    capturedAt: payload.capturedAt,
    receivedAt,
    schemaVersion: payload.schemaVersion,
    // Denormalized discriminator (#66 decision 1) — "current per harness" is
    // one indexed read. Old rows get theirs from the 20260801 backfill.
    harness: payload.harness.name,
    payload,
  })
  return { snapshotId, receivedAt }
}

/**
 * Insert one approved sync against an explicit stack.
 *
 * `publishForToken` is the path the HTTP layer actually uses; this one exists
 * for tests and for any future caller that has already established authority
 * over the target by other means. The payload never names its own destination —
 * that is the whole point of binding the stack at link time (#33 decision 7).
 */
export const publishSnapshot = internalMutation({
  args: {
    stackId: v.id('stacks'),
    payload: MeasuredPayload,
  },
  returns: v.object({
    snapshotId: v.id('measuredSnapshots'),
    receivedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId)
    if (!stack) throw new Error('Stack not found')
    return await insertSnapshot(ctx, args.stackId, args.payload)
  },
})

// ---------------------------------------------------------------------------
// Read — current snapshot, with catalog resolution
// ---------------------------------------------------------------------------

/** One published model, with the catalog resolved as of NOW. */
const ResolvedModel = v.object({
  id: v.string(),
  /** `null` when the id matches nothing in the models catalog yet. */
  catalogSlug: v.union(v.string(), v.null()),
  catalogName: v.union(v.string(), v.null()),
  tokenShare: v.number(),
  tokens: v.object({
    input: v.number(),
    output: v.number(),
    cacheWrite: v.number(),
    cacheRead: v.number(),
  }),
  apiEquivalentUSD: v.optional(v.number()),
})

/**
 * Resolve published model ids against the catalog at read time.
 *
 * Matches the slug first, then the `aliases` array — the analyzer publishes a
 * normalized vendor id (`claude-haiku-4-5`, dated suffix stripped) and the
 * catalog may carry the dated spelling as an alias, or vice versa.
 *
 * An unresolved id keeps its tokens and its cost and reports a null slug. That
 * is the honest failure: the alternative — dropping it — is exactly the silent
 * disappearance #33 decision 3 exempted model ids to prevent.
 */
async function resolveModels(
  ctx: QueryCtx,
  models: Doc<'measuredSnapshots'>['payload']['models']
) {
  return await Promise.all(
    models.map(async (m) => {
      const bySlug = await ctx.db
        .query('models')
        .withIndex('by_slug', (q) => q.eq('slug', m.id))
        .first()
      const match =
        bySlug ??
        (await ctx.db
          .query('models')
          .collect()
          .then((all) => all.find((row) => row.aliases?.includes(m.id)) ?? null))
      return {
        ...m,
        catalogSlug: match?.slug ?? null,
        catalogName: match?.name ?? null,
      }
    })
  )
}

/**
 * Read-time repricing for rows that landed before the CLI knew their price
 * (#72). The Codex live test published `gpt-5.6-*` and `codex-auto-review`
 * rows with tokens but no `apiEquivalentUSD` — the CLI's pinned table had no
 * rate for them — and snapshots are immutable, so the fix has to happen where
 * catalog resolution already does: at read time.
 *
 * Rates mirror the CLI's `openai-list-2026-08-02` table (source:
 * https://developers.openai.com/api/docs/pricing; cached input is 10% of
 * input; `codex-auto-review` is the aggregator-consensus rate, see the CLI
 * table comment). Only ids with a single open-ended price period are safe
 * here — per-response timestamps are gone by publish time, so a repriced
 * model must cost the same at every moment the window can cover.
 *
 * Two guards keep this honest:
 *   - it never fires when the payload published no cost at all
 *     (`pricingTable === null` — the owner turned cost publishing off, and
 *     read-time dollars would override that choice), and
 *   - it skips rows with cache-write tokens: OpenAI publishes no cache-write
 *     rate, and Codex never reports writes, so a row that has them is not a
 *     row this table can price.
 */
const READTIME_OPENAI_PRICES: Record<string, { input: number; output: number }> =
  {
    'gpt-5.6-sol': { input: 5, output: 30 },
    'gpt-5.6-terra': { input: 2, output: 12 },
    'gpt-5.6-luna': { input: 0.2, output: 1.2 },
    'gpt-5.3-codex': { input: 1.75, output: 14 },
    'codex-auto-review': { input: 2.5, output: 15 },
  }
const READTIME_PRICING_TABLE = 'openai-list-2026-08-02'
const READTIME_CACHE_READ_MULTIPLIER = 0.1

/**
 * Price unpriced rows from `READTIME_OPENAI_PRICES`, in place on a copy.
 * Returns the repriced list plus the token total that moved from unpriced to
 * priced, so the caller can shrink `excludedTokens.unpriced` to match.
 */
function applyReadTimePrices<
  T extends {
    id: string
    tokens: {
      input: number
      output: number
      cacheWrite: number
      cacheRead: number
    }
    apiEquivalentUSD?: number
  },
>(models: T[]): { models: T[]; repricedTokens: number } {
  let repricedTokens = 0
  const out = models.map((m) => {
    if (m.apiEquivalentUSD !== undefined) return m
    const rate = READTIME_OPENAI_PRICES[m.id]
    if (!rate || m.tokens.cacheWrite > 0) return m
    const usd =
      (m.tokens.input * rate.input +
        m.tokens.output * rate.output +
        m.tokens.cacheRead * rate.input * READTIME_CACHE_READ_MULTIPLIER) /
      1_000_000
    repricedTokens +=
      m.tokens.input + m.tokens.output + m.tokens.cacheRead
    return { ...m, apiEquivalentUSD: usd }
  })
  return { models: out, repricedTokens }
}

const harnessOf = (row: Doc<'measuredSnapshots'>): string => row.harness

/**
 * The newest snapshot of EACH harness (#66 decisions 1-2). "Current" became
 * per-harness the day snapshots did: each harness syncs independently, so its
 * freshness and failures stay attributable.
 *
 * One collect over the stack's rows rather than one indexed read per harness,
 * because the harness set is open (a plain string, deliberately) and the
 * retention policy bounds a stack to roughly one row per day — the collect is
 * small by construction. Claude Code sorts first (the documented default),
 * then alphabetical, so the display order is stable.
 */
async function newestSnapshotsPerHarness(
  ctx: QueryCtx,
  stackId: Id<'stacks'>
): Promise<Doc<'measuredSnapshots'>[]> {
  const rows = await ctx.db
    .query('measuredSnapshots')
    .withIndex('by_stack_capturedAt', (q) => q.eq('stackId', stackId))
    .collect()
  const byHarness = new Map<string, Doc<'measuredSnapshots'>>()
  for (const row of rows) {
    const held = byHarness.get(harnessOf(row))
    if (!held || row.capturedAt > held.capturedAt) {
      byHarness.set(harnessOf(row), row)
    }
  }
  return [...byHarness.values()].sort((a, b) => {
    const ha = harnessOf(a)
    const hb = harnessOf(b)
    if (ha === hb) return 0
    if (ha === 'claude-code') return -1
    if (hb === 'claude-code') return 1
    return ha.localeCompare(hb)
  })
}

/** One harness's current snapshot — the old CurrentSnapshot, one per harness. */
const HarnessSnapshot = v.object({
  capturedAt: v.number(),
  receivedAt: v.number(),
  schemaVersion: v.number(),
  /** True when receivedAt is inside the 7-day living-stacks window. */
  isFresh: v.boolean(),
  window: v.object({ days: v.number(), from: v.string(), to: v.string() }),
  harness: v.object({
    name: v.string(),
    version: v.union(v.string(), v.null()),
  }),
  pricingTable: v.union(v.string(), v.null()),
  activity: v.object({
    sessions: v.number(),
    activeDays: v.number(),
    projects: v.number(),
    totalTokens: v.number(),
    cacheHitShare: v.number(),
    subagentShare: v.number(),
  }),
  models: v.array(ResolvedModel),
  inventory: v.object({
    builtinTools: v.array(v.object({ name: v.string(), callShare: v.number() })),
    mcpServers: v.array(v.object({ name: v.string(), callShare: v.number() })),
    skills: v.array(v.object({ name: v.string(), callShare: v.number() })),
    subagents: v.array(v.object({ name: v.string(), callShare: v.number() })),
    slashCommands: v.array(
      v.object({ name: v.string(), callShare: v.number() })
    ),
    withheld: v.object({
      builtinTools: v.number(),
      mcpServers: v.number(),
      skills: v.number(),
      subagents: v.number(),
      slashCommands: v.number(),
    }),
  }),
  coverage: v.object({
    filesScanned: v.number(),
    filesUnreadable: v.number(),
    linesParsed: v.number(),
    linesFailed: v.number(),
  }),
  excludedTokens: v.object({ unpriced: v.number(), synthetic: v.number() }),
})

/**
 * The combined headline plus the per-harness sections (#66 decision 2).
 *
 * The headline SUMS what sums honestly — a session belongs to exactly one
 * harness, so tokens, sessions and dollars cannot double-count even when the
 * windows overlap. What cannot merge stays per-harness: inventory atoms carry
 * normalized `callShare` only (no weights, so a cross-harness number would be
 * fabricated), and day-sets/project-sets can overlap, so the headline shows
 * `max` for those, labeled as such by the display.
 */
const CurrentMeasured = v.object({
  /** Newest across harnesses; the freshness the page leads with. */
  receivedAt: v.number(),
  capturedAt: v.number(),
  /** True when ANY harness synced inside the 7-day window. */
  isFresh: v.boolean(),
  /** Envelope: max days, earliest from, latest to. */
  window: v.object({ days: v.number(), from: v.string(), to: v.string() }),
  /** Every cited price table, joined for display; null when none published cost. */
  pricingTable: v.union(v.string(), v.null()),
  activity: v.object({
    sessions: v.number(),
    /** MAX across harnesses, not a sum — the same day can appear in both. */
    activeDays: v.number(),
    /** MAX across harnesses — the same project can appear in both. */
    projects: v.number(),
    totalTokens: v.number(),
    cacheHitShare: v.number(),
    subagentShare: v.number(),
  }),
  /** Merged by id: absolute token objects summed, tokenShare recomputed. */
  models: v.array(ResolvedModel),
  harnesses: v.array(HarnessSnapshot),
})

async function toHarnessSnapshot(
  ctx: QueryCtx,
  snapshot: Doc<'measuredSnapshots'>
) {
  const p = snapshot.payload
  const resolved = await resolveModels(ctx, p.models)
  const { models, repricedTokens } =
    p.pricingTable !== null
      ? applyReadTimePrices(resolved)
      : { models: resolved, repricedTokens: 0 }
  return {
    capturedAt: snapshot.capturedAt,
    receivedAt: snapshot.receivedAt,
    schemaVersion: snapshot.schemaVersion,
    isFresh: Date.now() - snapshot.receivedAt <= SEVEN_DAYS_MS,
    window: p.window,
    harness: p.harness,
    // A repriced row's dollars are cited by OUR table, not the payload's —
    // the footer must name both.
    pricingTable:
      repricedTokens > 0 && p.pricingTable !== READTIME_PRICING_TABLE
        ? `${p.pricingTable} + ${READTIME_PRICING_TABLE}`
        : p.pricingTable,
    activity: p.activity,
    models,
    inventory: p.inventory,
    coverage: p.coverage,
    excludedTokens: {
      unpriced: Math.max(0, p.excludedTokens.unpriced - repricedTokens),
      synthetic: p.excludedTokens.synthetic,
    },
  }
}

type Resolved = Awaited<ReturnType<typeof resolveModels>>[number]

/**
 * Merge per-harness model lists by id, summing the absolute token objects and
 * recomputing `tokenShare` over the combined total. Dollars sum only while
 * every contributor priced — a merged row that mixed a priced and an unpriced
 * half would understate without saying so, so it drops the field instead.
 */
function mergeModels(lists: Resolved[][]): Resolved[] {
  const merged = new Map<string, Resolved>()
  for (const list of lists) {
    for (const m of list) {
      const held = merged.get(m.id)
      if (!held) {
        merged.set(m.id, { ...m, tokens: { ...m.tokens } })
        continue
      }
      held.tokens.input += m.tokens.input
      held.tokens.output += m.tokens.output
      held.tokens.cacheWrite += m.tokens.cacheWrite
      held.tokens.cacheRead += m.tokens.cacheRead
      if (held.apiEquivalentUSD !== undefined && m.apiEquivalentUSD !== undefined) {
        held.apiEquivalentUSD += m.apiEquivalentUSD
      } else {
        held.apiEquivalentUSD = undefined
      }
      if (held.catalogSlug === null) {
        held.catalogSlug = m.catalogSlug
        held.catalogName = m.catalogName
      }
    }
  }
  const tokensOf = (r: Resolved) =>
    r.tokens.input + r.tokens.output + r.tokens.cacheWrite + r.tokens.cacheRead
  const total = [...merged.values()].reduce((a, r) => a + tokensOf(r), 0)
  return [...merged.values()]
    .map((r) => ({ ...r, tokenShare: total ? tokensOf(r) / total : 0 }))
    .sort((a, b) => tokensOf(b) - tokensOf(a) || a.id.localeCompare(b.id))
}

/**
 * The current measured layer for a published stack, by public slug.
 *
 * Public and unauthenticated, matching the minimal public display this map
 * pulls forward (#34). Returns null for an unpublished stack or one that has
 * never synced — the display decides how to render the silence. No merged row
 * is ever stored: this aggregation exists only at read time (#66 decision 2).
 */
export const getCurrentByStackSlug = query({
  args: { slug: v.string() },
  returns: v.union(CurrentMeasured, v.null()),
  handler: async (ctx, args) => {
    const shortId = extractShortId(args.slug)
    const stack = await ctx.db
      .query('stacks')
      .withIndex('by_shortId', (q) => q.eq('shortId', shortId))
      .first()
    if (!stack || !stack.published) return null

    const snapshots = await newestSnapshotsPerHarness(ctx, stack._id)
    if (snapshots.length === 0) return null

    const harnesses = []
    for (const snapshot of snapshots) {
      harnesses.push(await toHarnessSnapshot(ctx, snapshot))
    }

    const totalTokens = harnesses.reduce(
      (a, h) => a + h.activity.totalTokens,
      0
    )
    // Cache-hit share recomputes from the summed model tokens — the same
    // input-class formula each client used, over the merged absolute counts.
    const models = mergeModels(harnesses.map((h) => h.models))
    let cacheRead = 0
    let inputClass = 0
    for (const m of models) {
      cacheRead += m.tokens.cacheRead
      inputClass += m.tokens.input + m.tokens.cacheRead + m.tokens.cacheWrite
    }
    const pricingTables = [
      ...new Set(
        harnesses.map((h) => h.pricingTable).filter((t): t is string => t !== null)
      ),
    ]

    return {
      receivedAt: Math.max(...harnesses.map((h) => h.receivedAt)),
      capturedAt: Math.max(...harnesses.map((h) => h.capturedAt)),
      isFresh: harnesses.some((h) => h.isFresh),
      window: {
        days: Math.max(...harnesses.map((h) => h.window.days)),
        from: harnesses.map((h) => h.window.from).sort()[0],
        to: harnesses.map((h) => h.window.to).sort()[harnesses.length - 1],
      },
      pricingTable: pricingTables.length > 0 ? pricingTables.join(' + ') : null,
      activity: {
        sessions: harnesses.reduce((a, h) => a + h.activity.sessions, 0),
        activeDays: Math.max(...harnesses.map((h) => h.activity.activeDays)),
        projects: Math.max(...harnesses.map((h) => h.activity.projects)),
        totalTokens,
        cacheHitShare: inputClass ? cacheRead / inputClass : 0,
        subagentShare: totalTokens
          ? harnesses.reduce(
              (a, h) => a + h.activity.subagentShare * h.activity.totalTokens,
              0
            ) / totalTokens
          : 0,
      },
      models,
      harnesses,
    }
  },
})

/**
 * The done-bar counter: stacks whose newest snapshot landed within 7 days.
 *
 * A query over `measuredSnapshots`, not a telemetry event — with n=1 user an
 * event would say nothing, and this reads the fact directly (#33 decision 13).
 */
export const countLivingStacks = query({
  args: {},
  returns: v.object({ living: v.number(), everSynced: v.number() }),
  handler: async (ctx) => {
    const cutoff = Date.now() - SEVEN_DAYS_MS
    const seen = new Set<string>()
    const fresh = new Set<string>()
    for (const row of await ctx.db.query('measuredSnapshots').collect()) {
      seen.add(row.stackId)
      if (row.receivedAt > cutoff) fresh.add(row.stackId)
    }
    return { living: fresh.size, everSynced: seen.size }
  },
})

// ---------------------------------------------------------------------------
// Reconcile — suggestions derived on read, dismissals persisted
// ---------------------------------------------------------------------------

async function requireStackOwner(
  ctx: QueryCtx | MutationCtx,
  stackId: Id<'stacks'>
): Promise<Doc<'stacks'>> {
  const user = await ctx.auth.getUserIdentity()
  if (!user) throw new Error('Not authenticated')
  const userId = user.tokenIdentifier.split('|')[1]

  const stack = await ctx.db.get(stackId)
  if (!stack) throw new Error('Stack not found')
  const creator = await ctx.db.get(stack.creatorId)
  if (!creator || creator.userId !== userId) throw new Error('Not authorized')
  return stack
}

const ReconcileSuggestion = v.object({
  atomKind: ReconcileAtomKind,
  atomKey: v.string(),
  /** Display name resolved from the catalog, falling back to the key. */
  label: v.string(),
  kind: v.union(
    // Measured shows a catalog tool the authored list doesn't carry.
    v.literal('missing_from_authored'),
    // Authored carries the tool but its what-for is still blank.
    v.literal('missing_what_for')
  ),
  tokenShare: v.optional(v.number()),
  /**
   * API-equivalent dollars for a measured model, straight from the snapshot.
   * Absent when the client withheld cost (`publishCost: false`, #33 decision
   * 11) — the surface renders the price line only when it is present.
   */
  apiEquivalentUSD: v.optional(v.number()),
})

/**
 * Recompute the reconcile suggestions for a stack.
 *
 * Derived on read (#33 decision 12) — there is no queue and no merge step, so a
 * new sync needs no reconciliation logic of its own. The only durable state is
 * the dismissal set, which is exactly the state that should be durable: the
 * user's own explicit decisions.
 *
 * The overlap is CATALOG SLUGS ONLY. MCP servers and Skills appear in the
 * measured inventory but have nowhere to land in `toolSubscriptions`, so they
 * are deliberately not suggested here even though `ReconcileAtomKind` can name
 * them (#39 locks this).
 *
 * THE WHAT-FOR IS `description`, NOT `primaryUsageLabel` (corrects #33/#38/#39).
 * `primaryUsageLabel` looks like the what-for and is not: the tool picker writes
 * the TIER NAME into it (`defaultTier.name`, `"Custom"`) and rewrites it on
 * every tier change, and the stack page renders it as a tier name. Deriving the
 * suggestion from it would have fired almost never, and answering one would have
 * written a sentence into the tier line and lost it at the next tier change.
 * `toolSubscriptions[].description` is the free text the tool card already
 * renders under the tool name, which is what #39's copy promises the owner.
 */
export const getReconcileSuggestions = query({
  args: { stackId: v.id('stacks') },
  returns: v.object({
    hasSnapshot: v.boolean(),
    /** Server clock of the newest snapshot; `null` when none has ever landed. */
    receivedAt: v.union(v.number(), v.null()),
    /** True when that snapshot is inside the 7-day living-stacks window. */
    isFresh: v.boolean(),
    suggestions: v.array(ReconcileSuggestion),
    dismissedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const stack = await requireStackOwner(ctx, args.stackId)
    // One snapshot per harness (#66): a model measured by ANY harness is a
    // reconcile candidate, and the surface's freshness reads the newest sync.
    const snapshots = await newestSnapshotsPerHarness(ctx, args.stackId)

    const dismissals = await ctx.db
      .query('reconcileDismissals')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    const dismissed = new Set(dismissals.map((d) => `${d.atomKind}:${d.atomKey}`))

    const suggestions: Array<{
      atomKind: 'model' | 'tool' | 'mcpServer' | 'skill'
      atomKey: string
      label: string
      kind: 'missing_from_authored' | 'missing_what_for'
      tokenShare?: number
      apiEquivalentUSD?: number
    }> = []

    // Authored-side: a subscribed tool with no what-for. Independent of whether
    // a snapshot exists — an empty what-for is worth filling in either way.
    for (const sub of stack.toolSubscriptions) {
      if ((sub.description ?? '').trim().length > 0) continue
      const key = `tool:${sub.toolSlug}`
      if (dismissed.has(key)) continue
      const tool = await ctx.db
        .query('tools')
        .withIndex('by_slug', (q) => q.eq('slug', sub.toolSlug))
        .first()
      suggestions.push({
        atomKind: 'tool',
        atomKey: sub.toolSlug,
        label: tool?.name ?? sub.toolSlug,
        kind: 'missing_what_for',
      })
    }

    // Measured-side: a model that resolves to the catalog but is absent from
    // the authored model list. Across harnesses the first (freshest-ordered)
    // sighting wins — the suggestion is "you ran this", not a share ranking.
    const authoredModels = new Set(
      (stack.modelSubscriptions ?? []).map((m) => m.modelSlug)
    )
    const suggestedSlugs = new Set<string>()
    for (const snapshot of snapshots) {
      const resolved = await resolveModels(ctx, snapshot.payload.models)
      const repriced =
        snapshot.payload.pricingTable !== null
          ? applyReadTimePrices(resolved).models
          : resolved
      for (const m of repriced) {
        if (m.catalogSlug === null) continue
        if (authoredModels.has(m.catalogSlug)) continue
        if (dismissed.has(`model:${m.catalogSlug}`)) continue
        if (suggestedSlugs.has(m.catalogSlug)) continue
        suggestedSlugs.add(m.catalogSlug)
        suggestions.push({
          atomKind: 'model',
          atomKey: m.catalogSlug,
          label: m.catalogName ?? m.id,
          kind: 'missing_from_authored',
          tokenShare: m.tokenShare,
          apiEquivalentUSD: m.apiEquivalentUSD,
        })
      }
    }

    suggestions.sort(
      (a, b) => (b.tokenShare ?? 0) - (a.tokenShare ?? 0) || a.label.localeCompare(b.label)
    )

    const newestReceivedAt =
      snapshots.length > 0
        ? Math.max(...snapshots.map((s) => s.receivedAt))
        : null
    return {
      hasSnapshot: snapshots.length > 0,
      receivedAt: newestReceivedAt,
      isFresh:
        newestReceivedAt !== null &&
        Date.now() - newestReceivedAt <= SEVEN_DAYS_MS,
      suggestions,
      dismissedCount: dismissals.length,
    }
  },
})

/** Dismiss one suggestion. Idempotent — re-dismissing is a no-op, not a duplicate. */
export const dismissSuggestion = mutation({
  args: {
    stackId: v.id('stacks'),
    atomKind: ReconcileAtomKind,
    atomKey: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireStackOwner(ctx, args.stackId)
    const existing = await ctx.db
      .query('reconcileDismissals')
      .withIndex('by_stack_atom', (q) =>
        q
          .eq('stackId', args.stackId)
          .eq('atomKind', args.atomKind)
          .eq('atomKey', args.atomKey)
      )
      .first()
    if (existing) return null
    await ctx.db.insert('reconcileDismissals', {
      stackId: args.stackId,
      atomKind: args.atomKind,
      atomKey: args.atomKey,
      dismissedAt: Date.now(),
    })
    return null
  },
})

/** Undo a dismissal, so the suggestion recomputes on the next read. */
export const undismissSuggestion = mutation({
  args: {
    stackId: v.id('stacks'),
    atomKind: ReconcileAtomKind,
    atomKey: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireStackOwner(ctx, args.stackId)
    const existing = await ctx.db
      .query('reconcileDismissals')
      .withIndex('by_stack_atom', (q) =>
        q
          .eq('stackId', args.stackId)
          .eq('atomKind', args.atomKind)
          .eq('atomKey', args.atomKey)
      )
      .first()
    if (existing) await ctx.db.delete(existing._id)
    return null
  },
})

/**
 * Everything the reconcile surface needs to render its dismissed list.
 *
 * The label is resolved here rather than stored, for the same reason
 * `catalogSlug` is: a dismissal outlives any one snapshot, and a name that
 * changes in the catalog should change here too. A key with no catalog row
 * falls back to the key itself — never to nothing.
 */
export const listDismissals = query({
  args: { stackId: v.id('stacks') },
  returns: v.array(
    v.object({
      atomKind: ReconcileAtomKind,
      atomKey: v.string(),
      label: v.string(),
      dismissedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await requireStackOwner(ctx, args.stackId)
    const rows = await ctx.db
      .query('reconcileDismissals')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    const labelled = await Promise.all(
      rows.map(async (r) => ({
        atomKind: r.atomKind,
        atomKey: r.atomKey,
        label: await resolveAtomLabel(ctx, r.atomKind, r.atomKey),
        dismissedAt: r.dismissedAt,
      }))
    )
    return labelled.sort((a, b) => b.dismissedAt - a.dismissedAt)
  },
})

/** Catalog name for one reconcile atom, falling back to its key. */
async function resolveAtomLabel(
  ctx: QueryCtx,
  atomKind: 'model' | 'tool' | 'mcpServer' | 'skill',
  atomKey: string
): Promise<string> {
  if (atomKind === 'model') {
    const model = await ctx.db
      .query('models')
      .withIndex('by_slug', (q) => q.eq('slug', atomKey))
      .first()
    return model?.name ?? atomKey
  }
  if (atomKind === 'tool') {
    const tool = await ctx.db
      .query('tools')
      .withIndex('by_slug', (q) => q.eq('slug', atomKey))
      .first()
    return tool?.name ?? atomKey
  }
  return atomKey
}

// ---------------------------------------------------------------------------
// Answering a suggestion — the two writes into the authored layer
// ---------------------------------------------------------------------------

/**
 * Write the what-for the owner typed onto one subscribed tool.
 *
 * Narrow on purpose. `stacks.update` takes the whole `toolSubscriptions` array,
 * so answering one suggestion through it would send the entire authored list
 * back over the wire and overwrite anything a second tab changed meanwhile.
 *
 * The target is `description` — the free text the tool card renders — NOT
 * `primaryUsageLabel`, which carries the tier name. See `getReconcileSuggestions`.
 */
export const applyWhatFor = mutation({
  args: {
    stackId: v.id('stacks'),
    toolSlug: v.string(),
    whatFor: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const stack = await requireStackOwner(ctx, args.stackId)
    const whatFor = args.whatFor.trim()
    if (whatFor.length === 0) throw new Error('A what-for cannot be blank')

    const subs = stack.toolSubscriptions
    if (!subs.some((s) => s.toolSlug === args.toolSlug)) {
      throw new Error('Tool is not on this stack')
    }
    await ctx.db.patch(args.stackId, {
      toolSubscriptions: subs.map((s) =>
        s.toolSlug === args.toolSlug ? { ...s, description: whatFor } : s
      ),
      updatedAt: Date.now(),
    })
    return null
  },
})

/**
 * Add a measured model to the authored model list.
 *
 * Idempotent, so answering the same suggestion twice (two tabs, a double click)
 * adds one row. The role is not asked for at the gate — the surface answers a
 * yes/no question — so the first model added becomes `primary` and every later
 * one `secondary`. The owner can change the role in the editor.
 */
export const addMeasuredModel = mutation({
  args: {
    stackId: v.id('stacks'),
    modelSlug: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const stack = await requireStackOwner(ctx, args.stackId)
    const model = await ctx.db
      .query('models')
      .withIndex('by_slug', (q) => q.eq('slug', args.modelSlug))
      .first()
    if (!model) throw new Error('Model is not in the catalog')

    const existing = stack.modelSubscriptions ?? []
    if (existing.some((m) => m.modelSlug === args.modelSlug)) return null

    await ctx.db.patch(args.stackId, {
      modelSubscriptions: [
        ...existing,
        {
          modelSlug: args.modelSlug,
          role: existing.some((m) => m.role === 'primary')
            ? ('secondary' as const)
            : ('primary' as const),
        },
      ],
      updatedAt: Date.now(),
    })
    return null
  },
})

// ---------------------------------------------------------------------------
// Sync config — the client's pre-send fetch
// ---------------------------------------------------------------------------

/**
 * The curated allowlist served to sync clients (#33 decision 4).
 *
 * THE BAR (settled by grilling #42): a name qualifies if the STRING carries no
 * private information no matter who typed it — a property of the string, not of
 * the user and not of the artifact. See the long rationale on the client's
 * bundled fallback (packages/cli/src/transcripts/bundled-allowlist.ts), which
 * this must stay byte-identical to; the two are the same policy, one served and
 * one for when the server can't be reached.
 *
 * This list is NOT the only road to publishing a name (#42 decision 1): the
 * approve gate offers every kept-private name as an explicit, default-off tick,
 * and those per-stack opt-ins ride down with the rest of the sync config for the
 * client to union in before its fail-closed filter. So this list stays strict —
 * it exists to spare users from ticking the obvious, not to carry coverage.
 *
 * Serving it from here rather than only bundling it is what makes the list
 * fixable at all: third-party marketplace plugin auto-update defaults to off,
 * so an installed user's bundled copy is otherwise frozen forever.
 */
const CURATED_ALLOWLIST = {
  mcpServers: [
    'chrome-devtools',
    'context7',
    'deepwiki',
    'figma',
    'filesystem',
    'git',
    'github',
    'huggingface',
    'ide',
    'linear',
    'notion',
    'playwright',
    'puppeteer',
    'sentry',
    'slack',
    'stripe',
  ],
  skills: [
    'artifact-capabilities',
    'artifact-design',
    'claude-api',
    'code-review',
    'codebase-design',
    'dataviz',
    'diagnosing-bugs',
    'domain-modeling',
    'fewer-permission-prompts',
    'grilling',
    'init',
    'keybindings-help',
    'loop',
    'prototype',
    'research',
    'review',
    'run',
    'schedule',
    'security-review',
    'simplify',
    'tdd',
    'update-config',
  ],
  subagents: [
    '(default)',
    'claude',
    'claude-code-guide',
    'Explore',
    'fork',
    'general-purpose',
    'Plan',
    'statusline-setup',
  ],
  slashCommands: [
    'add-dir',
    'agents',
    'bug',
    'clear',
    'compact',
    'config',
    'context',
    'cost',
    'doctor',
    'effort',
    'exit',
    'export',
    'fast',
    'help',
    'hooks',
    'ide',
    'init',
    'login',
    'logout',
    'mcp',
    'memory',
    'model',
    'output-style',
    'permissions',
    'plugin',
    'privacy-settings',
    'release-notes',
    'resume',
    'review',
    'rewind',
    'security-review',
    'status',
    'statusline',
    'terminal-setup',
    'todos',
    'upgrade',
    'usage',
    'vim',
    'workflows',
  ],
} as const

const AllowlistValidator = v.object({
  mcpServers: v.array(v.string()),
  skills: v.array(v.string()),
  subagents: v.array(v.string()),
  slashCommands: v.array(v.string()),
})

/**
 * Public, unauthenticated: the allowlist alone.
 *
 * `publishCost` is NOT here, and cannot be — it is a stack-level preference and
 * an unauthenticated caller has not said which stack it is. See
 * `getSyncConfigForToken` for the authenticated half; the HTTP route merges
 * them so a client with a bearer gets both in one request, and a client without
 * one still gets the allowlist it needs before the send.
 */
function allowlistPayload() {
  return {
    allowlist: {
      mcpServers: [...CURATED_ALLOWLIST.mcpServers],
      skills: [...CURATED_ALLOWLIST.skills],
      subagents: [...CURATED_ALLOWLIST.subagents],
      slashCommands: [...CURATED_ALLOWLIST.slashCommands],
    },
  }
}

export const getPublicSyncConfig = query({
  args: {},
  returns: v.object({ allowlist: AllowlistValidator }),
  handler: async () => allowlistPayload(),
})

/** Same value, reachable from the HTTP action that merges in the stack half. */
export const getPublicSyncConfigInternal = internalQuery({
  args: {},
  returns: v.object({ allowlist: AllowlistValidator }),
  handler: async () => allowlistPayload(),
})

// ---------------------------------------------------------------------------
// Published-name opt-ins — the per-stack tick set (#42 decision 2)
// ---------------------------------------------------------------------------

/**
 * The names the owner ticked at the approve gate, by inventory class.
 *
 * These ride down with the rest of the sync config and the client unions them
 * into the curated list before its fail-closed filter (#44). Nothing here
 * changes WHERE filtering happens — it still runs on the machine, before the
 * send — only what the allowed set contains.
 *
 * Three properties this placement buys, all from #42 decision 2: the set
 * survives a reinstall and a second machine, a failed config fetch reverts every
 * ticked name to kept-private (losing the network publishes LESS), and the
 * reconcile page has somewhere to revoke a name the owner regrets.
 */
const NAME_CATEGORIES = [
  'builtinTools',
  'mcpServers',
  'skills',
  'subagents',
  'slashCommands',
] as const

type NameCategory = (typeof NAME_CATEGORIES)[number]

const OptInNames = v.object({
  builtinTools: v.array(v.string()),
  mcpServers: v.array(v.string()),
  skills: v.array(v.string()),
  subagents: v.array(v.string()),
  slashCommands: v.array(v.string()),
})

const emptyOptIns = (): Record<NameCategory, string[]> => ({
  builtinTools: [],
  mcpServers: [],
  skills: [],
  subagents: [],
  slashCommands: [],
})

/** A cap per call, so one request cannot write an unbounded transaction. */
const MAX_NAMES_PER_CALL = 500

const OptInName = v.object({ category: PublishedNameCategory, name: v.string() })

function checkNames(entries: ReadonlyArray<{ name: string }>): void {
  if (entries.length > MAX_NAMES_PER_CALL) {
    throw new Error(`At most ${MAX_NAMES_PER_CALL} names per call`)
  }
  for (const { name } of entries) {
    // The SAME bar the published payload is held to (convex/lib/names.ts) — a
    // tick the owner can store but the snapshot would then be rejected for is
    // worse than no tick at all.
    //
    // Loud, not silent: a name that cannot be stored is a tick the owner made
    // and would otherwise believe took effect.
    if (!isDisplaySafeName(name)) {
      throw new Error(
        `A published name must be 1-${NAME_MAX} characters and carry no control or bidi characters`
      )
    }
  }
}

async function findOptIn(
  ctx: QueryCtx | MutationCtx,
  stackId: Id<'stacks'>,
  category: NameCategory,
  name: string
) {
  return await ctx.db
    .query('publishedNameOptIns')
    .withIndex('by_stack_name', (q) =>
      q.eq('stackId', stackId).eq('category', category).eq('name', name)
    )
    .first()
}

/**
 * Tick one or more names for publication. Owner-only, idempotent.
 *
 * Takes an array because the gate's bulk action ("tick all in `alp-river`")
 * stores every name in the group expanded — one click, 47 rows, one round trip.
 */
export const addPublishedNameOptIns = mutation({
  args: { stackId: v.id('stacks'), names: v.array(OptInName) },
  returns: v.object({ added: v.number() }),
  handler: async (ctx, args) => {
    await requireStackOwner(ctx, args.stackId)
    checkNames(args.names)

    const now = Date.now()
    let added = 0
    for (const entry of args.names) {
      if (await findOptIn(ctx, args.stackId, entry.category, entry.name)) continue
      await ctx.db.insert('publishedNameOptIns', {
        stackId: args.stackId,
        category: entry.category,
        name: entry.name,
        optedInAt: now,
      })
      added++
    }
    return { added }
  },
})

/**
 * Un-tick names. Owner-only, idempotent.
 *
 * This is the revoke path #42 decision 2 promised the reconcile page: the next
 * sync from ANY machine drops the name back to kept-private, rather than the
 * owner having to find the machine they ticked it on.
 */
export const removePublishedNameOptIns = mutation({
  args: { stackId: v.id('stacks'), names: v.array(OptInName) },
  returns: v.object({ removed: v.number() }),
  handler: async (ctx, args) => {
    await requireStackOwner(ctx, args.stackId)
    if (args.names.length > MAX_NAMES_PER_CALL) {
      throw new Error(`At most ${MAX_NAMES_PER_CALL} names per call`)
    }

    let removed = 0
    for (const entry of args.names) {
      const row = await findOptIn(ctx, args.stackId, entry.category, entry.name)
      if (!row) continue
      await ctx.db.delete(row._id)
      removed++
    }
    return { removed }
  },
})

/** The owner's own tick set, for a surface that shows or revokes it. */
export const listPublishedNameOptIns = query({
  args: { stackId: v.id('stacks') },
  returns: v.array(
    v.object({
      category: PublishedNameCategory,
      name: v.string(),
      optedInAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await requireStackOwner(ctx, args.stackId)
    const rows = await ctx.db
      .query('publishedNameOptIns')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    return rows
      .map((r) => ({
        category: r.category,
        name: r.name,
        optedInAt: r.optedInAt,
      }))
      .sort(
        (a, b) =>
          a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      )
  },
})

async function optInsForStack(
  ctx: QueryCtx,
  stackId: Id<'stacks'>
): Promise<Record<NameCategory, string[]>> {
  const out = emptyOptIns()
  const rows = await ctx.db
    .query('publishedNameOptIns')
    .withIndex('by_stack', (q) => q.eq('stackId', stackId))
    .collect()
  for (const row of rows) out[row.category].push(row.name)
  for (const key of NAME_CATEGORIES) out[key].sort()
  return out
}

/** The stack-level half, resolved from a bearer token's bound stack. */
export const getSyncConfigForStack = internalQuery({
  args: { stackId: v.id('stacks') },
  returns: v.object({
    publishCost: v.boolean(),
    reviewKeptPrivate: v.boolean(),
    stackName: v.string(),
    stackSlug: v.string(),
    optIns: OptInNames,
  }),
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId)
    if (!stack) throw new Error('Stack not found')
    // Absent reads as opted IN: the field records a refusal, and a stack that
    // has never seen the toggle has not refused.
    return {
      publishCost: stack.publishCost !== false,
      // Same rule, same shape, deliberately (#48): absent means on, and the
      // approve gate names the switch before the first upload.
      reviewKeptPrivate: stack.reviewKeptPrivate !== false,
      stackName: stack.name,
      // The approve gate points at `/stacks/{slug}/changes` BEFORE the first
      // send (#48 beat one), so the slug must be readable pre-publish (#41).
      // Composite like every public stack URL: the bare `slug` field is not
      // routable on its own — `publishForToken` below does the same.
      stackSlug: `${stack.slug}-${stack.shortId}`,
      optIns: await optInsForStack(ctx, args.stackId),
    }
  },
})

// ---------------------------------------------------------------------------
// Kept-private staging — the names the owner has NOT published (#48)
// ---------------------------------------------------------------------------

/**
 * The unsealed half of a sync body.
 *
 * #38 and #45 hold that a payload carrying an extra key is REJECTED, and that
 * closedness is the privacy claim. So the staged names could not ride inside
 * the payload without breaking the sentence — they ride beside it, in the same
 * request, so the two halves can never drift against a newer snapshot.
 *
 * Every field is client-supplied and every field is bounded (`checkStagedNames`).
 * #45 bounds the payload; this is a second surface and needs its own assertion.
 */
const KeptPrivateAtom = v.object({
  name: v.string(),
  count: v.number(),
  group: v.union(v.string(), v.null()),
})

const KeptPrivateNames = v.object({
  builtinTools: v.array(KeptPrivateAtom),
  mcpServers: v.array(KeptPrivateAtom),
  skills: v.array(KeptPrivateAtom),
  subagents: v.array(KeptPrivateAtom),
  slashCommands: v.array(KeptPrivateAtom),
})

type StagedAtom = { name: string; count: number; group: string | null }

/** A staged list is thrown away this long after the sync that wrote it. */
const KEPT_PRIVATE_TTL_MS = 30 * 24 * 60 * 60 * 1000

function flattenStaged(
  names: Record<NameCategory, StagedAtom[]>
): Array<StagedAtom & { category: NameCategory }> {
  const out: Array<StagedAtom & { category: NameCategory }> = []
  for (const category of NAME_CATEGORIES) {
    for (const atom of names[category]) out.push({ ...atom, category })
  }
  return out
}

/**
 * The bound on the unsealed half.
 *
 * `checkNames` is reused rather than reimplemented so a name the owner can tick
 * and a name their machine can stage are held to ONE bar — two copies would
 * drift into a name that stages but can never be ticked. The group and the count
 * are bounded here because they are client strings and numbers too: #45's rule
 * is that EVERY client-supplied field gets a bound, not only the interesting one.
 */
function checkStagedNames(
  entries: ReadonlyArray<StagedAtom & { category: NameCategory }>
): void {
  checkNames(entries)
  for (const entry of entries) {
    if (entry.group !== null && !isDisplaySafeName(entry.group)) {
      throw new Error(
        `A group must be 1-${NAME_MAX} characters and carry no control or bidi characters`
      )
    }
    if (!Number.isInteger(entry.count) || entry.count < 0) {
      throw new Error('A kept-private count must be a non-negative integer')
    }
  }
}

/**
 * Replace a stack's staged list.
 *
 * REPLACE, never merge. A name outside the current rolling window is not in the
 * snapshot either, so ticking it would publish nothing — which is what makes the
 * list mean exactly "names in your current window you have not published".
 */
async function replaceKeptPrivate(
  ctx: MutationCtx,
  stackId: Id<'stacks'>,
  names: Record<NameCategory, StagedAtom[]>,
  stagedAt: number
): Promise<number> {
  await deleteKeptPrivate(ctx, stackId)
  const flat = flattenStaged(names)
  checkStagedNames(flat)
  for (const entry of flat) {
    await ctx.db.insert('keptPrivateNames', {
      stackId,
      category: entry.category,
      name: entry.name,
      count: entry.count,
      group: entry.group,
      stagedAt,
    })
  }
  return flat.length
}

async function deleteKeptPrivate(
  ctx: MutationCtx,
  stackId: Id<'stacks'>
): Promise<number> {
  const rows = await ctx.db
    .query('keptPrivateNames')
    .withIndex('by_stack', (q) => q.eq('stackId', stackId))
    .collect()
  for (const row of rows) await ctx.db.delete(row._id)
  return rows.length
}

/**
 * Turn staging on or off. Owner-only.
 *
 * Off DELETES the list, in the same transaction. The switch says "off means we
 * never see them", and a switch that leaves the last upload sitting in the
 * database would make that sentence false the moment it is flipped.
 */
export const setReviewKeptPrivate = mutation({
  args: { stackId: v.id('stacks'), enabled: v.boolean() },
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx, args) => {
    await requireStackOwner(ctx, args.stackId)
    await ctx.db.patch(args.stackId, { reviewKeptPrivate: args.enabled })
    // Ticks are untouched: a tick is a standing permission, not a name we hold.
    const deleted = args.enabled ? 0 : await deleteKeptPrivate(ctx, args.stackId)
    return { deleted }
  },
})

/**
 * The plugin a ticked name came from.
 *
 * The machine is the authority on grouping and sends `group` with every staged
 * name, so this covers only the other half of the view: a name that is already
 * ticked PUBLISHES, so it is never staged, so it arrives here with no group at
 * all. Mirrors `pluginGroup` in packages/cli/src/transcripts/allowlist.ts.
 */
function groupOfTickedName(name: string): string | null {
  return (
    /^plugin_([^_]+)_(.+)$/.exec(name)?.[1] ??
    /^([^:\s]+):(.+)$/.exec(name)?.[1] ??
    null
  )
}

const KeptPrivateRow = v.object({
  category: PublishedNameCategory,
  name: v.string(),
  /** Absent for a ticked name: it publishes, so no sync ever staged a count. */
  count: v.optional(v.number()),
  group: v.union(v.string(), v.null()),
  /** True when the owner has ticked it — the row the revoke action acts on. */
  published: v.boolean(),
})

/**
 * What the `Kept private` view renders. Owner-only, and joined into NO public
 * read — this store is the thing #48 rejected read-time promotion FROM.
 *
 * It is a union of two sets, because they are two halves of one question:
 * what the machine staged (not published), and what the owner has ticked
 * (published, and revocable only from here — a ticked name never stages again).
 */
export const listKeptPrivate = query({
  args: { stackId: v.id('stacks') },
  returns: v.object({
    reviewEnabled: v.boolean(),
    /** When the staged list arrived, or null when nothing is staged. */
    stagedAt: v.union(v.number(), v.null()),
    names: v.array(KeptPrivateRow),
  }),
  handler: async (ctx, args) => {
    const stack = await requireStackOwner(ctx, args.stackId)

    const staged = await ctx.db
      .query('keptPrivateNames')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    const optIns = await ctx.db
      .query('publishedNameOptIns')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()

    type Row = {
      category: NameCategory
      name: string
      count?: number
      group: string | null
      published: boolean
    }
    const rows = new Map<string, Row>()
    for (const row of staged) {
      rows.set(`${row.category}:${row.name}`, {
        category: row.category,
        name: row.name,
        count: row.count,
        group: row.group,
        published: false,
      })
    }
    for (const row of optIns) {
      const key = `${row.category}:${row.name}`
      const held = rows.get(key)
      // A staged row that is ALSO ticked keeps its count — the count is real
      // and the tick is what changed. It shows once, as published.
      rows.set(key, {
        category: row.category,
        name: row.name,
        count: held?.count,
        group: held?.group ?? groupOfTickedName(row.name),
        published: true,
      })
    }

    return {
      reviewEnabled: stack.reviewKeptPrivate !== false,
      stagedAt: staged[0]?.stagedAt ?? null,
      names: [...rows.values()].sort(
        (a, b) =>
          (b.count ?? 0) - (a.count ?? 0) || a.name.localeCompare(b.name)
      ),
    }
  },
})

// ---------------------------------------------------------------------------
// Retention
// ---------------------------------------------------------------------------

const FINE_GRAIN_MS = 90 * 24 * 60 * 60 * 1000
const GC_BATCH = 500

const utcDay = (ms: number): string => new Date(ms).toISOString().slice(0, 10)

/**
 * Retention for the append-only snapshot table (#33 carried this forward).
 *
 * Policy: keep EVERY snapshot from the last 90 days, and beyond that keep only
 * the last snapshot of each UTC day. The newest row for a stack is never
 * deleted at any age.
 *
 * Why downsample rather than expire: the P1 live-stats map inherits this table
 * as a time series, and a hard cutoff would put a cliff in it. A day is the
 * finest grain any chart of a rolling-30-day metric can use meaningfully, so
 * beyond the fine-grain window the extra rows carry no signal — while inside it
 * they are what makes a bad sync debuggable. There is no absolute age cap: one
 * row per stack per day is ~365 rows a year, which never needs one.
 *
 * Deleting the newest row is guarded separately because "current" is a query
 * for it — GC must never be able to empty the measured layer of a live stack.
 */
export const gcSnapshots = internalMutation({
  args: {},
  returns: v.object({
    scanned: v.number(),
    deleted: v.number(),
    /** Staged kept-private names aged out — see the note below. */
    keptPrivateDeleted: v.number(),
  }),
  handler: async (ctx) => {
    const cutoff = Date.now() - FINE_GRAIN_MS
    const old = await ctx.db
      .query('measuredSnapshots')
      .withIndex('by_stack_capturedAt')
      .take(GC_BATCH)

    // Group by (stack, UTC day) and keep the newest of each group.
    const keepers = new Map<string, Doc<'measuredSnapshots'>>()
    const candidates: Doc<'measuredSnapshots'>[] = []
    for (const row of old) {
      if (row.capturedAt >= cutoff) continue
      candidates.push(row)
      const key = `${row.stackId}:${utcDay(row.capturedAt)}`
      const held = keepers.get(key)
      if (!held || row.capturedAt > held.capturedAt) keepers.set(key, row)
    }

    // Never delete a stack's newest row, whatever its age.
    const newestPerStack = new Map<string, number>()
    for (const stackId of new Set(candidates.map((r) => r.stackId))) {
      const newest = await ctx.db
        .query('measuredSnapshots')
        .withIndex('by_stack_capturedAt', (q) => q.eq('stackId', stackId))
        .order('desc')
        .first()
      if (newest) newestPerStack.set(stackId, newest.capturedAt)
    }

    let deleted = 0
    for (const row of candidates) {
      const key = `${row.stackId}:${utcDay(row.capturedAt)}`
      if (keepers.get(key)?._id === row._id) continue
      if (newestPerStack.get(row.stackId) === row.capturedAt) continue
      await ctx.db.delete(row._id)
      deleted++
    }

    return {
      scanned: old.length,
      deleted,
      keptPrivateDeleted: await gcKeptPrivate(ctx),
    }
  },
})

/**
 * Age out staged kept-private names, in the same cron rather than a second one.
 *
 * The opposite policy to the snapshots above: these are DELETED, not
 * downsampled. They are strings the owner never agreed to publish, and after 30
 * days every one of them is outside any rolling window it could describe — a
 * tick on it would publish nothing, so holding it buys the owner nothing and
 * costs them a name we should not have.
 *
 * This is also what covers a deleted stack. There is no stack-delete path in the
 * codebase today, so there is nothing to cascade from; if one lands, its rows
 * are already unreachable (every read is owner-gated) and expire within 30 days.
 */
async function gcKeptPrivate(ctx: MutationCtx): Promise<number> {
  const cutoff = Date.now() - KEPT_PRIVATE_TTL_MS
  const stale = await ctx.db
    .query('keptPrivateNames')
    .withIndex('by_stagedAt', (q) => q.lt('stagedAt', cutoff))
    .take(GC_BATCH)
  for (const row of stale) await ctx.db.delete(row._id)
  return stale.length
}

/**
 * Payloads per publish. Two harnesses exist today; the cap only bounds the
 * transaction a hostile client could ask for.
 */
const MAX_PAYLOADS_PER_PUBLISH = 8

/** Convenience for the HTTP layer: publish + report what the gate should show. */
export const publishForToken = internalMutation({
  args: {
    tokenId: v.id('cliTokens'),
    /**
     * Pre-#67 clients send exactly one payload here. Tolerated like
     * `ResourceInput.scope` — an installed CLI keeps working until a wire
     * bump retires the field.
     */
    payload: v.optional(MeasuredPayload),
    /**
     * The batch (#66 decision 5): one payload per detected harness, landed in
     * ONE atomic mutation. Atomicity is what closes the staged-names wipe
     * hazard — `replaceKeptPrivate` is a whole-list replace per stack, so two
     * sequential per-harness publishes would have the second wipe the first's
     * names.
     */
    payloads: v.optional(v.array(MeasuredPayload)),
    /**
     * The unsealed half (#48), ONE union across harnesses — consent is per
     * name, not per harness. Optional, because a client with the switch off
     * sends the payloads alone — and because #41's gate must be able to sync
     * before this half exists on the machine.
     */
    keptPrivate: v.optional(KeptPrivateNames),
    /**
     * The machine's standing auto-sync opt-in, as it currently stands (#77).
     * Optional: the opt-in lives in `~/.config/aistack/settings.json` and older
     * clients report nothing, which reads as "never told us".
     */
    autoSync: v.optional(AutoSyncState),
  },
  returns: v.object({
    snapshotIds: v.array(v.id('measuredSnapshots')),
    receivedAt: v.number(),
    stackSlug: v.string(),
    /** How many staged names landed, and whether the switch refused them. */
    keptPrivate: v.object({ stored: v.number(), refused: v.boolean() }),
  }),
  handler: async (ctx, args) => {
    const payloads = args.payloads ?? (args.payload ? [args.payload] : [])
    if (payloads.length === 0) {
      throw new Error('A publish needs at least one payload')
    }
    if (payloads.length > MAX_PAYLOADS_PER_PUBLISH) {
      throw new Error(`At most ${MAX_PAYLOADS_PER_PUBLISH} payloads per publish`)
    }
    // One snapshot per harness per publish. Two payloads claiming the same
    // harness would make "current per harness" depend on insert order.
    const harnesses = new Set(payloads.map((p) => p.harness.name))
    if (harnesses.size !== payloads.length) {
      throw new Error('Each payload must name a distinct harness')
    }

    const token = await ctx.db.get(args.tokenId)
    if (!token) throw new Error('Token not found')
    if (!token.stackId) {
      throw new Error(
        'This machine is not linked to a stack. Run `aistack login` again to pick one.'
      )
    }
    const stack = await ctx.db.get(token.stackId)
    if (!stack) throw new Error('Linked stack no longer exists')

    // The token's owner must still own the stack. A stack can change hands or be
    // deleted and recreated between link time and send time, and an immutable
    // snapshot written to the wrong stack cannot be taken back.
    const creator = await ctx.db.get(stack.creatorId)
    if (!creator || creator.userId !== token.userId) {
      throw new Error('Token is no longer authorized for its linked stack')
    }

    // Asked BEFORE the inserts, or every sync looks like the first one.
    const priorSnapshot = await ctx.db
      .query('measuredSnapshots')
      .withIndex('by_stack_capturedAt', (q) => q.eq('stackId', stack._id))
      .first()
    const isFirstSync = priorSnapshot === null

    const snapshotIds: Id<'measuredSnapshots'>[] = []
    let receivedAt = 0
    for (const payload of payloads) {
      const inserted = await insertSnapshot(ctx, stack._id, payload)
      snapshotIds.push(inserted.snapshotId)
      receivedAt = inserted.receivedAt
    }

    // ONE event per approved sync, never one per snapshot: this mutation lands
    // up to 8 payloads atomically, so a per-snapshot emit would fire 8 times for
    // one sync (#77). Summarizing the whole batch is also what lets the read
    // path drop its broken cross-page dedupe.
    //
    // Skipped for a draft. Visibility is re-checked at read time — this gate
    // only stops a week of drafting from filling the table with rows that can
    // never be shown.
    if (stack.published) {
      await emitActivityEvent(
        ctx,
        stack._id,
        {
          type: 'sync.landed',
          harnesses: payloads.map((p) => ({
            harness: p.harness.name,
            windowDays: p.window.days,
            sessions: p.activity.sessions,
            activeDays: p.activity.activeDays,
            projects: p.activity.projects,
            totalTokens: p.activity.totalTokens,
          })),
        },
        receivedAt,
      )
    }

    if (isFirstSync) {
      await captureServerEvent(ctx, 'first_sync_completed', token.userId, {
        harnesses: payloads.map((p) => p.harness.name),
        windowDays: payloads[0]?.window.days ?? 0,
      })
    }

    // The transition from unknown-or-off to on, as the BACKEND sees it — so it
    // fires once and not on every subsequent sync.
    if (args.autoSync?.enabled && token.autoSync?.enabled !== true) {
      await captureServerEvent(ctx, 'auto_sync_enabled', token.userId, {
        frequencyHours: args.autoSync.frequencyHours,
      })
    }
    if (
      args.autoSync !== undefined &&
      (token.autoSync?.enabled !== args.autoSync.enabled ||
        token.autoSync?.frequencyHours !== args.autoSync.frequencyHours)
    ) {
      await ctx.db.patch(token._id, { autoSync: args.autoSync })
    }

    // The switch is not client-side-only. A client that sends the half anyway —
    // a stale config fetch, or the owner flipping the switch mid-sync — has the
    // HALF refused, not the sync: losing the measurement over a race would cost
    // the owner the one thing they approved.
    const refused = args.keptPrivate !== undefined && stack.reviewKeptPrivate === false
    const stored =
      args.keptPrivate && !refused
        ? await replaceKeptPrivate(ctx, stack._id, args.keptPrivate, receivedAt)
        : 0

    return {
      snapshotIds,
      receivedAt,
      stackSlug: `${stack.slug}-${stack.shortId}`,
      keptPrivate: { stored, refused },
    }
  },
})
