import { v } from 'convex/values'
import { internal } from './_generated/api'
import { internalMutation, internalQuery } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import {
  Binding,
  View,
  SESSION_TTL,
  WORK_TTL,
  ACTIONS,
} from './lib/discordSession'

function reject(
  s: Doc<'discordSessions'> | null,
  args: {
    requester: string
    applicationId: string
    messageId: string
    revision: number
  },
) {
  if (!s) return 'These controls expired. Run the command again.'
  if (s.requester !== args.requester)
    return `Only the original requester can change this answer. Run /${s.view.command} yourself.`
  if (s.applicationId !== args.applicationId || s.messageId !== args.messageId)
    return 'These controls belong to another message.'
  if (s.expiresAt <= Date.now())
    return 'These controls expired. Run the command again.'
  if (
    s.status === 'failed' ||
    (s.status === 'busy' && Date.now() - (s.startedAt ?? 0) >= WORK_TTL)
  )
    return 'This session could not finish safely. Run the command again.'
  if (s.status === 'busy') return 'This answer is updating. Try again shortly.'
  if (s.revision !== args.revision)
    return 'These controls are stale. Use the latest answer.'
  return null
}
export const create = internalMutation({
  args: {
    requester: v.string(),
    applicationId: v.string(),
    interactionId: v.string(),
    view: View,
    private: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (
      await ctx.db
        .query('discordSessions')
        .withIndex('by_initial', (q) =>
          q.eq('initialInteraction', args.interactionId),
        )
        .first()
    )
      return null
    return await ctx.db.insert('discordSessions', {
      requester: args.requester,
      applicationId: args.applicationId,
      initialInteraction: args.interactionId,
      expiresAt: Date.now() + SESSION_TTL,
      revision: 0,
      status: 'busy',
      view: args.view,
      pending: args.view,
      operation: args.interactionId,
      startedAt: Date.now(),
      seen: [args.interactionId],
      private: args.private,
    })
  },
})
export const get = internalQuery({
  args: { id: v.id('discordSessions') },
  handler: async (ctx, { id }) => await ctx.db.get(id),
})
export const begin = internalMutation({
  args: {
    id: v.id('discordSessions'),
    ...Binding.fields,
    revision: v.number(),
    interactionId: v.string(),
    action: v.string(),
    value: v.optional(v.string()),
    modalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.id)
    const error = reject(s, args)
    if (error || !s) {
      if (s?.status === 'busy' && Date.now() - (s.startedAt ?? 0) >= WORK_TTL)
        await ctx.db.patch(s._id, { status: 'failed' })
      return { error: error! }
    }
    if (s.seen.includes(args.interactionId))
      return { error: 'This interaction was already handled.' }
    if (s.seen.length >= 200)
      return { error: 'Start a new command to continue exploring.' }
    if (!(ACTIONS as readonly string[]).includes(args.action))
      return { error: 'Unknown control.' }
    if (
      args.modalId &&
      (s.modal?.id !== args.modalId ||
        s.modal.kind !== args.action ||
        s.modal.revision !== args.revision)
    )
      return { error: 'This dialog is stale. Open it again.' }
    if (args.action === 'search' && !s.view.picker)
      return { error: 'Open the person picker first.' }
    if (['search', 'range'].includes(args.action) && !args.modalId) {
      await ctx.db.patch(s._id, {
        modal: {
          id: args.interactionId,
          kind: args.action,
          revision: s.revision,
        },
        seen: [...s.seen, args.interactionId],
      })
      return { modal: true, view: s.view }
    }
    const view = { ...s.view }
    if (args.action.startsWith('range')) {
      const value = args.action === 'range' ? args.value : args.action.slice(5)
      if (
        !value ||
        !/^\d{1,3}$/.test(value) ||
        Number(value) < 1 ||
        Number(value) > 180
      )
        return { error: 'Enter a whole number of days from 1 through 180.' }
      view.days = Number(value)
    } else if (args.action === 'search') {
      if (!view.picker) return { error: 'Open the person picker first.' }
      view.search = (args.value ?? '').slice(0, 100)
    } else if (args.action === 'subject' || args.action === 'compare') {
      view.picker = args.action === 'subject' ? 'subject' : 'comparison'
      view.search = ''
    } else if (args.action === 'back') {
      if (!view.subject || (view.command === 'compare' && !view.comparison))
        return { error: 'Choose a creator first.' }
      view.picker = null
    } else if (args.action === 'full') {
      if (!['tokens', 'cost'].includes(view.command) || view.picker)
        return { error: 'This view has no list control.' }
      view.full = !view.full
    } else if (args.action === 'harness') {
      if (
        !['context', 'harness'].includes(view.command) ||
        !args.value ||
        args.value.length > 100
      )
        return { error: 'Choose an available harness.' }
      view.harness = args.value
    } else if (args.action === 'person' && (!view.picker || !args.value))
      return { error: 'Open the person picker first.' }
    await ctx.db.patch(s._id, {
      status: 'busy',
      workerClaimed: false,
      pending: view,
      operation: args.interactionId,
      startedAt: Date.now(),
      seen: [...s.seen, args.interactionId],
      modal: undefined,
    })
    return { view, private: s.private }
  },
})
export const finish = internalMutation({
  args: {
    id: v.id('discordSessions'),
    operation: v.string(),
    view: View,
    messageId: v.string(),
    private: v.boolean(),
  },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.id)
    if (
      !s ||
      s.status !== 'busy' ||
      s.operation !== args.operation ||
      Date.now() - (s.startedAt ?? 0) >= WORK_TTL ||
      s.expiresAt <= Date.now()
    )
      return false
    await ctx.db.patch(s._id, {
      status: 'ready',
      view: args.view,
      revision: s.revision + 1,
      messageId: args.messageId,
      private: args.private,
      pending: undefined,
      operation: undefined,
      startedAt: undefined,
    })
    return true
  },
})
export const fail = internalMutation({
  args: {
    id: v.id('discordSessions'),
    operation: v.string(),
    ambiguous: v.boolean(),
  },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.id)
    if (s?.status !== 'busy' || s.operation !== args.operation) return null
    await ctx.db.patch(s._id, {
      status:
        args.ambiguous ||
        !s.messageId ||
        Date.now() - (s.startedAt ?? 0) >= WORK_TTL ||
        s.expiresAt <= Date.now()
          ? 'failed'
          : 'ready',
      pending: undefined,
      operation: undefined,
      startedAt: undefined,
    })
    return null
  },
})
export const cleanup = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx): Promise<number> => {
    const rows = await ctx.db
      .query('discordSessions')
      .withIndex('by_expiry', (q) => q.lte('expiresAt', Date.now()))
      .take(500)
    for (const row of rows) await ctx.db.delete(row._id)
    if (rows.length === 500)
      await ctx.scheduler.runAfter(0, internal.discordSessions.cleanup, {})
    return rows.length
  },
})

/** A scheduled action may start this operation once, including after process restarts. */
export const claimWorker = internalMutation({
  args: { id: v.id('discordSessions'), operation: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id)
    if (
      !session ||
      session.status !== 'busy' ||
      session.operation !== args.operation ||
      session.workerClaimed
    )
      return null
    if (
      session.expiresAt <= Date.now() ||
      Date.now() - (session.startedAt ?? 0) >= WORK_TTL
    ) {
      await ctx.db.patch(session._id, { status: 'failed' })
      return null
    }
    await ctx.db.patch(session._id, { workerClaimed: true })
    return session
  },
})
