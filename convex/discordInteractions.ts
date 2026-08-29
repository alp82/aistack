import { v } from 'convex/values'
import { internal } from './_generated/api'
import { httpAction, internalAction } from './_generated/server'
import type { ActionCtx } from './_generated/server'
import { SHARED_BUCKET_MAX_REQUESTS } from './rateLimit'
import { encodeUtf8, hexToBytes } from './lib/webCrypto'
import {
  leaderboardCommand,
  modelCommand,
  stackCommand,
  tokensCommand,
} from './discordCommands'

/**
 * The Discord interactions endpoint (wayfinder #229, map #199).
 *
 * Discord POSTs every slash command here. The handler runs in three steps,
 * each bounded by a Discord rule:
 *
 * 1. Verify the Ed25519 signature over `timestamp + raw body` BEFORE parsing.
 *    Discord probes the endpoint with bad signatures and removes one that
 *    answers anything but 401.
 * 2. Answer inside the 3-second window: PONG for the registration ping, and a
 *    deferred response (type 5) for a command. The deferral is the only place
 *    the ephemeral flag can be set, so a command declares it up front.
 * 3. A scheduled action computes the reply and PATCHes `@original` through the
 *    webhook, well inside the 15-minute token life.
 *
 * Commands plug in through `COMMANDS`. `/stack` and `/tokens` live in
 * `discordCommands.ts` (#226), and so do `/leaderboard` and `/model` (#223).
 * `/link` is here because its reply already exists.
 */

export const INTERACTIONS_PATH = '/api/discord/interactions'

/** Slash commands one Discord user may run per minute. */
export const DISCORD_USER_MAX_REQUESTS = 20

const DISCORD_API = 'https://discord.com/api/v10'
const EPHEMERAL = 64

const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
} as const

const CallbackType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  AUTOCOMPLETE_RESULT: 8,
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

/** The command registry. Later tickets add their entries here. */
const COMMANDS: Record<string, CommandSpec> = {
  link: {
    ephemeral: true,
    reply: async (ctx, call) =>
      await ctx.runAction(internal.discordLink.createCommandResponse, {
        discordUserId: call.discordUserId,
      }),
  },
  stack: stackCommand,
  tokens: tokensCommand,
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
    data: { flags: EPHEMERAL, content },
  })
}

interface RawInteraction {
  type?: number
  application_id?: string
  token?: string
  data?: {
    name?: string
    options?: Array<{ name?: string; value?: unknown }>
  }
  member?: { user?: { id?: string } }
  user?: { id?: string }
}

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
  if (!(await verifyDiscordSignature(publicKey, signature, timestamp, rawBody))) {
    return json(401, { error: 'invalid request signature' })
  }

  let interaction: RawInteraction
  try {
    interaction = JSON.parse(rawBody) as RawInteraction
  } catch {
    return json(400, { error: 'invalid JSON' })
  }

  if (interaction.type === InteractionType.PING) {
    return json(200, { type: CallbackType.PONG })
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
    return json(200, { type: CallbackType.AUTOCOMPLETE_RESULT, data: { choices: [] } })
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

  // Abuse limits. One bucket per Discord user, and one app-wide bucket that
  // bounds a flood from many users. Interaction responses are exempt from
  // Discord's global rate limit, so the reply is a message, not a 429.
  const perUser = await ctx.runMutation(internal.rateLimit.checkRateLimit, {
    key: `discord-user:${discordUserId}`,
    limit: DISCORD_USER_MAX_REQUESTS,
  })
  if (!perUser.allowed) {
    return message(
      `Too many commands. Try again in ${perUser.retryAfterSeconds} seconds.`,
    )
  }
  const shared = await ctx.runMutation(internal.rateLimit.checkRateLimit, {
    key: 'discord-app:all',
    limit: SHARED_BUCKET_MAX_REQUESTS,
  })
  if (!shared.allowed) {
    return message(
      `The bot is busy. Try again in ${shared.retryAfterSeconds} seconds.`,
    )
  }

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
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    console.error(`discord patch failed: ${res.status} ${await res.text()}`)
  }
}
