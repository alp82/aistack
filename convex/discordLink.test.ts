/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { afterEach, expect, test, vi } from 'vitest'
import { api, internal } from './_generated/api'
import type { MutationCtx } from './_generated/server'
import schema from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')

const savedSecret = process.env.BETTER_AUTH_SECRET
const savedAppUrl = process.env.APP_URL

afterEach(() => {
  vi.useRealTimers()
  if (savedSecret === undefined) delete process.env.BETTER_AUTH_SECRET
  else process.env.BETTER_AUTH_SECRET = savedSecret
  if (savedAppUrl === undefined) delete process.env.APP_URL
  else process.env.APP_URL = savedAppUrl
})

test('/link creates the locked ephemeral reply with a signed site URL', async () => {
  process.env.BETTER_AUTH_SECRET = 'discord-link-test-secret-at-least-32-characters'
  process.env.APP_URL = 'https://aistack.test'
  const t = convexTest(schema, modules)

  const reply = await t.action(internal.discordLink.createCommandResponse, {
    discordUserId: '105048063873126400',
  })

  expect(reply.flags).toBe(64)
  expect(reply.embeds[0]?.title).toBe('Link your aistack account')
  expect(reply.embeds[0]?.description).toMatch(
    /^Open this URL and sign in\. It is valid for 10 minutes and only works once\./,
  )
  const url = reply.components[0]?.components[0]?.url
  expect(url).toMatch(/^https:\/\/aistack\.test\/link\/discord\?token=./)
  expect(reply.embeds[0]?.description).toContain(url)
})

test('a signed-in creator consumes a link once', async () => {
  process.env.BETTER_AUTH_SECRET = 'discord-link-test-secret-at-least-32-characters'
  process.env.APP_URL = 'https://aistack.test'
  const t = convexTest(schema, modules)
  const creatorId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: 'Ada',
      slug: 'ada',
      userId: 'user_ada',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )
  const asCreator = t.withIdentity({ tokenIdentifier: 'convex|user_ada' })
  const reply = await t.action(internal.discordLink.createCommandResponse, {
    discordUserId: '105048063873126400',
  })
  const url = new URL(reply.components[0]?.components[0]?.url ?? '')
  const token = url.searchParams.get('token') ?? ''

  await expect(
    asCreator.mutation(api.discordLink.linkAccount, { token }),
  ).resolves.toEqual({ status: 'linked' })
  expect(
    await t.run(async (ctx: MutationCtx) => (await ctx.db.get(creatorId))?.discordUserId),
  ).toBe('105048063873126400')
  await expect(
    asCreator.mutation(api.discordLink.linkAccount, { token }),
  ).resolves.toEqual({ status: 'invalid' })
})

test('a link expires after 10 minutes', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-08-28T15:00:00Z'))
  process.env.BETTER_AUTH_SECRET = 'discord-link-test-secret-at-least-32-characters'
  process.env.APP_URL = 'https://aistack.test'
  const t = convexTest(schema, modules)
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: 'Ada',
      slug: 'ada',
      userId: 'user_ada',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )
  const reply = await t.action(internal.discordLink.createCommandResponse, {
    discordUserId: '105048063873126400',
  })
  const url = new URL(reply.components[0]?.components[0]?.url ?? '')
  const token = url.searchParams.get('token') ?? ''

  vi.advanceTimersByTime(10 * 60 * 1000 + 1)

  await expect(
    t
      .withIdentity({ tokenIdentifier: 'convex|user_ada' })
      .mutation(api.discordLink.linkAccount, { token }),
  ).resolves.toEqual({ status: 'expired' })
})

test('the settings query reports whether the creator has a linked account', async () => {
  const t = convexTest(schema, modules)
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: 'Ada',
      slug: 'ada',
      userId: 'user_ada',
      discordUserId: '105048063873126400',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )

  await expect(
    t
      .withIdentity({ tokenIdentifier: 'convex|user_ada' })
      .query(api.discordLink.getMine, {}),
  ).resolves.toEqual({ linked: true })
})

test('the signed-in creator removes their Discord link', async () => {
  const t = convexTest(schema, modules)
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: 'Ada',
      slug: 'ada',
      userId: 'user_ada',
      discordUserId: '105048063873126400',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )
  const asCreator = t.withIdentity({ tokenIdentifier: 'convex|user_ada' })

  await asCreator.mutation(api.discordLink.removeMine, {})

  await expect(asCreator.query(api.discordLink.getMine, {})).resolves.toEqual({
    linked: false,
  })
})

test('the cleanup removes expired unused links and keeps current links', async () => {
  const t = convexTest(schema, modules)
  await t.run(async (ctx: MutationCtx) => {
    await ctx.db.insert('discordLinkTokens', {
      tokenIdHash: 'expired',
      discordUserId: '105048063873126400',
      expiresAt: Date.now() - 1,
    })
    await ctx.db.insert('discordLinkTokens', {
      tokenIdHash: 'current',
      discordUserId: '105048063873126400',
      expiresAt: Date.now() + 60_000,
    })
  })

  await expect(
    t.mutation(internal.discordLink.cleanupExpiredTokens, {}),
  ).resolves.toEqual({ deleted: 1 })
  expect(
    await t.run(async (ctx: MutationCtx) =>
      ctx.db.query('discordLinkTokens').collect(),
    ),
  ).toHaveLength(1)
})

test('linking moves a Discord account from its previous creator', async () => {
  process.env.BETTER_AUTH_SECRET = 'discord-link-test-secret-at-least-32-characters'
  process.env.APP_URL = 'https://aistack.test'
  const t = convexTest(schema, modules)
  await t.run(async (ctx: MutationCtx) => {
    await ctx.db.insert('creators', {
      name: 'Previous',
      slug: 'previous',
      userId: 'user_previous',
      discordUserId: '105048063873126400',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    })
    await ctx.db.insert('creators', {
      name: 'Current',
      slug: 'current',
      userId: 'user_current',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    })
  })
  const reply = await t.action(internal.discordLink.createCommandResponse, {
    discordUserId: '105048063873126400',
  })
  const url = new URL(reply.components[0]?.components[0]?.url ?? '')
  const token = url.searchParams.get('token') ?? ''

  await t
    .withIdentity({ tokenIdentifier: 'convex|user_current' })
    .mutation(api.discordLink.linkAccount, { token })

  await expect(
    t
      .withIdentity({ tokenIdentifier: 'convex|user_previous' })
      .query(api.discordLink.getMine, {}),
  ).resolves.toEqual({ linked: false })
  await expect(
    t
      .withIdentity({ tokenIdentifier: 'convex|user_current' })
      .query(api.discordLink.getMine, {}),
  ).resolves.toEqual({ linked: true })
})

test('a tampered signature cannot consume the one-time link', async () => {
  process.env.BETTER_AUTH_SECRET = 'discord-link-test-secret-at-least-32-characters'
  process.env.APP_URL = 'https://aistack.test'
  const t = convexTest(schema, modules)
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: 'Ada',
      slug: 'ada',
      userId: 'user_ada',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )
  const reply = await t.action(internal.discordLink.createCommandResponse, {
    discordUserId: '105048063873126400',
  })
  const url = new URL(reply.components[0]?.components[0]?.url ?? '')
  const token = url.searchParams.get('token') ?? ''
  const last = token.charAt(token.length - 1)
  const tampered = `${token.slice(0, -1)}${last === '0' ? '1' : '0'}`
  const asCreator = t.withIdentity({ tokenIdentifier: 'convex|user_ada' })

  await expect(
    asCreator.mutation(api.discordLink.linkAccount, { token: tampered }),
  ).resolves.toEqual({ status: 'invalid' })
  await expect(
    asCreator.mutation(api.discordLink.linkAccount, { token }),
  ).resolves.toEqual({ status: 'linked' })
})
