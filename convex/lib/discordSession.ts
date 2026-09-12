import { v } from 'convex/values'
import type { Infer } from 'convex/values'

export const StatsCommand = v.union(
  v.literal('tokens'),
  v.literal('cost'),
  v.literal('context'),
  v.literal('harness'),
  v.literal('compare'),
)
export const Target = v.object({
  creatorId: v.id('creators'),
  stackId: v.id('stacks'),
})
export const View = v.object({
  command: StatsCommand,
  subject: v.union(Target, v.null()),
  comparison: v.union(Target, v.null()),
  endDate: v.string(),
  days: v.number(),
  full: v.boolean(),
  harness: v.optional(v.string()),
  picker: v.union(v.literal('subject'), v.literal('comparison'), v.null()),
  search: v.string(),
})
export type View = Infer<typeof View>
export const Binding = v.object({
  requester: v.string(),
  applicationId: v.string(),
  messageId: v.string(),
})
export const SESSION_TTL = 3600000
export const WORK_TTL = 120000
export const ACTIONS = [
  'range1',
  'range7',
  'range30',
  'range',
  'search',
  'subject',
  'compare',
  'person',
  'harness',
  'full',
  'back',
] as const
export function controlId(id: string, revision: number, action: string) {
  return `stats:${id}:${revision}:${action}`
}
export function parseControl(value: string) {
  const match = /^stats:([a-zA-Z0-9]+):(\d{1,8}):([a-zA-Z0-9_-]{1,64})$/.exec(
    value,
  )
  return match
    ? { id: match[1], revision: Number(match[2]), action: match[3] }
    : null
}
