/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { api, internal } from './_generated/api'
import type { MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { sha256Hex } from './httpCli'

/**
 * A sync reopens the reports against a stack, the way a meaningful edit does:
 * the admin's low-quality mark drops, the flags stay, and the stack returns to
 * the admin flagged queue so the admin can judge it again.
 */

const modules = import.meta.glob('./**/*.{js,ts}')

async function seedStack(
  t: ReturnType<typeof convexTest>,
  userId: string,
): Promise<{ stackId: Id<'stacks'>; tokenId: Id<'cliTokens'> }> {
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: `Creator ${userId}`,
      slug: `creator-${userId}`,
      userId,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )
  const asCreator = t.withIdentity({ tokenIdentifier: `convex|${userId}` })
  const created = await asCreator.mutation(api.stacks.create, {
    name: 'S',
    oneLiner: 'o',
    toolSubscriptions: [],
  })
  const tokenId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('cliTokens', {
      tokenHash: await sha256Hex(`bearer-${userId}`),
      userId,
      scopes: ['collect', 'sync'],
      stackId: created._id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      lastUsedAt: Date.now(),
    }),
  )
  return { stackId: created._id, tokenId }
}

function payload(tokens: number) {
  return {
    schemaVersion: 1 as const,
    capturedAt: Date.now(),
    window: { days: 30, from: '2026-07-01', to: '2026-07-31' },
    harness: { name: 'claude-code', version: '1.0.0' },
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

async function flags(
  t: ReturnType<typeof convexTest>,
  stackId: Id<'stacks'>,
): Promise<Doc<'stackFlags'>[]> {
  return await t.run((ctx: MutationCtx) =>
    ctx.db
      .query('stackFlags')
      .withIndex('by_stackId', (q) => q.eq('stackId', stackId))
      .collect(),
  )
}

test('a sync clears the low-quality mark and keeps the reports for the admin queue', async () => {
  const t = convexTest(schema, modules)
  const { stackId, tokenId } = await seedStack(t, 'owner1')

  const reporter = t.withIdentity({ tokenIdentifier: 'convex|reporter1' })
  await reporter.mutation(api.stacks.reportStack, { stackId })
  await t.run((ctx: MutationCtx) => ctx.db.patch(stackId, { isLowQuality: true }))
  expect(await flags(t, stackId)).toHaveLength(1)

  await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload(1)],
  })

  expect(await flags(t, stackId)).toHaveLength(1)
  const stack = await t.run((ctx: MutationCtx) => ctx.db.get(stackId))
  expect(stack?.isLowQuality).toBe(false)
  expect((await reporter.query(api.stacks.getReportStatus, { stackId })).reported).toBe(true)
})

test('a sync against an unreported stack leaves the stack row alone', async () => {
  const t = convexTest(schema, modules)
  const { stackId, tokenId } = await seedStack(t, 'owner2')
  const before = await t.run((ctx: MutationCtx) => ctx.db.get(stackId))

  await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload(1)],
  })

  const after = await t.run((ctx: MutationCtx) => ctx.db.get(stackId))
  expect(after?.isLowQuality).toBeUndefined()
  expect(after?.updatedAt).toBe(before?.updatedAt)
})
