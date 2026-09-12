import { v } from 'convex/values'
import {
  statsInteraction,
  STATS_COMMANDS,
  type StatsInteraction,
} from './discordStatsInteractions'
import { internal } from './_generated/api'
import { httpAction, internalAction } from './_generated/server'
import type { ActionCtx } from './_generated/server'
import { SHARED_BUCKET_MAX_REQUESTS } from './rateLimit'
import { encodeUtf8, hexToBytes } from './lib/webCrypto'
import {
  leaderboardCommand,
  modelCommand,
  stackCommand,
} from './discordCommands'

/** Signed Discord entry: prompt acknowledgements and scheduled webhook delivery.
 * Creator statistics use durable sessions; retained entries use small embeds. */

export const INTERACTIONS_PATH = '/api/discord/interactions'

/** Slash commands one Discord user may run per minute. */
export const DISCORD_USER_MAX_REQUESTS = 20

const DISCORD_API = 'https://discord.com/api/v10'
const EPHEMERAL = 64

const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
} as const

const CallbackType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
} as const

const OptionValue = v.union(v.string(), v.number(), v.boolean())
const CommandOption = v.object({ name: v.string(), value: OptionValue })

export type CommandOption = { name: string; value: string | number | boolean }

/** What a command handler receives: the parsed, already-verified call. */
export interface CommandCall {
  discordUserId: string
  options: CommandOption[]
}

/** A Discord message payload, as sent to the webhook PATCH. */
export type ReplyData = Record<string, unknown>

interface CommandSpec {
  /** Set at deferral time, because a deferral fixes the reply's visibility. */
  ephemeral: boolean
  /**
   * Runs before the deferral, inside the 3-second window. A returned string
   * is answered at once as an ephemeral message and `reply` never runs. This
   * is how a public command keeps its error states private.
   */
  check?: (ctx: ActionCtx, call: CommandCall) => Promise<string | null>
  reply: (ctx: ActionCtx, call: CommandCall) => Promise<ReplyData>
}

/** The complete registered release command set. */
export const COMMANDS: Record<string, CommandSpec> = {
  link: {
    ephemeral: true,
    reply: async (ctx, call) =>
      await ctx.runAction(internal.discordLink.createCommandResponse, {
        discordUserId: call.discordUserId,
      }),
  },
  stack: stackCommand,
  ...Object.fromEntries(
    STATS_COMMANDS.map((name) => [
      name,
      {
        ephemeral: false,
        reply: async () => {
          throw new Error('Stats use durable sessions')
        },
      },
    ]),
  ),
  leaderboard: leaderboardCommand,
  model: modelCommand,
}

const FALLBACK_REPLY: ReplyData = {
  flags: EPHEMERAL,
  content: 'The site did not answer. Try again in a minute.',
}

export function optionValue(
  options: CommandOption[],
  name: string,
): string | number | boolean | undefined {
  return options.find((option) => option.name === name)?.value
}

/**
 * Verify Discord's Ed25519 signature over `timestamp + rawBody`.
 *
 * Every input is untrusted. Malformed hex, a key of the wrong length, and a
 * runtime without Ed25519 all return false rather than throw.
 */
export async function verifyDiscordSignature(
  publicKeyHex: string,
  signatureHex: string,
  timestamp: string,
  rawBody: string,
): Promise<boolean> {
  if (!/^[0-9a-f]{64}$/i.test(publicKeyHex)) return false
  if (!/^[0-9a-f]{128}$/i.test(signatureHex)) return false
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      hexToBytes(publicKeyHex),
      { name: 'Ed25519' },
      false,
      ['verify'],
    )
    return await crypto.subtle.verify(
      'Ed25519',
      key,
      hexToBytes(signatureHex),
      encodeUtf8(`${timestamp}${rawBody}`),
    )
  } catch {
    return false
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function message(content: string): Response {
  return json(200, {
    type: CallbackType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { flags: EPHEMERAL, content, allowed_mentions: { parse: [] } },
  })
}

type RawInteraction = StatsInteraction

function parseOptions(raw: RawInteraction['data']): CommandOption[] {
  const options: CommandOption[] = []
  for (const option of raw?.options ?? []) {
    if (typeof option.name !== 'string') continue
    const value = option.value
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      options.push({ name: option.name, value })
    }
  }
  return options
}

export const interactions = httpAction(async (ctx, request) => {
  const publicKey = process.env.DISCORD_PUBLIC_KEY
  if (!publicKey) return json(503, { error: 'Discord is not configured' })

  const rawBody = await request.text()
  const signature = request.headers.get('x-signature-ed25519') ?? ''
  const timestamp = request.headers.get('x-signature-timestamp') ?? ''
  if (
    !(await verifyDiscordSignature(publicKey, signature, timestamp, rawBody))
  ) {
    return json(401, { error: 'invalid request signature' })
  }

  if (
    !/^\d+$/.test(timestamp) ||
    Math.abs(Date.now() - Number(timestamp) * 1000) > 300000
  )
    return json(401, { error: 'expired request signature' })
  if (rawBody.length > 65536)
    return json(413, { error: 'interaction too large' })

  let interaction: RawInteraction
  try {
    interaction = JSON.parse(rawBody) as RawInteraction
    if (
      !interaction ||
      typeof interaction !== 'object' ||
      Array.isArray(interaction)
    )
      return json(400, { error: 'invalid interaction' })
  } catch {
    return json(400, { error: 'invalid JSON' })
  }

  if (interaction.type === InteractionType.PING) {
    return json(200, { type: CallbackType.PONG })
  }

  const actor = interaction.member?.user?.id ?? interaction.user?.id
  if (actor) {
    // Abuse limits. One bucket per Discord user, and one app-wide bucket that
    // bounds a flood from many users. Interaction responses are exempt from
    // Discord's global rate limit, so the reply is a message, not a 429.
    const perUser = await ctx.runMutation(internal.rateLimit.checkRateLimit, {
      key: `discord-user:${actor}`,
      limit: DISCORD_USER_MAX_REQUESTS,
    })
    if (!perUser.allowed) {
      if (interaction.type === 4)
        return json(200, { type: 8, data: { choices: [] } })
      return message(
        `Too many commands. Try again in ${perUser.retryAfterSeconds} seconds.`,
      )
    }
    const shared = await ctx.runMutation(internal.rateLimit.checkRateLimit, {
      key: 'discord-app:all',
      limit: SHARED_BUCKET_MAX_REQUESTS,
    })
    if (!shared.allowed) {
      if (interaction.type === 4)
        return json(200, { type: 8, data: { choices: [] } })
      return message(
        `The bot is busy. Try again in ${shared.retryAfterSeconds} seconds.`,
      )
    }
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
    return json(200, await statsInteraction(ctx, interaction))
  }

  if (interaction.type === 3 || interaction.type === 5) {
    return json(200, await statsInteraction(ctx, interaction))
  }

  if (interaction.type !== InteractionType.APPLICATION_COMMAND) {
    return message('This app only answers slash commands.')
  }

  const discordUserId = interaction.member?.user?.id ?? interaction.user?.id
  const command = interaction.data?.name
  const applicationId = interaction.application_id
  const token = interaction.token
  if (!discordUserId || !command || !applicationId || !token) {
    return json(400, { error: 'incomplete interaction' })
  }

  if (STATS_COMMANDS.includes(command))
    return json(200, await statsInteraction(ctx, interaction))

  const spec = COMMANDS[command]
  const options = parseOptions(interaction.data)
  if (spec?.check) {
    let error: string | null
    try {
      error = await spec.check(ctx, { discordUserId, options })
    } catch (cause) {
      console.error(`discord /${command} check failed`, cause)
      error = FALLBACK_REPLY.content as string
    }
    if (error) return message(error)
  }

  const ephemeral = spec?.ephemeral ?? true
  await ctx.scheduler.runAfter(0, internal.discordInteractions.fulfill, {
    applicationId,
    token,
    command,
    discordUserId,
    options,
  })

  return json(200, {
    type: CallbackType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    data: ephemeral ? { flags: EPHEMERAL } : {},
  })
})

/**
 * Compute the reply and patch it into the deferred message.
 *
 * A thrown handler still patches: the alternative is a "did not respond"
 * message from Discord fifteen minutes later.
 */
export const fulfill = internalAction({
  args: {
    applicationId: v.string(),
    token: v.string(),
    command: v.string(),
    discordUserId: v.string(),
    options: v.array(CommandOption),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const spec = COMMANDS[args.command]
    let data: ReplyData
    if (!spec) {
      data = { flags: EPHEMERAL, content: `Unknown command: /${args.command}` }
    } else {
      try {
        data = await spec.reply(ctx, {
          discordUserId: args.discordUserId,
          options: args.options,
        })
      } catch (error) {
        console.error(`discord /${args.command} failed`, error)
        data = FALLBACK_REPLY
      }
    }
    await patchOriginal(args.applicationId, args.token, data)
    return null
  },
})

/** PATCH the deferred reply. The webhook route needs no bot token. */
export async function patchOriginal(
  applicationId: string,
  token: string,
  data: ReplyData,
): Promise<void> {
  const url = `${DISCORD_API}/webhooks/${applicationId}/${token}/messages/@original`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, allowed_mentions: { parse: [] } }),
  })
  if (!res.ok) {
    console.error(`discord patch failed: ${res.status}`)
  }
}
