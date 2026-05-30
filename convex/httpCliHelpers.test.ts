/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { api, internal } from './_generated/api'
import type { MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'

const modules = import.meta.glob('./**/*.{js,ts}')

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
  ownerKind: 'stack' | 'project',
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

test('upsertProject persists scope=global onto stack with source=cli', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'my-project',
    resources: [
      {
        type: 'rule',
        name: 'global-rule',
        group: 'claude-code',
        scope: 'global',
        stableKey: 'claude-code:rule:global-rule',
        files: [{ name: 'rule.md', content: '# Global rule' }],
      },
    ],
    source: 'cli',
  })

  const projects = await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .collect(),
  )
  expect(projects).toHaveLength(1)

  const stackResources = await resourcesForOwner(t, 'stack', stackId)
  expect(stackResources).toHaveLength(1)
  expect(stackResources[0].scope).toBe('global')
  expect(stackResources[0].storage).toBe('hosted')
  expect(stackResources[0].owner.kind).toBe('creator')
  expect(stackResources[0].addedBy).toBe(creatorId)

  const projectResources = await resourcesForOwner(t, 'project', projects[0]._id)
  expect(projectResources).toHaveLength(0)
})

test('upsertProject persists scope=project onto project with source=cli', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'my-project',
    resources: [
      {
        type: 'prompt',
        name: 'project-prompt',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:prompt:project-prompt',
        files: [{ name: 'prompt.md', content: '# Project prompt' }],
      },
    ],
    source: 'cli',
  })

  const projects = await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .collect(),
  )
  expect(projects).toHaveLength(1)

  const stackResources = await resourcesForOwner(t, 'stack', stackId)
  expect(stackResources).toHaveLength(0)

  const projectResources = await resourcesForOwner(t, 'project', projects[0]._id)
  expect(projectResources).toHaveLength(1)
  expect(projectResources[0].scope).toBe('project')
  expect(projectResources[0].storage).toBe('hosted')
  expect(projectResources[0].owner.kind).toBe('creator')
  expect(projectResources[0].addedBy).toBe(creatorId)
})

test('upsertProject merges by stableKey on second call (preserves A, replaces B, adds C)', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'my-project',
    resources: [
      {
        type: 'rule',
        name: 'A',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:A',
        files: [{ name: 'A.md', content: 'A v1' }],
      },
      {
        type: 'rule',
        name: 'B',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:B',
        files: [{ name: 'B.md', content: 'B v1' }],
      },
    ],
    source: 'cli',
  })

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'my-project',
    resources: [
      {
        type: 'rule',
        name: 'B',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:B',
        files: [{ name: 'B.md', content: 'B v2' }],
      },
      {
        type: 'rule',
        name: 'C',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:C',
        files: [{ name: 'C.md', content: 'C v1' }],
      },
    ],
    source: 'cli',
  })

  const projects = await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .collect(),
  )
  expect(projects).toHaveLength(1)

  const items = await resourcesForOwner(t, 'project', projects[0]._id)
  expect(items).toHaveLength(3)

  const byKey = new Map(items.map((i) => [i.stableKey, i]))
  expect(byKey.get('claude-code:rule:A')?.files?.[0]?.content).toBe('A v1')
  expect(byKey.get('claude-code:rule:B')?.files?.[0]?.content).toBe('B v2')
  expect(byKey.get('claude-code:rule:C')?.files?.[0]?.content).toBe('C v1')
})

test('upsertResourcesForOwner resurrects a soft-deleted row and reuses its _id', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'my-project',
    resources: [
      {
        type: 'rule',
        name: 'R',
        description: 'first',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:R',
        files: [{ name: 'R.md', content: 'R v1' }],
      },
    ],
    source: 'cli',
  })

  const project = (await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .first(),
  ))!

  const before = await resourcesForOwner(t, 'project', project._id)
  const originalId = before[0]._id

  // Delete the project, cascading the link removal -> soft-deletes the row.
  await t.run(async (ctx: MutationCtx) => {
    const links = await ctx.db
      .query('resourceLinks')
      .withIndex('by_owner', (q) =>
        q.eq('ownerKind', 'project').eq('ownerId', project._id),
      )
      .collect()
    for (const link of links) {
      await ctx.db.delete(link._id)
      await ctx.db.patch(link.resourceId, { deletedAt: Date.now() })
    }
  })

  const softDeleted = await t.run(async (ctx: MutationCtx) => ctx.db.get(originalId))
  expect(softDeleted?.deletedAt).not.toBeNull()

  // Re-upsert the same (creatorId, stableKey) with overwritten fields.
  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'my-project-2',
    resources: [
      {
        type: 'rule',
        name: 'R renamed',
        description: 'second',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:R',
        files: [{ name: 'R.md', content: 'R v2' }],
      },
    ],
    source: 'cli',
  })

  const resurrected = await t.run(async (ctx: MutationCtx) => ctx.db.get(originalId))
  expect(resurrected?.deletedAt).toBeNull()
  expect(resurrected?.name).toBe('R renamed')
  expect(resurrected?.description).toBe('second')
  expect(resurrected?.files?.[0]?.content).toBe('R v2')

  // The link was re-created against the new owner.
  const project2 = (await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .collect(),
  )).find((p) => p.name === 'my-project-2')!
  const links2 = await resourcesForOwner(t, 'project', project2._id)
  expect(links2.map((l) => l._id)).toContainEqual(originalId)
})

test('omitting a stableKey on re-upsert keeps its existing link (preservation)', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'my-project',
    resources: [
      {
        type: 'rule',
        name: 'keep',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:keep',
        files: [{ name: 'keep.md', content: 'keep' }],
      },
    ],
    source: 'cli',
  })

  // Second upsert omits "keep" entirely.
  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'my-project',
    resources: [
      {
        type: 'rule',
        name: 'other',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:other',
        files: [{ name: 'other.md', content: 'other' }],
      },
    ],
    source: 'cli',
  })

  const project = (await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .first(),
  ))!
  const items = await resourcesForOwner(t, 'project', project._id)
  const keys = items.map((i) => i.stableKey).sort()
  expect(keys).toEqual(['claude-code:rule:keep', 'claude-code:rule:other'])
})

test('getResourceBrowserContext returns empty arrays and not-found early returns', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  // Stack target with no resources -> empty stackResources, valid contract.
  const stackCtx = await t.query(api.resources.getResourceBrowserContext, {
    target: { kind: 'stack', id: stackId },
  })
  expect(stackCtx.stackResources).toEqual([])
  expect(stackCtx.projectResources).toEqual([])
  expect(stackCtx.stackName).toBe('Test Stack')
  expect(stackCtx.stackId).toBe(stackId)

  // Project target with resources.
  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'p',
    resources: [
      {
        type: 'rule',
        name: 'pr',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:pr',
        files: [{ name: 'pr.md', content: 'pr' }],
      },
    ],
    source: 'cli',
  })
  // Publish so an anon viewer sees it.
  const project = (await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .first(),
  ))!
  await t.run(async (ctx) => ctx.db.patch(project._id, { published: true }))

  const projCtx = await t.query(api.resources.getResourceBrowserContext, {
    target: { kind: 'project', id: project._id },
  })
  expect(projCtx.projectResources).toHaveLength(1)
  expect(projCtx.projectResources[0].stableKey).toBe('claude-code:rule:pr')
  expect(projCtx.projectName).toBe('p')

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

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'p',
    resources: [
      {
        type: 'rule',
        name: 'global',
        group: 'claude-code',
        scope: 'global',
        stableKey: 'claude-code:rule:global',
        files: [{ name: 'g.md', content: 'before' }],
      },
    ],
    source: 'cli',
  })

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await asUser.mutation(api.resources.updateResourceContent, {
    target: { kind: 'stack', id: stackId },
    stableKey: 'claude-code:rule:global',
    fileName: 'g.md',
    content: 'after',
  })

  const stackResources = await resourcesForOwner(t, 'stack', stackId)
  expect(stackResources[0].files?.[0]?.content).toBe('after')
})

test('deleteProject cascades: zero links and the row is soft-deleted with no live link', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'p',
    resources: [
      {
        type: 'rule',
        name: 'only-here',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:only-here',
        files: [{ name: 'o.md', content: 'o' }],
      },
    ],
    source: 'cli',
  })

  const project = (await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .first(),
  ))!
  const resourceId = (await resourcesForOwner(t, 'project', project._id))[0]._id

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await asUser.mutation(api.projects.deleteProject, { projectId: project._id })

  const remainingLinks = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('resourceLinks')
      .withIndex('by_owner', (q) =>
        q.eq('ownerKind', 'project').eq('ownerId', project._id),
      )
      .collect(),
  )
  expect(remainingLinks).toHaveLength(0)

  const row = await t.run(async (ctx: MutationCtx) => ctx.db.get(resourceId))
  expect(row?.deletedAt).not.toBeNull()

  const linksToRow = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('resourceLinks')
      .withIndex('by_resourceId', (q) => q.eq('resourceId', resourceId))
      .collect(),
  )
  expect(linksToRow).toHaveLength(0)
})

test('deleteProject cascades: resource NOT soft-deleted when another owner still holds a link', async () => {
  // Invariant: cascadeUnlinkOwner only soft-deletes when remaining.length === 0
  // (resourceLinks.ts ~187-193). This test guards that invariant for multi-owner.
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  // Create a resource with a global-scope item so it lands on the stack.
  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'shared-project',
    resources: [
      {
        type: 'rule',
        name: 'shared',
        group: 'claude-code',
        scope: 'global',
        stableKey: 'claude-code:rule:shared',
        files: [{ name: 'shared.md', content: 'shared' }],
      },
    ],
    source: 'cli',
  })

  // The resource now has a link to the stack.
  const stackLinked = await resourcesForOwner(t, 'stack', stackId)
  expect(stackLinked).toHaveLength(1)
  const resourceId = stackLinked[0]._id

  // Create a project and attach a second resourceLinks row to the same resource.
  const now = Date.now()
  const projectId = await t.run(async (ctx: MutationCtx) => {
    const id = await ctx.db.insert('projects', {
      name: 'extra-project',
      slug: 'extra-project',
      shortId: 'EXT001',
      creatorId,
      stackId,
      published: false,
      createdAt: now,
      updatedAt: now,
    })
    await ctx.db.insert('resourceLinks', {
      resourceId,
      ownerKind: 'project',
      ownerId: id,
      order: 0,
      addedAt: now,
    })
    return id
  })

  // Confirm both links exist.
  const stackLinks = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('resourceLinks')
      .withIndex('by_resourceId', (q) => q.eq('resourceId', resourceId))
      .collect(),
  )
  expect(stackLinks).toHaveLength(2)

  // Delete the project — should cascade-unlink only the project link.
  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await asUser.mutation(api.projects.deleteProject, { projectId })

  // (a) Project link is gone.
  const projectLinks = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('resourceLinks')
      .withIndex('by_owner', (q) =>
        q.eq('ownerKind', 'project').eq('ownerId', projectId),
      )
      .collect(),
  )
  expect(projectLinks).toHaveLength(0)

  // (b) Stack link remains.
  const remainingStackLinks = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('resourceLinks')
      .withIndex('by_owner', (q) =>
        q.eq('ownerKind', 'stack').eq('ownerId', stackId),
      )
      .collect(),
  )
  expect(remainingStackLinks).toHaveLength(1)

  // (c) Resource row is NOT soft-deleted because the stack link still holds it.
  const resourceRow = await t.run(async (ctx: MutationCtx) => ctx.db.get(resourceId))
  expect(resourceRow?.deletedAt).toBeNull()
})

test('reset_resources hard-deletes all rows and is idempotent', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  // Seed one resources row + one resourceLinks row pointing at it.
  await t.run(async (ctx) => {
    const now = Date.now()
    const resourceId = await ctx.db.insert('resources', {
      scope: 'project',
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

test('getByShortId returns split linked/hosted Resource JSON shapes for the CLI clone endpoint', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'clone-me',
    resources: [
      {
        type: 'rule',
        name: 'CLAUDE.md',
        description: 'root rule',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:CLAUDE.md',
        upstream: {
          repoUrl: 'https://github.com/acme/repo',
          path: 'CLAUDE.md',
        },
      },
      {
        type: 'prompt',
        name: 'hosted-prompt',
        description: 'local prompt',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:prompt:hosted-prompt',
        files: [{ name: 'p.md', content: '# hi', path: 'p.md' }],
      },
    ],
    source: 'cli',
  })

  const project = (await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .first(),
  ))!

  const result = await t.query(api.projects.getByShortId, {
    shortId: project.shortId,
  })
  expect(result).not.toBeNull()
  const r = result!
  expect(r._id).toBe(project._id)
  expect(r.resources).toHaveLength(2)

  const byKey = new Map(r.resources.map((res) => [res.stableKey, res]))
  const linked = byKey.get('claude-code:rule:CLAUDE.md')!
  const hosted = byKey.get('claude-code:prompt:hosted-prompt')!

  // Linked: pure reference — carries `upstream`, omits `files`.
  expect(Object.keys(linked).sort()).toEqual(
    [
      'addedBy',
      'description',
      'group',
      'name',
      'owner',
      'scope',
      'stableKey',
      'storage',
      'type',
      'upstream',
    ].sort(),
  )
  expect(linked.storage).toBe('linked')
  expect(linked.owner).toEqual({ kind: 'github', handle: 'acme' })
  expect(linked.upstream?.repoUrl).toBe('https://github.com/acme/repo')
  expect((linked as Record<string, unknown>).files).toBeUndefined()

  // Hosted: carries `files`, omits `upstream`.
  expect(Object.keys(hosted).sort()).toEqual(
    [
      'addedBy',
      'description',
      'files',
      'group',
      'name',
      'owner',
      'scope',
      'stableKey',
      'storage',
      'type',
    ].sort(),
  )
  expect(hosted.storage).toBe('hosted')
  expect(hosted.owner.kind).toBe('creator')
  expect(hosted.files?.[0]).toEqual({ name: 'p.md', content: '# hi', path: 'p.md' })
  expect((hosted as Record<string, unknown>).upstream).toBeUndefined()

  expect((linked as Record<string, unknown>)._id).toBeUndefined()
  expect((linked as Record<string, unknown>).creatorId).toBeUndefined()
  expect((linked as Record<string, unknown>).deletedAt).toBeUndefined()
})

test('getByShortId splits project vs stack-scoped resources (stackResources)', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  // A global-scoped item attaches to the stack (e.g. an installed plugin link);
  // a project-scoped item to the project. getByShortId must split them.
  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'scoped',
    resources: [
      {
        type: 'plugin',
        name: 'alp-river',
        group: 'claude-code',
        scope: 'global',
        stableKey: 'linked:https://github.com/alp82/alp-river:',
        upstream: { repoUrl: 'https://github.com/alp82/alp-river' },
      },
      {
        type: 'prompt',
        name: 'local',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:prompt:local',
        files: [{ name: 'p.md', content: '# hi', path: 'p.md' }],
      },
    ],
    source: 'cli',
  })

  const project = (await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .first(),
  ))!

  const result = (await t.query(api.projects.getByShortId, {
    shortId: project.shortId,
  }))!

  expect(result.resources.map((r) => r.stableKey)).toEqual([
    'claude-code:prompt:local',
  ])
  const pluginLink = result.stackResources.find(
    (r) => r.stableKey === 'linked:https://github.com/alp82/alp-river:',
  )!
  expect(pluginLink).toBeDefined()
  expect(pluginLink.storage).toBe('linked')
  expect(pluginLink.type).toBe('plugin')
})

test('upsertProject stores a pkg (MCP) resource as a linked row, deduped by (registry,id)', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  const pkgItem = {
    type: 'mcp',
    name: 'context7',
    group: 'claude-code',
    scope: 'project' as const,
    stableKey: 'linked:pkg:npm:@upstash/context7-mcp',
    pkg: {
      registry: 'npm' as const,
      id: '@upstash/context7-mcp',
      transport: 'stdio' as const,
    },
  }

  // Two projects link the same MCP server.
  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'a',
    resources: [pkgItem],
    source: 'cli',
  })
  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'b',
    resources: [pkgItem],
    source: 'cli',
  })

  // Deduped GLOBALLY by by_pkg → exactly one shared resources row.
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

  const projectA = (await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .filter((q) => q.eq(q.field('name'), 'a'))
      .first(),
  ))!
  const result = (await t.query(api.projects.getByShortId, {
    shortId: projectA.shortId,
  }))!
  const mcp = result.resources.find((r) => r.pkg)!
  expect(mcp.stableKey).toBe('linked:pkg:npm:@upstash/context7-mcp')
  expect(mcp.pkg).toEqual({
    registry: 'npm',
    id: '@upstash/context7-mcp',
    transport: 'stdio',
  })
})

test('unlinkResource removes one link and leaves the others intact', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'p',
    resources: [
      {
        type: 'rule',
        name: 'A',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:A',
        files: [{ name: 'A.md', content: 'A' }],
      },
      {
        type: 'rule',
        name: 'B',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:B',
        files: [{ name: 'B.md', content: 'B' }],
      },
    ],
    source: 'cli',
  })

  const project = (await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .first(),
  ))!

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await asUser.mutation(api.resources.unlinkResource, {
    target: { kind: 'project', id: project._id },
    stableKey: 'claude-code:rule:A',
  })

  const items = await resourcesForOwner(t, 'project', project._id)
  expect(items.map((i) => i.stableKey)).toEqual(['claude-code:rule:B'])
})

test('unlinkResource soft-deletes the resource when it drops the last link', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'p',
    resources: [
      {
        type: 'rule',
        name: 'solo',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:solo',
        files: [{ name: 's.md', content: 's' }],
      },
    ],
    source: 'cli',
  })

  const project = (await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .first(),
  ))!
  const resourceId = (await resourcesForOwner(t, 'project', project._id))[0]._id

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await asUser.mutation(api.resources.unlinkResource, {
    target: { kind: 'project', id: project._id },
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
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  // Global item lands on the stack.
  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'p',
    resources: [
      {
        type: 'rule',
        name: 'shared',
        group: 'claude-code',
        scope: 'global',
        stableKey: 'claude-code:rule:shared',
        files: [{ name: 's.md', content: 's' }],
      },
    ],
    source: 'cli',
  })
  const resourceId = (await resourcesForOwner(t, 'stack', stackId))[0]._id

  // Attach a second link to the same resource from a project.
  const now = Date.now()
  const projectId = await t.run(async (ctx: MutationCtx) => {
    const id = await ctx.db.insert('projects', {
      name: 'extra',
      slug: 'extra',
      shortId: 'EXT777',
      creatorId,
      stackId,
      published: false,
      createdAt: now,
      updatedAt: now,
    })
    await ctx.db.insert('resourceLinks', {
      resourceId,
      ownerKind: 'project',
      ownerId: id,
      order: 0,
      addedAt: now,
    })
    return id
  })

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await asUser.mutation(api.resources.unlinkResource, {
    target: { kind: 'project', id: projectId },
    stableKey: 'claude-code:rule:shared',
  })

  expect(await resourcesForOwner(t, 'project', projectId)).toHaveLength(0)
  expect(await resourcesForOwner(t, 'stack', stackId)).toHaveLength(1)
  const row = await t.run(async (ctx: MutationCtx) => ctx.db.get(resourceId))
  expect(row?.deletedAt).toBeNull()
})

test('unlinkResource is a no-op when the stableKey is not linked', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'p',
    resources: [
      {
        type: 'rule',
        name: 'present',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:present',
        files: [{ name: 'p.md', content: 'p' }],
      },
    ],
    source: 'cli',
  })
  const project = (await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .first(),
  ))!

  const before = project.updatedAt

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await asUser.mutation(api.resources.unlinkResource, {
    target: { kind: 'project', id: project._id },
    stableKey: 'claude-code:rule:does-not-exist',
  })

  // No-op must not bump the owner's updatedAt.
  const after = (await t.run(async (ctx: MutationCtx) => ctx.db.get(project._id)))!
  expect(after.updatedAt).toBe(before)

  const items = await resourcesForOwner(t, 'project', project._id)
  expect(items.map((i) => i.stableKey)).toEqual(['claude-code:rule:present'])
})

test('unlinkResource rejects a non-owner', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'owner-user' }))

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'p',
    resources: [
      {
        type: 'rule',
        name: 'x',
        group: 'claude-code',
        scope: 'project',
        stableKey: 'claude-code:rule:x',
        files: [{ name: 'x.md', content: 'x' }],
      },
    ],
    source: 'cli',
  })
  const project = (await t.run(async (ctx) =>
    ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .first(),
  ))!

  const asOther = t.withIdentity({ tokenIdentifier: 'convex|intruder' })
  await expect(
    asOther.mutation(api.resources.unlinkResource, {
      target: { kind: 'project', id: project._id },
      stableKey: 'claude-code:rule:x',
    }),
  ).rejects.toThrow('Not authorized')

  const items = await resourcesForOwner(t, 'project', project._id)
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
  expect(project.source).toBe('web')
  expect(project.order).toBeUndefined()
  expect(project.stackId).toBe(stackId)
  expect(project.description).toBe('d')
  expect(project.url).toBe('https://x')
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
    scope: 'project' as const,
    stableKey: 'claude-code:rule:shared-linked',
    upstream: { repoUrl: 'https://github.com/acme/repo', path: 'AGENTS.md' },
  }

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId: creatorA,
    stackId: stackA,
    name: 'project-a',
    resources: [linkedItem],
    source: 'cli',
  })
  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId: creatorB,
    stackId: stackB,
    name: 'project-b',
    resources: [linkedItem],
    source: 'cli',
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

  // Two links — one per project.
  const links = await t.run(async (ctx) =>
    ctx.db
      .query('resourceLinks')
      .withIndex('by_resourceId', (q) => q.eq('resourceId', rows[0]._id))
      .collect(),
  )
  expect(links).toHaveLength(2)

  const projects = await t.run(async (ctx) =>
    ctx.db.query('projects').collect(),
  )
  const projectA = projects.find((p) => p.name === 'project-a')!
  const projectB = projects.find((p) => p.name === 'project-b')!

  // Unlink from A — shared row stays alive (B still links it).
  await t.run(async (ctx: MutationCtx) => {
    const link = await ctx.db
      .query('resourceLinks')
      .withIndex('by_owner', (q) =>
        q.eq('ownerKind', 'project').eq('ownerId', projectA._id),
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

  // Unlink from B — last link gone, row soft-deleted.
  await t.run(async (ctx: MutationCtx) => {
    const link = await ctx.db
      .query('resourceLinks')
      .withIndex('by_owner', (q) =>
        q.eq('ownerKind', 'project').eq('ownerId', projectB._id),
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

test('upsert guard: linked-with-files and hosted-without-files both throw', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await expect(
    t.mutation(internal.httpCliHelpers.upsertProject, {
      creatorId,
      stackId,
      name: 'bad-linked',
      resources: [
        {
          type: 'rule',
          name: 'linked-with-files',
          group: 'claude-code',
          scope: 'project',
          stableKey: 'claude-code:rule:linked-with-files',
          files: [{ name: 'x.md', content: 'x' }],
          upstream: { repoUrl: 'https://github.com/acme/repo', path: 'x.md' },
        },
      ],
      source: 'cli',
    }),
  ).rejects.toThrow(/linked resource must not carry files/)

  await expect(
    t.mutation(internal.httpCliHelpers.upsertProject, {
      creatorId,
      stackId,
      name: 'bad-hosted',
      resources: [
        {
          type: 'rule',
          name: 'hosted-without-files',
          group: 'claude-code',
          scope: 'project',
          stableKey: 'claude-code:rule:hosted-without-files',
        },
      ],
      source: 'cli',
    }),
  ).rejects.toThrow(/hosted resource must carry files/)
})

async function seedOwnedProject(
  t: ReturnType<typeof convexTest>,
  creatorId: Id<'creators'>,
  stackId: Id<'stacks'>,
  name: string,
  slug: string,
  shortId: string,
) {
  return await t.run(async (ctx: MutationCtx) => {
    const now = Date.now()
    return await ctx.db.insert('projects', {
      name,
      slug,
      shortId,
      creatorId,
      stackId,
      published: false,
      createdAt: now,
      updatedAt: now,
    })
  })
}

test('linkResource creates one fileless linked row owned by the github handle', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))
  const projectId = await seedOwnedProject(
    t,
    creatorId,
    stackId,
    'p',
    'p',
    'PRJ001',
  )

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await asUser.mutation(api.resources.linkResource, {
    target: { kind: 'project', id: projectId },
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
  expect(rows[0].scope).toBe('global')
  expect(rows[0].addedBy).toBe(creatorId)
  expect(rows[0].upstream?.repoUrl).toBe('https://github.com/acme/repo')
  expect(rows[0].upstream?.path).toBe('src/agents')
  expect(rows[0].stableKey).toBe(
    'linked:https://github.com/acme/repo:src/agents',
  )

  const links = await resourcesForOwner(t, 'project', projectId)
  expect(links).toHaveLength(1)
})

test('linkResource dedups two owners onto ONE row across messy casing/.git/slash/query', async () => {
  const t = convexTest(schema, modules)
  const { creatorId: creatorA, stackId: stackA } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorA, { userId: 'user-a' }))
  const projectA = await seedOwnedProject(
    t,
    creatorA,
    stackA,
    'project-a',
    'project-a',
    'PRJ00A',
  )

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
      shortId: 'STK00B',
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
  const projectB = await seedOwnedProject(
    t,
    creatorB,
    stackB,
    'project-b',
    'project-b',
    'PRJ00B',
  )

  const asA = t.withIdentity({ tokenIdentifier: 'convex|user-a' })
  await asA.mutation(api.resources.linkResource, {
    target: { kind: 'project', id: projectA },
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
    target: { kind: 'project', id: projectB },
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
  expect(await resourcesForOwner(t, 'project', projectA)).toHaveLength(1)
  expect(await resourcesForOwner(t, 'project', projectB)).toHaveLength(1)
})

test('linkResource rejects a non-github / repo-less URL and writes nothing', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))
  const projectId = await seedOwnedProject(
    t,
    creatorId,
    stackId,
    'p',
    'p',
    'PRJ00C',
  )

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await expect(
    asUser.mutation(api.resources.linkResource, {
      target: { kind: 'project', id: projectId },
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
      target: { kind: 'project', id: projectId },
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
  const projectId = await seedOwnedProject(
    t,
    creatorId,
    stackId,
    'p',
    'p',
    'PRJ00D',
  )

  const asOther = t.withIdentity({ tokenIdentifier: 'convex|intruder' })
  await expect(
    asOther.mutation(api.resources.linkResource, {
      target: { kind: 'project', id: projectId },
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

test('linkResource throws when upstream is omitted and writes nothing', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)
  await t.run(async (ctx) => ctx.db.patch(creatorId, { userId: 'user-1' }))
  const projectId = await seedOwnedProject(
    t,
    creatorId,
    stackId,
    'p',
    'p',
    'PRJ00E',
  )

  const asUser = t.withIdentity({ tokenIdentifier: 'convex|user-1' })
  await expect(
    asUser.mutation(api.resources.linkResource, {
      target: { kind: 'project', id: projectId },
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
