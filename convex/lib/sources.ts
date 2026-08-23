/**
 * What counts as one reading of the measured layer.
 *
 * A SOURCE IS (harness, machine), NOT A HARNESS. `measuredSnapshots` is
 * append-only and "current" is a query for the newest row, so every surface has
 * to answer "newest of what?". Until #243 the answer was the harness alone,
 * which was right only while a stack had one machine: a second machine running
 * the same harness published a snapshot of its own rolling window and REPLACED
 * the first machine's reading instead of adding to it. Each machine measures a
 * disjoint set of sessions, so the two readings sum honestly - the same
 * argument #66 used to sum across harnesses.
 *
 * THE RULE LIVES HERE AND NOWHERE ELSE. Three files carried their own copy,
 * each commented "the same rule every other surface reads", which is exactly
 * the shape a rule takes just before the copies disagree.
 *
 * UNTAGGED ROWS ARE SUPERSEDED, NOT MERGED. Rows published before machine
 * tagging carry no `machine`, and which machine wrote them is not recoverable -
 * it was never stored, and unlike `harness` it is not derivable from the
 * payload either. An untagged row is therefore a WHOLE-HARNESS reading, not one
 * machine's: holding it beside a tagged reading of the same harness would count
 * the same sessions twice, and carry-forward is unconditional, so it would do
 * so forever. `visibleSources` drops it the moment any machine of that harness
 * reports. That resolves a stack on its next sync and needs no backfill.
 */

/** The fields the rule reads. Both real columns on `measuredSnapshots`. */
export type SnapshotSource = {
  harness: string
  /** The publishing machine's name, absent on rows written before tagging. */
  machine?: string
}

/**
 * The bucket key for one source.
 *
 * NUL separates the parts because `machine` is a display name and could
 * otherwise collide with a harness name across the boundary. Nothing can carry
 * a NUL: both halves clear `isDisplaySafeName`, which rejects control
 * characters, before they are ever stored.
 *
 * PRESENCE IS ENCODED, not left to fall out of an empty string. Untagged and
 * "tagged with an empty name" are different states, and this repo has already
 * been bitten once by a check that read a `""` field as absent.
 */
export function sourceKey(row: SnapshotSource): string {
  return row.machine === undefined
    ? `-\u0000${row.harness}`
    : `+\u0000${row.harness}\u0000${row.machine}`
}

/** Claude Code first (the documented default), then alphabetical. */
export function sourceOrder(a: SnapshotSource, b: SnapshotSource): number {
  if (a.harness !== b.harness) {
    if (a.harness === 'claude-code') return -1
    if (b.harness === 'claude-code') return 1
    return a.harness.localeCompare(b.harness)
  }
  return (a.machine ?? '').localeCompare(b.machine ?? '')
}

/**
 * Drop the untagged reading of any harness that also has a tagged one.
 *
 * Applied at the moment readings are combined rather than when they are held,
 * because a fold walks forward in time: a row that is the only reading of its
 * harness at one point on the trail is superseded at a later one, and both
 * points must state what was true then.
 *
 * `pick` exists because callers hold different things - raw rows, priced
 * readings, bare token counts - and all of them need the same eviction.
 */
export function visibleSources<T>(
  items: Iterable<T>,
  pick: (item: T) => SnapshotSource
): T[] {
  const rows = [...items]
  const tagged = new Set<string>()
  for (const item of rows) {
    const source = pick(item)
    if (source.machine !== undefined) tagged.add(source.harness)
  }
  return rows.filter((item) => {
    const source = pick(item)
    return source.machine !== undefined || !tagged.has(source.harness)
  })
}

const identity = <T extends SnapshotSource>(row: T): SnapshotSource => row

/**
 * The newest row of every source, INCLUDING superseded untagged ones.
 *
 * Separate from `newestPerSource` because two callers want different things
 * from the same fold. A display wants what it may state, which is the evicted
 * set. Retention wants what it must not throw away, which is every source's
 * last row - an untagged row still seeds the historical points that predate the
 * first tagged sync, so being superseded TODAY is no licence to delete it.
 */
export function newestBySource<
  T extends SnapshotSource & { capturedAt: number },
>(rows: T[]): T[] {
  const bySource = new Map<string, T>()
  for (const row of rows) {
    const key = sourceKey(row)
    const held = bySource.get(key)
    if (!held || row.capturedAt > held.capturedAt) bySource.set(key, row)
  }
  return [...bySource.values()]
}

/**
 * The newest reading of every source a stack currently publishes from.
 *
 * The one function every surface's "current" goes through. Takes the stack's
 * rows already collected, because each caller reads them for other reasons too.
 */
export function newestPerSource<
  T extends SnapshotSource & { capturedAt: number },
>(rows: T[]): T[] {
  return visibleSources(newestBySource(rows), identity).sort(sourceOrder)
}
