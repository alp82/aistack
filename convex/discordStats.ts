import {
  foldContextDays,
  harnessLabel,
  HARNESS_NAMES,
  type HarnessName,
} from '@aistack/workflow-rules'
import { type Infer, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { internalQuery, type QueryCtx } from './_generated/server'
import {
  getNormalizedMonthlyAmount,
  sortToolsByPrice,
} from '../src/lib/pricing'
import { orderCreatorStacks } from './lib/creatorOrder'
import { resolveCreatorAvatarUrl } from './lib/avatar'
import { loadModelCatalog, type ModelCatalog } from './lib/modelCatalog'
import {
  readContextHarness,
  topModelOf,
  type WorkflowDayRow,
} from './lib/workflow'
import { readUsageWindow, UsageReading } from './measured'
import { ContextHarness } from './workflow'
import { getAppUrl } from './httpCli'

const nullableString = v.union(v.string(), v.null())
export const DiscordTarget = v.object({
  creatorId: v.id('creators'),
  stackId: v.id('stacks'),
})
const Identity = v.object({
  ...DiscordTarget.fields,
  handle: v.string(),
  name: v.string(),
  avatarUrl: nullableString,
  profileUrl: v.string(),
  stackName: v.string(),
  stackUrl: v.string(),
})
const Bounds = v.object({ from: v.string(), to: v.string() })
export const DiscordRange = v.object({
  endDate: v.string(),
  days: v.number(),
  current: Bounds,
  previous: Bounds,
})
const Subscription = v.object({
  id: v.string(),
  name: v.string(),
  iconUrl: nullableString,
  monthlyUSD: v.number(),
  state: v.union(
    v.literal('paid'),
    v.literal('included'),
    v.literal('sponsored'),
    v.literal('usage-based'),
    v.literal('free'),
    v.literal('one-time'),
  ),
})
const Period = v.object({
  usage: v.union(UsageReading, v.null()),
  context: v.array(ContextHarness),
  modelIds: v.array(v.string()),
  hasMoreModels: v.boolean(),
})
export const DiscordAnswer = v.object({
  identity: Identity,
  range: DiscordRange,
  current: Period,
  previous: Period,
  subscriptions: v.object({
    monthlyUSD: v.number(),
    rows: v.array(Subscription),
    preview: v.array(Subscription),
    hasMore: v.boolean(),
  }),
  icons: v.array(
    v.object({
      kind: v.union(v.literal('model'), v.literal('harness')),
      id: v.string(),
      name: v.string(),
      iconUrl: nullableString,
    }),
  ),
  selectedContextHarness: nullableString,
  selectedTokenHarness: nullableString,
  publishCost: v.boolean(),
  publishWorkflow: v.boolean(),
})
export type DiscordAnswer = Infer<typeof DiscordAnswer>

export function discordRange(
  endDate = new Date().toISOString().slice(0, 10),
  days = 7,
): Infer<typeof DiscordRange> {
  const ms = Date.parse(`${endDate}T00:00:00.000Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
    !Number.isFinite(ms) ||
    new Date(ms).toISOString().slice(0, 10) !== endDate
  )
    throw new Error('Invalid UTC date')
  if (!Number.isInteger(days) || days < 1 || days > 180)
    throw new Error('Days must be a whole number from 1 through 180')
  const offset = (n: number) =>
    new Date(ms - n * 86400000).toISOString().slice(0, 10)
  return {
    endDate,
    days,
    current: { from: offset(days - 1), to: endDate },
    previous: { from: offset(2 * days - 1), to: offset(days) },
  }
}

export const resolveCreator = internalQuery({
  args: {
    discordUserId: v.string(),
    handle: v.optional(v.string()),
    creatorId: v.optional(v.id('creators')),
  },
  returns: v.union(
    v.object({ kind: v.literal('unlinked') }),
    v.object({ kind: v.literal('not-found') }),
    v.object({ kind: v.literal('no-stack'), creatorId: v.id('creators') }),
    v.object({ kind: v.literal('target'), ...DiscordTarget.fields }),
  ),
  handler: async (ctx, args) => {
    const handle = args.handle?.trim().replace(/^@/, '')
    const creator = args.creatorId
      ? await ctx.db.get(args.creatorId)
      : handle !== undefined
        ? await ctx.db
            .query('creators')
            .withIndex('by_slug', (q) => q.eq('slug', handle))
            .first()
        : await ctx.db
            .query('creators')
            .withIndex('by_discordUserId', (q) =>
              q.eq('discordUserId', args.discordUserId),
            )
            .first()
    if (!creator)
      return {
        kind:
          args.creatorId || handle !== undefined
            ? ('not-found' as const)
            : ('unlinked' as const),
      }
    const stack = orderCreatorStacks(
      await ctx.db
        .query('stacks')
        .withIndex('by_creatorId', (q) => q.eq('creatorId', creator._id))
        .collect(),
    )[0]
    if (!stack) return { kind: 'no-stack' as const, creatorId: creator._id }
    return {
      kind: 'target' as const,
      creatorId: creator._id,
      stackId: stack._id,
    }
  },
})

/** Exact and prefix matches use the handle index; substring discovery scans a bounded pool. */
export const searchCreators = internalQuery({
  args: { text: v.string() },
  returns: v.array(
    v.object({
      creatorId: v.id('creators'),
      handle: v.string(),
      name: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const term = args.text.trim().replace(/^@/, '').toLowerCase().slice(0, 100)
    const prefix = await ctx.db
      .query('creators')
      .withIndex('by_slug', (q) =>
        q.gte('slug', term).lt('slug', `${term}\uffff`),
      )
      .take(25)
    const pool =
      prefix.length < 25
        ? await ctx.db.query('creators').withIndex('by_slug').take(1000)
        : []
    const unique = [
      ...new Map([...prefix, ...pool].map((c) => [c._id, c])).values(),
    ]
    const rank = (slug: string) =>
      slug === term ? 0 : slug.startsWith(term) ? 1 : 2
    return unique
      .filter((c) => c.slug.includes(term))
      .sort(
        (a, b) => rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug),
      )
      .slice(0, 25)
      .map((c) => ({ creatorId: c._id, handle: c.slug, name: c.name }))
  },
})

export function contextForDiscord(
  rows: readonly Doc<'measuredDays'>[],
  catalog: ModelCatalog,
) {
  const ordered = rows
    .filter((r): r is WorkflowDayRow => r.workflow !== undefined)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.receivedAt - b.receivedAt ||
        (a.machine ?? '').localeCompare(b.machine ?? '') ||
        a._id.localeCompare(b._id),
    )
  const names = [
    ...new Set(
      ordered.flatMap((r) =>
        r.workflow.harnesses.filter((h) => h.context).map((h) => h.harness),
      ),
    ),
  ].sort()
  return names
    .flatMap((harness) => {
      const atoms = ordered.flatMap((r) =>
        r.workflow.harnesses
          .filter((h) => h.harness === harness)
          .flatMap((h) => (h.context ? [h.context] : [])),
      )
      const context = foldContextDays(atoms)
      if (!context.calls.main.some((b) => b.calls > 0)) return []
      const routing = ordered.flatMap((r) =>
        r.workflow.harnesses
          .filter((h) => h.harness === harness)
          .flatMap((h) => h.routing?.main ?? []),
      )
      const totals = new Map<string, number>()
      for (const row of routing)
        totals.set(row.model, (totals.get(row.model) ?? 0) + row.tokens)
      const model = topModelOf(
        {
          harness,
          routing: {
            main: [...totals].map(([model, tokens]) => ({ model, tokens })),
            subagents: [],
          },
        },
        ordered,
      )
      return [readContextHarness(harness, context, model, catalog)]
    })
    .sort((a, b) => b.calls - a.calls || a.harness.localeCompare(b.harness))
}

export function discordPeriod(
  rows: readonly Doc<'measuredDays'>[],
  catalog: ModelCatalog,
  publishCost: boolean,
  publishWorkflow: boolean,
): Infer<typeof Period> {
  const usage = readUsageWindow(
    rows.flatMap((r) => (r.usage ? [{ date: r.date, usage: r.usage }] : [])),
    catalog,
    publishCost,
  )
  if (usage) {
    usage.models.sort(
      (a, b) => b.totalTokens - a.totalTokens || a.id.localeCompare(b.id),
    )
    usage.harnesses.sort(
      (a, b) =>
        b.totalTokens - a.totalTokens || a.harness.localeCompare(b.harness),
    )
  }
  return {
    usage,
    context: publishWorkflow ? contextForDiscord(rows, catalog) : [],
    modelIds:
      usage?.models
        .filter(
          (m) =>
            usage.totalTokens > 0 && m.totalTokens / usage.totalTokens >= 0.05,
        )
        .map((m) => m.id) ?? [],
    hasMoreModels:
      usage?.models.some(
        (m) =>
          usage.totalTokens === 0 || m.totalTokens / usage.totalTokens < 0.05,
      ) ?? false,
  }
}

async function icon(
  ctx: QueryCtx,
  row:
    | { iconStorageId?: Doc<'tools'>['iconStorageId']; iconUrl?: string }
    | undefined
    | null,
) {
  return (
    (row?.iconStorageId ? await ctx.storage.getUrl(row.iconStorageId) : null) ??
    row?.iconUrl ??
    null
  )
}

export async function subscriptionRows(ctx: QueryCtx, stack: Doc<'stacks'>) {
  const rows = []
  for (const sub of stack.toolSubscriptions) {
    const tool = await ctx.db
      .query('tools')
      .withIndex('by_slug', (q) => q.eq('slug', sub.toolSlug))
      .first()
    if (!tool) continue
    const included = sub.priceKind === 'bundle',
      sponsored = sub.priceKind === 'sponsored'
    const fixed =
      included || sponsored
        ? { amount: 0, period: 'month' as const }
        : sub.price.fixed
    rows.push({
      id: `tool:${tool.slug}`,
      name: tool.name,
      iconUrl: await icon(ctx, tool),
      priceKind: sub.priceKind,
      price: { fixed },
      monthlyUSD: getNormalizedMonthlyAmount(fixed),
      state: included
        ? ('included' as const)
        : sponsored
          ? ('sponsored' as const)
          : fixed?.period === 'one_time'
            ? ('one-time' as const)
            : getNormalizedMonthlyAmount(fixed) > 0
              ? ('paid' as const)
              : sub.priceKind === 'usage_based' ||
                  sub.price.pricingType === 'usage' ||
                  sub.price.pricingType === 'mixed'
                ? ('usage-based' as const)
                : ('free' as const),
    })
  }
  const seen = new Set<string>()
  for (const sub of stack.bundleSubscriptions ?? []) {
    if (seen.has(sub.bundleSlug)) continue
    seen.add(sub.bundleSlug)
    const bundle = await ctx.db
      .query('bundles')
      .withIndex('by_slug', (q) => q.eq('slug', sub.bundleSlug))
      .first()
    const tier = bundle?.tiers.find((t) => t.tierId === sub.tierId)
    if (!bundle || !tier) continue
    const fixed = tier.pricing.fixed
    rows.push({
      id: `bundle:${bundle.slug}`,
      name: bundle.name,
      iconUrl: await icon(ctx, bundle),
      priceKind: 'regular' as const,
      price: { fixed },
      monthlyUSD: getNormalizedMonthlyAmount(fixed),
      state:
        fixed?.period === 'one_time'
          ? ('one-time' as const)
          : getNormalizedMonthlyAmount(fixed) > 0
            ? ('paid' as const)
            : tier.pricing.pricingType === 'usage' ||
                tier.pricing.pricingType === 'mixed'
              ? ('usage-based' as const)
              : ('free' as const),
    })
  }
  const sorted = sortToolsByPrice(rows).map(
    ({ priceKind: _kind, price: _price, ...row }) => row,
  )
  return {
    monthlyUSD: sorted.reduce((sum, row) => sum + row.monthlyUSD, 0),
    rows: sorted,
    preview: sorted.slice(0, 5),
    hasMore: sorted.length > 5,
  }
}

/** Pinned IDs are reread without retargeting. No legacy totals or private machine names escape. */
export const readAnswer = internalQuery({
  args: {
    ...DiscordTarget.fields,
    endDate: v.string(),
    days: v.number(),
    contextHarness: v.optional(v.string()),
    tokenHarness: v.optional(v.string()),
  },
  returns: v.union(DiscordAnswer, v.null()),
  handler: async (ctx, args) => {
    const range = discordRange(args.endDate, args.days)
    const [creator, stack] = await Promise.all([
      ctx.db.get(args.creatorId),
      ctx.db.get(args.stackId),
    ])
    if (!creator || !stack || stack.creatorId !== creator._id) return null
    const [rows, catalog, subscriptions] = await Promise.all([
      ctx.db
        .query('measuredDays')
        .withIndex('by_stack_date', (q) =>
          q
            .eq('stackId', stack._id)
            .gte('date', range.previous.from)
            .lte('date', range.current.to),
        )
        .collect(),
      loadModelCatalog(ctx),
      subscriptionRows(ctx, stack),
    ])
    const publishCost = stack.publishCost !== false,
      publishWorkflow = stack.publishWorkflow !== false
    const current = discordPeriod(
      rows.filter((r) => r.date >= range.current.from),
      catalog,
      publishCost,
      publishWorkflow,
    )
    const previous = discordPeriod(
      rows.filter((r) => r.date <= range.previous.to),
      catalog,
      publishCost,
      publishWorkflow,
    )
    const icons: DiscordAnswer['icons'] = []
    for (const m of [
      ...new Map(
        [
          ...(current.usage?.models ?? []),
          ...(previous.usage?.models ?? []),
        ].map((m) => [m.id, m]),
      ).values(),
    ])
      icons.push({
        kind: 'model',
        id: m.id,
        name: m.catalogName ?? m.id,
        iconUrl: await icon(
          ctx,
          m.catalogSlug ? catalog.bySlug.get(m.catalogSlug) : null,
        ),
      })
    const harnesses = new Set([
      ...(current.usage?.harnesses ?? []).map((h) => h.harness),
      ...(previous.usage?.harnesses ?? []).map((h) => h.harness),
      ...current.context.map((h) => h.harness),
      ...previous.context.map((h) => h.harness),
    ])
    for (const id of [...harnesses].sort()) {
      const tool = await ctx.db
        .query('tools')
        .withIndex('by_slug', (q) => q.eq('slug', id))
        .first()
      icons.push({
        kind: 'harness',
        id,
        name:
          tool?.name ??
          ((HARNESS_NAMES as readonly string[]).includes(id)
            ? harnessLabel(id as HarnessName)
            : id),
        iconUrl: await icon(ctx, tool),
      })
    }
    const appUrl = getAppUrl()
    return {
      identity: {
        creatorId: creator._id,
        stackId: stack._id,
        handle: creator.slug,
        name: creator.name,
        avatarUrl: (await resolveCreatorAvatarUrl(ctx, creator)) ?? null,
        profileUrl: `${appUrl}/@${creator.slug}`,
        stackName: stack.name,
        stackUrl: `${appUrl}/stacks/${stack.slug}-${stack.shortId}`,
      },
      range,
      current,
      previous,
      subscriptions,
      icons,
      selectedContextHarness:
        args.contextHarness ?? current.context[0]?.harness ?? null,
      selectedTokenHarness:
        args.tokenHarness ?? current.usage?.harnesses[0]?.harness ?? null,
      publishCost,
      publishWorkflow,
    }
  },
})
