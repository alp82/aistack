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

const MIGRATION = internal.migrations['20260831_auto_sync_six_hours']

describe('20260831_auto_sync_six_hours', () => {
  test('moves enabled stacks to six hours and leaves every off state alone', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => {
      const creatorId = await ctx.db.insert('creators', {
        name: 'Owner',
        slug: 'owner',
        userId: 'owner',
        verified: false,
        personalPages: [],
        projectPages: [],
        createdAt: 1,
      })
      const insert = (
        slug: string,
        autoSync?: { enabled: boolean; frequencyHours: number },
      ) =>
        ctx.db.insert('stacks', {
          name: slug,
          slug,
          shortId: `sid-${slug}`,
          creatorId,
          oneLiner: slug,
          toolSubscriptions: [],
          hasUsageComponent: false,
          published: true,
          ...(autoSync ? { autoSync } : {}),
          createdAt: 1,
          updatedAt: 1,
        })
      return {
        daily: await insert('daily', { enabled: true, frequencyHours: 24 }),
        custom: await insert('custom', { enabled: true, frequencyHours: 12 }),
        six: await insert('six', { enabled: true, frequencyHours: 6 }),
        off: await insert('off', { enabled: false, frequencyHours: 24 }),
        unset: await insert('unset'),
      }
    })

    expect(await t.mutation(MIGRATION.run, {})).toEqual({
      updated: 2,
      alreadySixHours: 1,
      disabledOrUnset: 2,
    })
    const rows = await t.run(async (ctx) =>
      Object.fromEntries(
        await Promise.all(
          Object.entries(ids).map(async ([key, id]) => [key, await ctx.db.get(id)]),
        ),
      ),
    )
    expect(rows.daily?.autoSync).toEqual({ enabled: true, frequencyHours: 6 })
    expect(rows.custom?.autoSync).toEqual({ enabled: true, frequencyHours: 6 })
    expect(rows.six?.autoSync).toEqual({ enabled: true, frequencyHours: 6 })
    expect(rows.off?.autoSync).toEqual({ enabled: false, frequencyHours: 24 })
    expect(rows.unset?.autoSync).toBeUndefined()

    expect(await t.mutation(MIGRATION.run, {})).toEqual({
      updated: 0,
      alreadySixHours: 3,
      disabledOrUnset: 2,
    })
  })
})
