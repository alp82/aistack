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
    stackImageUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id('_storage')),
    personalPageUrl: v.optional(v.string()),
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
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_userCode', ['userCode'])
    .index('by_secretId', ['secretId']),

  cliTokens: defineTable({
    token: v.string(),
    userId: v.string(),
    name: v.optional(v.string()),
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
})
