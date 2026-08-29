import { inDateRange, rangeDates, type UsageDay } from '@aistack/workflow-rules'
import type { Doc } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { readUsageWindow, type UsageRow } from '../measured'
import { measuredDaysForStack } from './measuredDays'
import { type ModelCatalog, findInCatalog, loadModelCatalog } from './modelCatalog'

/**
 * The stack's model list, derived (#338, map #332).
 *
 * Measured models come first: every catalog row the stack's 30-day fold holds
 * tokens for, sorted by token share descending. Manual picks follow in their
 * stored order, minus any pick the fold already covers. Nothing ranks a pick
 * against a measured model, and there are no roles.
 *
 * Hide is DISPLAY ONLY. A hidden slug drops out of the public list and stays
 * in every token, spend and leaderboard figure; the owner's read keeps it with
 * the flag set so the editor can unhide it.
 */
export type StackModelEntry = {
  slug: string
  /** Share of the 30-day fold's tokens; null for a manual pick. */
  tokenShare: number | null
  measured: boolean
  hidden: boolean
  description?: string
}

export type MeasuredModelInput = {
  catalogSlug: string | null
  tokenShare: number
  totalTokens: number
}

export type PickInput = { modelSlug: string; description?: string }

export function mergeStackModels(input: {
  measured: readonly MeasuredModelInput[]
  picks: readonly PickInput[]
  hidden: readonly string[]
  /** The catalog slug a pick names, or null when it names no row. */
  canonical: (slug: string) => string | null
}): StackModelEntry[] {
  const hiddenSet = new Set(input.hidden)
  const share = new Map<string, number>()
  for (const m of input.measured) {
    if (m.catalogSlug === null || m.totalTokens <= 0) continue
    share.set(m.catalogSlug, (share.get(m.catalogSlug) ?? 0) + m.tokenShare)
  }
  const descriptions = new Map<string, string>()
  for (const p of input.picks) {
    const slug = input.canonical(p.modelSlug)
    if (slug && p.description && !descriptions.has(slug)) descriptions.set(slug, p.description)
  }
  const out: StackModelEntry[] = [...share.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([slug, tokenShare]) => ({
      slug,
      tokenShare,
      measured: true,
      hidden: hiddenSet.has(slug),
      ...(descriptions.has(slug) ? { description: descriptions.get(slug) } : {}),
    }))
  const seen = new Set(share.keys())
  for (const p of input.picks) {
    const slug = input.canonical(p.modelSlug)
    if (slug === null || seen.has(slug)) continue
    seen.add(slug)
    out.push({
      slug,
      tokenShare: null,
      measured: false,
      hidden: hiddenSet.has(slug),
      ...(p.description ? { description: p.description } : {}),
    })
  }
  return out
}

/** The merged list with its catalog rows, read once per stack. */
export async function stackModelList(
  ctx: QueryCtx | MutationCtx,
  stack: Doc<'stacks'>,
  now = Date.now()
): Promise<Array<StackModelEntry & { model: Doc<'models'> }>> {
  const catalog = await loadModelCatalog(ctx)
  const entries = mergeStackModels({
    measured: await measuredModelsOf(ctx, stack, catalog, now),
    picks: stack.modelSubscriptions ?? [],
    hidden: stack.hiddenModelSlugs ?? [],
    canonical: (slug) => findInCatalog(catalog, slug)?.slug ?? null,
  })
  const out: Array<StackModelEntry & { model: Doc<'models'> }> = []
  for (const entry of entries) {
    const model = catalog.bySlug.get(entry.slug)
    if (model) out.push({ ...entry, model })
  }
  return out
}

async function measuredModelsOf(
  ctx: QueryCtx | MutationCtx,
  stack: Doc<'stacks'>,
  catalog: ModelCatalog,
  now: number
): Promise<MeasuredModelInput[]> {
  const window = rangeDates('30d', now)
  const rows: UsageRow[] = (await measuredDaysForStack(ctx, stack._id))
    .filter((row) => row.usage !== undefined && inDateRange(row.date, window))
    .map((row) => ({ date: row.date, usage: row.usage as UsageDay }))
  // Shares do not depend on cost, so the fold skips the pricing pass.
  const folded = readUsageWindow(rows, catalog, false)
  return (folded?.models ?? []).map((m) => ({
    catalogSlug: m.catalogSlug,
    tokenShare: m.tokenShare,
    totalTokens: m.totalTokens,
  }))
}
