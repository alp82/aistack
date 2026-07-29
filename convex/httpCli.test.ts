/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { api, internal } from './_generated/api'
import schema from './schema'
import { sha256Hex } from './httpCli'
import { FULL_CLI_TOKEN_SCOPES, type CliTokenScope } from './lib/cliScopes'
import { DEFAULT_MAX_REQUESTS, SHARED_BUCKET_MAX_REQUESTS } from './rateLimit'

/**
 * The CLI bearer path over HTTP — wayfinder #49 (map #29).
 *
 * These tests exercise the real `httpAction`s through `t.fetch`, because the
 * property being asserted only exists there: hashing happens in the ACTION, so
 * the plaintext never crosses into the database layer. A convexTest that called
 * the queries directly would prove nothing about that.
 *
 * The load-bearing test is now `login to approval to token ...`, which asserts
 * the row carries the digest and NOT the bearer — the property #52's narrow
 * exists to create.
 */

const modules = import.meta.glob('./**/*.{js,ts}')

const USER = 'user_owner'
const IDENTITY = { tokenIdentifier: `convex|${USER}`, subject: USER }
const DAY = 24 * 60 * 60 * 1000

type Ctx = Awaited<ReturnType<typeof convexTest>>

async function seedCreator(t: Ctx) {
  return await t.run(async (ctx) =>
    ctx.db.insert('creators', {
      name: 'Owner',
      slug: 'owner',
      userId: USER,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )
}

async function seedToken(t: Ctx, token: string, opts: { scopes?: CliTokenScope[] } = {}) {
  return await t.run(async (ctx) =>
    ctx.db.insert('cliTokens', {
      tokenHash: await sha256Hex(token),
      userId: USER,
      scopes: opts.scopes ?? FULL_CLI_TOKEN_SCOPES,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      expiresAt: Date.now() + 90 * DAY,
    }),
  )
}

describe('bearer resolution', () => {
  test('a hashed token authenticates', async () => {
    const t = convexTest(schema, modules)
    await seedCreator(t)
    await seedToken(t, 'tok_hashed')

    const resp = await t.fetch('/api/cli/stacks', {
      method: 'GET',
      headers: { Authorization: 'Bearer tok_hashed' },
    })
    // 404 means the bearer RESOLVED and the handler then found no stack. A 401
    // would mean it never got that far.
    expect(resp.status).toBe(404)
  })

  test('a wrong token is refused', async () => {
    const t = convexTest(schema, modules)
    await seedCreator(t)
    await seedToken(t, 'tok_real')

    const resp = await t.fetch('/api/cli/stacks', {
      method: 'GET',
      headers: { Authorization: 'Bearer tok_wrong' },
    })
    expect(resp.status).toBe(401)
  })

  test('a revoked token is refused immediately', async () => {
    // The point of the whole surface. The sliding TTL means expiry is not a
    // remedy, so revoke has to bite on the very next request.
    const t = convexTest(schema, modules)
    await seedCreator(t)
    const id = await seedToken(t, 'tok_revoked')
    await t.withIdentity(IDENTITY).mutation(api.cliTokens.revokeToken, { id })

    const resp = await t.fetch('/api/cli/stacks', {
      method: 'GET',
      headers: { Authorization: 'Bearer tok_revoked' },
    })
    expect(resp.status).toBe(401)
  })

  test('sync-config falls back to anonymous for an unknown bearer', async () => {
    // #38 decided this route takes an OPTIONAL bearer. A bad token must not
    // 401 it, or the client cannot run its fail-closed filter before sending.
    const t = convexTest(schema, modules)
    const resp = await t.fetch('/api/cli/sync-config', {
      method: 'GET',
      headers: { Authorization: 'Bearer nonsense' },
    })
    expect(resp.status).toBe(200)
    const body = await resp.json()
    expect(body.publishCost).toBe(false)
    expect(body.stack).toBeNull()
  })
})

describe('authStart machine name', () => {
  async function start(body?: string) {
    const t = convexTest(schema, modules)
    const resp = await t.fetch('/api/cli/auth/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body }),
    })
    const json = await resp.json()
    const session = await t.query(internal.cliSessions.getByUserCode, {
      userCode: json.userCode,
    })
    return { t, json, session }
  }

  test('stores the CLI proposal', async () => {
    const { t, json } = await start(JSON.stringify({ machineName: 'work laptop' }))
    const stored = await t.run(async (ctx) => {
      const row = await ctx.db
        .query('cliSessions')
        .withIndex('by_userCode', (q) => q.eq('userCode', json.userCode))
        .first()
      return row?.machineName
    })
    expect(stored).toBe('work laptop')
  })

  test('an older CLI that sends no body still authenticates', async () => {
    const { session } = await start()
    expect(session).not.toBeNull()
  })

  test('a name that cannot be rendered is DROPPED, not rejected', async () => {
    // Refusing the login over a cosmetic field would break authentication for a
    // hostname the user never chose and cannot see yet.
    const { t, json, session } = await start(
      JSON.stringify({ machineName: 'bad‮name' }),
    )
    expect(session).not.toBeNull()
    const stored = await t.run(async (ctx) => {
      const row = await ctx.db
        .query('cliSessions')
        .withIndex('by_userCode', (q) => q.eq('userCode', json.userCode))
        .first()
      // `t.run` serializes an absent field as null on the way out.
      return row?.machineName ?? null
    })
    expect(stored).toBeNull()
  })
})

describe('the name reaches the machines list', () => {
  test('login to approval to token carries the name the user settled on', async () => {
    const t = convexTest(schema, modules)
    await seedCreator(t)

    // 1. The CLI proposes its hostname.
    const startResp = await t.fetch('/api/cli/auth/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineName: 'alp-desktop' }),
    })
    const { userCode, secretId } = await startResp.json()

    // 2. The approval page reads that proposal to prefill its field.
    const pending = await t
      .withIdentity(IDENTITY)
      .query(api.cliSessions.getPendingMachineName, { userCode })
    expect(pending?.machineName).toBe('alp-desktop')

    // 3. The user overwrites it. The user's string wins.
    await t.withIdentity(IDENTITY).mutation(api.cliSessions.approveSession, {
      userCode,
      machineName: 'work laptop',
    })

    // 4. The token is minted, hashed, and named.
    const pollResp = await t.fetch(
      `/api/cli/auth/poll?secretId=${encodeURIComponent(secretId)}`,
      { method: 'GET' },
    )
    const polled = await pollResp.json()
    expect(polled.status).toBe('approved')

    const rows = await t.withIdentity(IDENTITY).query(api.cliTokens.listByUser, {})
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('work laptop')

    // The minted token is stored as a digest, that digest is what
    // authenticates it, and THE PLAINTEXT IS NOWHERE ON THE ROW (#52). The last
    // assertion is the one the narrow exists for: before it, a database read
    // disclosed a live credential.
    const stored = await t.run(async (ctx) => {
      const row = await ctx.db.query('cliTokens').first()
      return row as unknown as Record<string, unknown>
    })
    expect(stored.tokenHash).toBe(await sha256Hex(polled.token))
    expect(stored.token).toBeUndefined()
    expect(Object.values(stored)).not.toContain(polled.token)

    const resp = await t.fetch('/api/cli/stacks', {
      method: 'GET',
      headers: { Authorization: `Bearer ${polled.token}` },
    })
    expect(resp.status).toBe(404)
  })

  test('clearing the field leaves the machine unnamed', async () => {
    // An empty field is a deliberate answer, not a missing one — it must not
    // fall back to the hostname the user just deleted.
    const t = convexTest(schema, modules)
    await seedCreator(t)
    const startResp = await t.fetch('/api/cli/auth/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineName: 'alp-desktop' }),
    })
    const { userCode, secretId } = await startResp.json()

    await t.withIdentity(IDENTITY).mutation(api.cliSessions.approveSession, {
      userCode,
      machineName: '   ',
    })
    await t.fetch(`/api/cli/auth/poll?secretId=${encodeURIComponent(secretId)}`, {
      method: 'GET',
    })

    const rows = await t.withIdentity(IDENTITY).query(api.cliTokens.listByUser, {})
    expect(rows[0].name).toBeUndefined()
  })

  test('a name that cannot be rendered is refused at the approval form', async () => {
    // Unlike the CLI's proposal, this string was typed into a form the user is
    // looking at, so refusing it is actionable rather than mysterious.
    const t = convexTest(schema, modules)
    const startResp = await t.fetch('/api/cli/auth/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const { userCode } = await startResp.json()

    await expect(
      t.withIdentity(IDENTITY).mutation(api.cliSessions.approveSession, {
        userCode,
        machineName: 'x'.repeat(65),
      }),
    ).rejects.toThrow(/64 characters/)
  })

  test('the approval-page prefill is not readable while signed out', async () => {
    const t = convexTest(schema, modules)
    const startResp = await t.fetch('/api/cli/auth/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineName: 'alp-desktop' }),
    })
    const { userCode } = await startResp.json()

    expect(
      await t.query(api.cliSessions.getPendingMachineName, { userCode }),
    ).toBeNull()
  })
})

/**
 * Scopes at the choke point (#52).
 *
 * Every token is minted with the full set, so nothing here is a live
 * restriction — these tests exist so that a narrower token later needs no
 * server change, and so the enforcement point cannot be deleted by accident.
 */
describe('scopes', () => {
  test('a collect-only token cannot publish', async () => {
    const t = convexTest(schema, modules)
    await seedCreator(t)
    await seedToken(t, 'tok_collect_only', { scopes: ['collect'] })

    const resp = await t.fetch('/api/cli/sync', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok_collect_only' },
      body: JSON.stringify({ payload: {} }),
    })
    // 403 and not 401: the credential is good, and presenting it again changes
    // nothing. 403 and not 400 is the load-bearing half — it proves the scope
    // check runs BEFORE the payload is looked at, which is what makes this a
    // choke point rather than a check one route could forget.
    expect(resp.status).toBe(403)
  })

  test('a sync-only token cannot read or update the stack', async () => {
    const t = convexTest(schema, modules)
    await seedCreator(t)
    await seedToken(t, 'tok_sync_only', { scopes: ['sync'] })

    for (const path of ['/api/cli/stacks', '/api/cli/stacks/collect']) {
      const resp = await t.fetch(path, {
        method: path.endsWith('collect') ? 'POST' : 'GET',
        headers: { Authorization: 'Bearer tok_sync_only' },
        body: path.endsWith('collect') ? JSON.stringify({ resources: [] }) : undefined,
      })
      expect(resp.status).toBe(403)
    }
  })

  test('a full token reaches every route', async () => {
    const t = convexTest(schema, modules)
    await seedCreator(t)
    await seedToken(t, 'tok_full')

    // 404 = the bearer resolved and the handler found no stack.
    const read = await t.fetch('/api/cli/stacks', {
      method: 'GET',
      headers: { Authorization: 'Bearer tok_full' },
    })
    expect(read.status).toBe(404)

    // 400 = the gate let it through and the PAYLOAD was refused, which is the
    // mirror image of the collect-only test above.
    const publish = await t.fetch('/api/cli/sync', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok_full' },
      body: JSON.stringify({}),
    })
    expect(publish.status).toBe(400)
  })

  test('sync-config answers a scope-less token anonymously, never 401 or 403', async () => {
    // The one route that must NOT refuse. Filtering is fail-closed and runs
    // BEFORE the send, so a client that cannot fetch the list is the client we
    // most want to have it — refusing it would publish more, not less.
    const t = convexTest(schema, modules)
    await seedCreator(t)
    await seedToken(t, 'tok_no_sync', { scopes: ['collect'] })

    const resp = await t.fetch('/api/cli/sync-config', {
      method: 'GET',
      headers: { Authorization: 'Bearer tok_no_sync' },
    })
    expect(resp.status).toBe(200)
    const body = await resp.json()
    expect(body.publishCost).toBe(false)
    expect(body.reviewKeptPrivate).toBe(false)
    expect(body.stack).toBeNull()
    // The genuinely public half still arrives, because that is the whole point.
    expect(Array.isArray(body.allowlist.mcpServers)).toBe(true)
  })

  test('every minted token carries the full set', async () => {
    const t = convexTest(schema, modules)
    await seedCreator(t)
    const startResp = await t.fetch('/api/cli/auth/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const { userCode, secretId } = await startResp.json()
    await t.withIdentity(IDENTITY).mutation(api.cliSessions.approveSession, { userCode })
    await t.fetch(`/api/cli/auth/poll?secretId=${encodeURIComponent(secretId)}`, {
      method: 'GET',
    })

    const rows = await t.withIdentity(IDENTITY).query(api.cliTokens.listByUser, {})
    expect(rows[0].scopes).toEqual(FULL_CLI_TOKEN_SCOPES)
  })
})

/**
 * The authenticated budget (#52).
 *
 * Keyed on the TOKEN, not the IP: `/api/cli/*` are thin proxies and the Convex
 * site URL is directly reachable, so an IP key is walked around — while the
 * proxy forwards only `Authorization`, so a Convex-side IP limiter would see
 * one address for every user on earth.
 */
describe('token-keyed rate limit', () => {
  async function burn(t: Ctx, tokenId: string) {
    for (let i = 0; i < DEFAULT_MAX_REQUESTS; i++) {
      await t.mutation(internal.rateLimit.checkRateLimit, { key: `cli-token:${tokenId}` })
    }
  }

  test('a saturated token gets 429 with a Retry-After', async () => {
    const t = convexTest(schema, modules)
    await seedCreator(t)
    const id = await seedToken(t, 'tok_busy')
    await burn(t, id)

    const resp = await t.fetch('/api/cli/stacks', {
      method: 'GET',
      headers: { Authorization: 'Bearer tok_busy' },
    })
    expect(resp.status).toBe(429)
    expect(resp.headers.get('Retry-After')).toBeTruthy()
  })

  test('two machines are independent buckets', async () => {
    // The property an IP key does not have: two machines behind one office NAT
    // must not throttle each other.
    const t = convexTest(schema, modules)
    await seedCreator(t)
    const busy = await seedToken(t, 'tok_a')
    await seedToken(t, 'tok_b')
    await burn(t, busy)

    const resp = await t.fetch('/api/cli/stacks', {
      method: 'GET',
      headers: { Authorization: 'Bearer tok_b' },
    })
    expect(resp.status).toBe(404)
  })

  test('a refused request is not charged twice', async () => {
    // A saturated window must not increment, or a client that retries hard
    // never sees the window end.
    const t = convexTest(schema, modules)
    const key = 'cli-token:probe'
    for (let i = 0; i < DEFAULT_MAX_REQUESTS; i++) {
      await t.mutation(internal.rateLimit.checkRateLimit, { key })
    }
    const first = await t.mutation(internal.rateLimit.checkRateLimit, { key })
    const second = await t.mutation(internal.rateLimit.checkRateLimit, { key })
    expect(first.allowed).toBe(false)
    expect(second.allowed).toBe(false)
    const count = await t.run(async (ctx) => {
      const row = await ctx.db
        .query('apiRateLimits')
        .withIndex('by_key', (q) => q.eq('key', key))
        .first()
      return row?.count
    })
    expect(count).toBe(DEFAULT_MAX_REQUESTS)
  })
})

/**
 * `authStart` — the real abuse target on this surface (#36/#52).
 *
 * Unauthenticated, one `cliSessions` row per call, and the caller has no token
 * to be charged against, so the client address is the only thing left to key
 * on. The proxy destroys it, so it arrives in a header authenticated by a
 * shared secret.
 */
describe('authStart budget', () => {
  const SECRET = 'proxy-secret-value'

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  async function start(t: Ctx, headers: Record<string, string>) {
    return await t.fetch('/api/cli/auth/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({}),
    })
  }

  test('a trusted header keys on the CLAIMED address at the normal cap', async () => {
    vi.stubEnv('CLI_PROXY_SECRET', SECRET)
    const t = convexTest(schema, modules)
    await start(t, { 'x-aistack-client-ip': '9.9.9.9', 'x-aistack-proxy-auth': SECRET })

    const row = await t.run(async (ctx) =>
      ctx.db
        .query('apiRateLimits')
        .withIndex('by_key', (q) => q.eq('key', 'cli-auth-ip:9.9.9.9'))
        .first(),
    )
    expect(row?.count).toBe(1)
  })

  test('a claimed address with the WRONG secret is ignored completely', async () => {
    // Without this the header is a free-text field on a public endpoint, and
    // every attacker gets a fresh bucket per request.
    vi.stubEnv('CLI_PROXY_SECRET', SECRET)
    const t = convexTest(schema, modules)
    await start(t, {
      'x-aistack-client-ip': '9.9.9.9',
      'x-aistack-proxy-auth': 'wrong',
      'x-forwarded-for': '203.0.113.7',
    })

    const claimed = await t.run(async (ctx) =>
      ctx.db
        .query('apiRateLimits')
        .withIndex('by_key', (q) => q.eq('key', 'cli-auth-ip:9.9.9.9'))
        .first(),
    )
    expect(claimed).toBeNull()

    const fallback = await t.run(async (ctx) =>
      ctx.db
        .query('apiRateLimits')
        .withIndex('by_key', (q) => q.eq('key', 'cli-auth-hop:203.0.113.7'))
        .first(),
    )
    expect(fallback?.count).toBe(1)
  })

  test('no secret configured falls back to the shared bucket at the HIGH cap', async () => {
    // THE FALLBACK MATTERS MORE THAN THE HAPPY PATH. With no secret, every
    // proxied login on earth lands in this one bucket — at 60/min a missing env
    // var would break login for everybody at once.
    vi.stubEnv('CLI_PROXY_SECRET', '')
    const t = convexTest(schema, modules)
    const resp = await start(t, {
      'x-aistack-client-ip': '9.9.9.9',
      'x-aistack-proxy-auth': SECRET,
      'x-forwarded-for': '10.0.0.1, 198.51.100.4',
    })
    expect(resp.status).toBe(200)

    // Rightmost hop, because Traefik APPENDS the real address.
    const row = await t.run(async (ctx) =>
      ctx.db
        .query('apiRateLimits')
        .withIndex('by_key', (q) => q.eq('key', 'cli-auth-hop:198.51.100.4'))
        .first(),
    )
    expect(row?.count).toBe(1)

    // The cap is the high one. Saturating at 60 here would be the lockout.
    await t.run(async (ctx) => {
      const r = await ctx.db
        .query('apiRateLimits')
        .withIndex('by_key', (q) => q.eq('key', 'cli-auth-hop:198.51.100.4'))
        .first()
      if (r) await ctx.db.patch(r._id, { count: DEFAULT_MAX_REQUESTS })
    })
    const stillFine = await start(t, {
      'x-forwarded-for': '10.0.0.1, 198.51.100.4',
    })
    expect(stillFine.status).toBe(200)
  })

  test('a saturated caller gets 429 and writes no session row', async () => {
    vi.stubEnv('CLI_PROXY_SECRET', SECRET)
    const t = convexTest(schema, modules)
    for (let i = 0; i < DEFAULT_MAX_REQUESTS; i++) {
      await t.mutation(internal.rateLimit.checkRateLimit, {
        key: 'cli-auth-ip:9.9.9.9',
        limit: DEFAULT_MAX_REQUESTS,
      })
    }

    const resp = await start(t, {
      'x-aistack-client-ip': '9.9.9.9',
      'x-aistack-proxy-auth': SECRET,
    })
    expect(resp.status).toBe(429)
    expect(resp.headers.get('Retry-After')).toBeTruthy()

    // The growth this exists to stop: a refused call must not leave a row.
    const sessions = await t.run(async (ctx) => ctx.db.query('cliSessions').collect())
    expect(sessions).toHaveLength(0)
  })

  test('the high cap really is higher than the normal one', async () => {
    expect(SHARED_BUCKET_MAX_REQUESTS).toBeGreaterThan(DEFAULT_MAX_REQUESTS)
  })
})
