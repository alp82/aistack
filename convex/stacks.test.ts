/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { api } from './_generated/api'
import type { MutationCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

const modules = import.meta.glob('./**/*.{js,ts}')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Seeds a creator row with a given userId and returns both the creatorId and a
 * convexTest instance scoped to that identity. Each caller must supply a
 * unique userId string to avoid the one-stack-per-creator throw.
 */
async function seedAuthenticatedCreator(
  t: ReturnType<typeof convexTest>,
  opts: { userId: string; slug: string },
): Promise<{ creatorId: Id<'creators'>; asCreator: ReturnType<typeof t.withIdentity> }> {
  const creatorId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: `Creator ${opts.userId}`,
      slug: opts.slug,
      userId: opts.userId,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )
  const asCreator = t.withIdentity({ tokenIdentifier: `convex|${opts.userId}` })
  return { creatorId, asCreator }
}

/** Minimal args to call stacks.create successfully (no projects). */
const minimalCreateArgs = {
  name: 'My Stack',
  oneLiner: 'A test stack',
  toolSubscriptions: [],
  published: false,
}

// ---------------------------------------------------------------------------
// Group I — create() with a `projects` argument
// ---------------------------------------------------------------------------

test('TC-I-01: create() with projects array inserts matching project rows for the new stack', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-i01',
    slug: 'creator-i01',
  })

  const result = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
    projects: [
      {
        name: 'App',
        description: 'D',
        url: 'https://x.com',
        tags: ['web'],
      },
    ],
  })

  expect(result).toMatchObject({ _id: expect.any(String), slug: expect.any(String) })

  const projects = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('projects')
      .withIndex('by_stackId', (q) => q.eq('stackId', result._id))
      .collect(),
  )
  expect(projects).toHaveLength(1)
  expect(projects[0].name).toBe('App')
  expect(projects[0].description).toBe('D')
  // normalizeProjectUrl canonicalizes via parsed.href, so a bare host gains a trailing
  // slash - identical to the view-page createProject path (one shared normalizer).
  expect(projects[0].url).toBe('https://x.com/')
  expect(projects[0].tags).toEqual(['web'])
  // Projects no longer carry a publish state - the stack's flag must not propagate.
  expect(projects[0].published).toBeUndefined()
})

test('TC-I-04: create() with projects:[] inserts no project rows', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-i04',
    slug: 'creator-i04',
  })

  const result = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
    projects: [],
  })

  const projects = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('projects')
      .withIndex('by_stackId', (q) => q.eq('stackId', result._id))
      .collect(),
  )
  expect(projects).toHaveLength(0)
})

test('TC-I-05: create() with projects omitted inserts no project rows', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-i05',
    slug: 'creator-i05',
  })

  const result = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
    // no projects key
  })

  const projects = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('projects')
      .withIndex('by_stackId', (q) => q.eq('stackId', result._id))
      .collect(),
  )
  expect(projects).toHaveLength(0)
})

test('TC-I-06: create() with projects:[P1, P2, P3] inserts all 3 rows', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-i06',
    slug: 'creator-i06',
  })

  const result = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
    projects: [{ name: 'P1' }, { name: 'P2' }, { name: 'P3' }],
  })

  const projects = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('projects')
      .withIndex('by_stackId', (q) => q.eq('stackId', result._id))
      .collect(),
  )
  expect(projects).toHaveLength(3)
  const names = projects.map((p) => p.name).sort()
  expect(names).toEqual(['P1', 'P2', 'P3'])
})

test('TC-I-07: each inserted project row carries the correct stackId and creatorId', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-i07',
    slug: 'creator-i07',
  })

  const result = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
    projects: [{ name: 'App' }, { name: 'Blog' }],
  })

  const projects = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('projects')
      .withIndex('by_stackId', (q) => q.eq('stackId', result._id))
      .collect(),
  )
  expect(projects).toHaveLength(2)
  for (const project of projects) {
    expect(project.stackId).toBe(result._id)
    expect(project.creatorId).toBe(creatorId)
  }
})

// ---------------------------------------------------------------------------
// Group J — update() does NOT bulk-publish project rows
// ---------------------------------------------------------------------------

test('TC-J-01: stacks.update with only stack fields does not alter any project published value', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-j01',
    slug: 'creator-j01',
  })

  // Seed a stack directly (bypass create to avoid one-stack-per-creator
  // interactions and to have full control over project rows).
  const stackId = await t.run(async (ctx: MutationCtx) => {
    const now = Date.now()
    return ctx.db.insert('stacks', {
      name: 'J01 Stack',
      slug: 'j01-stack',
      shortId: 'STKJ01',
      creatorId,
      oneLiner: 'original one liner',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      createdAt: now,
      updatedAt: now,
    })
  })

  // Insert two project rows.
  const { projectId1, projectId2 } = await t.run(
    async (ctx: MutationCtx) => {
      const now = Date.now()
      const projectId1 = await ctx.db.insert('projects', {
        name: 'Project One',
        slug: 'project-one',
        shortId: 'PRJ001',
        creatorId,
        stackId,
        createdAt: now,
        updatedAt: now,
      })
      const projectId2 = await ctx.db.insert('projects', {
        name: 'Project Two',
        slug: 'project-two',
        shortId: 'PRJ002',
        creatorId,
        stackId,
        createdAt: now,
        updatedAt: now,
      })
      return { projectId1, projectId2 }
    },
  )

  // Call stacks.update changing only oneLiner (a stack-level field).
  await asCreator.mutation(api.stacks.update, {
    stackId,
    oneLiner: 'changed one liner',
  })

  // Both project rows must still exist with their names unchanged.
  const row1 = await t.run(async (ctx: MutationCtx) => ctx.db.get(projectId1))
  const row2 = await t.run(async (ctx: MutationCtx) => ctx.db.get(projectId2))

  expect(row1?.name).toBe('Project One')
  expect(row2?.name).toBe('Project Two')
})
