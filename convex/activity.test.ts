/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { api, internal } from './_generated/api'
import type { MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'

const modules = import.meta.glob('./**/*.{js,ts}')

async function seedCreator(
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
  return {
    creatorId,
    asCreator: t.withIdentity({ tokenIdentifier: `convex|${opts.userId}` }),
  }
}

async function seedTool(
  t: ReturnType<typeof convexTest>,
  slug: string,
  name: string,
): Promise<void> {
  await t.run(async (ctx: MutationCtx) => {
    await ctx.db.insert('tools', {
      name,
      slug,
      shortId: slug.slice(0, 6),
      categories: [],
      tiers: [],
      reviewStatus: 'approved',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  })
}

function toolSub(slug: string) {
  return {
    toolSlug: slug,
    kind: 'main' as const,
    primaryUsageLabel: 'coding',
    price: { pricingType: 'fixed' as const },
    priceKind: 'regular' as const,
  }
}

async function events(
  t: ReturnType<typeof convexTest>,
): Promise<Doc<'activityEvents'>[]> {
  return await t.run((ctx: MutationCtx) => ctx.db.query('activityEvents').collect())
}

// ---------------------------------------------------------------------------
// stack.created
// ---------------------------------------------------------------------------

test('creating a stack emits stack.created', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, { userId: 'a1', slug: 'creator-a1' })
  await seedTool(t, 'claude-code', 'Claude Code')

  await asCreator.mutation(api.stacks.create, {
    name: 'S',
    oneLiner: 'o',
    toolSubscriptions: [toolSub('claude-code')],
  })

  const rows = await events(t)
  expect(rows).toHaveLength(1)
  expect(rows[0].event).toEqual({ type: 'stack.created', toolCount: 1 })
})

test('re-saving a stack does not re-emit stack.created', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, { userId: 'a5', slug: 'creator-a5' })
  const created = await asCreator.mutation(api.stacks.create, {
    name: 'S',
    oneLiner: 'o',
    toolSubscriptions: [],
  })

  await asCreator.mutation(api.stacks.update, {
    stackId: created._id,
    oneLiner: 'edited',
  })

  const rows = await events(t)
  expect(rows).toHaveLength(1)
})

// ---------------------------------------------------------------------------
// stack.composition_changed
// ---------------------------------------------------------------------------

test('adding and removing tools on a public stack emits the diff with frozen names', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, { userId: 'b1', slug: 'creator-b1' })
  await seedTool(t, 'cursor', 'Cursor')
  await seedTool(t, 'zed', 'Zed')
  const created = await asCreator.mutation(api.stacks.create, {
    name: 'S',
    oneLiner: 'o',
    toolSubscriptions: [toolSub('cursor')],
  })

  await asCreator.mutation(api.stacks.update, {
    stackId: created._id,
    toolSubscriptions: [toolSub('zed')],
  })

  const rows = await events(t)
  expect(rows).toHaveLength(2)
  expect(rows[1].event).toEqual({
    type: 'stack.composition_changed',
    added: [{ kind: 'tool', slug: 'zed', name: 'Zed' }],
    removed: [{ kind: 'tool', slug: 'cursor', name: 'Cursor' }],
  })
})

test('a prose-only edit emits nothing', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, { userId: 'b2', slug: 'creator-b2' })
  await seedTool(t, 'cursor', 'Cursor')
  const created = await asCreator.mutation(api.stacks.create, {
    name: 'S',
    oneLiner: 'o',
    toolSubscriptions: [toolSub('cursor')],
  })

  await asCreator.mutation(api.stacks.update, {
    stackId: created._id,
    oneLiner: 'a better line',
    description: 'prose',
    toolSubscriptions: [toolSub('cursor')],
  })

  expect(await events(t)).toHaveLength(1)
})

test('a composition change on a stack emits its diff', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, { userId: 'b3', slug: 'creator-b3' })
  await seedTool(t, 'cursor', 'Cursor')
  const created = await asCreator.mutation(api.stacks.create, {
    name: 'S',
    oneLiner: 'o',
    toolSubscriptions: [],
  })

  await asCreator.mutation(api.stacks.update, {
    stackId: created._id,
    toolSubscriptions: [toolSub('cursor')],
  })

  const rows = await events(t)
  expect(rows).toHaveLength(2)
  expect(rows[1].event).toMatchObject({
    type: 'stack.composition_changed',
    added: [{ kind: 'tool', slug: 'cursor', name: 'Cursor' }],
  })
})

test('a model or bundle change is a composition change too', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, { userId: 'b5', slug: 'creator-b5' })
  await t.run(async (ctx: MutationCtx) => {
    await ctx.db.insert('models', {
      name: 'Opus 5',
      slug: 'opus-5',
      shortId: 'opus5',
      provider: 'anthropic',
      category: 'coding',
      reviewStatus: 'approved',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  })
  const created = await asCreator.mutation(api.stacks.create, {
    name: 'S',
    oneLiner: 'o',
    toolSubscriptions: [],
  })

  await asCreator.mutation(api.stacks.update, {
    stackId: created._id,
    modelSubscriptions: [{ modelSlug: 'opus-5' }],
  })

  const rows = await events(t)
  expect(rows).toHaveLength(2)
  expect(rows[1].event).toEqual({
    type: 'stack.composition_changed',
    added: [{ kind: 'model', slug: 'opus-5', name: 'Opus 5' }],
    removed: [],
  })
})

test('a slug with no catalog row keeps the slug as its name rather than vanishing', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, { userId: 'b6', slug: 'creator-b6' })
  const created = await asCreator.mutation(api.stacks.create, {
    name: 'S',
    oneLiner: 'o',
    toolSubscriptions: [],
  })

  await asCreator.mutation(api.stacks.update, {
    stackId: created._id,
    toolSubscriptions: [toolSub('ghost-tool')],
  })

  const rows = await events(t)
  expect(rows[1].event).toMatchObject({
    added: [{ kind: 'tool', slug: 'ghost-tool', name: 'ghost-tool' }],
  })
})

// ---------------------------------------------------------------------------
// sync.landed
// ---------------------------------------------------------------------------

function payload(harness: string, tokens: number) {
  return {
    schemaVersion: 1 as const,
    capturedAt: Date.now(),
    window: { days: 30, from: '2026-07-01', to: '2026-07-31' },
    harness: { name: harness, version: '1.0.0' },
    pricingTable: null,
    activity: {
      sessions: 3,
      activeDays: 2,
      projects: 1,
      totalTokens: tokens,
      cacheHitShare: 0.5,
      subagentShare: 0,
    },
    models: [],
    inventory: {
      builtinTools: [],
      mcpServers: [],
      skills: [],
      subagents: [],
      slashCommands: [],
      withheld: {
        builtinTools: 0,
        mcpServers: 0,
        skills: 0,
        subagents: 0,
        slashCommands: 0,
      },
    },
    coverage: { filesScanned: 1, filesUnreadable: 0, linesParsed: 10, linesFailed: 0 },
    excludedTokens: { unpriced: 0, synthetic: 0 },
  }
}

async function seedTokenFor(
  t: ReturnType<typeof convexTest>,
  stackId: Id<'stacks'>,
  userId: string,
): Promise<Id<'cliTokens'>> {
  return await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('cliTokens', {
      tokenHash: `hash-${userId}`,
      userId,
      scopes: ['collect', 'sync'],
      stackId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000,
      lastUsedAt: Date.now(),
    }),
  )
}

test('a batch of two harnesses lands ONE sync.landed summarizing both', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, { userId: 'c1', slug: 'creator-c1' })
  const created = await asCreator.mutation(api.stacks.create, {
    name: 'S',
    oneLiner: 'o',
    toolSubscriptions: [],
  })
  const tokenId = await seedTokenFor(t, created._id, 'c1')

  await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 1000), payload('codex', 500)],
  })

  const rows = await events(t)
  const syncs = rows.filter((r) => r.event.type === 'sync.landed')
  expect(syncs).toHaveLength(1)
  expect(syncs[0].event).toEqual({
    type: 'sync.landed',
    harnesses: [
      {
        harness: 'claude-code',
        windowDays: 30,
        sessions: 3,
        activeDays: 2,
        projects: 1,
        totalTokens: 1000,
      },
      {
        harness: 'codex',
        windowDays: 30,
        sessions: 3,
        activeDays: 2,
        projects: 1,
        totalTokens: 500,
      },
    ],
  })
})

test('a sync to a stack lands the snapshot and a feed event', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, { userId: 'c2', slug: 'creator-c2' })
  const created = await asCreator.mutation(api.stacks.create, {
    name: 'S',
    oneLiner: 'o',
    toolSubscriptions: [],
  })
  const tokenId = await seedTokenFor(t, created._id, 'c2')

  const result = await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 1000)],
  })

  expect(result.receivedAt).toBeGreaterThan(0)
  expect((await events(t)).map((row) => row.event.type)).toEqual([
    'stack.created',
    'sync.landed',
  ])
})

test('the second sync emits a second event - there is no read-time collapsing to work around', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, { userId: 'c3', slug: 'creator-c3' })
  const created = await asCreator.mutation(api.stacks.create, {
    name: 'S',
    oneLiner: 'o',
    toolSubscriptions: [],
  })
  const tokenId = await seedTokenFor(t, created._id, 'c3')

  await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 1000)],
  })
  await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 2000)],
  })

  const rows = await events(t)
  expect(rows.filter((r) => r.event.type === 'sync.landed')).toHaveLength(2)
})

// ---------------------------------------------------------------------------
// The auto-sync opt-in the sync reports
// ---------------------------------------------------------------------------

test('the reported auto-sync state is stored on the token', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, { userId: 'd1', slug: 'creator-d1' })
  const created = await asCreator.mutation(api.stacks.create, {
    name: 'S',
    oneLiner: 'o',
    toolSubscriptions: [],
  })
  const tokenId = await seedTokenFor(t, created._id, 'd1')

  await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 1)],
    autoSync: { enabled: true, frequencyHours: 24 },
  })

  const token = await t.run((ctx: MutationCtx) => ctx.db.get(tokenId))
  expect(token?.autoSync).toEqual({ enabled: true, frequencyHours: 24 })
})

test('a sync that reports nothing leaves the stored state alone', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, { userId: 'd2', slug: 'creator-d2' })
  const created = await asCreator.mutation(api.stacks.create, {
    name: 'S',
    oneLiner: 'o',
    toolSubscriptions: [],
  })
  const tokenId = await seedTokenFor(t, created._id, 'd2')

  await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 1)],
    autoSync: { enabled: true, frequencyHours: 12 },
  })
  await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 2)],
  })

  const token = await t.run((ctx: MutationCtx) => ctx.db.get(tokenId))
  expect(token?.autoSync).toEqual({ enabled: true, frequencyHours: 12 })
})
