import { v } from 'convex/values'
import { internal } from './_generated/api'
import { internalAction, type ActionCtx } from './_generated/server'
import type { DiscordAnswer } from './discordStats'
import { controlId, WORK_TTL, type View } from './lib/discordSession'
import { bytesToHex, encodeUtf8 } from './lib/webCrypto'
import { getAppUrl } from './httpCli'

const api = 'https://discord.com/api/v10'
const mentions = { parse: [] }
const row = (...components: Record<string, unknown>[]) => ({
  type: 1,
  components,
})
const button = (id: string, label: string) => ({
  type: 2,
  style: 2,
  custom_id: id,
  label,
})
const link = (label: string, url: string) => ({
  type: 2,
  style: 5,
  label: label.slice(0, 80),
  url,
})

export function controls(
  id: string,
  revision: number,
  view: View,
  subject: DiscordAnswer | null,
  comparison: DiscordAnswer | null,
  choices: Array<{ handle: string; name: string }> = [],
) {
  const key = (action: string) => controlId(id, revision, action)
  if (view.picker) {
    const rows = [
      row(
        button(key('search'), 'Search'),
        ...(view.subject && (view.command !== 'compare' || view.comparison)
          ? [button(key('back'), 'Back')]
          : []),
      ),
    ]
    if (choices.length)
      rows.unshift(
        row({
          type: 3,
          custom_id: key('person'),
          placeholder:
            view.picker === 'subject'
              ? 'Choose a creator'
              : 'Compare with a creator',
          options: choices.map((c) => ({
            label: `@${c.handle}`.slice(0, 100),
            description: c.name.slice(0, 100),
            value: c.handle,
          })),
        }),
      )
    return rows
  }
  const rows = [
    row(
      ...[1, 7, 30].map((n) => button(key(`range${n}`), `${n}d`)),
      button(key('range'), 'Custom'),
      button(key('compare'), 'Compare'),
    ),
  ]
  const extra = [button(key('subject'), 'Person')]
  if (
    (view.command === 'tokens' &&
      (subject?.current.hasMoreModels ||
        comparison?.current.hasMoreModels ||
        view.full)) ||
    (view.command === 'cost' &&
      (subject?.subscriptions.hasMore ||
        comparison?.subscriptions.hasMore ||
        view.full))
  )
    extra.push(
      button(
        key('full'),
        view.full
          ? view.command === 'tokens'
            ? '5% and up'
            : 'Five entries'
          : 'Full list',
      ),
    )
  rows.push(row(...extra))
  const harnesses =
    view.command === 'context'
      ? subject?.current.context.map((h) => h.harness)
      : view.command === 'harness'
        ? subject?.current.usage?.harnesses.map((h) => h.harness)
        : []
  if (harnesses && harnesses.length > 1)
    rows.push(
      row({
        type: 3,
        custom_id: key('harness'),
        placeholder: 'Harness',
        options: harnesses.slice(0, 25).map((h) => ({
          label:
            subject?.icons.find((i) => i.kind === 'harness' && i.id === h)
              ?.name ?? h,
          value: h,
          default: view.harness === h,
        })),
      }),
    )
  const links = [subject, comparison]
    .filter((a): a is DiscordAnswer => a !== null)
    .map((a) => link(`@${a.identity.handle}`, a.identity.profileUrl))
  if (links.length) rows.push(row(...links))
  return rows
}

export async function renderPng(
  body: string,
  limit: number,
): Promise<ArrayBuffer> {
  const secret = process.env.DISCORD_RENDER_SECRET
  const origin = process.env.DISCORD_RENDER_ORIGIN
  if (!secret || secret.length < 32 || !origin)
    throw new Error('Renderer configuration unavailable')
  const url = new URL(origin)
  if (
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    !['http:', 'https:'].includes(url.protocol)
  )
    throw new Error('Invalid renderer origin')
  const timestamp = String(Date.now())
  const key = await crypto.subtle.importKey(
    'raw',
    encodeUtf8(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = bytesToHex(
    await crypto.subtle.sign('HMAC', key, encodeUtf8(`${timestamp}\n${body}`)),
  )
  const response = await fetch(`${url.origin}/api/discord/render`, {
    method: 'POST',
    redirect: 'error',
    headers: {
      'Content-Type': 'application/json',
      'x-aistack-render-timestamp': timestamp,
      'x-aistack-render-signature': signature,
    },
    body,
    signal: AbortSignal.timeout(30000),
  })
  if (
    !response.ok ||
    !response.headers.get('content-type')?.startsWith('image/png')
  )
    throw new Error('Renderer failed')
  // Bound the stream too: an incorrect renderer cannot allocate arbitrary bytes.
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Empty image')
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const chunk = await reader.read()
    if (chunk.done) break
    size += chunk.value.byteLength
    if (size > Math.min(limit, 8 * 1024 * 1024)) {
      await reader.cancel()
      throw new Error('Image exceeds upload limit')
    }
    chunks.push(chunk.value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  if (
    size < 8 ||
    bytes[0] !== 137 ||
    bytes[1] !== 80 ||
    bytes[2] !== 78 ||
    bytes[3] !== 71
  )
    throw new Error('Invalid image')
  return bytes.buffer
}

export class DeliveryError extends Error {
  constructor(public ambiguous: boolean) {
    super('Discord delivery failed')
  }
}
export async function deliver(
  applicationId: string,
  token: string,
  data: Record<string, unknown>,
  png?: ArrayBuffer,
): Promise<string> {
  let body: BodyInit
  const headers: Record<string, string> = {}
  const payload = { ...data, allowed_mentions: mentions }
  if (png) {
    const form = new FormData()
    form.append(
      'payload_json',
      JSON.stringify({
        ...payload,
        attachments: [{ id: 0, filename: 'stats.png' }],
      }),
    )
    form.append('files[0]', new Blob([png], { type: 'image/png' }), 'stats.png')
    body = form
  } else {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(payload)
  }
  let response: Response
  try {
    response = await fetch(
      `${api}/webhooks/${applicationId}/${token}/messages/@original`,
      { method: 'PATCH', headers, body, signal: AbortSignal.timeout(20000) },
    )
  } catch {
    throw new DeliveryError(true)
  }
  if (!response.ok) throw new DeliveryError(response.status >= 500)
  try {
    const result = await response.json()
    if (typeof result.id !== 'string') throw new Error()
    return result.id
  } catch {
    throw new DeliveryError(true)
  }
}

async function read(ctx: ActionCtx, view: View) {
  if (!view.subject) return { subject: null, comparison: null }
  const args = {
    endDate: view.endDate,
    days: view.days,
    contextHarness: view.command === 'context' ? view.harness : undefined,
    tokenHarness: view.command === 'harness' ? view.harness : undefined,
  }
  const subject: DiscordAnswer | null = await ctx.runQuery(
    internal.discordStats.readAnswer,
    { ...view.subject, ...args },
  )
  if (!subject) throw new Error('Selected creator is unavailable')
  const harness =
    view.command === 'context'
      ? subject.selectedContextHarness
      : view.command === 'harness'
        ? subject.selectedTokenHarness
        : undefined
  const comparison: DiscordAnswer | null = view.comparison
    ? await ctx.runQuery(internal.discordStats.readAnswer, {
        ...view.comparison,
        ...args,
        ...(view.command === 'context' && harness
          ? { contextHarness: harness }
          : {}),
        ...(view.command === 'harness' && harness
          ? { tokenHarness: harness }
          : {}),
      })
    : null
  if (view.comparison && !comparison)
    throw new Error('Selected comparison is unavailable')
  if (comparison && view.command === 'context')
    comparison.selectedContextHarness = subject.selectedContextHarness
  if (comparison && view.command === 'harness')
    comparison.selectedTokenHarness = subject.selectedTokenHarness
  return { subject, comparison }
}
const consent = (answers: Awaited<ReturnType<typeof read>>) =>
  JSON.stringify(
    [answers.subject, answers.comparison].map(
      (a) =>
        a && [
          a.identity.creatorId,
          a.identity.stackId,
          a.publishCost,
          a.publishWorkflow,
        ],
    ),
  )

export const fulfill = internalAction({
  args: {
    id: v.id('discordSessions'),
    operation: v.string(),
    token: v.string(),
    uploadLimit: v.number(),
    action: v.optional(v.string()),
    value: v.optional(v.string()),
    recovery: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.runMutation(
      internal.discordSessions.claimWorker,
      {
        id: args.id,
        operation: args.operation,
      },
    )
    if (
      !session ||
      session.status !== 'busy' ||
      session.operation !== args.operation
    )
      return null
    let delivered = false
    try {
      const view: View = { ...session.pending! }
      if (args.action === 'person') {
        const target = await ctx.runQuery(
          internal.discordStats.resolveCreator,
          { discordUserId: session.requester, handle: args.value },
        )
        if (target.kind !== 'target')
          throw new Error('Selected creator is unavailable')
        const pinned = { creatorId: target.creatorId, stackId: target.stackId }
        if (view.picker === 'subject') {
          view.subject = pinned
          view.harness = undefined
        } else view.comparison = pinned
        view.picker =
          view.command === 'compare' && !view.comparison ? 'comparison' : null
      }
      let answers = await read(ctx, view)
      if (args.action === 'harness') {
        const choices =
          view.command === 'context'
            ? answers.subject?.current.context.map((h) => h.harness)
            : answers.subject?.current.usage?.harnesses.map((h) => h.harness)
        if (!choices?.includes(view.harness!))
          throw new Error('Harness unavailable')
      }
      if (!view.harness && answers.subject)
        view.harness =
          (view.command === 'context'
            ? answers.subject.selectedContextHarness
            : view.command === 'harness'
              ? answers.subject.selectedTokenHarness
              : null) ?? undefined
      const choices = view.picker
        ? await ctx.runQuery(internal.discordStats.searchCreators, {
            text: view.search,
          })
        : []
      let png: ArrayBuffer | undefined
      const pickerOnly =
        view.picker !== null &&
        session.messageId !== undefined &&
        !session.private
      if (
        view.subject &&
        !pickerOnly &&
        !(view.command === 'compare' && !view.comparison)
      ) {
        for (let attempt = 0; attempt < 2; attempt++) {
          png = await renderPng(
            JSON.stringify({
              version: 1,
              command: view.command,
              full: view.full,
              ...answers,
            }),
            args.uploadLimit,
          )
          const fresh = await read(ctx, view)
          if (consent(fresh) === consent(answers)) break
          png = undefined
          answers = fresh
        }
        if (!png) throw new Error('Publication changed during rendering')
      }
      const live = await ctx.runQuery(internal.discordSessions.get, {
        id: args.id,
      })
      if (
        !live ||
        live.status !== 'busy' ||
        live.operation !== args.operation ||
        live.expiresAt <= Date.now() ||
        Date.now() - (live.startedAt ?? 0) > WORK_TTL - 25000
      )
        throw new Error('Worker expired')
      const data: Record<string, unknown> = {
        content: view.picker
          ? (args.recovery ??
            (view.picker === 'subject'
              ? 'Choose an AI Stack creator.'
              : 'Choose a creator to compare.'))
          : '',
        components: controls(
          args.id,
          session.revision + 1,
          view,
          answers.subject,
          answers.comparison,
          choices,
        ),
      }
      if (png) data.embeds = [{ image: { url: 'attachment://stats.png' } }]
      else if (!pickerOnly) {
        data.embeds = []
        data.attachments = []
      }
      if (args.recovery) {
        const components = data.components as ReturnType<typeof controls>
        components.push(
          row(
            link('Browse creators', `${getAppUrl()}/stacks`),
            link('Create a stack', `${getAppUrl()}/stacks/new`),
          ),
        )
      }
      const messageId = await deliver(
        session.applicationId,
        args.token,
        data,
        png,
      )
      delivered = true
      const committed = await ctx.runMutation(internal.discordSessions.finish, {
        id: args.id,
        operation: args.operation,
        view,
        messageId,
        private: session.private && args.action !== 'person',
      })
      if (!committed) throw new DeliveryError(true)
    } catch (error) {
      const ambiguous =
        delivered || (error instanceof DeliveryError && error.ambiguous)
      await ctx.runMutation(internal.discordSessions.fail, {
        id: args.id,
        operation: args.operation,
        ambiguous,
      })
      const text = ambiguous
        ? 'This update could not finish safely. Run the command again.'
        : 'The answer could not be updated. Try again or run a new command.'
      try {
        if (!session.messageId || (session.private && args.action === 'person'))
          await deliver(session.applicationId, args.token, {
            content: text,
            embeds: [],
            attachments: [],
            components: [],
          })
        else {
          const response = await fetch(
            `${api}/webhooks/${session.applicationId}/${args.token}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                flags: 64,
                content: text,
                allowed_mentions: mentions,
              }),
              signal: AbortSignal.timeout(10000),
            },
          )
          if (!response.ok)
            console.error('Discord recovery delivery failed', response.status)
        }
      } catch {
        console.error('Discord recovery delivery unavailable')
      }
    }
    return null
  },
})
