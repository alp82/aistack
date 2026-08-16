// The activity-feed write side (#77, map #76).
//
// Events are written at the moment things happen, inside the same mutation as
// the thing they record, so a failed write cannot produce a phantom event.
// Nothing here reads the table - the feed's read path is a separate ticket.

import type { Infer } from 'convex/values'
import type { Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import type { ActivityAtom, ActivityEvent } from './schema'

export type ActivityAtomValue = Infer<typeof ActivityAtom>
export type ActivityEventValue = Infer<typeof ActivityEvent>

/**
 * Append one event.
 *
 * `createdAt` is set here rather than left to `_creationTime`, so a launch-time
 * backfill from existing snapshots can carry the time the thing actually
 * happened instead of the time the row was inserted.
 */
export async function emitActivityEvent(
  ctx: MutationCtx,
  stackId: Id<'stacks'>,
  event: ActivityEventValue,
  now: number = Date.now()
): Promise<void> {
  await ctx.db.insert('activityEvents', { stackId, createdAt: now, event })
}

/** What a stack is composed of, flattened to comparable atoms. */
export interface StackComposition {
  toolSubscriptions?: readonly { toolSlug: string }[]
  modelSubscriptions?: readonly { modelSlug: string }[]
  bundleSubscriptions?: readonly { bundleSlug: string }[]
}

interface SlugSet {
  tool: string[]
  model: string[]
  bundle: string[]
}

function slugsOf(composition: StackComposition): SlugSet {
  return {
    tool: (composition.toolSubscriptions ?? []).map((s) => s.toolSlug),
    model: (composition.modelSubscriptions ?? []).map((s) => s.modelSlug),
    bundle: (composition.bundleSubscriptions ?? []).map((s) => s.bundleSlug),
  }
}

const CATALOG_TABLE = {
  tool: 'tools',
  model: 'models',
  bundle: 'bundles',
} as const

/**
 * Resolve display names for a set of slugs, ONCE, at write time.
 *
 * The stored name is the name at the moment of the change, which is both the
 * cheap answer (no per-row catalog lookup on the read path) and the correct
 * one: the feed is a historical record. A slug with no catalog row keeps the
 * slug as its name rather than dropping the atom - a change the owner made is
 * still a change that happened.
 */
async function toAtoms(
  ctx: MutationCtx,
  kind: 'tool' | 'model' | 'bundle',
  slugs: readonly string[]
): Promise<ActivityAtomValue[]> {
  const atoms: ActivityAtomValue[] = []
  for (const slug of slugs) {
    const row = await ctx.db
      .query(CATALOG_TABLE[kind])
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()
    atoms.push({ kind, slug, name: row?.name ?? slug })
  }
  return atoms
}

/**
 * Diff two compositions on SLUG and return the atoms added and removed.
 *
 * Prose edits are excluded by construction: only the subscription slug sets are
 * compared. That keeps authoring noise out of a feed that will be thin at
 * launch, and it produces exactly the row the churn framing will later need.
 */
export async function diffComposition(
  ctx: MutationCtx,
  before: StackComposition,
  after: StackComposition
): Promise<{ added: ActivityAtomValue[]; removed: ActivityAtomValue[] }> {
  const from = slugsOf(before)
  const to = slugsOf(after)
  const added: ActivityAtomValue[] = []
  const removed: ActivityAtomValue[] = []

  for (const kind of ['tool', 'model', 'bundle'] as const) {
    const had = new Set(from[kind])
    const has = new Set(to[kind])
    added.push(...(await toAtoms(ctx, kind, [...has].filter((s) => !had.has(s)))))
    removed.push(...(await toAtoms(ctx, kind, [...had].filter((s) => !has.has(s)))))
  }

  return { added, removed }
}
