/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'
import schema from '../schema'

// Vite keys same-directory files as './x.ts' while convex-test derives its
// module root ('../') from the _generated path — remap the sibling keys so
// 'migrations/20260725_clear_stack_image_url' resolves. Same quirk the sibling
// cliTokens migration test works around.
const modules = Object.fromEntries(
  Object.entries(import.meta.glob('../**/*.{js,ts}')).map(([key, loader]) => [
    key.replace(/^\.\//, '../migrations/'),
    loader,
  ]),
)

const MIGRATION = internal.migrations['20260725_clear_stack_image_url']

type Ctx = Awaited<ReturnType<typeof convexTest>>

async function seedStack(
  t: Ctx,
  slug: string,
  stackImageUrl?: string,
): Promise<Id<'stacks'>> {
  return await t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: slug,
      slug: `creator-${slug}`,
      userId: `user-${slug}`,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    })
    return await ctx.db.insert('stacks', {
      name: slug,
      slug,
      shortId: `sid-${slug}`,
      creatorId,
      oneLiner: 'x',
      // Passing `undefined` leaves the field absent — that is the clean case.
      stackImageUrl,
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  })
}

describe('stacks.stackImageUrl clear pass (phase B)', () => {
  test('clears a row whose stackImageUrl is the empty string', async () => {
    // The row that blocked the narrow: present, but falsy — which is why the
    // original pass, testing truthiness, walked straight past it.
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t, 'empty-string', '')

    expect(await t.query(MIGRATION.report, {})).toMatchObject({
      total: 1,
      clean: 0,
      dirtyEmpty: 1,
      dirtyNonEmpty: 0,
    })

    expect(await t.mutation(MIGRATION.clearEmpty, {})).toEqual({
      cleared: 1,
      leftDirty: 0,
    })

    const stack = await t.run((ctx) => ctx.db.get(stackId))
    expect(stack?.stackImageUrl).toBeUndefined()
    expect('stackImageUrl' in (stack as object)).toBe(false)
  })

  test('the dirty check tests PRESENCE, not truthiness', async () => {
    // Guards the exact regression this migration repairs. A truthiness-based
    // report would count the empty-string row as clean and let the narrow ship
    // against a deployment it cannot validate.
    const t = convexTest(schema, modules)
    await seedStack(t, 'absent')
    await seedStack(t, 'empty-string', '')

    expect(await t.query(MIGRATION.report, {})).toMatchObject({
      total: 2,
      clean: 1,
      dirtyEmpty: 1,
    })
  })

  test('leaves a real URL alone and names it in the report', async () => {
    // Unrecoverable if cleared blindly: the image was never consumed onto the
    // creator, so a human decides.
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t, 'real-url', 'https://example.com/img.png')

    expect(await t.query(MIGRATION.report, {})).toMatchObject({
      dirtyEmpty: 0,
      dirtyNonEmpty: 1,
      nonEmptySlugs: ['real-url'],
    })

    expect(await t.mutation(MIGRATION.clearEmpty, {})).toEqual({
      cleared: 0,
      leftDirty: 1,
    })
    const stack = await t.run((ctx) => ctx.db.get(stackId))
    expect(stack?.stackImageUrl).toBe('https://example.com/img.png')
  })

  test('clears a real URL only when explicitly opted in', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t, 'real-url', 'https://example.com/img.png')

    expect(
      await t.mutation(MIGRATION.clearEmpty, { includeNonEmpty: true }),
    ).toEqual({ cleared: 1, leftDirty: 0 })
    const stack = await t.run((ctx) => ctx.db.get(stackId))
    expect(stack?.stackImageUrl).toBeUndefined()
  })

  test('is idempotent — a second run clears nothing', async () => {
    const t = convexTest(schema, modules)
    await seedStack(t, 'empty-string', '')

    await t.mutation(MIGRATION.clearEmpty, {})
    expect(await t.mutation(MIGRATION.clearEmpty, {})).toEqual({
      cleared: 0,
      leftDirty: 0,
    })
    expect(await t.query(MIGRATION.report, {})).toMatchObject({
      clean: 1,
      dirtyEmpty: 0,
    })
  })

  test('handles a mixed population in one pass', async () => {
    const t = convexTest(schema, modules)
    await seedStack(t, 'absent')
    await seedStack(t, 'empty-one', '')
    await seedStack(t, 'empty-two', '')
    await seedStack(t, 'real-url', 'https://example.com/img.png')

    expect(await t.mutation(MIGRATION.clearEmpty, {})).toEqual({
      cleared: 2,
      leftDirty: 1,
    })
    expect(await t.query(MIGRATION.report, {})).toMatchObject({
      total: 4,
      clean: 3,
      dirtyEmpty: 0,
      dirtyNonEmpty: 1,
    })
  })
})
