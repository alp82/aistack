/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { api, internal } from './_generated/api'
import type { MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import {
  upsertResourcesForOwner,
  type ResourceInputItem,
} from './lib/resourceLinks'
import { slugifyAscii } from '../src/lib/slug'

const modules = import.meta.glob('./**/*.{js,ts}')

/**
 * Test-only seed: insert a project row, then attach all items to the stack
 * (stack-only, no project-scoped resources — post-narrowing contract).
 */
async function seedStackWithResources(
  t: ReturnType<typeof convexTest>,
  args: {
    creatorId: Id<'creators'>
    stackId: Id<'stacks'>
    name: string
    resources: ResourceInputItem[]
  },
): Promise<Id<'projects'>> {
  return await t.run(async (ctx: MutationCtx) => {
    const now = Date.now()
    const projectId = await ctx.db.insert('projects', {
      name: args.name,
      slug: slugifyAscii(args.name, 'project'),
      shortId: `P${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      creatorId: args.creatorId,
      stackId: args.stackId,
      published: false,
      createdAt: now,
      updatedAt: now,
    })

    if (args.resources.length > 0) {
      await upsertResourcesForOwner(ctx, {
        addedBy: args.creatorId,
        ownerKind: 'stack',
        ownerId: args.stackId,
        items: args.resources,
      })
    }
    return projectId
  })
}

async function seedCreatorAndStack(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const now = Date.now()
    const creatorId = await ctx.db.insert('creators', {
      name: 'Test Creator',
      slug: 'test-creator',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: now,
    })
    const stackId = await ctx.db.insert('stacks', {
      name: 'Test Stack',
      slug: 'test-stack',
      shortId: 'STK001',
      creatorId,
      oneLiner: 'A test stack',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      createdAt: now,
      updatedAt: now,
    })
    return { creatorId, stackId }
  })
}

async function resourcesForOwner(
  t: ReturnType<typeof convexTest>,
  ownerKind: 'stack',
  ownerId: string,
) {
  return await t.run(async (ctx: MutationCtx) => {
    const links = await ctx.db
      .query('resourceLinks')
      .withIndex('by_owner', (q) =>
        q.eq('ownerKind', ownerKind).eq('ownerId', ownerId),
      )
      .collect()
    links.sort((a, b) => a.order - b.order)
    const out: Doc<'resources'>[] = []
    for (const link of links) {
      const doc = await ctx.db.get(link.resourceId)
      if (doc) out.push(doc)
    }
    return out
  })
}

// ---------------------------------------------------------------------------
// upsertStackResources — scope coercion
// ---------------------------------------------------------------------------

test('TC-01: upsertStackResources with scope:project input lands on stack — no project links', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  const preCall = Date.now()

  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'scope-coerce',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'k:rule:scope-coerce',
        files: [{ name: 'r.md', content: 'v1' }],
      },
    ],
  })

  const stackResources = await resourcesForOwner(t, 'stack', stackId)
  expect(stackResources).toHaveLength(1)
  expect(stackResources[0].storage).toBe('hosted')

  // No project links created by this call
  const allLinks = await t.run(async (ctx: MutationCtx) =>
    ctx.db.query('resourceLinks').collect(),
  )
  const projectLinks = allLinks.filter((l) => (l.ownerKind as string) === 'project')
  expect(projectLinks).toHaveLength(0)

  // All links are stack-owned
  expect(allLinks.every((l) => l.ownerKind === 'stack')).toBe(true)

  // stack.updatedAt bumped
  const stack = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  expect(stack!.updatedAt).toBeGreaterThan(preCall)
})

test('TC-02: upsertStackResources with scope:global lands on stack', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'already-global',
        group: 'claude-code',
        scope: 'global',
        stableKey: 'k:rule:already-global',
        files: [{ name: 'g.md', content: 'global' }],
      },
    ],
  })

  const stackResources = await resourcesForOwner(t, 'stack', stackId)
  expect(stackResources).toHaveLength(1)

  const allLinks = await t.run(async (ctx: MutationCtx) =>
    ctx.db.query('resourceLinks').collect(),
  )
  expect(allLinks).toHaveLength(1)
  expect(allLinks[0].ownerKind).toBe('stack')
})

test('TC-03: upsertStackResources with scope omitted lands on stack', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'no-scope',
        group: 'claude-code',
        stableKey: 'k:rule:no-scope',
        files: [{ name: 'ns.md', content: 'no scope' }],
      },
    ],
  })

  const stackResources = await resourcesForOwner(t, 'stack', stackId)
  expect(stackResources).toHaveLength(1)
})

test('TC-04: upsertStackResources three scope variants all land on stack', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'r-project',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'k:rule:r-project',
        files: [{ name: 'a.md', content: 'a' }],
      },
      {
        type: 'rule',
        name: 'r-global',
        group: 'claude-code',
        scope: 'global',
        stableKey: 'k:rule:r-global',
        files: [{ name: 'b.md', content: 'b' }],
      },
      {
        type: 'rule',
        name: 'r-absent',
        group: 'claude-code',
        stableKey: 'k:rule:r-absent',
        files: [{ name: 'c.md', content: 'c' }],
      },
    ],
  })

  const stackResources = await resourcesForOwner(t, 'stack', stackId)
  expect(stackResources).toHaveLength(3)

  const allLinks = await t.run(async (ctx: MutationCtx) =>
    ctx.db.query('resourceLinks').collect(),
  )
  expect(allLinks.every((l) => l.ownerKind === 'stack')).toBe(true)
})

test('TC-05: upsertStackResources bumps stack.updatedAt on each successive call', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  // Baseline from the seeded row (not a post-seed Date.now(), which can land on
  // the same millisecond as the mutation's patch and make `>` racy).
  const seeded = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  const t0 = seeded!.updatedAt

  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'first',
        group: 'claude-code',
        stableKey: 'k:rule:first',
        files: [{ name: 'f.md', content: 'first' }],
      },
    ],
  })

  const afterFirst = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  expect(afterFirst!.updatedAt).toBeGreaterThanOrEqual(t0)
  const afterFirstTs = afterFirst!.updatedAt

  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'second',
        group: 'claude-code',
        stableKey: 'k:rule:second',
        files: [{ name: 's.md', content: 'second' }],
      },
    ],
  })

  const afterSecond = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  expect(afterSecond!.updatedAt).toBeGreaterThanOrEqual(afterFirstTs)
})

// ---------------------------------------------------------------------------
// upsertStackResources — merge-by-stableKey
// ---------------------------------------------------------------------------

test('TC-06: upsertStackResources first-time upsert creates one resources row and one stack link', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'A',
        group: 'claude-code',
        stableKey: 'k:rule:A',
        files: [{ name: 'A.md', content: 'A v1' }],
      },
    ],
  })

  const rows = await t.run(async (ctx) => ctx.db.query('resources').collect())
  expect(rows).toHaveLength(1)
  expect(rows[0].storage).toBe('hosted')
  expect(rows[0].owner).toEqual({ kind: 'creator', id: creatorId })

  const links = await t.run(async (ctx: MutationCtx) =>
    ctx.db.query('resourceLinks').collect(),
  )
  expect(links).toHaveLength(1)
  expect(links[0].ownerKind).toBe('stack')
  expect(links[0].ownerId).toBe(stackId)
})

test('TC-07: upsertStackResources merge — A preserved, B updated, C added', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  // First call: seed A and B
  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'A',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'k:rule:A',
        files: [{ name: 'A.md', content: 'A v1' }],
      },
      {
        type: 'rule',
        name: 'B',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'k:rule:B',
        files: [{ name: 'B.md', content: 'B v1' }],
      },
    ],
  })

  // Second call: B updated, C new
  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'B',
        group: 'claude-code',
        stableKey: 'k:rule:B',
        files: [{ name: 'B.md', content: 'B v2' }],
      },
      {
        type: 'rule',
        name: 'C',
        group: 'claude-code',
        stableKey: 'k:rule:C',
        files: [{ name: 'C.md', content: 'C v1' }],
      },
    ],
  })

  const stackResources = await resourcesForOwner(t, 'stack', stackId)
  expect(stackResources).toHaveLength(3)

  const byKey = new Map(stackResources.map((r) => [r.stableKey, r]))
  expect(byKey.get('k:rule:A')?.files?.[0]?.content).toBe('A v1')
  expect(byKey.get('k:rule:B')?.files?.[0]?.content).toBe('B v2')
  expect(byKey.get('k:rule:C')?.files?.[0]?.content).toBe('C v1')
})

test('TC-08: upsertStackResources omitting a stableKey on re-upsert keeps its existing link', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'keep',
        group: 'claude-code',
        stableKey: 'k:rule:keep',
        files: [{ name: 'keep.md', content: 'keep' }],
      },
    ],
  })

  // Second call omits 'keep'
  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'other',
        group: 'claude-code',
        stableKey: 'k:rule:other',
        files: [{ name: 'other.md', content: 'other' }],
      },
    ],
  })

  const stackResources = await resourcesForOwner(t, 'stack', stackId)
  const keys = stackResources.map((r) => r.stableKey).sort()
  expect(keys).toEqual(['k:rule:keep', 'k:rule:other'])
})

test('TC-09: upsertStackResources with items:[] preserves existing links and bumps updatedAt', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'exists',
        group: 'claude-code',
        stableKey: 'k:rule:exists',
        files: [{ name: 'e.md', content: 'e' }],
      },
    ],
  })

  const afterFirst = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  const tsAfterFirst = afterFirst!.updatedAt

  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [],
  })

  const stackResources = await resourcesForOwner(t, 'stack', stackId)
  expect(stackResources).toHaveLength(1) // link preserved

  const afterEmpty = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  expect(afterEmpty!.updatedAt).toBeGreaterThanOrEqual(tsAfterFirst)
})

test('TC-10: upsertStackResources resurrects a soft-deleted resources row and reuses its _id', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'R',
        group: 'claude-code',
        stableKey: 'k:rule:R',
        files: [{ name: 'R.md', content: 'R v1' }],
      },
    ],
  })

  const before = await resourcesForOwner(t, 'stack', stackId)
  const originalId = before[0]._id

  // Manually soft-delete the resources row and delete its resourceLinks row
  await t.run(async (ctx: MutationCtx) => {
    const links = await ctx.db
      .query('resourceLinks')
      .withIndex('by_owner', (q) =>
        q.eq('ownerKind', 'stack').eq('ownerId', stackId),
      )
      .collect()
    for (const link of links) {
      await ctx.db.delete(link._id)
      await ctx.db.patch(link.resourceId, { deletedAt: Date.now() })
    }
  })

  const softDeleted = await t.run(async (ctx: MutationCtx) => ctx.db.get(originalId))
  expect(softDeleted?.deletedAt).not.toBeNull()

  // Re-upsert same stableKey with new content
  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'R renamed',
        group: 'claude-code',
        stableKey: 'k:rule:R',
        files: [{ name: 'R.md', content: 'R v2' }],
      },
    ],
  })

  const resurrected = await t.run(async (ctx: MutationCtx) => ctx.db.get(originalId))
  expect(resurrected?.deletedAt).toBeNull()
  expect(resurrected?.name).toBe('R renamed')
  expect(resurrected?.files?.[0]?.content).toBe('R v2')

  const newLinks = await resourcesForOwner(t, 'stack', stackId)
  expect(newLinks.map((l) => l._id)).toContainEqual(originalId)
})

test('TC-11: upsertStackResources pkg (MCP) resource is deduped by (registry,id) across two stacks', async () => {
  const t = convexTest(schema, modules)
  const { creatorId: creatorA, stackId: stackA } = await seedCreatorAndStack(t)

  const { creatorB, stackB } = await t.run(async (ctx) => {
    const now = Date.now()
    const creatorB = await ctx.db.insert('creators', {
      name: 'Creator B',
      slug: 'creator-b-tc11',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: now,
    })
    const stackB = await ctx.db.insert('stacks', {
      name: 'Stack B',
      slug: 'stack-b-tc11',
      shortId: 'SKB011',
      creatorId: creatorB,
      oneLiner: 'b',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      createdAt: now,
      updatedAt: now,
    })
    return { creatorB, stackB }
  })

  const pkgItem = {
    type: 'mcp',
    name: 'context7',
    group: 'claude-code',
    stableKey: 'linked:pkg:npm:@upstash/context7-mcp',
    pkg: {
      registry: 'npm' as const,
      id: '@upstash/context7-mcp',
      transport: 'stdio' as const,
    },
  }

  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId: creatorA,
    stackId: stackA,
    resources: [pkgItem],
  })
  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId: creatorB,
    stackId: stackB,
    resources: [pkgItem],
  })

  // Exactly one shared resources row
  const rows = await t.run(async (ctx) =>
    ctx.db
      .query('resources')
      .withIndex('by_pkg', (q) =>
        q.eq('pkg.registry', 'npm').eq('pkg.id', '@upstash/context7-mcp'),
      )
      .collect(),
  )
  expect(rows).toHaveLength(1)
  expect(rows[0].storage).toBe('linked')
  expect(rows[0].owner).toEqual({
    kind: 'package',
    registry: 'npm',
    id: '@upstash/context7-mcp',
  })
  expect(rows[0].files).toBeUndefined()

  // Two resourceLinks rows — one per stack
  const links = await t.run(async (ctx) =>
    ctx.db
      .query('resourceLinks')
      .withIndex('by_resourceId', (q) => q.eq('resourceId', rows[0]._id))
      .collect(),
  )
  expect(links).toHaveLength(2)
  const ownerIds = links.map((l) => l.ownerId).sort()
  expect(ownerIds).toContain(stackA)
  expect(ownerIds).toContain(stackB)
})

test('TC-12: upsertStackResources guard — linked-with-files throws; hosted-without-files throws', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  // (a) linked resource carrying files
  await expect(
    t.mutation(internal.httpCliHelpers.upsertStackResources, {
      creatorId,
      stackId,
      resources: [
        {
          type: 'rule',
          name: 'linked-with-files',
          group: 'claude-code',
          stableKey: 'k:rule:linked-with-files',
          files: [{ name: 'x.md', content: 'x' }],
          upstream: { repoUrl: 'https://github.com/acme/repo', path: 'x.md' },
        },
      ],
    }),
  ).rejects.toThrow(/linked resource must not carry files/)

  // (b) hosted resource with no files, no upstream, no pkg
  await expect(
    t.mutation(internal.httpCliHelpers.upsertStackResources, {
      creatorId,
      stackId,
      resources: [
        {
          type: 'rule',
          name: 'hosted-without-files',
          group: 'claude-code',
          stableKey: 'k:rule:hosted-without-files',
        },
      ],
    }),
  ).rejects.toThrow(/hosted resource must carry files/)

  // No rows written in either case
  const rows = await t.run(async (ctx) => ctx.db.query('resources').collect())
  expect(rows).toHaveLength(0)
})

// ---------------------------------------------------------------------------
// getStackWithResourcesByCreator (internalQuery)
// ---------------------------------------------------------------------------

test('TC-13: getStackWithResourcesByCreator returns name, composed slug, shortId, and serialized resources', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'r1',
        group: 'claude-code',
        stableKey: 'k:rule:r1',
        files: [{ name: 'r1.md', content: 'r1' }],
      },
      {
        type: 'rule',
        name: 'r2',
        group: 'claude-code',
        stableKey: 'k:rule:r2',
        files: [{ name: 'r2.md', content: 'r2' }],
      },
    ],
  })

  const stack = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))

  const result = await t.query(internal.httpCliHelpers.getStackWithResourcesByCreator, {
    creatorId,
  })

  expect(result).not.toBeNull()
  expect(result!.name).toBe('Test Stack')
  // composed slug: `${stack.slug}-${stack.shortId}`
  expect(result!.slug).toBe(`${stack!.slug}-${stack!.shortId}`)
  expect(result!.shortId).toBe(stack!.shortId)
  expect(result!.resources).toHaveLength(2)

  // Serialized Resource shape: no _id, no deletedAt
  for (const res of result!.resources) {
    expect((res as Record<string, unknown>)._id).toBeUndefined()
    expect((res as Record<string, unknown>).deletedAt).toBeUndefined()
    expect(res.stableKey).toBeDefined()
    expect(res.storage).toBeDefined()
  }
})

test('TC-14: getStackWithResourcesByCreator returns null when creator has no stack', async () => {
  const t = convexTest(schema, modules)

  const creatorNoStack = await t.run(async (ctx) =>
    ctx.db.insert('creators', {
      name: 'Stackless',
      slug: 'stackless-tc14',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )

  const result = await t.query(internal.httpCliHelpers.getStackWithResourcesByCreator, {
    creatorId: creatorNoStack,
  })

  expect(result).toBeNull()
})

test('TC-15: getStackWithResourcesByCreator excludes soft-deleted resources rows', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'live',
        group: 'claude-code',
        stableKey: 'k:rule:live',
        files: [{ name: 'live.md', content: 'live' }],
      },
      {
        type: 'rule',
        name: 'deleted',
        group: 'claude-code',
        stableKey: 'k:rule:deleted',
        files: [{ name: 'del.md', content: 'del' }],
      },
    ],
  })

  // Soft-delete the second row
  await t.run(async (ctx: MutationCtx) => {
    const rows = await ctx.db
      .query('resources')
      .withIndex('by_addedBy_stableKey', (q) =>
        q.eq('addedBy', creatorId).eq('stableKey', 'k:rule:deleted'),
      )
      .first()
    if (rows) {
      await ctx.db.patch(rows._id, { deletedAt: Date.now() })
    }
  })

  const result = await t.query(internal.httpCliHelpers.getStackWithResourcesByCreator, {
    creatorId,
  })

  expect(result!.resources).toHaveLength(1)
  expect(result!.resources[0].stableKey).toBe('k:rule:live')
})

// ---------------------------------------------------------------------------
// stackCollect (httpAction) + stackGet
// KNOWN LIMITATION: convex-test supports t.fetch() for httpActions but the
// new stackCollect/stackGet actions don't exist yet. These tests call t.fetch()
// against the routes that will be registered once the implementation lands.
// They are intentionally red until both the action and the http.ts route
// registration exist.
// ---------------------------------------------------------------------------

async function seedBearerToken(
  t: ReturnType<typeof convexTest>,
  userId: string,
): Promise<string> {
  const token = `test-token-${userId}-${Math.random().toString(36).slice(2)}`
  const now = Date.now()
  await t.run(async (ctx: MutationCtx) => {
    await ctx.db.insert('cliTokens', {
      token,
      userId,
      createdAt: now,
      expiresAt: now + 90 * 24 * 60 * 60 * 1000,
      lastUsedAt: now,
    })
  })
  return token
}

test('TC-16: stackCollect returns 200 with slug/shortId/url; resource lands on stack', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-tc16' }))
  const bearerToken = await seedBearerToken(t, 'user-tc16')

  const stack = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  const composedSlug = `${stack!.slug}-${stack!.shortId}`

  const resp = await t.fetch('/api/cli/stacks/collect', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resources: [
        {
          type: 'rule',
          name: 'tc16-rule',
          group: 'claude-code',
          scope: 'project',
          stableKey: 'k:rule:tc16',
          files: [{ name: 'r.md', content: 'v1' }],
        },
      ],
    }),
  })

  expect(resp.status).toBe(200)
  const body = await resp.json() as Record<string, unknown>
  expect(body.slug).toBe(composedSlug)
  expect(body.shortId).toBe(stack!.shortId)
  // url must contain /stacks/ and NOT /projects/
  expect(body.url).toMatch(/\/stacks\//)
  expect(body.url).not.toMatch(/\/projects\//)

  // resource row lands on the stack
  const stackResources = await resourcesForOwner(t, 'stack', stackId)
  expect(stackResources).toHaveLength(1)
})

test('TC-17: stackCollect returns 400 when creator exists but has no stack', async () => {
  const t = convexTest(schema, modules)
  await t.run(async (ctx) =>
    ctx.db.insert('creators', {
      name: 'No Stack Creator',
      slug: 'no-stack-tc17',
      userId: 'user-tc17',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )
  const bearerToken = await seedBearerToken(t, 'user-tc17')

  const resp = await t.fetch('/api/cli/stacks/collect', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resources: [] }),
  })

  expect(resp.status).toBe(400)
  const body = await resp.json() as Record<string, unknown>
  expect(JSON.stringify(body)).toMatch(/stack/i)
})

test('TC-18: stackCollect returns 401 with missing or invalid Authorization header', async () => {
  const t = convexTest(schema, modules)

  // (a) no Authorization header
  const respNoAuth = await t.fetch('/api/cli/stacks/collect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resources: [] }),
  })
  expect(respNoAuth.status).toBe(401)

  // (b) Bearer with invalid token
  const respBadToken = await t.fetch('/api/cli/stacks/collect', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer invalid-token-xyz',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resources: [] }),
  })
  expect(respBadToken.status).toBe(401)
})

test('TC-19: stackCollect returns 404 when valid bearer has no creators row', async () => {
  const t = convexTest(schema, modules)
  // Seed a token for a userId that has no creators row
  const bearerToken = await seedBearerToken(t, 'user-tc19-orphan')

  const resp = await t.fetch('/api/cli/stacks/collect', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resources: [] }),
  })

  expect(resp.status).toBe(404)
})

test('TC-20: stackCollect url invariant — returned url does NOT contain /projects/', async () => {
  const t = convexTest(schema, modules)
  const { creatorId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-tc20' }))
  const bearerToken = await seedBearerToken(t, 'user-tc20')

  const resp = await t.fetch('/api/cli/stacks/collect', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resources: [
        {
          type: 'rule',
          name: 'tc20-rule',
          group: 'claude-code',
          stableKey: 'k:rule:tc20',
          files: [{ name: 'r.md', content: 'v1' }],
        },
      ],
    }),
  })

  expect(resp.status).toBe(200)
  const body = await resp.json() as Record<string, unknown>
  expect(body.url as string).not.toMatch(/\/projects\//)
})

// ---------------------------------------------------------------------------
// stackGet (httpAction) — GET /api/cli/stacks
// ---------------------------------------------------------------------------

test('TC-21: stackGet returns 200 with name/slug/shortId/resources for a valid bearer', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-tc21' }))
  const bearerToken = await seedBearerToken(t, 'user-tc21')

  // Upload one resource first so resources array is non-empty.
  await t.mutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId,
    stackId,
    resources: [
      {
        type: 'rule',
        name: 'tc21-rule',
        group: 'claude-code',
        stableKey: 'k:rule:tc21',
        files: [{ name: 'r.md', content: 'v1' }],
      },
    ],
  })

  const stack = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  const composedSlug = `${stack!.slug}-${stack!.shortId}`

  const resp = await t.fetch('/api/cli/stacks', {
    method: 'GET',
    headers: { Authorization: `Bearer ${bearerToken}` },
  })

  expect(resp.status).toBe(200)
  const body = await resp.json() as Record<string, unknown>
  expect(body.name).toBe('Test Stack')
  expect(body.slug).toBe(composedSlug)
  expect(body.shortId).toBe(stack!.shortId)
  expect(Array.isArray(body.resources)).toBe(true)
  expect((body.resources as unknown[]).length).toBe(1)
})

test('TC-22: stackGet returns 401 with missing or invalid Authorization header', async () => {
  const t = convexTest(schema, modules)

  // (a) no Authorization header
  const respNoAuth = await t.fetch('/api/cli/stacks', { method: 'GET' })
  expect(respNoAuth.status).toBe(401)

  // (b) Bearer with invalid token
  const respBadToken = await t.fetch('/api/cli/stacks', {
    method: 'GET',
    headers: { Authorization: 'Bearer totally-invalid-token' },
  })
  expect(respBadToken.status).toBe(401)
})

test('TC-23: stackGet returns 404 when valid bearer has no creators row', async () => {
  const t = convexTest(schema, modules)
  const bearerToken = await seedBearerToken(t, 'user-tc23-orphan')

  const resp = await t.fetch('/api/cli/stacks', {
    method: 'GET',
    headers: { Authorization: `Bearer ${bearerToken}` },
  })

  expect(resp.status).toBe(404)
  const body = await resp.json() as Record<string, unknown>
  expect(typeof body.error).toBe('string')
})

test('TC-24: stackGet returns 404 when creator exists but has no stack', async () => {
  const t = convexTest(schema, modules)
  await t.run(async (ctx) =>
    ctx.db.insert('creators', {
      name: 'No Stack',
      slug: 'no-stack-tc24',
      userId: 'user-tc24',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )
  const bearerToken = await seedBearerToken(t, 'user-tc24')

  const resp = await t.fetch('/api/cli/stacks', {
    method: 'GET',
    headers: { Authorization: `Bearer ${bearerToken}` },
  })

  expect(resp.status).toBe(404)
  const body = await resp.json() as Record<string, unknown>
  expect(JSON.stringify(body)).toMatch(/stack/i)
})


test('getResourceBrowserContext returns empty arrays and not-found early returns', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  // Stack target with no resources -> empty stackResources, valid contract.
  const stackCtx = await t.query(api.resources.getResourceBrowserContext, {
    target: { kind: 'stack', id: stackId },
  })
  expect(stackCtx.stackResources).toEqual([])
  expect(stackCtx.stackName).toBe('Test Stack')
  expect(stackCtx.stackId).toBe(stackId)
  // Narrowed contract: project fields must NOT appear on a stack target.
  expect('projectResources' in stackCtx).toBe(false)
  expect('projectName' in stackCtx).toBe(false)

  // Not-found stack target -> all-empty early return.
  const missingId = await t.run(async (ctx) => {
    const id = await ctx.db.insert('stacks', {
      name: 'tmp',
      slug: 'tmp',
      shortId: 'TMP999',
      creatorId,
      oneLiner: 'x',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    await ctx.db.delete(id)
    return id
  })
  const notFound = await t.query(api.resources.getResourceBrowserContext, {
    target: { kind: 'stack', id: missingId },
  })
  expect(notFound.stackName).toBe('')
  expect(notFound.stackId).toBeUndefined()
  expect(notFound.stackResources).toEqual([])
})

test('updateResourceContent patches the resources row, not an embedded array', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  // Give the creator an authenticated identity.
  await t.run(async (ctx) =>
    ctx.db.patch(creatorId, { userId: 'user-1' }),
  )

  await seedStackWithResources(t, {
    creatorId,
    stackId,
    name: 'p',
    resources: [
      {
        type: 'rule',
        name: 'stack-rule',
        group: 'claude-code',
        stableKey: 'claude-code:rule:stack-rule',
        files: [{ name: 'g.md', content: 'before' }],
      },
    ],
  })

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await asUser.mutation(api.resources.updateResourceContent, {
    target: { kind: 'stack', id: stackId },
    stableKey: 'claude-code:rule:stack-rule',
    fileName: 'g.md',
    content: 'after',
  })

  const stackResources = await resourcesForOwner(t, 'stack', stackId)
  expect(stackResources[0].files?.[0]?.content).toBe('after')
})

test('deleteProject removes only the project row and leaves stack resources untouched', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  await seedStackWithResources(t, {
    creatorId,
    stackId,
    name: 'p',
    resources: [
      {
        type: 'rule',
        name: 'stack-only',
        group: 'claude-code',
        stableKey: 'claude-code:rule:stack-only',
        files: [{ name: 'o.md', content: 'o' }],
      },
    ],
  })

  const project = (await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .first(),
  ))!

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await asUser.mutation(api.projects.deleteProject, { projectId: project._id })

  // Project row gone
  const gone = await t.run(async (ctx: MutationCtx) => ctx.db.get(project._id))
  expect(gone).toBeNull()

  // Stack link still present
  const stackResources = await resourcesForOwner(t, 'stack', stackId)
  expect(stackResources).toHaveLength(1)

  // Resources row NOT soft-deleted
  expect(stackResources[0].deletedAt).toBeNull()
})

// TC-1207: DELETED — subject gone; coverage held by TC-NEW-MIG-02 (migration
// dual-held test) and the rewritten TC-1450 (unlinkResource shared-row-stays-alive).

test('reset_resources hard-deletes all rows and is idempotent', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  // Seed one resources row + one resourceLinks row pointing at it.
  await t.run(async (ctx) => {
    const now = Date.now()
    const resourceId = await ctx.db.insert('resources', {
      type: 'rule',
      name: 'to-wipe',
      group: 'claude-code',
      stableKey: 'claude-code:rule:to-wipe',
      files: [{ name: 'w.md', content: 'w' }],
      storage: 'hosted',
      owner: { kind: 'creator', id: creatorId },
      addedBy: creatorId,
      deletedAt: null,
      shortId: 'RES001',
    })
    await ctx.db.insert('resourceLinks', {
      resourceId,
      ownerKind: 'stack',
      ownerId: stackId,
      order: 0,
      addedAt: now,
    })
  })

  const first = await t.mutation(
    internal.migrations['20260529_reset_resources'].run,
    {},
  )
  expect(first.resourcesDeleted).toBeGreaterThanOrEqual(1)
  expect(first.linksDeleted).toBeGreaterThanOrEqual(1)

  // Both tables are empty after the reset.
  const resourcesAfter = await t.run(async (ctx) =>
    ctx.db.query('resources').collect(),
  )
  const linksAfter = await t.run(async (ctx) =>
    ctx.db.query('resourceLinks').collect(),
  )
  expect(resourcesAfter).toHaveLength(0)
  expect(linksAfter).toHaveLength(0)

  // Second run deletes nothing and returns zeros.
  const second = await t.mutation(
    internal.migrations['20260529_reset_resources'].run,
    {},
  )
  expect(second.resourcesDeleted).toBe(0)
  expect(second.linksDeleted).toBe(0)
})




test('unlinkResource removes one link and leaves the others intact', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  await seedStackWithResources(t, {
    creatorId,
    stackId,
    name: 'p',
    resources: [
      {
        type: 'rule',
        name: 'A',
        group: 'claude-code',
        stableKey: 'claude-code:rule:A',
        files: [{ name: 'A.md', content: 'A' }],
      },
      {
        type: 'rule',
        name: 'B',
        group: 'claude-code',
        stableKey: 'claude-code:rule:B',
        files: [{ name: 'B.md', content: 'B' }],
      },
    ],
  })

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await asUser.mutation(api.resources.unlinkResource, {
    target: { kind: 'stack', id: stackId },
    stableKey: 'claude-code:rule:A',
  })

  const items = await resourcesForOwner(t, 'stack', stackId)
  expect(items.map((i) => i.stableKey)).toEqual(['claude-code:rule:B'])
})

test('unlinkResource soft-deletes the resource when it drops the last link', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  await seedStackWithResources(t, {
    creatorId,
    stackId,
    name: 'p',
    resources: [
      {
        type: 'rule',
        name: 'solo',
        group: 'claude-code',
        stableKey: 'claude-code:rule:solo',
        files: [{ name: 's.md', content: 's' }],
      },
    ],
  })

  const resourceId = (await resourcesForOwner(t, 'stack', stackId))[0]._id

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await asUser.mutation(api.resources.unlinkResource, {
    target: { kind: 'stack', id: stackId },
    stableKey: 'claude-code:rule:solo',
  })

  const links = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('resourceLinks')
      .withIndex('by_resourceId', (q) => q.eq('resourceId', resourceId))
      .collect(),
  )
  expect(links).toHaveLength(0)

  const row = await t.run(async (ctx: MutationCtx) => ctx.db.get(resourceId))
  expect(row?.deletedAt).not.toBeNull()
})

test('unlinkResource keeps a shared resource alive when another owner still links it', async () => {
  const t = convexTest(schema, modules)
  const { creatorId: creatorA, stackId: stackA } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorA, { userId: 'user-a' }))

  // Seed a second stack (stackB) to act as the second owner.
  const { stackB } = await t.run(async (ctx) => {
    const now = Date.now()
    const creatorB = await ctx.db.insert('creators', {
      name: 'Creator B 1450',
      slug: 'creator-b-1450',
      userId: 'user-b-1450',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: now,
    })
    const stackB = await ctx.db.insert('stacks', {
      name: 'Stack B 1450',
      slug: 'stack-b-1450',
      shortId: 'SKB1450',
      creatorId: creatorB,
      oneLiner: 'b',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      createdAt: now,
      updatedAt: now,
    })
    return { creatorB, stackB }
  })

  // Item lands on stackA.
  await seedStackWithResources(t, {
    creatorId: creatorA,
    stackId: stackA,
    name: 'p-a',
    resources: [
      {
        type: 'rule',
        name: 'shared',
        group: 'claude-code',
        stableKey: 'claude-code:rule:shared-1450',
        files: [{ name: 's.md', content: 's' }],
      },
    ],
  })
  const resourceId = (await resourcesForOwner(t, 'stack', stackA))[0]._id

  // Attach a second link to the same resource from stackB.
  const now = Date.now()
  await t.run(async (ctx: MutationCtx) => {
    await ctx.db.insert('resourceLinks', {
      resourceId,
      ownerKind: 'stack',
      ownerId: stackB,
      order: 0,
      addedAt: now,
    })
  })

  // Unlink from stackB.
  const asUserB = t.withIdentity({ tokenIdentifier: 'convex|user-b-1450' })
  await asUserB.mutation(api.resources.unlinkResource, {
    target: { kind: 'stack', id: stackB },
    stableKey: 'claude-code:rule:shared-1450',
  })

  expect(await resourcesForOwner(t, 'stack', stackB)).toHaveLength(0)
  expect(await resourcesForOwner(t, 'stack', stackA)).toHaveLength(1)
  const row = await t.run(async (ctx: MutationCtx) => ctx.db.get(resourceId))
  expect(row?.deletedAt).toBeNull()
})

test('unlinkResource is a no-op when the stableKey is not linked', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  await seedStackWithResources(t, {
    creatorId,
    stackId,
    name: 'p',
    resources: [
      {
        type: 'rule',
        name: 'present',
        group: 'claude-code',
        stableKey: 'claude-code:rule:present',
        files: [{ name: 'p.md', content: 'p' }],
      },
    ],
  })

  const stackBefore = (await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId)))!
  const before = stackBefore.updatedAt

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await asUser.mutation(api.resources.unlinkResource, {
    target: { kind: 'stack', id: stackId },
    stableKey: 'claude-code:rule:does-not-exist',
  })

  // No-op must not bump the stack's updatedAt.
  const stackAfter = (await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId)))!
  expect(stackAfter.updatedAt).toBe(before)

  const items = await resourcesForOwner(t, 'stack', stackId)
  expect(items.map((i) => i.stableKey)).toEqual(['claude-code:rule:present'])
})

test('unlinkResource rejects a non-owner', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'owner-user' }))

  await seedStackWithResources(t, {
    creatorId,
    stackId,
    name: 'p',
    resources: [
      {
        type: 'rule',
        name: 'x',
        group: 'claude-code',
        stableKey: 'claude-code:rule:x',
        files: [{ name: 'x.md', content: 'x' }],
      },
    ],
  })

  const asOther = t.withIdentity({ tokenIdentifier: 'convex|intruder' })
  await expect(
    asOther.mutation(api.resources.unlinkResource, {
      target: { kind: 'stack', id: stackId },
      stableKey: 'claude-code:rule:x',
    }),
  ).rejects.toThrow('Not authorized')

  const items = await resourcesForOwner(t, 'stack', stackId)
  expect(items).toHaveLength(1)
})

test('deleteProject rejects a published project and allows an unpublished one', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  const now = Date.now()
  const { publishedId, draftId } = await t.run(async (ctx: MutationCtx) => {
    const publishedId = await ctx.db.insert('projects', {
      name: 'Published',
      slug: 'published',
      shortId: 'PUB001',
      creatorId,
      stackId,
      published: true,
      createdAt: now,
      updatedAt: now,
    })
    const draftId = await ctx.db.insert('projects', {
      name: 'Draft',
      slug: 'draft',
      shortId: 'DRF001',
      creatorId,
      stackId,
      published: false,
      createdAt: now,
      updatedAt: now,
    })
    return { publishedId, draftId }
  })

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })

  // Published project cannot be hard-deleted.
  await expect(
    asUser.mutation(api.projects.deleteProject, { projectId: publishedId }),
  ).rejects.toThrow(/published/i)
  const stillThere = await t.run(async (ctx: MutationCtx) => ctx.db.get(publishedId))
  expect(stillThere).not.toBeNull()

  // Unpublished project deletes successfully and the row is gone.
  await asUser.mutation(api.projects.deleteProject, { projectId: draftId })
  const gone = await t.run(async (ctx: MutationCtx) => ctx.db.get(draftId))
  expect(gone).toBeNull()
})

test('createProject persists a web draft with unique slug+shortId, timestamps, and resolved stack', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  const result = await asUser.mutation(api.projects.createProject, {
    name: 'Web Project',
    description: 'd',
    url: 'https://x',
    tags: ['a'],
  })
  expect(result.slug).toMatch(/^web-project-[a-z0-9]{6}$/)

  const projects = await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .collect(),
  )
  expect(projects).toHaveLength(1)
  const project = projects[0]
  expect(project._id).toBe(result._id)
  expect(project.published).toBe(false)
  expect((project as Record<string, unknown>).source).toBeUndefined()
  expect(project.order).toBeUndefined()
  expect(project.stackId).toBe(stackId)
  expect(project.description).toBe('d')
  expect(project.url).toBe('https://x/')
  expect(project.tags).toEqual(['a'])
  expect(project.shortId).toHaveLength(6)
  expect(project.createdAt).toBeGreaterThan(0)
  expect(project.updatedAt).toBeGreaterThan(0)
})

test('createProject appends to the bottom of listByStack (order undefined)', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  // Pre-existing project with order undefined and an earlier createdAt.
  const existingId = await t.run(async (ctx) =>
    ctx.db.insert('projects', {
      name: 'Existing',
      slug: 'existing',
      shortId: 'EXS001',
      creatorId,
      stackId,
      published: false,
      createdAt: Date.now() - 10_000,
      updatedAt: Date.now() - 10_000,
    }),
  )

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  const result = await asUser.mutation(api.projects.createProject, {
    name: 'New One',
  })

  const list = await t.query(api.projects.listByStack, {
    stackId,
    includeUnpublished: true,
  })
  expect(list).toHaveLength(2)
  expect(list[0]._id).toBe(existingId)
  expect(list[list.length - 1]._id).toBe(result._id)
  // Narrowed contract: retired resource fields must NOT appear on listByStack rows.
  expect('fileCount' in list[0]).toBe(false)
  expect('source' in list[0]).toBe(false)
  expect('cloneCount' in list[0]).toBe(false)
})

test('createProject auto-resolves the single stack and rejects when the creator has none', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  // Auto-resolve: no stackId arg -> falls back to the creator's single stack.
  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  const result = await asUser.mutation(api.projects.createProject, { name: 'x' })
  const project = await t.run(async (ctx) => ctx.db.get(result._id))
  expect(project?.stackId).toBe(stackId)

  // A lone creator with no stack -> clear error.
  await t.run(async (ctx) =>
    ctx.db.insert('creators', {
      name: 'Stackless',
      slug: 'stackless',
      userId: 'user-2',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )
  const asUser2 = t.withIdentity({ tokenIdentifier: 'convex|user-2' })
  await expect(
    asUser2.mutation(api.projects.createProject, { name: 'x' }),
  ).rejects.toThrow(/stack/i)
})

test('createProject rejects an unauthenticated caller and a non-owner of the target stack', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  // Unauthenticated.
  await expect(
    t.mutation(api.projects.createProject, { name: 'x' }),
  ).rejects.toThrow(/not authenticated/i)

  // A different creator targeting the owner's stack -> Not authorized.
  await t.run(async (ctx) =>
    ctx.db.insert('creators', {
      name: 'Other',
      slug: 'other',
      userId: 'user-2',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )
  const asOther = t.withIdentity({ tokenIdentifier: 'convex|user-2' })
  await expect(
    asOther.mutation(api.projects.createProject, { name: 'x', stackId }),
  ).rejects.toThrow(/not authorized/i)
})

test('two creators linking the same repo+path share ONE fileless row with two links', async () => {
  const t = convexTest(schema, modules)
  const { creatorId: creatorA, stackId: stackA } = await seedCreatorAndStack(t)

  // A second creator + stack.
  const { creatorB, stackB } = await t.run(async (ctx) => {
    const now = Date.now()
    const creatorB = await ctx.db.insert('creators', {
      name: 'Creator B',
      slug: 'creator-b',
      userId: 'user-b',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: now,
    })
    const stackB = await ctx.db.insert('stacks', {
      name: 'Stack B',
      slug: 'stack-b',
      shortId: 'STK002',
      creatorId: creatorB,
      oneLiner: 'b',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      createdAt: now,
      updatedAt: now,
    })
    return { creatorB, stackB }
  })

  const linkedItem = {
    type: 'rule' as const,
    name: 'shared-linked',
    group: 'claude-code',
    stableKey: 'claude-code:rule:shared-linked',
    upstream: { repoUrl: 'https://github.com/acme/repo', path: 'AGENTS.md' },
  }

  await seedStackWithResources(t, {
    creatorId: creatorA,
    stackId: stackA,
    name: 'project-a',
    resources: [linkedItem],
  })
  await seedStackWithResources(t, {
    creatorId: creatorB,
    stackId: stackB,
    name: 'project-b',
    resources: [linkedItem],
  })

  // Exactly ONE shared resources row, fileless, github-owned.
  const rows = await t.run(async (ctx) =>
    ctx.db.query('resources').collect(),
  )
  expect(rows).toHaveLength(1)
  expect(rows[0].storage).toBe('linked')
  expect(rows[0].files).toBeUndefined()
  expect(rows[0].owner).toEqual({ kind: 'github', handle: 'acme' })
  expect(rows[0].upstream?.path).toBe('AGENTS.md')

  // Two links — one per stack.
  const links = await t.run(async (ctx) =>
    ctx.db
      .query('resourceLinks')
      .withIndex('by_resourceId', (q) => q.eq('resourceId', rows[0]._id))
      .collect(),
  )
  expect(links).toHaveLength(2)

  // Unlink from stackA — shared row stays alive (stackB still links it).
  await t.run(async (ctx: MutationCtx) => {
    const link = await ctx.db
      .query('resourceLinks')
      .withIndex('by_owner', (q) =>
        q.eq('ownerKind', 'stack').eq('ownerId', stackA),
      )
      .first()
    await ctx.db.delete(link!._id)
    const remaining = await ctx.db
      .query('resourceLinks')
      .withIndex('by_resourceId', (q) => q.eq('resourceId', rows[0]._id))
      .collect()
    if (remaining.length === 0) {
      await ctx.db.patch(rows[0]._id, { deletedAt: Date.now() })
    }
  })
  expect(
    (await t.run(async (ctx: MutationCtx) => ctx.db.get(rows[0]._id)))?.deletedAt,
  ).toBeNull()

  // Unlink from stackB — last link gone, row soft-deleted.
  await t.run(async (ctx: MutationCtx) => {
    const link = await ctx.db
      .query('resourceLinks')
      .withIndex('by_owner', (q) =>
        q.eq('ownerKind', 'stack').eq('ownerId', stackB),
      )
      .first()
    await ctx.db.delete(link!._id)
    const remaining = await ctx.db
      .query('resourceLinks')
      .withIndex('by_resourceId', (q) => q.eq('resourceId', rows[0]._id))
      .collect()
    if (remaining.length === 0) {
      await ctx.db.patch(rows[0]._id, { deletedAt: Date.now() })
    }
  })
  expect(
    (await t.run(async (ctx: MutationCtx) => ctx.db.get(rows[0]._id)))?.deletedAt,
  ).not.toBeNull()
})


// seedOwnedProject DELETED — all linkResource tests target the stack directly.

test('linkResource creates one fileless linked row owned by the github handle', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await asUser.mutation(api.resources.linkResource, {
    target: { kind: 'stack', id: stackId },
    item: {
      type: 'rule',
      name: 'AGENTS',
      group: 'claude-code',
      stableKey: 'pending',
      upstream: { repoUrl: 'https://github.com/acme/repo', path: 'src/agents' },
    },
  })

  const rows = await t.run(async (ctx) => ctx.db.query('resources').collect())
  expect(rows).toHaveLength(1)
  expect(rows[0].storage).toBe('linked')
  expect(rows[0].files).toBeUndefined()
  expect(rows[0].owner).toEqual({ kind: 'github', handle: 'acme' })
  expect((rows[0] as Record<string, unknown>).scope).toBeUndefined()
  expect(rows[0].addedBy).toBe(creatorId)
  expect(rows[0].upstream?.repoUrl).toBe('https://github.com/acme/repo')
  expect(rows[0].upstream?.path).toBe('src/agents')
  expect(rows[0].stableKey).toBe(
    'linked:https://github.com/acme/repo:src/agents',
  )

  const links = await resourcesForOwner(t, 'stack', stackId)
  expect(links).toHaveLength(1)
})

test('linkResource dedups two owners onto ONE row across messy casing/.git/slash/query', async () => {
  const t = convexTest(schema, modules)
  const { creatorId: creatorA, stackId: stackA } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorA, { userId: 'user-a' }))

  const { stackB } = await t.run(async (ctx) => {
    const now = Date.now()
    const creatorB = await ctx.db.insert('creators', {
      name: 'Creator B',
      slug: 'creator-b',
      userId: 'user-b',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: now,
    })
    const stackB = await ctx.db.insert('stacks', {
      name: 'Stack B',
      slug: 'stack-b',
      shortId: 'STK00B',
      creatorId: creatorB,
      oneLiner: 'b',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      createdAt: now,
      updatedAt: now,
    })
    return { stackB }
  })

  const asA = t.withIdentity({ tokenIdentifier: 'convex|user-a' })
  await asA.mutation(api.resources.linkResource, {
    target: { kind: 'stack', id: stackA },
    item: {
      type: 'rule',
      name: 'A names it',
      group: 'claude-code',
      stableKey: 'pending',
      upstream: { repoUrl: 'https://github.com/acme/repo', path: 'AGENTS.md' },
    },
  })

  // B links the SAME logical repo+path via a messy URL/path: scp form, .git,
  // mixed case owner/repo, query string, and a leading slash on the path.
  const asB = t.withIdentity({ tokenIdentifier: 'convex|user-b' })
  await asB.mutation(api.resources.linkResource, {
    target: { kind: 'stack', id: stackB },
    item: {
      type: 'rule',
      name: 'B names it differently',
      group: 'claude-code',
      stableKey: 'pending',
      upstream: {
        repoUrl: 'git@github.com:Acme/Repo.git?tab=readme',
        path: '/AGENTS.md',
      },
    },
  })

  const rows = await t.run(async (ctx) => ctx.db.query('resources').collect())
  expect(rows).toHaveLength(1)
  expect(rows[0].upstream?.repoUrl).toBe('https://github.com/acme/repo')
  expect(rows[0].upstream?.path).toBe('AGENTS.md')

  const links = await t.run(async (ctx) =>
    ctx.db
      .query('resourceLinks')
      .withIndex('by_resourceId', (q) => q.eq('resourceId', rows[0]._id))
      .collect(),
  )
  expect(links).toHaveLength(2)
  expect(await resourcesForOwner(t, 'stack', stackA)).toHaveLength(1)
  expect(await resourcesForOwner(t, 'stack', stackB)).toHaveLength(1)
})

test('linkResource rejects a non-github / repo-less URL and writes nothing', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await expect(
    asUser.mutation(api.resources.linkResource, {
      target: { kind: 'stack', id: stackId },
      item: {
        type: 'rule',
        name: 'gitlab',
        group: 'claude-code',
        stableKey: 'pending',
        upstream: { repoUrl: 'https://gitlab.com/acme/repo' },
      },
    }),
  ).rejects.toThrow(/GitHub repository URLs/)

  await expect(
    asUser.mutation(api.resources.linkResource, {
      target: { kind: 'stack', id: stackId },
      item: {
        type: 'rule',
        name: 'repo-less',
        group: 'claude-code',
        stableKey: 'pending',
        upstream: { repoUrl: 'https://github.com/onlyowner' },
      },
    }),
  ).rejects.toThrow(/GitHub repository URLs/)

  const rows = await t.run(async (ctx) => ctx.db.query('resources').collect())
  expect(rows).toHaveLength(0)
})

test('linkResource rejects a non-owner', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'owner-user' }))

  const asOther = t.withIdentity({ tokenIdentifier: 'convex|intruder' })
  await expect(
    asOther.mutation(api.resources.linkResource, {
      target: { kind: 'stack', id: stackId },
      item: {
        type: 'rule',
        name: 'x',
        group: 'claude-code',
        stableKey: 'pending',
        upstream: { repoUrl: 'https://github.com/acme/repo' },
      },
    }),
  ).rejects.toThrow('Not authorized')

  const rows = await t.run(async (ctx) => ctx.db.query('resources').collect())
  expect(rows).toHaveLength(0)
})

test('deleteProject rejects a non-owner with Not authorized', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-owner' }))

  const projectId = await seedStackWithResources(t, {
    creatorId,
    stackId,
    name: 'owned-project',
    resources: [],
  })

  // Seed a second creator who does NOT own the stack.
  await t.run(async (ctx) =>
    ctx.db.insert('creators', {
      name: 'Intruder',
      slug: 'intruder',
      userId: 'user-intruder',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )

  const asIntruder = t.withIdentity({ tokenIdentifier: 'convex|user-intruder' })
  await expect(
    asIntruder.mutation(api.projects.deleteProject, { projectId }),
  ).rejects.toThrow('Not authorized')

  // Row is still present.
  const still = await t.run(async (ctx) => ctx.db.get(projectId))
  expect(still).not.toBeNull()
})

test('linkResource throws when upstream is omitted and writes nothing', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await expect(
    asUser.mutation(api.resources.linkResource, {
      target: { kind: 'stack', id: stackId },
      item: {
        type: 'rule',
        name: 'no-upstream',
        group: 'claude-code',
        stableKey: 'pending',
      },
    }),
  ).rejects.toThrow(/requires an upstream repo URL/)

  const rows = await t.run(async (ctx) => ctx.db.query('resources').collect())
  expect(rows).toHaveLength(0)
})
