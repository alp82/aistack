import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { internal } from './_generated/api'

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

test('upsertProject persists scope=global onto stack with source=cli', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'my-project',
    instructions: [
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

  const result = await t.run(async (ctx) => {
    const stack = await ctx.db.get(stackId)
    const projects = await ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .collect()
    return { stack, projects }
  })

  expect(result.stack?.instructions).toHaveLength(1)
  expect(result.stack?.instructions?.[0]?.scope).toBe('global')
  expect(result.stack?.instructions?.[0]?.source).toBe('cli')
  expect(result.projects).toHaveLength(1)
  expect(result.projects[0].instructions).toHaveLength(0)
})

test('upsertProject persists scope=project onto project with source=cli', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'my-project',
    instructions: [
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

  const result = await t.run(async (ctx) => {
    const stack = await ctx.db.get(stackId)
    const projects = await ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .collect()
    return { stack, projects }
  })

  expect(result.stack?.instructions ?? []).toHaveLength(0)
  expect(result.projects).toHaveLength(1)
  expect(result.projects[0].instructions).toHaveLength(1)
  expect(result.projects[0].instructions[0].scope).toBe('project')
  expect(result.projects[0].instructions[0].source).toBe('cli')
})

test('upsertProject merges by stableKey on second call (preserves A, replaces B, adds C)', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreatorAndStack(t)

  await t.mutation(internal.httpCliHelpers.upsertProject, {
    creatorId,
    stackId,
    name: 'my-project',
    instructions: [
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
    instructions: [
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

  const projects = await t.run(async (ctx) => {
    return await ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .collect()
  })

  expect(projects).toHaveLength(1)
  const items = projects[0].instructions
  expect(items).toHaveLength(3)

  const byKey = new Map(items.map((i) => [i.stableKey, i]))
  const itemA = byKey.get('claude-code:rule:A')
  const itemB = byKey.get('claude-code:rule:B')
  const itemC = byKey.get('claude-code:rule:C')

  expect(itemA?.files[0]?.content).toBe('A v1')
  expect(itemB?.files[0]?.content).toBe('B v2')
  expect(itemC?.files[0]?.content).toBe('C v1')
})
