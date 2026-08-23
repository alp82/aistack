import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { CliTokenScope } from './lib/cliScopes'

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
// The measured layer - wire format fixed by #33, produced by
// packages/cli/src/transcripts (#37). Keep the two in lockstep: this validator
// is CLOSED on purpose. The capability research made the closed-aggregate
// schema load-bearing for the privacy story - a free-form blob would forfeit
// it, because "we only accept these exact fields" is the claim being made.
// ---------------------------------------------------------------------------

// Allowlisted names only. Freeform names are filtered CLIENT-side before the
// send (#33 decisions 2-4); this shape is the second line, not the first.
const MeasuredAtom = v.object({
  name: v.string(),
  // Share, never a raw invocation count - counts are the map's designated
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
  // Absent when publishCost is off, or when the model was not fully priced -
  // never zeroed (#33 decision 11).
  apiEquivalentUSD: v.optional(v.number()),
  // The table that produced the dollars above, riding on the model (#136): one
  // opencode payload mixes vendors, so the payload-level `pricingTable` cannot
  // cite every figure. Present exactly when the dollars are. Absent on
  // payloads from before the mixed-vendor wire change.
  pricingTable: v.optional(v.string()),
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
    // standing non-goal (#13) - they never travel.
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

// The five inventory classes a published name can belong to - the same five the
// payload's `inventory` block carries (#33), so an opt-in is addressed exactly
// the way the client filters.
export const PublishedNameCategory = v.union(
  v.literal('builtinTools'),
  v.literal('mcpServers'),
  v.literal('skills'),
  v.literal('subagents'),
  v.literal('slashCommands')
)

// ---------------------------------------------------------------------------
// Instrumentation - the three signal families (#77, map #76).
// ---------------------------------------------------------------------------

/**
 * What a view counter counts. Polymorphic on purpose: all three kinds exist on
 * day one, and `aggregate` has no document to type against at all - typed
 * optional columns would force its row to carry every id field absent.
 */
export const ViewTargetKind = v.union(
  v.literal('stack'),
  v.literal('creator'),
  v.literal('aggregate')
)

/**
 * Where a session came from, decided ONCE per session from `document.referrer`
 * and carried on every later page as `internal` (#77). `ai` is split out of
 * `search` because "did an assistant send someone here" is the question the
 * aggregate page exists to answer, and it cannot be added retroactively.
 */
export const ReferrerBucket = v.union(
  v.literal('direct'),
  v.literal('search'),
  v.literal('ai'),
  v.literal('social'),
  v.literal('internal'),
  v.literal('other')
)

/**
 * A tool, model or bundle named in a composition change, with its display name
 * FROZEN at write time. The feed is a historical record, so the name at the
 * moment of the change is the correct value - and freezing it also kills a
 * per-row catalog lookup on the read path.
 */
export const ActivityAtom = v.object({
  kind: v.union(v.literal('tool'), v.literal('model'), v.literal('bundle')),
  slug: v.string(),
  name: v.string(),
})

/**
 * ONE discriminated union, not a top-level `type` plus a separate payload
 * validator (#77). Two independent discriminators make a mismatched row legal,
 * and a reader switching on `type` then gets the wrong payload shape.
 *
 * There is no cost field. `apiEquivalentUSD` is stored PER MODEL and is absent
 * when a model is unpriced, so there is no snapshot-level total to copy -
 * summing the model values would present a partial sum as a total. Adding cost
 * later needs a `costComplete` flag alongside it.
 */
export const ActivityEvent = v.union(
  v.object({
    type: v.literal('stack.published'),
    toolCount: v.number(),
  }),
  v.object({
    type: v.literal('stack.composition_changed'),
    added: v.array(ActivityAtom),
    removed: v.array(ActivityAtom),
  }),
  v.object({
    type: v.literal('sync.landed'),
    // The WHOLE batch. `publishForToken` lands up to 8 payloads in one atomic
    // mutation, so a per-snapshot event would fire up to 8 times for one sync.
    harnesses: v.array(
      v.object({
        harness: v.string(),
        windowDays: v.number(),
        sessions: v.number(),
        activeDays: v.number(),
        projects: v.number(),
        totalTokens: v.number(),
      })
    ),
  })
)

/** What the CLI reports about its standing auto-sync opt-in (#77). */
export const AutoSyncState = v.object({
  enabled: v.boolean(),
  frequencyHours: v.number(),
})

/**
 * How a sync fired (#100 decision 5, built in #102).
 *
 * OPTIONAL ON THE WIRE, and absent reads as `manual`: a 0.6.x CLI sends no
 * trigger at all, and the honest reading of silence is the one that claims
 * nothing about automation.
 */
export const SyncTrigger = v.union(v.literal('manual'), v.literal('auto'))

// ---------------------------------------------------------------------------
// The news pipeline (#204, map #198). Spec: docs/specs/news-pipeline.md.
// Terms are defined in CONTEXT.md and are used here exactly as written there.
// ---------------------------------------------------------------------------

/**
 * What the collector reads. One literal per lane, and a lane exists only once
 * a collector reads it.
 *
 *   feed  a generic RSS/Atom reader that covers vendor blogs, newsletters,
 *         personal blogs, YouTube channels, the aggregator, and GitHub
 *         `releases.atom`
 *   hn    the Hacker News lane (#208), through the Algolia search API
 *
 * The scrapers (#210) add their own literal when they land.
 */
export const NewsSourceKind = v.union(v.literal('feed'), v.literal('hn'))

/**
 * What we may store and show for one piece of collected content. Straight from
 * the re-serving table in docs/specs/news-pipeline.md.
 *
 * It rides on the ITEM as well as the source, frozen at collection time: the
 * owner may relicense a source, and that must not retroactively change what we
 * were allowed to keep from a post collected last month.
 *
 *   cc-by                     full text with attribution
 *   permissive-release-notes  full text with attribution and license notice
 *   unlicensed-release-notes  summary in our own words plus link
 *   article                   headline, date, link, own summary, short quotes
 *   hn                        titles and links, excerpts with a link back
 *   x                         IDs and official oEmbed embeds only
 */
export const NewsLicenseClass = v.union(
  v.literal('cc-by'),
  v.literal('permissive-release-notes'),
  v.literal('unlicensed-release-notes'),
  v.literal('article'),
  v.literal('hn'),
  v.literal('x')
)

/**
 * Where a news item is on its way to the stream (#204).
 *
 * `approved` means the item joined the item stream. The stream is still
 * PRIVATE: each projection has its own publish act, so approval alone shows
 * nothing to anyone.
 */
export const NewsItemState = v.union(
  v.literal('inbox'),
  v.literal('approved'),
  v.literal('discarded')
)

/** How an item reached the inbox: the scheduled collector, or the owner. */
export const NewsItemIntake = v.union(
  v.literal('collector'),
  v.literal('quick-add')
)

/**
 * A preference toggle a recipient can turn off (#204). Every non-transactional
 * send belongs to exactly ONE of these, and transactional mail belongs to
 * neither: it always sends and has no toggle.
 */
export const EmailCategory = v.union(
  v.literal('newsletter'),
  v.literal('important-updates')
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
 * (a package - npm/PyPI/OCI/url, e.g. an MCP server) and no files; a hosted
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
    // opted IN - cost is the default, and this field only records a refusal.
    publishCost: v.optional(v.boolean()),
    // Whether the machine stages its kept-private names here so the owner can
    // tick them on the web (#48). Absent reads as ON, mirroring `publishCost`
    // field-for-field: default-off would reproduce the very complaint #48 was
    // opened for - "publishes less, forever" - one layer later. Default-on
    // survives ONLY because the approve gate names the switch before the first
    // upload, so the two hold each other up.
    reviewKeptPrivate: v.optional(v.boolean()),
    published: v.boolean(),
    // WHO MAY AUTO-SYNC INTO THIS STACK, and how often (#100 decision 2, built
    // in #102). The permission used to live only in the machine's settings file
    // and its hook, so the web could not read it and could not revoke it.
    //
    // The server is now the authority: `sync --auto` asks before it publishes,
    // and off means every stale hook on every machine publishes nothing.
    //
    // Absent means "never set", which is what the seed reads (#102): the first
    // sync from a machine whose local flag is ON writes the field. After that
    // the server always wins, so a machine can no longer turn itself back on.
    autoSync: v.optional(AutoSyncState),
    // When a sync last arrived stamped `trigger: "auto"` (#100 decision 5).
    //
    // A FACT, not a preference, so it sits beside the flag and not inside it: a
    // revoke clears the permission and must not erase what already happened.
    // The switch reads the pair - on with a stamp is on-and-working, on without
    // one is on-but-never-fired, which is the state an unupgraded CLI leaves.
    lastAutoSyncAt: v.optional(v.number()),
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

  // DEPRECATED by `emailPreferences` (#204). Nothing reads or writes it any
  // more. It stays one deploy longer because the migration that copies its
  // rows reads FROM it: a column already dropped cannot be migrated from.
  // Drop the table once `migrations/20260823_email_preferences:run` has run on
  // prod.
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
    // What this machine calls itself, so `/settings/machines` can tell three
    // rows apart (#49). The CLI proposes `os.hostname()` at authStart and the
    // approval page shows it in an editable field, so the stored string is
    // always one the user saw and could overwrite. Optional permanently: an
    // older CLI sends nothing, and the user may clear the field.
    machineName: v.optional(v.string()),
    // What the CLI calls itself, carried from `authStart` to the token exchange
    // so `cli_login_completed` can report it (#77). Optional permanently: an
    // older CLI sends nothing, and the login must still work.
    //
    // Recorded HERE and not on the poll, because the poll is a bare GET with a
    // secretId - adding a query parameter to it would be a second wire change
    // for a field the session already had a place to hold.
    cliVersion: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_userCode', ['userCode'])
    .index('by_secretId', ['secretId'])
    // Feeds the hourly cleanup cron (#52). `authStart` is unauthenticated and
    // inserts one row per call with a 15-minute TTL, and nothing ever collected
    // them - so this table grew without bound. The index also lets the cron GC
    // the machine name an abandoned login left behind.
    .index('by_expiresAt', ['expiresAt']),

  cliTokens: defineTable({
    // Unsalted SHA-256 of the bearer, lowercase hex, and the ONLY form of the
    // credential this table holds - PHASE C of the hash-at-rest migration
    // landed (#49 shipped A+B, #52 narrows). A database read no longer
    // discloses a working token.
    //
    // Unsalted is correct here and not an oversight: the token is 256 bits of
    // `crypto.getRandomValues`, so there is no dictionary to attack and nothing
    // for a salt to defeat. Password stretching would only make every request
    // slower.
    //
    // Hashing happens in the `httpAction` (`convex/httpCli.ts`), so the
    // plaintext never crosses into the database layer at all.
    //
    // DEPLOY ORDER IS NOT OPTIONAL. The digest is derived FROM the plaintext,
    // so a column already dropped cannot be backfilled from - deploy a revision
    // that still has `token`, run
    // `migrations/20260729_cli_token_hash:backfill`, and only then deploy this.
    tokenHash: v.string(),
    userId: v.string(),
    // What the user called this machine at link time (#49), carried from
    // `cliSessions.machineName`. Optional: an older CLI proposes nothing and
    // the field can be cleared, so `/settings/machines` falls back to the
    // linked date.
    name: v.optional(v.string()),
    // Target stack, bound to the token AT LINK TIME (#33 decision 7). Every
    // sync is then unambiguous and the approve gate can name its destination
    // before the send. Most-recent-wins was rejected as a footgun: editing a
    // second stack would silently redirect the measured layer.
    //
    // PHASE A of a three-phase migration - optional first, because the table
    // has live rows and the repo's migration gotcha is that the dirty-row check
    // must test field PRESENCE, not truthiness. Narrowing to required waits
    // until every live token is relinked; see convex/migrations/20260725_cli_token_stack.ts.
    stackId: v.optional(v.id('stacks')),
    // What this machine is allowed to do (#52). Every token is minted with the
    // full set, so no request is refused today - the value here is the
    // enforcement point and the display line, not a live restriction.
    //
    // REQUIRED, batched into the same narrow as `tokenHash` above, which is the
    // whole reason #49 split this ticket off: one deploy cycle instead of two.
    // Run `migrations/20260729_cli_token_scopes:backfill` before deploying
    // this. An absent array would otherwise read as full access forever, which
    // is a permanent bypass rather than a migration step.
    scopes: v.array(CliTokenScope),
    // The last auto-sync opt-in state this machine reported (#77). The opt-in
    // itself lives in `~/.config/aistack/settings.json` and the backend never
    // learned about it, so `auto_sync_enabled` had nothing to fire on.
    //
    // Held per TOKEN and not per stack, because the opt-in is a property of a
    // machine. Absent means "never reported", which is what makes the
    // unknown-or-off → on transition detectable exactly once.
    autoSync: v.optional(AutoSyncState),
    createdAt: v.number(),
    expiresAt: v.number(),
    lastUsedAt: v.number(),
  })
    .index('by_tokenHash', ['tokenHash'])
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
  // and no files; a hosted row carries files. Linked rows are shared globally -
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

  // One fixed window per caller. The caller used to be an IP and only an IP;
  // #52 adds bearer-token buckets, so the column names what it holds - an
  // opaque namespaced key (`ip:1.2.3.4`, `cli-token:<id>`) - rather than one of
  // the things it can hold.
  //
  // The rename rode along with the `cliTokens` narrow, because it gates the
  // same deploy. The usual three-phase DATA migration did not apply: every row
  // is dead 60 seconds after it is written, so there was nothing to preserve -
  // `migrations/20260729_cli_token_scopes:purgeKeylessRateLimits` deletes the
  // stragglers, and the hourly cron would have drained them anyway.
  apiRateLimits: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
  })
    .index('by_key', ['key'])
    .index('by_windowStart', ['windowStart']),

  // The measured layer (#33 decision 6). Append-only: one immutable row per
  // approved sync, and the "current" measured layer is the newest row by
  // capturedAt. There is deliberately NO denormalised current row - that was
  // rejected in #33 precisely because it drifts from the history it summarises.
  measuredSnapshots: defineTable({
    stackId: v.id('stacks'),
    // Client clock, from the payload. Ordering key for "current".
    capturedAt: v.number(),
    // Server clock. The 7-day living-stacks bar trusts this one, because a
    // client clock is attacker- and skew-controlled.
    receivedAt: v.number(),
    schemaVersion: v.number(),
    // Denormalized copy of payload.harness.name (#66 decision 1), so "current
    // per harness" is one indexed read. A plain string, not a union literal -
    // a third harness must not need a schema migration.
    harness: v.string(),
    payload: MeasuredPayload,
  })
    .index('by_stack_capturedAt', ['stackId', 'capturedAt'])
    .index('by_stack_harness_capturedAt', ['stackId', 'harness', 'capturedAt']),

  // The ONLY durable reconcile state (#33 decision 12). Suggestions themselves
  // are derived on read from (latest snapshot x authored toolSubscriptions), so
  // a new sync needs no merge logic - it simply recomputes.
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
  // grows - one row per artifact its owner has ever ticked - and a ticked name
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

  // Names the owner has NOT published, staged so they can be ticked on the web
  // (#48). This is the one store in the measured layer that holds strings the
  // owner never agreed to publish, and everything about it is shaped by that.
  //
  // A TABLE AND NOT A FIELD ON `stacks`, for the #44 reason exactly: this is the
  // mechanism that holds names back, so it must never ride along on a public
  // stack read. It is owner-only and joins into NO public query.
  //
  // THROWN AWAY, NOT ACCUMULATED. The whole list is replaced on every sync,
  // deleted the moment the switch flips off, and aged out after 30 days idle -
  // a name outside the rolling window is not in the snapshot either, so ticking
  // it would publish nothing. That is what makes the list mean exactly "names in
  // your current window you have not published". Ticks in `publishedNameOptIns`
  // survive all of it, which is why read-time promotion was rejected: it would
  // read from the one store designed to be discarded.
  keptPrivateNames: defineTable({
    stackId: v.id('stacks'),
    category: PublishedNameCategory,
    name: v.string(),
    /** How often it ran in the reported window - the gate's ordering signal. */
    count: v.number(),
    /** Plugin prefix, for the grouped bulk tick. `null` when standalone. */
    group: v.union(v.string(), v.null()),
    /** When the sync that staged this list arrived. Drives the 30-day expiry. */
    stagedAt: v.number(),
  })
    .index('by_stack', ['stackId'])
    // The expiry sweep's index. Age is the only thing it asks about.
    .index('by_stagedAt', ['stagedAt']),

  // -------------------------------------------------------------------------
  // Views (#77). Two tables: a PERMANENT counter and a DISPOSABLE marker.
  //
  // Deduping one visitor per target per day already forces one marker row per
  // (visitor, target, day), so a counter saves no rows. What it buys is the
  // right to throw the markers away after a day - which keeps the permanent
  // table bounded by `targets x days x buckets` instead of by traffic, and
  // keeps the visitor hash out of the permanent record entirely.
  // -------------------------------------------------------------------------
  viewCounters: defineTable({
    targetKind: ViewTargetKind,
    // The DOCUMENT id, never the slug, so a rename does not orphan history.
    // The aggregate page has no document and uses the sentinel `'global'`.
    targetId: v.string(),
    /** UTC midnight of the day being counted. */
    dayStartMs: v.number(),
    referrerBucket: ReferrerBucket,
    count: v.number(),
  }).index('by_target_day', ['targetKind', 'targetId', 'dayStartMs']),

  // The dedupe marker. Names its target in real columns rather than burying it
  // in an opaque digest, so the query semantics are visible in the index.
  //
  // `visitorHash` is HMAC(secret, ip + userAgent + target + day) computed in the
  // web server. The raw IP never reaches Convex.
  viewDedupe: defineTable({
    targetKind: ViewTargetKind,
    targetId: v.string(),
    dayStartMs: v.number(),
    visitorHash: v.string(),
  })
    .index('by_target_day_hash', ['targetKind', 'targetId', 'dayStartMs', 'visitorHash'])
    // The hourly GC's index. Age is the only thing it asks about.
    .index('by_day', ['dayStartMs']),

  // -------------------------------------------------------------------------
  // The activity feed (#77). Append-only, written at the moment things happen -
  // NOT derived at read time from `measuredSnapshots`/`stacks`, because
  // derivation gets expensive and cannot express "tool X added" at all.
  //
  // Visibility is enforced at READ time, which is the only place it can be
  // correct: a stack can be unpublished after the event is written and this
  // table never mutates. The write side still gates on drafts, so a week of
  // drafting cannot fill the table with rows that can never be shown.
  // -------------------------------------------------------------------------
  activityEvents: defineTable({
    stackId: v.id('stacks'),
    // EXPLICIT, not Convex's implicit `_creationTime`: seeding the feed from
    // existing snapshots is likely, and backfilled rows would all carry today's
    // insert time and sort wrong.
    createdAt: v.number(),
    event: ActivityEvent,
  })
    // The feed's only query. `by_stack_createdAt` is deliberately NOT built -
    // nothing on this map reads per-stack activity. Add it when something does.
    .index('by_createdAt', ['createdAt']),

  // -------------------------------------------------------------------------
  // The news pipeline (#204, map #198). One item stream, two projections.
  // -------------------------------------------------------------------------

  // A place the collector reads. Owner-managed from the admin News tab.
  newsSources: defineTable({
    name: v.string(),
    slug: v.string(),
    kind: NewsSourceKind,
    url: v.string(),
    licenseClass: NewsLicenseClass,
    /** The license notice a permissive release-notes source must carry. */
    attribution: v.optional(v.string()),
    enabled: v.boolean(),
    /**
     * The collector ignores every item published before this moment.
     *
     * A feed serves its archive, not its news: the OpenAI feed returned 1139
     * items to the prototype (#177). Without a floor, adding one source floods
     * the inbox with years of posts nobody will ever work through. Set to the
     * moment the source was added, so a source starts empty and collects
     * forward. The owner can move it back to backfill on purpose.
     */
    collectFrom: v.number(),
    /**
     * The points a Hacker News story needs before the lane collects it (#208).
     * Only a `hn` source reads it. Absent means the proved default of 20, which
     * left 97 items a week in the prototype (#178).
     *
     * It sits on the row, not in the code, because it is the one dial that
     * moves inbox VOLUME. The keyword tiers beside it are regular expressions a
     * test proves, so those stay in convex/lib/hackerNews.ts.
     */
    minPoints: v.optional(v.number()),
    /** Health, written by every poll. The Sources view reads these four. */
    lastPolledAt: v.optional(v.number()),
    lastOkAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    consecutiveFailures: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_enabled', ['enabled']),

  // An owner-managed label. Flat, and it evolves. One topic per item.
  newsTopics: defineTable({
    name: v.string(),
    slug: v.string(),
    /** The owner's order, which is the order both projections group by. */
    order: v.number(),
    createdAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_order', ['order']),

  // One collected link. The inbox is the rows in state `inbox`, and the item
  // stream is the rows in state `approved`.
  newsItems: defineTable({
    /** The link as it arrived. This is the one shown and followed. */
    url: v.string(),
    /**
     * The dedupe key, from `newsUrlKey` in convex/lib/feed.ts. Lossy and never
     * displayed: one post reaches the collector through a vendor feed and
     * through the aggregator that reposted it, and those are one item.
     */
    urlKey: v.string(),
    headline: v.string(),
    /** The source's own date. Absent when the feed carried none. */
    publishedAt: v.optional(v.number()),
    collectedAt: v.number(),
    /** Absent on a quick-add item, which has no source row behind it. */
    sourceId: v.optional(v.id('newsSources')),
    intake: NewsItemIntake,
    /** FROZEN from the source at collection time. See NewsLicenseClass. */
    licenseClass: NewsLicenseClass,
    /**
     * The body as plain text, kept ONLY when the license class allows full-text
     * re-serving. Absent is the normal state. Written at collection because a
     * feed drops old entries and a dormant source cannot be read again.
     */
    sourceText: v.optional(v.string()),
    /**
     * The Hacker News story id, when the lane found this link on Hacker News
     * (#208). The discussion page is `hnDiscussionUrl(hnItemId)`, derived and
     * never stored twice.
     *
     * It rides on ITEMS FROM ANY LANE. A story usually points at an article a
     * feed already collected, and that is one item with two links, not a twin.
     * The first discussion to carry the item keeps the row.
     */
    hnItemId: v.optional(v.string()),
    /**
     * The points and the comment count at the last read. Points SETTLE over
     * about two days, so every run of the trailing window refreshes them.
     */
    hnPoints: v.optional(v.number()),
    hnComments: v.optional(v.number()),
    /**
     * The official oEmbed embed of one X post (#208), stored at paste time.
     * License class `x` allows the ID and this embed, and nothing else, so this
     * is the whole of what a projection may re-serve. See convex/lib/xPaste.ts.
     */
    xEmbed: v.optional(
      v.object({
        statusId: v.string(),
        html: v.string(),
        authorName: v.optional(v.string()),
        authorUrl: v.optional(v.string()),
      })
    ),
    state: NewsItemState,
    /**
     * The summary in our own words. The drafting skill writes it (#233, ADR
     * 0003) and the owner edits it. Absent means undrafted, which is the state
     * the next drafting run looks for. An item can sit in the inbox forever
     * without one, because drafting never blocks collection.
     */
    summary: v.optional(v.string()),
    topicId: v.optional(v.id('newsTopics')),
    /** When a drafting run last wrote this item. Absent means undrafted. */
    draftedAt: v.optional(v.number()),
    /** When the owner last moved this item out of the inbox. */
    decidedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    // Dedupe. Every write path asks this one question first.
    .index('by_urlKey', ['urlKey'])
    // The inbox list and the stream list, newest first.
    .index('by_state_collectedAt', ['state', 'collectedAt'])
    // Per-source health and the cascade when a source is deleted.
    .index('by_source', ['sourceId'])
    // What a topic holds. The Topics view refuses to delete a topic in use.
    .index('by_topic', ['topicId']),

  // One week's composed newsletter. The compose flow itself is settled in the
  // prototype (#202) and built in #201, which is why nothing here describes it.
  newsIssues: defineTable({
    /** 1, 2, 3. The public archive page is addressed by `slug`, not by this. */
    number: v.number(),
    slug: v.string(),
    subject: v.string(),
    intro: v.optional(v.string()),
    /** The items, IN SEND ORDER. The order is the composition. */
    itemIds: v.array(v.id('newsItems')),
    status: v.union(v.literal('draft'), v.literal('sent')),
    sentAt: v.optional(v.number()),
    sentCount: v.optional(v.number()),
    failedCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_number', ['number'])
    .index('by_status', ['status']),

  // Per-category mail preferences (#204). Replaces the global
  // `emailUnsubscribes` list, which could only say "never mail me again".
  //
  // ABSENT READS AS SUBSCRIBED TO BOTH. The audience is members and waitlist,
  // subscribed by default, so a row records a REFUSAL and nothing else. That
  // also makes the migration from the old table a straight copy: every global
  // unsubscribe becomes one row with both categories off.
  //
  // Transactional mail never consults this table. It has no toggle.
  emailPreferences: defineTable({
    /** Trimmed and lowercased on every write. The address is the identity. */
    email: v.string(),
    newsletter: v.boolean(),
    importantUpdates: v.boolean(),
    updatedAt: v.number(),
  }).index('by_email', ['email']),
})
