/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { internal } from '../_generated/api'
import schema from '../schema'

const modules = Object.fromEntries(
  Object.entries(import.meta.glob('../**/*.{js,ts}')).map(([key, loader]) => [
    key.replace(/^\.\//, '../migrations/'),
    loader,
  ]),
)

const MIGRATION = (internal.migrations as any)['20260831_stacks_always_public']

describe('20260831_stacks_always_public', () => {
  test('removes draft flags and renames creation events idempotently', async () => {
    const t = convexTest(schema, modules)
    const { publicId, legacyEventId } = await t.run(async (ctx) => {
      const creatorId = await ctx.db.insert('creators', {
        name: 'Owner',
        slug: 'owner',
        userId: 'owner',
        verified: false,
        personalPages: [],
        projectPages: [],
        createdAt: 1,
      })
      const insertStack = (slug: string, published?: boolean) =>
        ctx.db.insert('stacks', {
          name: slug,
          slug,
          shortId: `sid-${slug}`,
          creatorId,
          oneLiner: slug,
          toolSubscriptions: [],
          hasUsageComponent: false,
          ...(published === undefined ? {} : { published }),
          createdAt: 1,
          updatedAt: 1,
        })
      const publicId = await insertStack('public', true)
      await insertStack('draft', false)
      await insertStack('current')
      const legacyEventId = await ctx.db.insert('activityEvents', {
        stackId: publicId,
        createdAt: 1,
        event: { type: 'stack.published', toolCount: 2 },
      })
      await ctx.db.insert('activityEvents', {
        stackId: publicId,
        createdAt: 2,
        event: { type: 'stack.created', toolCount: 3 },
      })
      return { publicId, legacyEventId }
    })

    expect(await t.mutation(MIGRATION.run, {})).toEqual({
      stacksUpdated: 2,
      eventsUpdated: 1,
    })
    expect((await t.run((ctx) => ctx.db.get(publicId)))?.published).toBeUndefined()
    expect((await t.run((ctx) => ctx.db.get(legacyEventId)))?.event).toEqual({
      type: 'stack.created',
      toolCount: 2,
    })
    expect(await t.mutation(MIGRATION.run, {})).toEqual({
      stacksUpdated: 0,
      eventsUpdated: 0,
    })
  })
})
