import type { FunctionReturnType } from 'convex/server'
import { HARNESS_NAMES, type HarnessName, harnessLabel } from '@aistack/workflow-rules'
import { api, internal } from './_generated/api'
import type { ActionCtx } from './_generated/server'
import type { StackTarget } from './discordStack'
import { getAppUrl } from './httpCli'

/**
 * The /stack and /tokens commands (wayfinder #226, map #199).
 *
 * Both take an optional `stack` slug. Without one they need a linked account
 * and use the caller's own stack. The embeds are the ones the showcase (#181)
 * proved in Discord. Every figure comes from the same public reads the web
 * uses: `publishedStackBySlug` for the card and `getUsageByStackSlug` for the
 * numbers, so the consent bits (`published`, `publishCost`) apply unchanged.
 *
 * `resolveStack` lives in `discordStack.ts`: a module that calls its own
 * `internal.*` entry degrades the generated API type to `any`.
 *
 * Error states answer INSIDE the 3-second window as ephemeral messages. A
 * public deferral cannot turn ephemeral later, so `check` runs before the
 * deferral and `reply` only ever builds the public embed.
 */

const LIME = 0xa3e635
const DAY_MS = 24 * 60 * 60 * 1000

export const UNLINKED_PROMPT =
  'No aistack account is linked to your Discord user. Run `/link`, open the URL, and sign in. After that, this command with no argument shows your own stack.'

export const UNPUBLISHED_PROMPT =
  'Your stack is not published yet. Publish it on the site, then run this command again.'

export const NO_DATA_ERROR =
  'This stack has no measured history. The owner can publish one with `aistack sync`.'

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

/** "2d ago", "today". Rounded down, so it never overstates freshness. */
export function ago(ms: number, nowMs: number): string {
  const days = Math.floor((nowMs - ms) / DAY_MS)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 60) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function labelHarness(name: string): string {
  return (HARNESS_NAMES as readonly string[]).includes(name)
    ? harnessLabel(name as HarnessName)
    : name
}

function linkButton(label: string, url: string) {
  return { type: 1, components: [{ type: 2, style: 5, label, url }] }
}

type Target = Extract<StackTarget, { kind: 'stack' }>
type Usage = NonNullable<FunctionReturnType<typeof api.measured.getUsageByStackSlug>>

/** The stack card: the OG image and one link button. */
export function stackCard(target: Target, appUrl: string) {
  const url = `${appUrl}/stacks/${target.slug}`
  return {
    embeds: [
      {
        title: target.name,
        url,
        color: LIME,
        image: { url: `${appUrl}/api/og/stack/${target.slug}?v=${target.updatedAt}` },
      },
    ],
    components: [linkButton('View stack', url)],
  }
}

/**
 * The measured numbers over the last 30 days. Spend prints only where the
 * read returned a cost, which is where `publishCost` allowed it, and every
 * dollar figure carries its price tables and the share of tokens it covers.
 */
export function tokensEmbed(target: Target, usage: Usage, appUrl: string, now: number) {
  const url = `${appUrl}/stacks/${target.slug}`
  const fields: Array<{ name: string; value: string; inline?: boolean }> = []
  const tables = new Set<string>()

  const reading = usage.current
  if (reading) {
    fields.push({
      name: 'Tokens',
      value: `\`${formatTokens(reading.totalTokens)}\` on \`${reading.activeDays}\` active ${
        reading.activeDays === 1 ? 'day' : 'days'
      }`,
      inline: true,
    })
    if (usage.receivedAt !== null) {
      fields.push({ name: 'Synced', value: ago(usage.receivedAt, now), inline: true })
    }
    const models = [...reading.models].sort((a, b) => b.totalTokens - a.totalTokens)
    const lead = models[0]
    if (lead) {
      const rest = models.length - 1
      const tail =
        rest === 0
          ? ''
          : ` ${rest} more ${rest === 1 ? 'model shares' : 'models share'} the rest.`
      fields.push({
        name: 'Models',
        value: `${lead.catalogName ?? lead.id} \`${pct(lead.tokenShare)}\` of tokens.${tail}`,
      })
    }
    const harnesses = [...reading.harnesses]
      .sort((a, b) => b.totalTokens - a.totalTokens)
      .map((h) => labelHarness(h.harness))
    if (harnesses.length > 0) {
      fields.push({ name: 'Harnesses', value: harnesses.join(' + ') })
    }
    if (reading.cost) {
      const figure = `${reading.cost.estimated ? '≥ ' : ''}${money.format(reading.cost.usd)}`
      fields.push({
        name: 'Spend',
        value: `\`${figure}\` · \`${pct(reading.cost.pricedShare)}\` of tokens priced`,
      })
      for (const table of reading.cost.pricingTables) tables.add(table)
    }
  } else if (usage.legacy) {
    // The retirement fallback (ADR-0011): one whole-window total, no per-model split.
    const legacy = usage.legacy
    fields.push({
      name: 'Tokens',
      value: `\`${formatTokens(legacy.tokens)}\` over \`${legacy.sessions}\` sessions`,
      inline: true,
    })
    fields.push({ name: 'Synced', value: ago(legacy.capturedAt, now), inline: true })
    if (legacy.usd !== null) {
      fields.push({ name: 'Spend', value: `\`${money.format(legacy.usd)}\`` })
    }
  }

  const footer =
    tables.size === 0
      ? "Counted on the builder's machine, published by them."
      : `Counted on the builder's machine, published by them. Prices: ${[...tables].sort().join(', ')}.`

  return {
    embeds: [
      {
        title: `${target.name} · measured, last 30 days`,
        url,
        color: LIME,
        fields,
        footer: { text: footer },
      },
    ],
    components: [linkButton('View stack', url)],
  }
}

/** True when the read holds a figure to print: a folded window or the legacy total. */
function hasNumbers(usage: Usage | null): usage is Usage {
  return usage !== null && (usage.current !== null || usage.legacy !== null)
}

function slugOption(options: Array<{ name: string; value: unknown }>): string | undefined {
  const value = options.find((o) => o.name === 'stack')?.value
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

async function target(
  ctx: ActionCtx,
  call: { discordUserId: string; options: Array<{ name: string; value: unknown }> },
) {
  return await ctx.runQuery(internal.discordStack.resolveStack, {
    discordUserId: call.discordUserId,
    slug: slugOption(call.options),
  })
}

function targetError(resolved: Awaited<ReturnType<typeof target>>): string | null {
  switch (resolved.kind) {
    case 'unlinked':
      return UNLINKED_PROMPT
    case 'unpublished':
      return UNPUBLISHED_PROMPT
    case 'unknown':
      return unknownStackError(resolved.slug)
    case 'stack':
      return null
  }
}

type Call = { discordUserId: string; options: Array<{ name: string; value: unknown }> }

export const stackCommand = {
  ephemeral: false,
  check: async (ctx: ActionCtx, call: Call) => targetError(await target(ctx, call)),
  reply: async (ctx: ActionCtx, call: Call) => {
    const resolved = await target(ctx, call)
    if (resolved.kind !== 'stack') throw new Error(`stack target ${resolved.kind}`)
    return stackCard(resolved, getAppUrl())
  },
}

export const tokensCommand = {
  ephemeral: false,
  check: async (ctx: ActionCtx, call: Call) => {
    const resolved = await target(ctx, call)
    const error = targetError(resolved)
    if (error || resolved.kind !== 'stack') return error
    const usage = await ctx.runQuery(api.measured.getUsageByStackSlug, { slug: resolved.slug })
    return hasNumbers(usage) ? null : NO_DATA_ERROR
  },
  reply: async (ctx: ActionCtx, call: Call) => {
    const resolved = await target(ctx, call)
    if (resolved.kind !== 'stack') throw new Error(`stack target ${resolved.kind}`)
    const usage = await ctx.runQuery(api.measured.getUsageByStackSlug, { slug: resolved.slug })
    if (!hasNumbers(usage)) throw new Error('no measured history')
    return tokensEmbed(resolved, usage, getAppUrl(), Date.now())
  },
}
