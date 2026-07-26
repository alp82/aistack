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
  MeasuredPayload,
  PublishedNameCategory,
  ReconcileAtomKind,
} from './schema'
import { extractShortId } from './lib/ids'

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

  const receivedAt = Date.now()
  const snapshotId = await ctx.db.insert('measuredSnapshots', {
    stackId,
    // Ordering key. Deliberately NOT clamped to the server clock: a skewed
    // client would otherwise have its ordering silently rewritten, and the
    // divergence between the two timestamps is itself a signal worth keeping.
    capturedAt: payload.capturedAt,
    receivedAt,
    schemaVersion: payload.schemaVersion,
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

async function newestSnapshot(
  ctx: QueryCtx,
  stackId: Id<'stacks'>
): Promise<Doc<'measuredSnapshots'> | null> {
  return await ctx.db
    .query('measuredSnapshots')
    .withIndex('by_stack_capturedAt', (q) => q.eq('stackId', stackId))
    .order('desc')
    .first()
}

const CurrentSnapshot = v.object({
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
 * The current measured layer for a published stack, by public slug.
 *
 * Public and unauthenticated, matching the minimal public display this map
 * pulls forward (#34). Returns null for an unpublished stack or one that has
 * never synced — the display decides how to render the silence.
 */
export const getCurrentByStackSlug = query({
  args: { slug: v.string() },
  returns: v.union(CurrentSnapshot, v.null()),
  handler: async (ctx, args) => {
    const shortId = extractShortId(args.slug)
    const stack = await ctx.db
      .query('stacks')
      .withIndex('by_shortId', (q) => q.eq('shortId', shortId))
      .first()
    if (!stack || !stack.published) return null

    const snapshot = await newestSnapshot(ctx, stack._id)
    if (!snapshot) return null

    const p = snapshot.payload
    return {
      capturedAt: snapshot.capturedAt,
      receivedAt: snapshot.receivedAt,
      schemaVersion: snapshot.schemaVersion,
      isFresh: Date.now() - snapshot.receivedAt <= SEVEN_DAYS_MS,
      window: p.window,
      harness: p.harness,
      pricingTable: p.pricingTable,
      activity: p.activity,
      models: await resolveModels(ctx, p.models),
      inventory: p.inventory,
      coverage: p.coverage,
      excludedTokens: p.excludedTokens,
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
    const snapshot = await newestSnapshot(ctx, args.stackId)

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

    // Measured-side: a model that resolves to the catalog but is absent from the
    // authored model list.
    if (snapshot) {
      const authoredModels = new Set(
        (stack.modelSubscriptions ?? []).map((m) => m.modelSlug)
      )
      for (const m of await resolveModels(ctx, snapshot.payload.models)) {
        if (m.catalogSlug === null) continue
        if (authoredModels.has(m.catalogSlug)) continue
        if (dismissed.has(`model:${m.catalogSlug}`)) continue
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

    return {
      hasSnapshot: snapshot !== null,
      receivedAt: snapshot?.receivedAt ?? null,
      isFresh:
        snapshot !== null && Date.now() - snapshot.receivedAt <= SEVEN_DAYS_MS,
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

/**
 * The bound on a name a client may tick.
 *
 * NOT the curated list's charset. A curated entry is ours and conventional; an
 * opt-in is the user's own string and may legitimately carry parentheses,
 * accents or CJK — refusing those would refuse names the user genuinely runs.
 * What is refused is what cannot be rendered safely: control characters and
 * bidi overrides, which move a terminal cursor or reorder the count printed
 * beside the name (CVE-2021-42574). This mirrors `cleanName` in
 * packages/cli/src/transcripts/analyzer.ts, which is where an observed name
 * gets the same treatment on the way in.
 */
const UNSAFE_NAME_RE =
  // biome-ignore lint/suspicious/noControlCharactersInRegex: refusing them is the point
  /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/

const NAME_MAX = 64

/** A cap per call, so one request cannot write an unbounded transaction. */
const MAX_NAMES_PER_CALL = 500

const OptInName = v.object({ category: PublishedNameCategory, name: v.string() })

function checkNames(entries: ReadonlyArray<{ name: string }>): void {
  if (entries.length > MAX_NAMES_PER_CALL) {
    throw new Error(`At most ${MAX_NAMES_PER_CALL} names per call`)
  }
  for (const { name } of entries) {
    // Loud, not silent: a name that cannot be stored is a tick the owner made
    // and would otherwise believe took effect.
    if (name.length === 0 || name.trim().length === 0) {
      throw new Error('A published name cannot be blank')
    }
    if (name.length > NAME_MAX) {
      throw new Error(`A published name cannot exceed ${NAME_MAX} characters`)
    }
    if (UNSAFE_NAME_RE.test(name)) {
      throw new Error('A published name cannot contain control characters')
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
    stackName: v.string(),
    optIns: OptInNames,
  }),
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId)
    if (!stack) throw new Error('Stack not found')
    // Absent reads as opted IN: the field records a refusal, and a stack that
    // has never seen the toggle has not refused.
    return {
      publishCost: stack.publishCost !== false,
      stackName: stack.name,
      optIns: await optInsForStack(ctx, args.stackId),
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
  returns: v.object({ scanned: v.number(), deleted: v.number() }),
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

    return { scanned: old.length, deleted }
  },
})

/** Convenience for the HTTP layer: publish + report what the gate should show. */
export const publishForToken = internalMutation({
  args: {
    tokenId: v.id('cliTokens'),
    payload: MeasuredPayload,
  },
  returns: v.object({
    snapshotId: v.id('measuredSnapshots'),
    receivedAt: v.number(),
    stackSlug: v.string(),
  }),
  handler: async (ctx, args) => {
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

    const { snapshotId, receivedAt } = await insertSnapshot(
      ctx,
      stack._id,
      args.payload
    )
    return { snapshotId, receivedAt, stackSlug: `${stack.slug}-${stack.shortId}` }
  },
})
