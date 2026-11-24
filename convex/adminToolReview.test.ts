/// <reference types="vite/client" />
import betterAuthTest from '@convex-dev/better-auth/test'
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import { api, components } from './_generated/api'
import { ADMIN_EMAILS } from './lib/admin'
import schema from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')

test('tool review links to each stack that lists the tool and to its submitter profile', async () => {
  const t = convexTest(schema, modules)
  betterAuthTest.register(t)
  const admin = t.withIdentity({ email: ADMIN_EMAILS[0] })
  const now = Date.now()
  const user = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'user',
      data: { name: 'Submitter', email: 'submitter@example.com', emailVerified: true, createdAt: now, updatedAt: now },
    },
  })
  const userWithoutProfile = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'user',
      data: { name: 'New user', email: 'new@example.com', emailVerified: true, createdAt: now, updatedAt: now },
    },
  })
  await t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: 'Submitter', slug: 'submitter', userId: user._id, verified: false,
      personalPages: [], projectPages: [], createdAt: now,
    })
    for (const [slug, createdBy] of [
      ['used', user._id],
      ['unused', `issuer|${user._id}`],
      ['no-profile', userWithoutProfile._id],
      ['no-submitter', undefined],
    ]) {
      await ctx.db.insert('tools', {
        name: slug, slug, shortId: slug, categories: [], tiers: [],
        reviewStatus: 'pending', createdBy, createdAt: now, updatedAt: now,
      })
    }
    const subscription = {
      toolSlug: 'used', kind: 'main', primaryUsageLabel: 'Editor',
      price: { pricingType: 'fixed' }, priceKind: 'regular',
    } as const
    for (const [slug, shortId] of [['first-stack', 'abc123'], ['second-stack', 'abc456']]) {
      await ctx.db.insert('stacks', {
        name: slug, slug, shortId, creatorId, oneLiner: 'A stack',
        toolSubscriptions: [subscription, subscription], hasUsageComponent: false,
        createdAt: now, updatedAt: now,
      })
    }
  })
  expect(await t.query(api.admin.getPendingTools, {})).toBeNull()
  const rows = await admin.query(api.admin.getPendingTools, {})
  const tools = new Map(rows?.map((tool) => [tool.slug, tool]))
  expect(tools.get('used')).toMatchObject({
    stacks: [
      { slug: 'second-stack-abc456', name: 'second-stack' },
      { slug: 'first-stack-abc123', name: 'first-stack' },
    ],
    submitterInfo: { name: 'Submitter', profileSlug: 'submitter' },
  })
  expect(tools.get('unused')).toMatchObject({
    stacks: [], submitterInfo: { name: 'Submitter', profileSlug: 'submitter' },
  })
  expect(tools.get('no-profile')?.submitterInfo).toMatchObject({ name: 'New user' })
  expect(tools.get('no-profile')?.submitterInfo?.profileSlug).toBeUndefined()
  expect(tools.get('no-submitter')).toMatchObject({ stacks: [], submitterInfo: null })
})
