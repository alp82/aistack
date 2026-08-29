import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import { ADMIN_EMAILS } from './lib/admin'
import schema from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')

function asAdmin(t: ReturnType<typeof convexTest>) {
  return t.withIdentity({ tokenIdentifier: 'convex|admin', email: ADMIN_EMAILS[0] })
}

async function seed(t: ReturnType<typeof convexTest>) {
  const now = 1_700_000_000_000
  await t.run(async (ctx) => {
    for (const [slug, reviewStatus] of [
      ['a-pending', 'pending'],
      ['b-pending', 'pending'],
      ['c-approved', 'approved'],
    ] as const) {
      await ctx.db.insert('models', {
        name: slug,
        slug,
        shortId: slug.slice(0, 6),
        provider: 'OpenAI',
        category: 'coding',
        reviewStatus,
        createdAt: now,
        updatedAt: now,
      })
    }
  })
}

describe('approveAllPendingModels', () => {
  test('approves every pending model and the import count drops to zero', async () => {
    const t = convexTest(schema, modules)
    await seed(t)
    const admin = asAdmin(t)
    expect(await admin.query(api.admin.getImportTabCount, {})).toBe(2)
    expect(await admin.mutation(api.admin.approveAllPendingModels, {})).toBe(2)
    expect(await admin.query(api.admin.getImportTabCount, {})).toBe(0)
    const statuses = await t.run(async (ctx) =>
      (await ctx.db.query('models').collect()).map((m) => m.reviewStatus)
    )
    expect(statuses).toEqual(['approved', 'approved', 'approved'])
  })

  test('refuses a non-admin and answers null for the count', async () => {
    const t = convexTest(schema, modules)
    await seed(t)
    const user = t.withIdentity({ tokenIdentifier: 'convex|user', email: 'someone@example.com' })
    expect(await user.query(api.admin.getImportTabCount, {})).toBeNull()
    await expect(user.mutation(api.admin.approveAllPendingModels, {})).rejects.toThrow()
  })
})
