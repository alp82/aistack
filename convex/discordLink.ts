import { v } from 'convex/values'
import { internal } from './_generated/api'
import {
  internalAction,
  internalMutation,
  mutation,
  query,
} from './_generated/server'
import { getAppUrl } from './httpCli'
import {
  DISCORD_LINK_TTL_MS,
  hashDiscordLinkTokenId,
  isDiscordUserId,
  randomTokenNonce,
  signDiscordLinkToken,
  verifyDiscordLinkToken,
} from './discordLinkToken'

const LinkButtonValidator = v.object({
  type: v.literal(1),
  components: v.array(
    v.object({
      type: v.literal(2),
      style: v.literal(5),
      label: v.string(),
      url: v.string(),
    }),
  ),
})

export const createCommandResponse = internalAction({
  args: { discordUserId: v.string() },
  returns: v.object({
    flags: v.literal(64),
    embeds: v.array(
      v.object({
        title: v.string(),
        color: v.number(),
        description: v.string(),
      }),
    ),
    components: v.array(LinkButtonValidator),
  }),
  handler: async (ctx, args) => {
    if (!isDiscordUserId(args.discordUserId)) {
      throw new Error('Invalid Discord user id')
    }
    const secret = process.env.BETTER_AUTH_SECRET
    if (!secret) throw new Error('Discord account linking is not configured')

    const payload = {
      discordUserId: args.discordUserId,
      nonce: randomTokenNonce(),
      expiresAt: Date.now() + DISCORD_LINK_TTL_MS,
    }
    const token = await signDiscordLinkToken(payload, secret)
    await ctx.runMutation(internal.discordLink.storeToken, {
      tokenIdHash: await hashDiscordLinkTokenId(payload.nonce),
      discordUserId: payload.discordUserId,
      expiresAt: payload.expiresAt,
    })
    const url = `${getAppUrl()}/link/discord?token=${encodeURIComponent(token)}`
    const description =
      'Open this URL and sign in. It is valid for 10 minutes and only works once.\n\n' +
      url

    return {
      flags: 64 as const,
      embeds: [
        {
          title: 'Link your aistack account',
          color: 0xa3e635,
          description,
        },
      ],
      components: [
        {
          type: 1 as const,
          components: [
            {
              type: 2 as const,
              style: 5 as const,
              label: 'Open link page',
              url,
            },
          ],
        },
      ],
    }
  },
})

export const storeToken = internalMutation({
  args: {
    tokenIdHash: v.string(),
    discordUserId: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert('discordLinkTokens', args)
    return null
  },
})

const LinkStatus = v.union(
  v.literal('linked'),
  v.literal('removed'),
  v.literal('invalid'),
  v.literal('expired'),
  v.literal('not_authenticated'),
)

export const updateMine = mutation({
  args: v.union(
    v.object({ operation: v.literal('link'), token: v.string() }),
    v.object({ operation: v.literal('remove') }),
  ),
  returns: v.object({ status: LinkStatus }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    status: 'linked' | 'removed' | 'invalid' | 'expired' | 'not_authenticated'
  }> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { status: 'not_authenticated' }
    const userId = identity.tokenIdentifier.split('|')[1]
    if (!userId) return { status: 'not_authenticated' }
    const creator = await ctx.db
      .query('creators')
      .withIndex('by_userId', (query) => query.eq('userId', userId))
      .unique()
    if (!creator) return { status: 'not_authenticated' as const }

    if (args.operation === 'remove') {
      if (creator.discordUserId !== undefined) {
        await ctx.db.patch(creator._id, { discordUserId: undefined })
      }
      return { status: 'removed' as const }
    }

    const secret = process.env.BETTER_AUTH_SECRET
    if (!secret) return { status: 'invalid' }
    const payload = await verifyDiscordLinkToken(args.token, secret)
    if (!payload) return { status: 'invalid' }
    const tokenIdHash = await hashDiscordLinkTokenId(payload.nonce)
    const row = await ctx.db
      .query('discordLinkTokens')
      .withIndex('by_tokenIdHash', (query) => query.eq('tokenIdHash', tokenIdHash))
      .unique()
    if (
      !row ||
      row.discordUserId !== payload.discordUserId ||
      row.expiresAt !== payload.expiresAt
    ) {
      return { status: 'invalid' as const }
    }
    if (row.expiresAt <= Date.now()) {
      await ctx.db.delete(row._id)
      return { status: 'expired' as const }
    }

    const previousCreators = await ctx.db
      .query('creators')
      .withIndex('by_discordUserId', (query) =>
        query.eq('discordUserId', payload.discordUserId),
      )
      .collect()
    for (const previous of previousCreators) {
      if (previous._id !== creator._id) {
        await ctx.db.patch(previous._id, { discordUserId: undefined })
      }
    }
    await ctx.db.patch(creator._id, { discordUserId: payload.discordUserId })
    await ctx.db.delete(row._id)
    return { status: 'linked' as const }
  },
})

export const getMine = query({
  args: {},
  returns: v.union(v.null(), v.object({ linked: v.boolean() })),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const userId = identity.tokenIdentifier.split('|')[1]
    if (!userId) return null
    const creator = await ctx.db
      .query('creators')
      .withIndex('by_userId', (queryBuilder) => queryBuilder.eq('userId', userId))
      .unique()
    if (!creator) return null
    return { linked: creator.discordUserId !== undefined }
  },
})

export const cleanupExpiredTokens = internalMutation({
  args: {},
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx) => {
    const expired = await ctx.db
      .query('discordLinkTokens')
      .withIndex('by_expiresAt', (queryBuilder) =>
        queryBuilder.lt('expiresAt', Date.now()),
      )
      .take(500)
    for (const row of expired) await ctx.db.delete(row._id)
    return { deleted: expired.length }
  },
})
