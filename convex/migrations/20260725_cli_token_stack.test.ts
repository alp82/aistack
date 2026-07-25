/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'
import schema from '../schema'

// Vite keys same-directory files as './x.ts' while convex-test derives its
// module root ('../') from the _generated path — remap the sibling keys so
// 'migrations/20260725_cli_token_stack' resolves. Same remap the retired
// profileDecoupling test needed; it is a convex-test quirk, not a repo one.
const modules = Object.fromEntries(
  Object.entries(import.meta.glob('../**/*.{js,ts}')).map(([key, loader]) => [
    key.replace(/^\.\//, '../migrations/'),
    loader,
  ]),
)

const DAY = 24 * 60 * 60 * 1000
const MIGRATION = internal.migrations['20260725_cli_token_stack']

type Ctx = Awaited<ReturnType<typeof convexTest>>

async function seedOwner(
  t: Ctx,
  userId: string,
  stackCount: number,
): Promise<Id<'stacks'>[]> {
  return await t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: userId,
      slug: `slug-${userId}`,
      userId,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    })
    const ids: Id<'stacks'>[] = []
    for (let i = 0; i < stackCount; i++) {
      ids.push(
        await ctx.db.insert('stacks', {
          name: `${userId} stack ${i}`,
          slug: `${userId}-stack-${i}`,
          shortId: `sid-${userId}-${i}`,
          creatorId,
          oneLiner: 'x',
          toolSubscriptions: [],
          hasUsageComponent: false,
          published: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
      )
    }
    return ids
  })
}

async function seedToken(
  t: Ctx,
  userId: string,
  stackId?: Id<'stacks'>,
): Promise<Id<'cliTokens'>> {
  return await t.run((ctx) =>
    ctx.db.insert('cliTokens', {
      token: `tok_${userId}_${Math.random().toString(36).slice(2)}`,
      userId,
      stackId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 90 * DAY,
      lastUsedAt: Date.now(),
    }),
  )
}

describe('cliTokens.stackId relink (phase B)', () => {
  test('links a token whose owner has exactly one stack', async () => {
    const t = convexTest(schema, modules)
    const [stackId] = await seedOwner(t, 'solo', 1)
    const tokenId = await seedToken(t, 'solo')

    expect(await t.query(MIGRATION.report, {})).toMatchObject({
      total: 1,
      alreadyLinked: 0,
      linkable: 1,
      ambiguous: 0,
    })

    const result = await t.mutation(MIGRATION.relinkUnambiguous, {})
    expect(result).toEqual({ linked: 1, leftUnlinked: 0 })

    const token = await t.run((ctx) => ctx.db.get(tokenId))
    expect(token?.stackId).toBe(stackId)
  })

  test('leaves an ambiguous owner unlinked rather than guessing', async () => {
    // Guessing would point a machine's measured layer at a stack the user never
    // chose, permanently — snapshots are immutable.
    const t = convexTest(schema, modules)
    await seedOwner(t, 'multi', 3)
    const tokenId = await seedToken(t, 'multi')

    const result = await t.mutation(MIGRATION.relinkUnambiguous, {})
    expect(result).toEqual({ linked: 0, leftUnlinked: 1 })
    const token = await t.run((ctx) => ctx.db.get(tokenId))
    expect(token?.stackId).toBeUndefined()
  })

  test('leaves a stackless owner unlinked', async () => {
    const t = convexTest(schema, modules)
    await seedOwner(t, 'empty', 0)
    await seedToken(t, 'empty')
    expect(await t.mutation(MIGRATION.relinkUnambiguous, {})).toEqual({
      linked: 0,
      leftUnlinked: 1,
    })
  })

  test('leaves a token with no creator profile unlinked and reports it', async () => {
    const t = convexTest(schema, modules)
    await seedToken(t, 'orphan')
    expect(await t.query(MIGRATION.report, {})).toMatchObject({
      total: 1,
      noCreator: 1,
      linkable: 0,
      ambiguous: 0,
    })
    expect(await t.mutation(MIGRATION.relinkUnambiguous, {})).toEqual({
      linked: 0,
      leftUnlinked: 1,
    })
  })

  test('is idempotent — a second run links nothing and changes nothing', async () => {
    const t = convexTest(schema, modules)
    const [stackId] = await seedOwner(t, 'solo', 1)
    const tokenId = await seedToken(t, 'solo')

    await t.mutation(MIGRATION.relinkUnambiguous, {})
    const second = await t.mutation(MIGRATION.relinkUnambiguous, {})
    expect(second).toEqual({ linked: 0, leftUnlinked: 0 })
    const token = await t.run((ctx) => ctx.db.get(tokenId))
    expect(token?.stackId).toBe(stackId)
  })

  test('never re-points a token that is already linked', async () => {
    const t = convexTest(schema, modules)
    const stacks = await seedOwner(t, 'solo', 1)
    const other = await seedOwner(t, 'elsewhere', 1)
    // Deliberately bound to a stack that is NOT the one the heuristic would pick.
    const tokenId = await seedToken(t, 'solo', other[0])

    await t.mutation(MIGRATION.relinkUnambiguous, {})
    const token = await t.run((ctx) => ctx.db.get(tokenId))
    expect(token?.stackId).toBe(other[0])
    expect(token?.stackId).not.toBe(stacks[0])
  })

  test('the dirty-row check tests PRESENCE, not truthiness', async () => {
    // The repo's migration gotcha: a truthiness check let an empty-string field
    // through last time and blocked the narrow. Mixing linked and unlinked rows
    // for one owner proves the report counts them apart.
    const t = convexTest(schema, modules)
    const [stackId] = await seedOwner(t, 'solo', 1)
    await seedToken(t, 'solo', stackId)
    await seedToken(t, 'solo')

    expect(await t.query(MIGRATION.report, {})).toMatchObject({
      total: 2,
      alreadyLinked: 1,
      linkable: 1,
    })
  })

  test('handles a mixed population in one pass', async () => {
    const t = convexTest(schema, modules)
    const [soloStack] = await seedOwner(t, 'solo', 1)
    await seedOwner(t, 'multi', 2)
    await seedToken(t, 'solo')
    await seedToken(t, 'multi')
    await seedToken(t, 'orphan')
    await seedToken(t, 'solo', soloStack)

    const result = await t.mutation(MIGRATION.relinkUnambiguous, {})
    expect(result).toEqual({ linked: 1, leftUnlinked: 2 })

    const after = await t.query(MIGRATION.report, {})
    expect(after).toMatchObject({
      total: 4,
      alreadyLinked: 2,
      linkable: 0,
      ambiguous: 1,
      noCreator: 1,
    })
  })
})
