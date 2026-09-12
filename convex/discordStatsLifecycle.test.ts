/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { internal } from './_generated/api'
import schema from './schema'
import { bytesToHex, encodeUtf8 } from './lib/webCrypto'
import { controlId, WORK_TTL } from './lib/discordSession'
import { deliver, DeliveryError, renderPng } from './discordStatsTransport'
const modules = import.meta.glob('./**/*.{js,ts}')
type Test = ReturnType<typeof convexTest>
let key: CryptoKeyPair, sequence: number
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
let renders: Array<Record<string, any>>,
  patches: Array<Record<string, any>>,
  fetcher: ReturnType<typeof vi.fn>
beforeEach(async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-12T23:59:00Z'))
  sequence = 0
  renders = []
  patches = []
  key = (await crypto.subtle.generateKey('Ed25519', true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair
  vi.stubEnv(
    'DISCORD_PUBLIC_KEY',
    bytesToHex(await crypto.subtle.exportKey('raw', key.publicKey)),
  )
  vi.stubEnv(
    'DISCORD_RENDER_SECRET',
    'test-render-secret-at-least-32-characters',
  )
  vi.stubEnv('DISCORD_RENDER_ORIGIN', 'https://renderer.test')
  vi.stubEnv('APP_URL', 'https://aistack.test')
  fetcher = vi.fn(async (url: string, init: RequestInit) => {
    if (url.includes('/api/discord/render')) {
      renders.push(JSON.parse(init.body as string))
      return new Response(png, { headers: { 'Content-Type': 'image/png' } })
    }
    const body =
      init.body instanceof FormData
        ? JSON.parse(init.body.get('payload_json') as string)
        : JSON.parse(init.body as string)
    patches.push(body)
    return Response.json({ id: 'message' })
  })
  vi.stubGlobal('fetch', fetcher)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})
async function seed(t: Test, handle = 'alice', discordUserId = 'owner') {
  return t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: handle,
      slug: handle,
      userId: handle,
      discordUserId,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: 1,
    })
    const stackId = await ctx.db.insert('stacks', {
      creatorId,
      name: `${handle} stack`,
      slug: handle,
      shortId: handle,
      oneLiner: 'Tools',
      toolSubscriptions: [],
      hasUsageComponent: false,
      publishCost: true,
      publishWorkflow: true,
      createdAt: 1,
      updatedAt: 1,
    })
    return { creatorId, stackId }
  })
}
async function post(t: Test, data: Record<string, unknown>) {
  const value = {
    id: `interaction${++sequence}`,
    application_id: 'app',
    token: 'token',
    user: { id: 'owner' },
    ...data,
  }
  const body = JSON.stringify(value),
    timestamp = String(Date.now() / 1000)
  const signature = bytesToHex(
    await crypto.subtle.sign(
      'Ed25519',
      key.privateKey,
      encodeUtf8(timestamp + body),
    ),
  )
  const response = await t.fetch('/api/discord/interactions', {
    method: 'POST',
    body,
    headers: {
      'x-signature-ed25519': signature,
      'x-signature-timestamp': timestamp,
    },
  })
  return response.json()
}
const run = (t: Test) =>
  t.finishAllScheduledFunctions(() => vi.advanceTimersByTime(0))
const state = (t: Test) =>
  t.run(async (ctx) => (await ctx.db.query('discordSessions').collect())[0])
async function start(
  t: Test,
  name = 'tokens',
  options: Array<{ name: string; value: unknown }> = [],
) {
  const response = await post(t, { type: 2, data: { name, options } })
  await run(t)
  return response
}
async function click(
  t: Test,
  action: string,
  rest: Record<string, unknown> = {},
) {
  const s = await state(t)
  return post(t, {
    type: 3,
    message: { id: s.messageId },
    data: { custom_id: controlId(s._id, s.revision, action) },
    ...rest,
  })
}
test.each(['tokens', 'cost', 'context', 'harness'])(
  'signed /%s renders public PNG and replaces attachments on successive updates',
  async (name) => {
    const t = convexTest(schema, modules)
    await seed(t)
    expect(await start(t, name)).toEqual({ type: 5, data: {} })
    expect((await state(t)).status).toBe('ready')
    expect(renders[0].command).toBe(name)
    for (const action of ['range1', 'range30']) {
      expect(await click(t, action)).toEqual({ type: 6 })
      await run(t)
    }
    expect(renders.map((r) => r.subject.range.days)).toEqual([7, 1, 30])
    expect(patches).toHaveLength(3)
    for (const payload of patches) {
      expect(payload.attachments).toEqual([{ id: 0, filename: 'stats.png' }])
      expect(payload.embeds).toEqual([
        { image: { url: 'attachment://stats.png' } },
      ])
      expect(payload.allowed_mentions).toEqual({ parse: [] })
    }
  },
)
test('autocomplete validates real handles; unlinked users can browse typed handles', async () => {
  const t = convexTest(schema, modules)
  await seed(t)
  const result = await post(t, {
    type: 4,
    data: {
      name: 'tokens',
      options: [{ name: 'creator', focused: true, value: '@ali' }],
    },
  })
  expect(result.data.choices).toEqual([
    { name: '@alice (alice)', value: 'alice' },
  ])
  expect(
    await post(t, {
      type: 2,
      user: { id: 'stranger' },
      data: {
        name: 'tokens',
        options: [{ name: 'creator', value: ' @alice ' }],
      },
    }),
  ).toEqual({ type: 5, data: {} })
  await run(t)
  expect(renders[0].subject.identity.handle).toBe('alice')
})
test('unlinked and unknown recovery is private, picking a real creator starts public answer', async () => {
  const t = convexTest(schema, modules)
  await seed(t, 'alice', 'someone-else')
  expect(await start(t)).toEqual({ type: 5, data: { flags: 64 } })
  expect(patches[0].content).toContain('/link')
  expect(renders).toHaveLength(0)
  const s = await state(t)
  const chosen = await click(t, 'person', {
    data: {
      custom_id: controlId(s._id, s.revision, 'person'),
      values: ['alice'],
    },
  })
  expect(chosen).toEqual({ type: 5, data: {} })
  await run(t)
  expect((await state(t)).private).toBe(false)
  expect(renders[0].subject.identity.handle).toBe('alice')
})
test('linked creator without stack gets contextual create-stack recovery', async () => {
  const t = convexTest(schema, modules),
    target = await seed(t)
  await t.run((ctx) => ctx.db.delete(target.stackId))
  await start(t)
  expect(patches[0].content).toContain('no stack')
  expect(JSON.stringify(patches[0].components)).toContain('/stacks/new')
})
test('unknown typed handles open a picker without inventing an identity', async () => {
  const t = convexTest(schema, modules)
  await seed(t)
  await start(t, 'tokens', [{ name: 'creator', value: 'alice-stack' }])
  expect(patches[0].content).toContain('No creator')
  expect((await state(t)).view.subject).toBeNull()
})
test('revision, requester, message and application bindings protect every branch and busy updates serialize', async () => {
  const t = convexTest(schema, modules)
  await seed(t)
  await start(t)
  const s = await state(t),
    stale = controlId(s._id, s.revision, 'range1')
  for (const extra of [
    { user: { id: 'stranger' } },
    { message: { id: 'other' } },
    { application_id: 'other' },
  ]) {
    const response = await click(t, 'search', extra)
    expect(response.type).toBe(4)
    expect(response.data.flags).toBe(64)
  }
  expect(await click(t, 'range1')).toEqual({ type: 6 })
  expect((await click(t, 'range30')).data.content).toContain('updating')
  await run(t)
  expect(
    (
      await post(t, {
        type: 3,
        message: { id: 'message' },
        data: { custom_id: stale },
      })
    ).data.content,
  ).toContain('stale')
  expect((await state(t)).view.days).toBe(1)
})
test('search and custom-range modal round trips require nonce, binding, and integer bounds', async () => {
  const t = convexTest(schema, modules)
  await seed(t)
  await start(t)
  const modal = await click(t, 'range')
  expect(modal.type).toBe(9)
  const data = {
    custom_id: modal.data.custom_id,
    components: [{ components: [{ custom_id: 'value', value: '180' }] }],
  }
  expect(
    (await post(t, { type: 5, message: { id: 'other' }, data })).data.content,
  ).toContain('another message')
  expect(await post(t, { type: 5, message: { id: 'message' }, data })).toEqual({
    type: 6,
  })
  await run(t)
  expect((await state(t)).view.days).toBe(180)
  expect(
    (await post(t, { type: 5, message: { id: 'message' }, data })).data.content,
  ).toContain('stale')
  await click(t, 'compare')
  await run(t)
  const search = await click(t, 'search')
  expect(search.type).toBe(9)
  expect(
    await post(t, {
      type: 5,
      message: { id: 'message' },
      data: {
        custom_id: search.data.custom_id,
        components: [
          { components: [{ custom_id: 'value', value: 'missing' }] },
        ],
      },
    }),
  ).toEqual({ type: 6 })
  await run(t)
  expect((await state(t)).view.search).toBe('missing')
  expect(renders).toHaveLength(2) // picker updates preserve the confirmed image
})
test('expiry and midnight retain the pinned date and require a new command after one hour', async () => {
  const t = convexTest(schema, modules)
  await seed(t)
  await start(t)
  const initial = await state(t)
  vi.setSystemTime(new Date('2026-09-13T00:01:00Z'))
  await click(t, 'range30')
  await run(t)
  expect(renders[1].subject.range.endDate).toBe('2026-09-12')
  expect((await state(t)).expiresAt).toBe(initial.expiresAt)
  vi.setSystemTime(initial.expiresAt)
  expect((await click(t, 'range1')).data.content).toContain('expired')
  await t.mutation(internal.discordSessions.cleanup, {})
  expect(await state(t)).toBeNull()
})
test('duplicate starters do not create another session', async () => {
  const t = convexTest(schema, modules)
  await seed(t)
  const command = { type: 2, id: 'same', data: { name: 'tokens' } }
  expect((await post(t, command)).type).toBe(5)
  expect((await post(t, command)).data.content).toContain('already handled')
  await run(t)
  expect(renders).toHaveLength(1)
})
test('consent revoked while rendering causes a fresh private-filtered render before delivery', async () => {
  const t = convexTest(schema, modules),
    target = await seed(t)
  const original = fetcher.getMockImplementation()!
  fetcher.mockImplementation(async (url: string, init: RequestInit) => {
    const response = await original(url, init)
    if (url.includes('/render') && renders.length === 1)
      await t.run((ctx) =>
        ctx.db.patch(target.stackId, {
          publishCost: false,
          publishWorkflow: false,
        }),
      )
    return response
  })
  await start(t, 'cost')
  expect(renders.map((r) => r.subject.publishCost)).toEqual([true, false])
  expect(patches).toHaveLength(1)
})
test('deleted pinned stack fails the update without retargeting or replacing its confirmed image', async () => {
  const t = convexTest(schema, modules),
    target = await seed(t)
  await start(t)
  await t.run((ctx) => ctx.db.delete(target.stackId))
  await click(t, 'range30')
  await run(t)
  expect((await state(t)).view.days).toBe(7)
  expect(patches[1].flags).toBe(64)
  expect(patches[1].attachments).toBeUndefined()
})
test('render failure retains confirmed state and initial failure produces a concise error', async () => {
  const t = convexTest(schema, modules)
  await seed(t)
  await start(t)
  const original = fetcher.getMockImplementation()!
  fetcher.mockImplementation((url: string, init: RequestInit) =>
    url.includes('/render')
      ? Promise.resolve(new Response(null, { status: 503 }))
      : original(url, init),
  )
  await click(t, 'range30')
  await run(t)
  expect((await state(t)).status).toBe('ready')
  expect((await state(t)).view.days).toBe(7)
  expect(patches[patches.length - 1]?.flags).toBe(64)
  const other = convexTest(schema, modules)
  await seed(other)
  await start(other)
  expect((await state(other)).status).toBe('failed')
  expect(patches[patches.length - 1]?.content).toContain('could not be updated')
})
test('ambiguous delivery and stranded workers fail closed, never reopening for another writer', async () => {
  const t = convexTest(schema, modules)
  await seed(t)
  await start(t)
  const original = fetcher.getMockImplementation()!
  fetcher.mockImplementation((url: string, init: RequestInit) =>
    init.method === 'PATCH'
      ? Promise.reject(new Error('network lost'))
      : original(url, init),
  )
  await click(t, 'range30')
  await run(t)
  expect((await state(t)).status).toBe('failed')
  expect((await click(t, 'range1')).data.content).toContain('safely')
  const other = convexTest(schema, modules)
  await seed(other)
  await post(other, { type: 2, data: { name: 'tokens' } })
  vi.advanceTimersByTime(WORK_TTL + 1)
  await run(other)
  expect((await state(other)).status).toBe('failed')
})
test('renderer request is signed over exact bytes and upload bounds are enforced', async () => {
  const body = '{"version":1}'
  await renderPng(body, 8)
  const [, init] = fetcher.mock.calls[0]
  const headers = new Headers(init.headers),
    timestamp = headers.get('x-aistack-render-timestamp')!
  const hmac = await crypto.subtle.importKey(
    'raw',
    encodeUtf8(process.env.DISCORD_RENDER_SECRET!),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  expect(headers.get('x-aistack-render-signature')).toBe(
    bytesToHex(
      await crypto.subtle.sign(
        'HMAC',
        hmac,
        encodeUtf8(`${timestamp}\n${body}`),
      ),
    ),
  )
  await expect(renderPng(body, 7)).rejects.toThrow('upload limit')
})
test('Discord HTTP rejection differs from ambiguous delivery and checks response identity', async () => {
  fetcher.mockResolvedValue(new Response(null, { status: 400 }))
  await expect(deliver('app', 'token', {})).rejects.toMatchObject({
    ambiguous: false,
  })
  fetcher.mockResolvedValue(new Response(null, { status: 500 }))
  await expect(deliver('app', 'token', {})).rejects.toMatchObject({
    ambiguous: true,
  })
  fetcher.mockResolvedValue(Response.json({}))
  await expect(deliver('app', 'token', {})).rejects.toBeInstanceOf(
    DeliveryError,
  )
})
test('/compare without person opens picker; selection and refinements preserve the subject IDs', async () => {
  const t = convexTest(schema, modules),
    alice = await seed(t)
  await seed(t, 'bob', 'bob-discord')
  await start(t, 'compare')
  expect(renders).toHaveLength(0)
  const s = await state(t)
  expect(
    await click(t, 'person', {
      data: {
        custom_id: controlId(s._id, s.revision, 'person'),
        values: ['bob'],
      },
    }),
  ).toEqual({ type: 6 })
  await run(t)
  expect(renders[0].subject.identity.creatorId).toBe(alice.creatorId)
  expect(renders[0].comparison.identity.handle).toBe('bob')
  await click(t, 'range30')
  await run(t)
  expect(renders[1].subject.range).toEqual(renders[1].comparison.range)
  const links = patches[patches.length - 1].components
    .flatMap((r: any) => r.components)
    .filter((c: any) => c.style === 5)
  expect(links.map((l: any) => l.url)).toEqual([
    'https://aistack.test/@alice',
    'https://aistack.test/@bob',
  ])
})
test('harness comparisons default from subject and preserve an explicit same-harness selection', async () => {
  const t = convexTest(schema, modules),
    alice = await seed(t),
    bob = await seed(t, 'bob', 'bob-discord')
  await t.run(async (ctx) => {
    for (const [target, harnesses] of [
      [alice, ['codex', 'claude-code']],
      [bob, ['claude-code']],
    ] as const) {
      await ctx.db.insert('measuredDays', {
        stackId: target.stackId,
        date: '2026-09-12',
        capturedAt: 1,
        receivedAt: 1,
        aggregateVersion: 'measured-days/v1',
        fingerprint: target.stackId,
        usage: {
          harnesses: harnesses.map((harness, i) => ({
            harness,
            sessions: 1,
            projectKeys: [],
            subagentTokens: 0,
            excludedTokens: { unpriced: 0, synthetic: 0 },
            models: [
              {
                model: 'test-model',
                tokens: {
                  input: 100 - i * 20,
                  output: 0,
                  cacheRead: 0,
                  cacheWrite: 0,
                },
              },
            ],
          })),
        },
      })
    }
  })
  await start(t, 'harness')
  await click(t, 'compare')
  await run(t)
  let s = await state(t)
  await click(t, 'person', {
    data: {
      custom_id: controlId(s._id, s.revision, 'person'),
      values: ['bob'],
    },
  })
  await run(t)
  expect(renders[1].subject.selectedTokenHarness).toBe('codex')
  expect(renders[1].comparison.selectedTokenHarness).toBe('codex')
  s = await state(t)
  await click(t, 'harness', {
    data: {
      custom_id: controlId(s._id, s.revision, 'harness'),
      values: ['claude-code'],
    },
  })
  await run(t)
  await click(t, 'range30')
  await run(t)
  expect(renders[3].subject.selectedTokenHarness).toBe('claude-code')
  expect(renders[3].comparison.selectedTokenHarness).toBe('claude-code')
})
test('invalid ranges and foreign modal nonce leave confirmed state untouched', async () => {
  const t = convexTest(schema, modules)
  await seed(t)
  await start(t)
  for (const value of ['0', '181', '1.5']) {
    const modal = await click(t, 'range')
    const result = await post(t, {
      type: 5,
      message: { id: 'message' },
      data: {
        custom_id: modal.data.custom_id,
        components: [{ components: [{ custom_id: 'value', value }] }],
      },
    })
    expect(result.data.content).toContain('whole number')
  }
  const modal = await click(t, 'range')
  expect(
    (
      await post(t, {
        type: 5,
        message: { id: 'message' },
        data: {
          custom_id: modal.data.custom_id.replace(/~.*$/, '~foreign'),
          components: [{ components: [{ custom_id: 'value', value: '30' }] }],
        },
      })
    ).data.content,
  ).toContain('stale')
  expect((await state(t)).view.days).toBe(7)
})
test('an HTTP-rejected edit retains confirmed revision and retries once with a fresh interaction', async () => {
  const t = convexTest(schema, modules)
  await seed(t)
  await start(t)
  const original = fetcher.getMockImplementation()!
  let rejected = false
  fetcher.mockImplementation((url: string, init: RequestInit) => {
    if (init.method === 'PATCH' && !rejected) {
      rejected = true
      return Promise.resolve(new Response(null, { status: 400 }))
    }
    return original(url, init)
  })
  const previous = await state(t)
  await click(t, 'range30')
  await run(t)
  expect((await state(t)).revision).toBe(previous.revision)
  expect((await state(t)).status).toBe('ready')
  await click(t, 'range30')
  await run(t)
  expect((await state(t)).view.days).toBe(30)
})
test('old correctly signed HTTP requests cannot recreate a cleaned-up session', async () => {
  const t = convexTest(schema, modules)
  const body = JSON.stringify({
    type: 2,
    id: 'replay',
    application_id: 'app',
    token: 'token',
    user: { id: 'owner' },
    data: { name: 'tokens' },
  })
  const timestamp = String(Date.now() / 1000 - 301)
  const signature = bytesToHex(
    await crypto.subtle.sign(
      'Ed25519',
      key.privateKey,
      encodeUtf8(timestamp + body),
    ),
  )
  const response = await t.fetch('/api/discord/interactions', {
    method: 'POST',
    body,
    headers: {
      'x-signature-ed25519': signature,
      'x-signature-timestamp': timestamp,
    },
  })
  expect(response.status).toBe(401)
  expect(await state(t)).toBeNull()
})
test('a durable worker claim prevents duplicate scheduled executions from writing', async () => {
  const t = convexTest(schema, modules)
  await seed(t)
  await post(t, { id: 'work', type: 2, data: { name: 'tokens' } })
  const s = await state(t)
  expect(
    await t.mutation(internal.discordSessions.claimWorker, {
      id: s._id,
      operation: 'work',
    }),
  ).not.toBeNull()
  expect(
    await t.mutation(internal.discordSessions.claimWorker, {
      id: s._id,
      operation: 'work',
    }),
  ).toBeNull()
  await run(t)
  expect(patches).toHaveLength(0)
  vi.setSystemTime(Date.now() + WORK_TTL + 1)
  await t.mutation(internal.discordSessions.fail, {
    id: s._id,
    operation: 'work',
    ambiguous: false,
  })
  expect((await state(t)).status).toBe('failed')
})
test('failed private-picker selection resolves the new public deferral and preserves private recovery', async () => {
  const t = convexTest(schema, modules)
  await seed(t, 'alice', 'someone-else')
  await start(t)
  const previous = await state(t),
    original = fetcher.getMockImplementation()!
  fetcher.mockImplementation((url: string, init: RequestInit) =>
    url.includes('/render')
      ? Promise.resolve(new Response(null, { status: 503 }))
      : original(url, init),
  )
  expect(
    await click(t, 'person', {
      data: {
        custom_id: controlId(previous._id, previous.revision, 'person'),
        values: ['alice'],
      },
    }),
  ).toEqual({ type: 5, data: {} })
  await run(t)
  const session = await state(t)
  expect(session.private).toBe(true)
  expect(session.revision).toBe(previous.revision)
  expect(session.view.subject).toBeNull()
  const recovery = patches[patches.length - 1]
  expect(recovery.content).toContain('could not be updated')
  expect(recovery.attachments).toEqual([])
  expect(recovery.components).toEqual([])
  expect(fetcher.mock.calls[fetcher.mock.calls.length - 1][1].method).toBe(
    'PATCH',
  )
})
test('full-list controls replace the image and return to the five-percent list', async () => {
  const t = convexTest(schema, modules),
    target = await seed(t)
  await t.run((ctx) =>
    ctx.db.insert('measuredDays', {
      stackId: target.stackId,
      date: '2026-09-12',
      capturedAt: 1,
      receivedAt: 1,
      aggregateVersion: 'measured-days/v1',
      fingerprint: 'list',
      usage: {
        harnesses: [
          {
            harness: 'codex',
            sessions: 1,
            projectKeys: [],
            subagentTokens: 0,
            excludedTokens: { unpriced: 0, synthetic: 0 },
            models: [96, 4].map((input, i) => ({
              model: `model-${i}`,
              tokens: { input, output: 0, cacheRead: 0, cacheWrite: 0 },
            })),
          },
        ],
      },
    }),
  )
  await start(t)
  expect(JSON.stringify(patches[0].components)).toContain('Full list')
  await click(t, 'full')
  await run(t)
  expect(renders[1].full).toBe(true)
  expect(JSON.stringify(patches[1].components)).toContain('5% and up')
  await click(t, 'full')
  await run(t)
  expect(renders[2].full).toBe(false)
})
