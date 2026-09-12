import { internal } from './_generated/api'
import type { ActionCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { parseControl, type View } from './lib/discordSession'

export const STATS_COMMANDS = [
  'tokens',
  'cost',
  'context',
  'harness',
  'compare',
]
export interface StatsInteraction {
  id?: string
  type?: number
  application_id?: string
  token?: string
  attachment_size_limit?: number
  member?: { user?: { id?: string } }
  user?: { id?: string }
  message?: { id?: string }
  data?: {
    name?: string
    custom_id?: string
    values?: string[]
    options?: Array<{ name?: string; value?: unknown; focused?: boolean }>
    components?: Array<{
      components?: Array<{ custom_id?: string; value?: string }>
    }>
  }
}
export const privateReply = (content: string) => ({
  type: 4,
  data: { flags: 64, content, allowed_mentions: { parse: [] } },
})
export async function statsInteraction(
  ctx: ActionCtx,
  i: StatsInteraction,
): Promise<Record<string, unknown>> {
  if (i.type === 4) {
    const focus = i.data?.options?.find((o) => o.focused)
    const choices =
      STATS_COMMANDS.includes(i.data?.name ?? '') &&
      ['creator', 'person'].includes(focus?.name ?? '') &&
      typeof focus?.value === 'string'
        ? await ctx.runQuery(internal.discordStats.searchCreators, {
            text: focus.value,
          })
        : []
    return {
      type: 8,
      data: {
        choices: choices.map((c) => ({
          name: `@${c.handle} (${c.name})`.slice(0, 100),
          value: c.handle,
        })),
      },
    }
  }
  const requester = i.member?.user?.id ?? i.user?.id
  if (!requester || !i.application_id || !i.token || !i.id)
    return privateReply('Incomplete interaction. Run the command again.')
  const base = {
    operation: i.id,
    token: i.token,
    uploadLimit: Math.max(
      1,
      Math.min(i.attachment_size_limit ?? 10 * 1024 * 1024, 8 * 1024 * 1024),
    ),
  }
  if (i.type === 2) {
    const option = (name: string) =>
      i.data?.options?.find((o) => o.name === name)?.value
    const days = option('days') ?? 7
    if (
      typeof days !== 'number' ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 180
    )
      return privateReply('Enter a whole number of days from 1 through 180.')
    const handle = option('creator')
    if (handle !== undefined && typeof handle !== 'string')
      return privateReply('Choose an AI Stack creator handle.')
    const target = await ctx.runQuery(internal.discordStats.resolveCreator, {
      discordUserId: requester,
      handle: typeof handle === 'string' ? handle : undefined,
    })
    let recovery: string | undefined
    if (target.kind === 'unlinked')
      recovery =
        'Run /link to link your AI Stack account, or choose another creator below.'
    else if (target.kind === 'no-stack')
      recovery =
        'This creator has no stack yet. Create a stack or choose another creator.'
    else if (target.kind === 'not-found')
      recovery =
        'No creator matches that handle. Search for an AI Stack creator below.'
    const subject =
      target.kind === 'target'
        ? { creatorId: target.creatorId, stackId: target.stackId }
        : null
    const person = option('person')
    const other =
      typeof person === 'string'
        ? await ctx.runQuery(internal.discordStats.resolveCreator, {
            discordUserId: requester,
            handle: person,
          })
        : null
    const comparison =
      other?.kind === 'target'
        ? { creatorId: other.creatorId, stackId: other.stackId }
        : null
    const view: View = {
      command: i.data!.name as View['command'],
      subject,
      comparison,
      days,
      endDate: new Date().toISOString().slice(0, 10),
      full: false,
      picker: !subject
        ? 'subject'
        : i.data?.name === 'compare' && !comparison
          ? 'comparison'
          : null,
      search: '',
    }
    const id = await ctx.runMutation(internal.discordSessions.create, {
      requester,
      applicationId: i.application_id,
      interactionId: i.id,
      view,
      private: !!recovery,
    })
    if (!id) return privateReply('This command was already handled.')
    await ctx.scheduler.runAfter(0, internal.discordStatsTransport.fulfill, {
      id,
      ...base,
      recovery,
    })
    return { type: 5, data: recovery ? { flags: 64 } : {} }
  }
  const raw = i.data?.custom_id ?? ''
  // A modal nonce is separate from visible control revisions and consumed once.
  const [custom, modalId, extra] = raw.split('~')
  const parsed = parseControl(custom)
  if (!parsed || extra !== undefined || (i.type === 5) !== !!modalId)
    return privateReply('These controls are invalid. Run the command again.')
  const value =
    i.type === 5
      ? i.data?.components
          ?.flatMap((r) => r.components ?? [])
          .find((c) => c.custom_id === 'value')?.value
      : i.data?.values?.[0]
  let result
  try {
    result = await ctx.runMutation(internal.discordSessions.begin, {
      id: parsed.id as Id<'discordSessions'>,
      requester,
      applicationId: i.application_id,
      messageId: i.message?.id ?? '',
      revision: parsed.revision,
      interactionId: i.id,
      action: parsed.action,
      value,
      modalId,
    })
  } catch {
    return privateReply('These controls are invalid. Run the command again.')
  }
  if (result.error) return privateReply(result.error)
  if (result.modal)
    return {
      type: 9,
      data: {
        custom_id: `${custom}~${i.id}`,
        title:
          parsed.action === 'search'
            ? 'Find an AI Stack creator'
            : 'Choose a date range',
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: 'value',
                label:
                  parsed.action === 'search'
                    ? 'Creator handle'
                    : 'Days (1 through 180)',
                style: 1,
                required: true,
                max_length: parsed.action === 'search' ? 100 : 3,
              },
            ],
          },
        ],
      },
    }
  await ctx.scheduler.runAfter(0, internal.discordStatsTransport.fulfill, {
    id: parsed.id as Id<'discordSessions'>,
    ...base,
    action: parsed.action,
    value,
  })
  // Selecting from private recovery creates a public answer with a new binding.
  return result.private && parsed.action === 'person'
    ? { type: 5, data: {} }
    : { type: 6 }
}
