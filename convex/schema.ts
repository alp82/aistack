import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const PageLink = v.object({
  name: v.string(),
  url: v.string(),
})

const Money = v.object({
  currency: v.string(),
  amount: v.number(),
  period: v.union(
    v.literal('month'),
    v.literal('year'),
    v.literal('one_time')
  ),
})

const UsagePricing = v.object({
  unit: v.string(),
  pricePerUnit: v.number(),
  currency: v.string(),
  notes: v.optional(v.string()),
})

export const ResourceFile = v.object({
  name: v.string(),
  content: v.string(),
  path: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
})

const ResourceUpstream = v.object({
  repoUrl: v.string(),
  path: v.optional(v.string()),
  license: v.optional(v.string()),
  stars: v.optional(v.number()),
  lastCommitSha: v.optional(v.string()),
  lastSyncAt: v.optional(v.number()),
})

// A non-repo package reference (e.g. an MCP server: an npm/PyPI package, a
// Docker image, or a remote URL). The identity lives in (registry, id).
const ResourcePackage = v.object({
  registry: v.union(
    v.literal('npm'),
    v.literal('pypi'),
    v.literal('oci'),
    v.literal('url')
  ),
  id: v.string(),
  version: v.optional(v.string()),
  transport: v.optional(
    v.union(v.literal('stdio'), v.literal('http'), v.literal('sse'))
  ),
})

// ---------------------------------------------------------------------------
// The measured layer — wire format fixed by #33, produced by
// packages/cli/src/transcripts (#37). Keep the two in lockstep: this validator
// is CLOSED on purpose. The capability research made the closed-aggregate
// schema load-bearing for the privacy story — a free-form blob would forfeit
// it, because "we only accept these exact fields" is the claim being made.
// ---------------------------------------------------------------------------

// Allowlisted names only. Freeform names are filtered CLIENT-side before the
// send (#33 decisions 2-4); this shape is the second line, not the first.
const MeasuredAtom = v.object({
  name: v.string(),
  // Share, never a raw invocation count — counts are the map's designated
  // post-P0 headroom metric and are deliberately left unspent.
  callShare: v.number(),
})

const MeasuredModel = v.object({
  // Vendor-assigned id, sanitized client-side. Exempt from the allowlist (#33
  // decision 3). `catalogSlug` is NOT stored: it is resolved against the models
  // catalog at READ time, so a later catalog addition retroactively resolves an
  // old snapshot without a republish.
  id: v.string(),
  tokenShare: v.number(),
  tokens: v.object({
    input: v.number(),
    output: v.number(),
    cacheWrite: v.number(),
    cacheRead: v.number(),
  }),
  // Absent when publishCost is off, or when the model was not fully priced —
  // never zeroed (#33 decision 11).
  apiEquivalentUSD: v.optional(v.number()),
})

export const MeasuredPayload = v.object({
  schemaVersion: v.number(),
  capturedAt: v.number(),
  window: v.object({
    days: v.number(),
    from: v.string(),
    to: v.string(),
  }),
  harness: v.object({
    name: v.string(),
    version: v.union(v.string(), v.null()),
  }),
  pricingTable: v.union(v.string(), v.null()),
  activity: v.object({
    sessions: v.number(),
    activeDays: v.number(),
    // COUNT only. Project directory names are munged absolute paths and are a
    // standing non-goal (#13) — they never travel.
    projects: v.number(),
    totalTokens: v.number(),
    cacheHitShare: v.number(),
    subagentShare: v.number(),
  }),
  models: v.array(MeasuredModel),
  inventory: v.object({
    builtinTools: v.array(MeasuredAtom),
    mcpServers: v.array(MeasuredAtom),
    skills: v.array(MeasuredAtom),
    subagents: v.array(MeasuredAtom),
    slashCommands: v.array(MeasuredAtom),
    // Distinct names withheld per category, so the gap in the shares above is
    // explained rather than silently absent (#33 decision 2).
    withheld: v.object({
      builtinTools: v.number(),
      mcpServers: v.number(),
      skills: v.number(),
      subagents: v.number(),
      slashCommands: v.number(),
    }),
  }),
  // Scan health (#33 decision 10). Cheap now, impossible later: snapshots are
  // immutable, so omitting this would leave a permanent hole in the history.
  coverage: v.object({
    filesScanned: v.number(),
    filesUnreadable: v.number(),
    linesParsed: v.number(),
    linesFailed: v.number(),
  }),
  excludedTokens: v.object({
    unpriced: v.number(),
    synthetic: v.number(),
  }),
})

// The authored<->measured overlap is catalog slugs only (#33 decision 2), but
// the dismissal key is kept wider than `tool` so a later surface can dismiss a
// model or an inventory atom without a migration.
export const ReconcileAtomKind = v.union(
  v.literal('model'),
  v.literal('tool'),
  v.literal('mcpServer'),
  v.literal('skill')
)

// The five inventory classes a published name can belong to — the same five the
// payload's `inventory` block carries (#33), so an opt-in is addressed exactly
// the way the client filters.
export const PublishedNameCategory = v.union(
  v.literal('builtinTools'),
  v.literal('mcpServers'),
  v.literal('skills'),
  v.literal('subagents'),
  v.literal('slashCommands')
)

const ResourceOwner = v.union(
  v.object({ kind: v.literal('creator'), id: v.id('creators') }),
  v.object({ kind: v.literal('github'), handle: v.string() }),
  v.object({ kind: v.literal('package'), registry: v.string(), id: v.string() })
)

/**
 * @stableKey format invariants:
 *   - Authored items: `manual:${type}:${name}` via buildManualStableKey in src/lib/resource-utils.ts
 *   - CLI items: `${group}:${type}:${relPath}` via computeStableKey in packages/cli/src/stableKey.ts
 *
 * A linked reference carries exactly one of `upstream` (GitHub repo) or `pkg`
 * (a package — npm/PyPI/OCI/url, e.g. an MCP server) and no files; a hosted
 * resource carries files (per-creator). Presence of either ref => linked.
 */
export const Resource = v.object({
  type: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  group: v.string(),
  stableKey: v.string(),
  files: v.optional(v.array(ResourceFile)),
  storage: v.union(v.literal('hosted'), v.literal('linked')),
  owner: ResourceOwner,
  addedBy: v.string(),
  upstream: v.optional(ResourceUpstream),
  pkg: v.optional(ResourcePackage),
})

/**
 * Public input shape for resources. Clients supply everything except the
 * server-derived `storage`/`owner`/`addedBy`, which the mutation derives from
 * the authenticated caller and the `upstream` discriminator.
 */
export const ResourceInput = v.object({
  type: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  group: v.string(),
  stableKey: v.string(),
  files: v.optional(v.array(ResourceFile)),
  // Deprecated and ignored: tolerated so old published CLIs that still send
  // scope keep working. The server discards it; nothing reads this field.
  scope: v.optional(v.union(v.literal('global'), v.literal('project'))),
  upstream: v.optional(ResourceUpstream),
  pkg: v.optional(ResourcePackage),
})

const ModelCategory = v.union(
  v.literal('language'),
  v.literal('coding'),
  v.literal('reasoning'),
  v.literal('vision'),
  v.literal('audio'),
  v.literal('image'),
  v.literal('video'),
  v.literal('embedding'),
  v.literal('other')
)

const TierPricing = v.object({
  pricingType: v.union(
    v.literal('fixed'),
    v.literal('usage'),
    v.literal('mixed')
  ),
  fixed: v.optional(Money),
  usage: v.optional(UsagePricing),
})

export default defineSchema({
  creators: defineTable({
    name: v.string(),
    slug: v.string(),
    userId: v.optional(v.string()),
    xHandle: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id('_storage')),
    verified: v.boolean(),
    personalPages: v.array(PageLink),
    projectPages: v.array(PageLink),
    bio: v.optional(v.string()),
    discordUserId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_userId', ['userId'])
    .index('by_verified', ['verified']),

  tools: defineTable({
    name: v.string(),
    slug: v.string(),
    shortId: v.string(),
    aliases: v.optional(v.array(v.string())),
    categories: v.array(v.string()),
    iconUrl: v.optional(v.string()),
    iconStorageId: v.optional(v.id('_storage')),
    websiteUrl: v.optional(v.string()),
    affiliateUrl: v.optional(v.string()),
    tiers: v.array(
      v.object({
        tierId: v.string(),
        name: v.string(),
        pricing: TierPricing,
        isDefault: v.optional(v.boolean()),
        updatedAt: v.optional(v.number()),
      })
    ),
    reviewStatus: v.union(
      v.literal('approved'),
      v.literal('pending'),
      v.literal('rejected')
    ),
    createdBy: v.optional(v.string()), // userId of creator
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_shortId', ['shortId'])
    .index('by_reviewStatus', ['reviewStatus']),

  stacks: defineTable({
    name: v.string(),
    slug: v.string(),
    shortId: v.string(),
    creatorId: v.id('creators'),
    teamSize: v.optional(v.number()),
    oneLiner: v.string(),
    description: v.optional(v.string()),
    accentPreset: v.optional(v.string()),
    toolSubscriptions: v.array(
      v.object({
        toolSlug: v.string(),
        tierId: v.optional(v.string()),
        kind: v.union(v.literal('main'), v.literal('misc')),
        primaryUsageLabel: v.string(),
        price: TierPricing,
        priceKind: v.union(
          v.literal('regular'),
          v.literal('discounted'),
          v.literal('bundle'),
          v.literal('usage_based'),
          v.literal('sponsored')
        ),
        bundleSlug: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
    bundleSubscriptions: v.optional(
      v.array(
        v.object({
          bundleSlug: v.string(),
          tierId: v.string(),
          description: v.optional(v.string()),
        }),
      ),
    ),
    modelSubscriptions: v.optional(
      v.array(
        v.object({
          modelSlug: v.string(),
          role: v.union(v.literal('primary'), v.literal('secondary'), v.literal('specialized')),
          description: v.optional(v.string()),
        }),
      ),
    ),
    fixedTotal: v.optional(Money),
    usageTotalNotes: v.optional(v.string()),
    hasUsageComponent: v.boolean(),
    // One opt-out bit, not a control panel (#33 decision 11). Applied
    // CLIENT-side: off means the cost fields are absent from the payload, never
    // transmitted, so there is nothing to "reveal" server-side. Absent reads as
    // opted IN — cost is the default, and this field only records a refusal.
    publishCost: v.optional(v.boolean()),
    published: v.boolean(),
    isLowQuality: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_shortId', ['shortId'])
    // TODO: enforce one-stack-per-creator invariant
    .index('by_creatorId', ['creatorId'])
    .index('by_published', ['published'])
    .index('by_isLowQuality', ['isLowQuality']),

  stackFlags: defineTable({
    stackId: v.id('stacks'),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index('by_stackId', ['stackId'])
    .index('by_stackId_userId', ['stackId', 'userId']),

  bundles: defineTable({
    name: v.string(),
    slug: v.string(),
    shortId: v.string(),
    aliases: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    iconStorageId: v.optional(v.id('_storage')),
    websiteUrl: v.optional(v.string()),
    toolSlugs: v.array(v.string()),
    tiers: v.array(
      v.object({
        tierId: v.string(),
        name: v.string(),
        pricing: TierPricing,
        isDefault: v.optional(v.boolean()),
      })
    ),
    reviewStatus: v.union(
      v.literal('approved'),
      v.literal('pending'),
      v.literal('rejected')
    ),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_shortId', ['shortId'])
    .index('by_reviewStatus', ['reviewStatus']),

  waitlist: defineTable({
    email: v.string(),
    userId: v.optional(v.string()),
    provider: v.union(v.literal('email'), v.literal('google')),
    status: v.union(v.literal('pending'), v.literal('registered')),
    joinedAt: v.number(),
    source: v.optional(v.string()),
    lookupId: v.string(), // UUID for secure public status page access
  })
    .index('by_email', ['email'])
    .index('by_userId', ['userId'])
    .index('by_status', ['status'])
    .index('by_lookupId', ['lookupId']),

  emailUnsubscribes: defineTable({
    email: v.string(),
    unsubscribedAt: v.number(),
  }).index('by_email', ['email']),

  stackUpvotes: defineTable({
    stackId: v.id('stacks'),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index('by_stackId', ['stackId'])
    .index('by_userId', ['userId'])
    .index('by_stackId_userId', ['stackId', 'userId'])
    .index('by_stackId_createdAt', ['stackId', 'createdAt']),

  models: defineTable({
    name: v.string(),
    slug: v.string(),
    shortId: v.string(),
    aliases: v.optional(v.array(v.string())),
    provider: v.string(),
    category: ModelCategory,
    iconUrl: v.optional(v.string()),
    iconStorageId: v.optional(v.id('_storage')),
    websiteUrl: v.optional(v.string()),
    contextWindow: v.optional(v.number()),
    description: v.optional(v.string()),
    reviewStatus: v.union(
      v.literal('approved'),
      v.literal('pending'),
      v.literal('rejected')
    ),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_shortId', ['shortId'])
    .index('by_provider', ['provider'])
    .index('by_category', ['category'])
    .index('by_reviewStatus', ['reviewStatus']),

  cliSessions: defineTable({
    userCode: v.string(),
    secretId: v.string(),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('expired')),
    userId: v.optional(v.string()),
    // Chosen on the approval page and carried into the issued token. Optional
    // permanently: a session is created BEFORE the user picks, and a profile
    // with no stack yet can still authenticate.
    stackId: v.optional(v.id('stacks')),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_userCode', ['userCode'])
    .index('by_secretId', ['secretId']),

  cliTokens: defineTable({
    token: v.string(),
    userId: v.string(),
    name: v.optional(v.string()),
    // Target stack, bound to the token AT LINK TIME (#33 decision 7). Every
    // sync is then unambiguous and the approve gate can name its destination
    // before the send. Most-recent-wins was rejected as a footgun: editing a
    // second stack would silently redirect the measured layer.
    //
    // PHASE A of a three-phase migration — optional first, because the table
    // has live rows and the repo's migration gotcha is that the dirty-row check
    // must test field PRESENCE, not truthiness. Narrowing to required waits
    // until every live token is relinked; see convex/migrations/20260725_cli_token_stack.ts.
    stackId: v.optional(v.id('stacks')),
    createdAt: v.number(),
    expiresAt: v.number(),
    lastUsedAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_userId', ['userId']),

  projects: defineTable({
    name: v.string(),
    slug: v.string(),
    shortId: v.string(),
    creatorId: v.id('creators'),
    stackId: v.id('stacks'),
    description: v.optional(v.string()),
    url: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_shortId', ['shortId'])
    .index('by_creatorId', ['creatorId'])
    .index('by_stackId', ['stackId']),

  // A linked row carries exactly one of `upstream` (GitHub) or `pkg` (package)
  // and no files; a hosted row carries files. Linked rows are shared globally —
  // deduped by `by_upstream` (repo) or `by_pkg` (package); hosted by creator.
  resources: defineTable({
    type: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    group: v.string(),
    stableKey: v.string(),
    files: v.optional(v.array(ResourceFile)),
    storage: v.union(v.literal('hosted'), v.literal('linked')),
    owner: ResourceOwner,
    addedBy: v.string(),
    upstream: v.optional(ResourceUpstream),
    pkg: v.optional(ResourcePackage),
    deletedAt: v.union(v.number(), v.null()),
    shortId: v.string(),
  })
    .index('by_addedBy_stableKey', ['addedBy', 'stableKey'])
    .index('by_upstream', ['upstream.repoUrl', 'upstream.path'])
    .index('by_pkg', ['pkg.registry', 'pkg.id'])
    .index('by_shortId', ['shortId']),

  resourceLinks: defineTable({
    resourceId: v.id('resources'),
    ownerKind: v.literal('stack'),
    ownerId: v.string(),
    order: v.number(),
    addedAt: v.number(),
  })
    .index('by_resourceId', ['resourceId'])
    .index('by_owner', ['ownerKind', 'ownerId']),

  toolEditSuggestions: defineTable({
    toolId: v.id('tools'),
    suggestedName: v.string(),
    suggestedCategories: v.array(v.string()),
    suggestedWebsiteUrl: v.optional(v.string()),
    suggestedIconStorageId: v.optional(v.id('_storage')),
    suggestedIconUrl: v.optional(v.string()),
    suggestedTiers: v.array(
      v.object({
        name: v.string(),
        pricingType: v.union(v.literal('fixed'), v.literal('usage'), v.literal('mixed')),
        fixedAmount: v.optional(v.number()),
        fixedPeriod: v.optional(v.union(v.literal('month'), v.literal('year'), v.literal('one_time'))),
      })
    ),
    reason: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected')
    ),
    submittedBy: v.optional(v.string()),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.string()),
  })
    .index('by_toolId', ['toolId'])
    .index('by_status', ['status']),

  apiRateLimits: defineTable({
    ip: v.string(),
    windowStart: v.number(),
    count: v.number(),
  })
    .index('by_ip', ['ip'])
    .index('by_windowStart', ['windowStart']),

  // The measured layer (#33 decision 6). Append-only: one immutable row per
  // approved sync, and the "current" measured layer is the newest row by
  // capturedAt. There is deliberately NO denormalised current row — that was
  // rejected in #33 precisely because it drifts from the history it summarises.
  measuredSnapshots: defineTable({
    stackId: v.id('stacks'),
    // Client clock, from the payload. Ordering key for "current".
    capturedAt: v.number(),
    // Server clock. The 7-day living-stacks bar trusts this one, because a
    // client clock is attacker- and skew-controlled.
    receivedAt: v.number(),
    schemaVersion: v.number(),
    payload: MeasuredPayload,
  }).index('by_stack_capturedAt', ['stackId', 'capturedAt']),

  // The ONLY durable reconcile state (#33 decision 12). Suggestions themselves
  // are derived on read from (latest snapshot x authored toolSubscriptions), so
  // a new sync needs no merge logic — it simply recomputes.
  reconcileDismissals: defineTable({
    stackId: v.id('stacks'),
    atomKind: ReconcileAtomKind,
    atomKey: v.string(),
    dismissedAt: v.number(),
  })
    .index('by_stack', ['stackId'])
    .index('by_stack_atom', ['stackId', 'atomKind', 'atomKey']),

  // Names the owner ticked for publication at the approve gate (#42 decision 2).
  // The curated allowlist is a convenience default; this table is where coverage
  // actually comes from, because every user-chosen name class is unbounded.
  //
  // ONE ROW PER NAME, never a pattern (#42 decision 3). The gate groups the
  // review list by plugin prefix and offers a bulk tick, but a stored `foo:*`
  // would be a standing grant to names that do not exist yet, and nobody can
  // consent to a name they have not thought of.
  //
  // A TABLE AND NOT A FIELD ON `stacks`, for two reasons. The set only ever
  // grows — one row per artifact its owner has ever ticked — and a ticked name
  // that the newest snapshot no longer carries is NOT public; parked on the
  // stack document it would ride along with every public stack read.
  publishedNameOptIns: defineTable({
    stackId: v.id('stacks'),
    category: PublishedNameCategory,
    name: v.string(),
    optedInAt: v.number(),
  })
    .index('by_stack', ['stackId'])
    .index('by_stack_name', ['stackId', 'category', 'name']),
})
