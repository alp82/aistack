import { api, internal } from './_generated/api'
import type { ActionCtx } from './_generated/server'
import type { StackTarget } from './discordStack'
import type { BoardReading as Board, ModelRanking } from './leaderboard'
import { getAppUrl } from './httpCli'

/** Retained stack card, leaderboard and global-model commands. Creator statistics
 * use discordStatsInteractions and the durable session transport. */

const LIME = 0xa3e635

export const UNLINKED_PROMPT =
  'No aistack account is linked to your Discord user. Run `/link`, open the URL, and sign in. After that, this command with no argument shows your own stack.'

export const EMPTY_BOARD_ERROR =
  'No stack has synced in the last 7 days, so there is nothing to rank yet.'

export function unknownModelError(name: string): string {
  return `No model matches "${name}". Use a model name from the leaderboard, like \`GPT-5.6 Sol\` or \`Claude Opus 5\`.`
}

export function unmeasuredModelError(name: string): string {
  return `No measured stack ran ${name} in the last 30 days.`
}

export function unknownStackError(slug: string): string {
  return `No stack matches "${slug}". Use the slug from the stack page URL, like \`alpers-agent-stack-unw0sl\`.`
}

/* Formatting, fixed to en-US: mirrors src/features/leaderboard/format.ts. */

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const plain = new Intl.NumberFormat('en-US')

/** 291.4B, 5.9M, 231. */
export function formatTokens(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 100e9 ? 1 : 2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  return plain.format(Math.round(n))
}

function pct(share: number): string {
  return `${Math.round(share * 100)}%`
}

function linkButton(label: string, url: string) {
  return { type: 1, components: [{ type: 2, style: 5, label, url }] }
}

type Target = Extract<StackTarget, { kind: 'stack' }>

/** The stack card: the OG image and one link button. */
export function stackCard(target: Target, appUrl: string) {
  const url = `${appUrl}/stacks/${target.slug}`
  return {
    embeds: [
      {
        title: target.name,
        url,
        color: LIME,
        image: {
          url: `${appUrl}/api/og/stack/${target.slug}?v=${target.updatedAt}`,
        },
      },
    ],
    components: [linkButton('View stack', url)],
  }
}

function slugOption(
  options: Array<{ name: string; value: unknown }>,
): string | undefined {
  const value = options.find((o) => o.name === 'stack')?.value
  return typeof value === 'string' && value.trim() !== ''
    ? value.trim()
    : undefined
}

async function target(
  ctx: ActionCtx,
  call: {
    discordUserId: string
    options: Array<{ name: string; value: unknown }>
  },
) {
  return await ctx.runQuery(internal.discordStack.resolveStack, {
    discordUserId: call.discordUserId,
    slug: slugOption(call.options),
  })
}

function targetError(
  resolved: Awaited<ReturnType<typeof target>>,
): string | null {
  switch (resolved.kind) {
    case 'unlinked':
      return UNLINKED_PROMPT
    case 'unknown':
      return unknownStackError(resolved.slug)
    case 'stack':
      return null
  }
}

type Call = {
  discordUserId: string
  options: Array<{ name: string; value: unknown }>
}

function plural(n: number, noun: string): string {
  return `\`${n}\` ${noun}${n === 1 ? '' : 's'}`
}

/**
 * The top builders by 30-day token volume: the board's first page, one line
 * per row. A row prints dollars only where the board priced it, which is
 * where `publishCost` allowed it; a partial price wears the lower-bound sign.
 */
export function leaderboardEmbed(board: Board, appUrl: string) {
  const url = `${appUrl}/leaderboard`
  const lines = board.rows.map((row) => {
    const parts = [
      `**${row.rank}** [${row.name}](${appUrl}/stacks/${row.slug})`,
      `\`${formatTokens(row.tokens)}\``,
    ]
    if (row.topModel)
      parts.push(`${row.topModel.name} ${pct(row.topModel.share)}`)
    if (row.spend) {
      const figure = money.format(row.spend.lowerBoundUSD)
      parts.push(`\`${row.spend.exact ? figure : `≥ ${figure}`}\``)
    }
    return parts.join(' · ')
  })

  const population = [
    `\`${formatTokens(board.totalTokens)}\` tokens`,
    plural(board.stackCount, 'stack'),
  ]
  if (board.costPublishers > 0) {
    population.push(
      `\`${money.format(board.spendLowerBoundUSD)}\` at least, ${board.costPublishers} of ${board.stackCount} publish cost`,
    )
  }

  const footer =
    board.pricingTables.length === 0
      ? "Counted on the builders' machines, published by them."
      : `Spend is a lower bound. Prices: ${board.pricingTables.join(', ')}.`

  return {
    embeds: [
      {
        title: 'AI coding leaderboard · measured, last 30 days',
        url,
        color: LIME,
        description: lines.join('\n'),
        fields: [
          { name: 'All measured stacks', value: population.join(' · ') },
        ],
        footer: { text: footer },
      },
    ],
    components: [linkButton('View leaderboard', url)],
  }
}

/** One model's adoption over every measured stack. */
export function modelEmbed(ranking: ModelRanking, appUrl: string) {
  const url = `${appUrl}/leaderboard`
  return {
    embeds: [
      {
        title: `${ranking.name} · measured, last 30 days`,
        url,
        color: LIME,
        fields: [
          {
            name: 'Token share',
            value: `\`${pct(ranking.tokenShare)}\` of attributed tokens`,
            inline: true,
          },
          {
            name: 'Measured on',
            value: plural(ranking.stackCount, 'stack'),
            inline: true,
          },
          {
            name: 'Leads',
            value: plural(ranking.leadsCount, 'stack'),
            inline: true,
          },
        ],
        footer: {
          text: 'Share of tokens that carry a model name, across all measured stacks.',
        },
      },
    ],
    components: [linkButton('View leaderboard', url)],
  }
}

function modelOption(options: Array<{ name: string; value: unknown }>): string {
  const value = options.find((o) => o.name === 'model')?.value
  return typeof value === 'string' ? value.trim() : ''
}

export const stackCommand = {
  ephemeral: false,
  check: async (ctx: ActionCtx, call: Call) =>
    targetError(await target(ctx, call)),
  reply: async (ctx: ActionCtx, call: Call) => {
    const resolved = await target(ctx, call)
    if (resolved.kind !== 'stack')
      throw new Error(`stack target ${resolved.kind}`)
    return stackCard(resolved, getAppUrl())
  },
}

export const leaderboardCommand = {
  ephemeral: false,
  check: async (ctx: ActionCtx) => {
    const board = await ctx.runQuery(api.leaderboard.get, {})
    return board.rows.length === 0 ? EMPTY_BOARD_ERROR : null
  },
  reply: async (ctx: ActionCtx) => {
    const board = await ctx.runQuery(api.leaderboard.get, {})
    if (board.rows.length === 0) throw new Error('empty board')
    return leaderboardEmbed(board, getAppUrl())
  },
}

export const modelCommand = {
  ephemeral: false,
  check: async (ctx: ActionCtx, call: Call) => {
    const name = modelOption(call.options)
    const ranking = await ctx.runQuery(api.leaderboard.model, { name })
    if (ranking === null) return unknownModelError(name)
    return ranking.stackCount === 0 ? unmeasuredModelError(ranking.name) : null
  },
  reply: async (ctx: ActionCtx, call: Call) => {
    const ranking = await ctx.runQuery(api.leaderboard.model, {
      name: modelOption(call.options),
    })
    if (ranking === null || ranking.stackCount === 0)
      throw new Error('model not measured')
    return modelEmbed(ranking, getAppUrl())
  },
}
