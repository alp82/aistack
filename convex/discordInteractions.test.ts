/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { internal } from './_generated/api'
import schema from './schema'
import {
  DISCORD_USER_MAX_REQUESTS,
  INTERACTIONS_PATH,
  verifyDiscordSignature,
} from './discordInteractions'
import { bytesToHex, encodeUtf8 } from './lib/webCrypto'

/**
 * The Discord interactions endpoint - wayfinder #229 (map #199).
 *
 * The tests run the real `httpAction` through `t.fetch` with bodies signed by
 * a key generated per test, because the property under test lives at the HTTP
 * edge: an unsigned or mis-signed body must never reach a handler.
 */

const modules = import.meta.glob('./**/*.{js,ts}')

type Ctx = Awaited<ReturnType<typeof convexTest>>

const savedEnv = {
  DISCORD_PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  APP_URL: process.env.APP_URL,
}

let keyPair: CryptoKeyPair

async function generateKeyPair(): Promise<{ pair: CryptoKeyPair; publicKeyHex: string }> {
  const pair = (await crypto.subtle.generateKey('Ed25519', true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair
  const raw = await crypto.subtle.exportKey('raw', pair.publicKey)
  return { pair, publicKeyHex: bytesToHex(raw) }
}

async function sign(body: string, timestamp: string, key = keyPair.privateKey) {
  const signature = await crypto.subtle.sign(
    'Ed25519',
    key,
    encodeUtf8(`${timestamp}${body}`),
  )
  return bytesToHex(signature)
}

async function post(
  t: Ctx,
  body: string,
  opts: { timestamp?: string; signature?: string } = {},
) {
  const timestamp = opts.timestamp ?? String(Math.floor(Date.now() / 1000))
  const signature = opts.signature ?? (await sign(body, timestamp))
  return await t.fetch(INTERACTIONS_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature-Ed25519': signature,
      'X-Signature-Timestamp': timestamp,
    },
    body,
  })
}

function command(
  name: string,
  options: Array<{ name: string; type: number; value: string | number | boolean }> = [],
  userId = '105048063873126400',
) {
  return JSON.stringify({
    id: '1',
    application_id: '1540381573243736116',
    type: 2,
    token: 'interaction-token',
    data: { id: '2', name, type: 1, options },
    member: { user: { id: userId } },
  })
}

beforeEach(async () => {
  const generated = await generateKeyPair()
  keyPair = generated.pair
  process.env.DISCORD_PUBLIC_KEY = generated.publicKeyHex
  process.env.BETTER_AUTH_SECRET = 'discord-link-test-secret-at-least-32-characters'
  process.env.APP_URL = 'https://aistack.test'
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  for (const [name, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

test('verifyDiscordSignature accepts a valid signature and rejects a tampered body', async () => {
  const body = '{"type":1}'
  const timestamp = '1700000000'
  const signature = await sign(body, timestamp)
  const publicKeyHex = process.env.DISCORD_PUBLIC_KEY as string

  await expect(
    verifyDiscordSignature(publicKeyHex, signature, timestamp, body),
  ).resolves.toBe(true)
  await expect(
    verifyDiscordSignature(publicKeyHex, signature, timestamp, '{"type":2}'),
  ).resolves.toBe(false)
  await expect(
    verifyDiscordSignature(publicKeyHex, signature, '1700000001', body),
  ).resolves.toBe(false)
  await expect(
    verifyDiscordSignature('not-hex', signature, timestamp, body),
  ).resolves.toBe(false)
  await expect(
    verifyDiscordSignature(publicKeyHex, 'zz', timestamp, body),
  ).resolves.toBe(false)
})

test('a registration ping answers pong', async () => {
  const t = convexTest(schema, modules)
  const res = await post(t, '{"type":1}')
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({ type: 1 })
})

test('a missing, malformed, or foreign signature is refused with 401 before parsing', async () => {
  const t = convexTest(schema, modules)
  const body = '{"type":1}'

  const unsigned = await t.fetch(INTERACTIONS_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  expect(unsigned.status).toBe(401)

  const garbage = await post(t, body, { signature: 'not-a-signature' })
  expect(garbage.status).toBe(401)

  const other = await generateKeyPair()
  const timestamp = '1700000000'
  const foreign = await post(t, body, {
    timestamp,
    signature: await sign(body, timestamp, other.pair.privateKey),
  })
  expect(foreign.status).toBe(401)

  // Even an unparseable body is refused by signature first, never by parse.
  const notJson = await t.fetch(INTERACTIONS_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not json',
  })
  expect(notJson.status).toBe(401)
})

test('a signed but unparseable body is a 400', async () => {
  const t = convexTest(schema, modules)
  const res = await post(t, 'not json')
  expect(res.status).toBe(400)
})

test('the endpoint answers 503 when the public key is not configured', async () => {
  delete process.env.DISCORD_PUBLIC_KEY
  const t = convexTest(schema, modules)
  const res = await t.fetch(INTERACTIONS_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"type":1}',
  })
  expect(res.status).toBe(503)
})

test('a slash command defers within the request and schedules the reply patch', async () => {
  vi.useFakeTimers()
  const t = convexTest(schema, modules)
  const fetchMock = vi.fn(async () => new Response(null, { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)

  const res = await post(t, command('link'))
  expect(res.status).toBe(200)
  // /link is ephemeral, and the deferral is where the flag has to be set.
  expect(await res.json()).toEqual({ type: 5, data: { flags: 64 } })

  await t.finishAllScheduledFunctions(vi.runAllTimers)

  expect(fetchMock).toHaveBeenCalledTimes(1)
  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
  expect(url).toBe(
    'https://discord.com/api/v10/webhooks/1540381573243736116/interaction-token/messages/@original',
  )
  expect(init.method).toBe('PATCH')
  const patched = JSON.parse(init.body as string)
  expect(patched.embeds[0].title).toBe('Link your aistack account')
  expect(patched.components[0].components[0].url).toMatch(
    /^https:\/\/aistack\.test\/link\/discord\?token=/,
  )
})

test('an unknown command patches an ephemeral error and never throws', async () => {
  vi.useFakeTimers()
  const t = convexTest(schema, modules)
  const fetchMock = vi.fn(async () => new Response(null, { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)

  const res = await post(t, command('nope'))
  expect(await res.json()).toEqual({ type: 5, data: { flags: 64 } })
  await t.finishAllScheduledFunctions(vi.runAllTimers)

  const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
  expect(JSON.parse(init.body as string).content).toMatch(/Unknown command/)
})

test('a handler failure patches a fallback message instead of leaving the deferral hanging', async () => {
  vi.useFakeTimers()
  delete process.env.BETTER_AUTH_SECRET // makes /link throw inside the handler
  const t = convexTest(schema, modules)
  const fetchMock = vi.fn(async () => new Response(null, { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)

  await post(t, command('link'))
  await t.finishAllScheduledFunctions(vi.runAllTimers)

  expect(fetchMock).toHaveBeenCalledTimes(1)
  const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
  expect(JSON.parse(init.body as string).content).toMatch(/did not answer/)
})

test('a user over the per-minute cap gets an ephemeral reply and no scheduled work', async () => {
  vi.useFakeTimers()
  const t = convexTest(schema, modules)
  const fetchMock = vi.fn(async () => new Response(null, { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)

  for (let index = 0; index < DISCORD_USER_MAX_REQUESTS; index++) {
    const res = await post(t, command('link'))
    expect((await res.json()).type).toBe(5)
  }
  const limited = await post(t, command('link'))
  expect(limited.status).toBe(200)
  const body = await limited.json()
  expect(body.type).toBe(4)
  expect(body.data.flags).toBe(64)
  expect(body.data.content).toMatch(/Too many commands/)

  // Another user is unaffected: the bucket is per Discord user.
  const other = await post(t, command('link', [], '105048063873126401'))
  expect((await other.json()).type).toBe(5)

  await t.finishAllScheduledFunctions(vi.runAllTimers)
  expect(fetchMock).toHaveBeenCalledTimes(DISCORD_USER_MAX_REQUESTS + 1)
})

test('component and autocomplete interactions get a harmless answer', async () => {
  const t = convexTest(schema, modules)
  const component = await post(t, JSON.stringify({ type: 3, token: 'x', application_id: '1' }))
  expect((await component.json()).type).toBe(4)
  const autocomplete = await post(t, JSON.stringify({ type: 4, token: 'x', application_id: '1' }))
  expect(await autocomplete.json()).toEqual({ type: 8, data: { choices: [] } })
})

test('the fulfill action is unreachable from the public API', async () => {
  // Compile-time: `internal.discordInteractions.fulfill` exists and there is
  // no `api.discordInteractions.fulfill`. The reference below is the check.
  expect(internal.discordInteractions.fulfill).toBeDefined()
})
