import type { Doc } from '../_generated/dataModel'

export type MeasuredSet = {
  value: number
  precision: 'exact' | 'lower-bound'
}

export type SetEvidence =
  | { kind: 'known'; values: readonly string[] }
  | { kind: 'legacy'; count: number }

type Payload = Doc<'measuredSnapshots'>['payload']
type SetMetric = 'activeDays' | 'projects'

/** Extract one immutable payload's evidence without inventing set members. */
export function setEvidence(payload: Payload, metric: SetMetric): SetEvidence {
  if (payload.schemaVersion === 2) {
    return {
      kind: 'known',
      values:
        metric === 'activeDays'
          ? payload.activity.activeDayDates
          : payload.activity.projectKeys,
    }
  }
  return {
    kind: 'legacy',
    count:
      metric === 'activeDays'
        ? payload.activity.activeDays
        : payload.activity.projects,
  }
}

/** A single source's count or set cardinality is exact without an overlap merge. */
export function measureOne(evidence: SetEvidence): MeasuredSet {
  return {
    value: evidence.kind === 'known' ? evidence.values.length : evidence.count,
    precision: 'exact',
  }
}

/** Return the tight lower bound supported by known members and old cardinalities. */
export function mergeSetEvidence(evidence: SetEvidence[]): MeasuredSet {
  const known = new Set<string>()
  const legacy: number[] = []
  for (const item of evidence) {
    if (item.kind === 'known') {
      for (const value of item.values) known.add(value)
    } else if (item.count > 0) {
      legacy.push(item.count)
    }
  }
  return {
    value: Math.max(known.size, ...legacy, 0),
    precision:
      legacy.length === 0 || (known.size === 0 && legacy.length === 1)
        ? 'exact'
        : 'lower-bound',
  }
}

/** Merge one metric across the newest visible payloads of a stack. */
export function mergePayloadSets(
  payloads: Payload[],
  metric: SetMetric
): MeasuredSet {
  return mergeSetEvidence(payloads.map((payload) => setEvidence(payload, metric)))
}
