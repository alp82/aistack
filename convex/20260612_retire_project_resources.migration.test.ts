/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'

// ---------------------------------------------------------------------------
// INLINE LEGACY SCHEMA
//
// The production schema will narrow after the implementation lands (resources
// loses the required `scope` field, resourceLinks loses 'project' from
// ownerKind, projects loses source/cloneCount). The test seeds LEGACY-shaped
// rows so it can verify the migration transforms them. We must NOT import the
// production schema here.
// ---------------------------------------------------------------------------

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
    v.literal('one_time'),
  ),
})

const UsagePricing = v.object({
  unit: v.string(),
  pricePerUnit: v.number(),
  currency: v.string(),
  notes: v.optional(v.string()),
})

const TierPricing = v.object({
  pricingType: v.union(
    v.literal('fixed'),
    v.literal('usage'),
    v.literal('mixed'),
  ),
  fixed: v.optional(Money),
  usage: v.optional(UsagePricing),
})

const ResourceFile = v.object({
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

const ResourcePackage = v.object({
  registry: v.union(
    v.literal('npm'),
    v.literal('pypi'),
    v.literal('oci'),
    v.literal('url'),
  ),
  id: v.string(),
  version: v.optional(v.string()),
  transport: v.optional(
    v.union(v.literal('stdio'), v.literal('http'), v.literal('sse')),
  ),
})

const ResourceOwner = v.union(
  v.object({ kind: v.literal('creator'), id: v.id('creators') }),
  v.object({ kind: v.literal('github'), handle: v.string() }),
  v.object({ kind: v.literal('package'), registry: v.string(), id: v.string() }),
)

const legacySchema = defineSchema({
  creators: defineTable({
    name: v.string(),
    slug: v.string(),
    userId: v.optional(v.string()),
    xHandle: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
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
          v.literal('sponsored'),
        ),
        bundleSlug: v.optional(v.string()),
        description: v.optional(v.string()),
      }),
    ),
    hasUsageComponent: v.boolean(),
    published: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_shortId', ['shortId'])
    .index('by_creatorId', ['creatorId'])
    .index('by_published', ['published']),

  // LEGACY resources table: scope is OPTIONAL here — this models the
  // Deploy-A intermediate state where the schema has already made scope
  // optional (so patch({ scope: undefined }) is accepted) but the narrowed
  // Deploy-B schema (scope removed entirely) has not yet been pushed.
  resources: defineTable({
    scope: v.optional(v.union(v.literal('global'), v.literal('project'))),
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

  // LEGACY resourceLinks table: ownerKind includes 'project'
  resourceLinks: defineTable({
    resourceId: v.id('resources'),
    ownerKind: v.union(v.literal('stack'), v.literal('project')),
    ownerId: v.string(),
    order: v.number(),
    addedAt: v.number(),
  })
    .index('by_resourceId', ['resourceId'])
    .index('by_owner', ['ownerKind', 'ownerId']),

  // LEGACY projects table: source and cloneCount exist
  projects: defineTable({
    name: v.string(),
    slug: v.string(),
    shortId: v.string(),
    creatorId: v.id('creators'),
    stackId: v.id('stacks'),
    source: v.optional(v.string()),
    description: v.optional(v.string()),
    url: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
    cloneCount: v.optional(v.number()),
    published: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_shortId', ['shortId'])
    .index('by_creatorId', ['creatorId'])
    .index('by_stackId', ['stackId']),

  // Include other tables so FK-valid rows can reference them
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
})

// Modules glob: from convex/ root use './**/*.{js,ts}'
const modules = import.meta.glob('./**/*.{js,ts}')

// ---------------------------------------------------------------------------
// TC-NEW-MIG-01: first run drains everything and returns correct counts
// ---------------------------------------------------------------------------

test('TC-NEW-MIG-01: first run drains project links, soft-deletes orphan, clears scope, patches projects', async () => {
  const t = convexTest(legacySchema, modules)

  const { orphanResourceId, dualResourceId, scopeOnlyResourceId, projectId } =
    await t.run(async (ctx) => {
      const now = Date.now()

      const creatorId = await ctx.db.insert('creators', {
        name: 'Test Creator',
        slug: 'test-creator-mig01',
        verified: false,
        personalPages: [],
        projectPages: [],
        createdAt: now,
      })

      const stackId = await ctx.db.insert('stacks', {
        name: 'Test Stack',
        slug: 'test-stack-mig01',
        shortId: 'MIG01',
        creatorId,
        oneLiner: 'test',
        toolSubscriptions: [],
        hasUsageComponent: false,
        published: false,
        createdAt: now,
        updatedAt: now,
      })

      // (1) orphan candidate: resource with scope:'project' + ONE project link
      const orphanResourceId = await ctx.db.insert('resources', {
        scope: 'project',
        type: 'rule',
        name: 'orphan-rule',
        group: 'claude-code',
        stableKey: 'claude-code:rule:orphan',
        files: [{ name: 'o.md', content: 'o' }],
        storage: 'hosted',
        owner: { kind: 'creator', id: creatorId },
        addedBy: creatorId,
        deletedAt: null,
        shortId: 'ORF001',
      })
      await ctx.db.insert('resourceLinks', {
        resourceId: orphanResourceId,
        ownerKind: 'project',
        ownerId: 'project-orphan-id',
        order: 0,
        addedAt: now,
      })

      // (2) dual-held: resource with a project link AND a stack link
      const dualResourceId = await ctx.db.insert('resources', {
        scope: 'project',
        type: 'rule',
        name: 'dual-rule',
        group: 'claude-code',
        stableKey: 'claude-code:rule:dual',
        files: [{ name: 'd.md', content: 'd' }],
        storage: 'hosted',
        owner: { kind: 'creator', id: creatorId },
        addedBy: creatorId,
        deletedAt: null,
        shortId: 'DUL001',
      })
      await ctx.db.insert('resourceLinks', {
        resourceId: dualResourceId,
        ownerKind: 'project',
        ownerId: 'project-dual-id',
        order: 0,
        addedAt: now,
      })
      await ctx.db.insert('resourceLinks', {
        resourceId: dualResourceId,
        ownerKind: 'stack',
        ownerId: stackId,
        order: 0,
        addedAt: now,
      })

      // (3) scope-only: resource with scope:'project', no links
      const scopeOnlyResourceId = await ctx.db.insert('resources', {
        scope: 'project',
        type: 'rule',
        name: 'scope-only',
        group: 'claude-code',
        stableKey: 'claude-code:rule:scope-only',
        files: [{ name: 's.md', content: 's' }],
        storage: 'hosted',
        owner: { kind: 'creator', id: creatorId },
        addedBy: creatorId,
        deletedAt: null,
        shortId: 'SCO001',
      })

      // (4) resource with stableKey 'hooks:project:PreToolUse' — should be renamed
      await ctx.db.insert('resources', {
        type: 'hook',
        name: 'pre-tool-use-hook',
        group: 'claude-code',
        stableKey: 'hooks:project:PreToolUse',
        files: [{ name: 'hook.ts', content: 'export default {}' }],
        storage: 'hosted',
        owner: { kind: 'creator', id: creatorId },
        addedBy: creatorId,
        deletedAt: null,
        shortId: 'HK0001',
      })

      // (5) projects row with source:'cli' and cloneCount:5
      const projectId = await ctx.db.insert('projects', {
        name: 'CLI Project',
        slug: 'cli-project-mig01',
        shortId: 'PRJ001',
        creatorId,
        stackId,
        source: 'cli',
        cloneCount: 5,
        published: false,
        createdAt: now,
        updatedAt: now,
      })

      return { orphanResourceId, dualResourceId, scopeOnlyResourceId, projectId }
    })

  const result = await t.mutation(
    internal.migrations['20260612_retire_project_resources'].run,
    {},
  )

  // Counts
  // Seeded scoped rows: orphanResource, dualResource, scopeOnlyResource = 3
  // hookResource has no scope field so scopeCleared stays 3.
  expect(result.projectLinksDeleted).toBe(2)
  expect(result.resourcesSoftDeleted).toBe(1)
  expect(result.scopeCleared).toBe(3)
  expect(result.projectsPatched).toBe(1)
  expect(result.hookKeysRenamed).toBe(1)

  // Zero project links remain
  const remainingProjectLinks = await t.run(async (ctx) =>
    ctx.db
      .query('resourceLinks')
      .withIndex('by_owner', (q) => q.eq('ownerKind', 'project'))
      .collect(),
  )
  expect(remainingProjectLinks).toHaveLength(0)

  // Orphan row has non-null deletedAt
  const orphanRow = await t.run(async (ctx) => ctx.db.get(orphanResourceId))
  expect(orphanRow?.deletedAt).not.toBeNull()

  // Dual-held row has deletedAt null
  const dualRow = await t.run(async (ctx) => ctx.db.get(dualResourceId))
  expect(dualRow?.deletedAt).toBeNull()

  // scopeOnlyResourceId: no links so deletedAt stays null, scope cleared
  const scopeOnlyRow = await t.run(async (ctx) => ctx.db.get(scopeOnlyResourceId))
  expect((scopeOnlyRow as Record<string, unknown> | null)?.scope).toBeUndefined()

  // No resources row carries a defined scope
  const allResources = await t.run(async (ctx) =>
    ctx.db.query('resources').collect(),
  )
  for (const res of allResources) {
    expect(res.scope).toBeUndefined()
  }

  // hooks:project:PreToolUse was renamed to hooks:local:PreToolUse
  const hookRow = allResources.find(
    (r) => (r as unknown as { stableKey: string }).stableKey === 'hooks:local:PreToolUse',
  )
  expect(hookRow).toBeDefined()
  const oldHookRow = allResources.find(
    (r) => (r as unknown as { stableKey: string }).stableKey === 'hooks:project:PreToolUse',
  )
  expect(oldHookRow).toBeUndefined()

  // Projects row has source undefined and cloneCount undefined
  const patchedProject = await t.run(async (ctx) => ctx.db.get(projectId))
  expect(patchedProject?.source).toBeUndefined()
  expect(patchedProject?.cloneCount).toBeUndefined()
})

// ---------------------------------------------------------------------------
// TC-NEW-MIG-02: dual-held resource survives
// ---------------------------------------------------------------------------

test('TC-NEW-MIG-02: dual-held resource survives migration — only project link removed', async () => {
  const t = convexTest(legacySchema, modules)

  const { resourceId, stackId } = await t.run(async (ctx) => {
    const now = Date.now()
    const creatorId = await ctx.db.insert('creators', {
      name: 'Creator MIG02',
      slug: 'creator-mig02',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: now,
    })
    const stackId = await ctx.db.insert('stacks', {
      name: 'Stack MIG02',
      slug: 'stack-mig02',
      shortId: 'MIG02',
      creatorId,
      oneLiner: 'test',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      createdAt: now,
      updatedAt: now,
    })
    const resourceId = await ctx.db.insert('resources', {
      scope: 'project',
      type: 'rule',
      name: 'shared-rule',
      group: 'claude-code',
      stableKey: 'claude-code:rule:shared',
      files: [{ name: 'sh.md', content: 'sh' }],
      storage: 'hosted',
      owner: { kind: 'creator', id: creatorId },
      addedBy: creatorId,
      deletedAt: null,
      shortId: 'SHR002',
    })
    // One project link
    await ctx.db.insert('resourceLinks', {
      resourceId,
      ownerKind: 'project',
      ownerId: 'project-mig02',
      order: 0,
      addedAt: now,
    })
    // One stack link
    await ctx.db.insert('resourceLinks', {
      resourceId,
      ownerKind: 'stack',
      ownerId: stackId,
      order: 0,
      addedAt: now,
    })
    return { resourceId, stackId }
  })

  const result = await t.mutation(
    internal.migrations['20260612_retire_project_resources'].run,
    {},
  )

  expect(result.resourcesSoftDeleted).toBe(0)
  expect(result.projectLinksDeleted).toBe(1)

  // Resource row deletedAt is null
  const row = await t.run(async (ctx) => ctx.db.get(resourceId))
  expect(row?.deletedAt).toBeNull()

  // Zero project links remain
  const projectLinks = await t.run(async (ctx) =>
    ctx.db
      .query('resourceLinks')
      .withIndex('by_owner', (q) => q.eq('ownerKind', 'project'))
      .collect(),
  )
  expect(projectLinks).toHaveLength(0)

  // Exactly one stack link remains
  const stackLinks = await t.run(async (ctx) =>
    ctx.db
      .query('resourceLinks')
      .withIndex('by_owner', (q) => q.eq('ownerKind', 'stack').eq('ownerId', stackId))
      .collect(),
  )
  expect(stackLinks).toHaveLength(1)
})

// ---------------------------------------------------------------------------
// TC-NEW-MIG-03: second run is idempotent
// ---------------------------------------------------------------------------

test('TC-NEW-MIG-03: second run is idempotent — returns all-zero counts', async () => {
  const t = convexTest(legacySchema, modules)

  // Seed the same state as TC-NEW-MIG-01
  await t.run(async (ctx) => {
    const now = Date.now()
    const creatorId = await ctx.db.insert('creators', {
      name: 'Creator MIG03',
      slug: 'creator-mig03',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: now,
    })
    const stackId = await ctx.db.insert('stacks', {
      name: 'Stack MIG03',
      slug: 'stack-mig03',
      shortId: 'MIG03',
      creatorId,
      oneLiner: 'test',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      createdAt: now,
      updatedAt: now,
    })

    // Orphan
    const orphanId = await ctx.db.insert('resources', {
      scope: 'project',
      type: 'rule',
      name: 'orphan',
      group: 'claude-code',
      stableKey: 'claude-code:rule:orphan-mig03',
      files: [{ name: 'o.md', content: 'o' }],
      storage: 'hosted',
      owner: { kind: 'creator', id: creatorId },
      addedBy: creatorId,
      deletedAt: null,
      shortId: 'ORP003',
    })
    await ctx.db.insert('resourceLinks', {
      resourceId: orphanId,
      ownerKind: 'project',
      ownerId: 'project-orphan-mig03',
      order: 0,
      addedAt: now,
    })

    // Project with source + cloneCount
    await ctx.db.insert('projects', {
      name: 'CLI Proj MIG03',
      slug: 'cli-proj-mig03',
      shortId: 'CP003',
      creatorId,
      stackId,
      source: 'cli',
      cloneCount: 3,
      published: false,
      createdAt: now,
      updatedAt: now,
    })
  })

  // First run
  await t.mutation(
    internal.migrations['20260612_retire_project_resources'].run,
    {},
  )

  // Second run
  const second = await t.mutation(
    internal.migrations['20260612_retire_project_resources'].run,
    {},
  )

  expect(second.projectLinksDeleted).toBe(0)
  expect(second.resourcesSoftDeleted).toBe(0)
  expect(second.scopeCleared).toBe(0)
  expect(second.projectsPatched).toBe(0)
  expect(second.hookKeysRenamed).toBe(0)
})
