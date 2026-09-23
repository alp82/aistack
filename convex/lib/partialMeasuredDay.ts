import type { Infer } from 'convex/values'
import type { MeasuredDayWire } from '../schema'

type Day = Infer<typeof MeasuredDayWire>['days'][number]
type Usage = NonNullable<Day['usage']>
type Model = Usage['harnesses'][number]['models'][number]

/** Keep a measured model intact, including its price and cache-write split.
 * Aggregates have no response identities, so adding overlapping readings would
 * double-count. Only replace a model when every recorded token bucket is covered.
 * Incomparable readings retain the stored record until a fuller scan arrives.
 */
function covers(next: Model, held: Model): boolean {
  for (const key of ['input', 'output', 'cacheRead', 'cacheWrite'] as const) {
    if (next.tokens[key] < held.tokens[key]) return false
  }
  if (held.tokens.cacheWriteTtl) {
    const split = next.tokens.cacheWriteTtl
    if (!split) return false
    for (const key of ['fiveMinute', 'oneHour', 'unsplit'] as const) {
      if (split[key] < held.tokens.cacheWriteTtl[key]) return false
    }
  }
  return held.usd === undefined || (next.usd !== undefined && next.usd >= held.usd)
}

/**
 * Extend a partial reading without deleting stored evidence or summing copies.
 *
 * `partialHarnesses` names the harnesses whose scan was incomplete. A harness
 * outside it scanned completely, so its incoming reading replaces the stored
 * one in both halves. `undefined` (an older client) treats every harness as
 * partial. A partial harness keeps its stored workflow reading but gains any
 * block it lacked, such as a block a newer client measures: adding a block
 * the stored reading never had cannot double count anything.
 */
export function retainPartialDay(
  held: Day,
  next: Day,
  partialHarnesses?: ReadonlySet<string>,
): Day {
  const isPartial = (harness: string) =>
    partialHarnesses === undefined || partialHarnesses.has(harness)
  const harnesses = new Map((held.usage?.harnesses ?? []).map(h => [h.harness, h]))
  for (const candidate of next.usage?.harnesses ?? []) {
    const previous = harnesses.get(candidate.harness)
    if (!previous || !isPartial(candidate.harness)) {
      harnesses.set(candidate.harness, candidate)
      continue
    }
    const models = new Map(previous.models.map(m => [m.model, m]))
    for (const model of candidate.models) {
      const previousModel = models.get(model.model)
      if (!previousModel || covers(model, previousModel)) models.set(model.model, model)
    }
    harnesses.set(candidate.harness, {
      ...previous,
      sessions: Math.max(previous.sessions, candidate.sessions),
      projectKeys: [...new Set([...previous.projectKeys, ...candidate.projectKeys])].sort(),
      models: [...models.values()].sort((a, b) => a.model.localeCompare(b.model)),
      subagentTokens: Math.max(previous.subagentTokens, candidate.subagentTokens),
      excludedTokens: {
        unpriced: Math.max(previous.excludedTokens.unpriced, candidate.excludedTokens.unpriced),
        synthetic: Math.max(previous.excludedTokens.synthetic, candidate.excludedTokens.synthetic),
      },
    })
  }
  // Workflow histograms and session metrics cannot safely merge overlapping
  // partial sessions. Keep recorded harnesses and Git, and add newly seen ones.
  const workflowHarnesses = new Map((held.workflow?.harnesses ?? []).map(h => [h.harness, h]))
  for (const h of next.workflow?.harnesses ?? []) {
    const stored = workflowHarnesses.get(h.harness)
    if (!stored || !isPartial(h.harness)) workflowHarnesses.set(h.harness, h)
    else workflowHarnesses.set(h.harness, { ...h, ...stored })
  }
  const previousWorkflow = held.workflow ?? next.workflow
  const workflow = previousWorkflow ? {
    ...previousWorkflow,
    harnesses: [...workflowHarnesses.values()].sort((a, b) => a.harness.localeCompare(b.harness)),
  } : undefined
  return {
    date: next.date,
    ...(held.usage || next.usage ? { usage: { harnesses: [...harnesses.values()].sort((a, b) => a.harness.localeCompare(b.harness)) } } : {}),
    ...(workflow ? { workflow } : {}),
  }
}
