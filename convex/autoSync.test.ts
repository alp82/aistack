/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { api, internal } from './_generated/api'
import type { MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { sha256Hex } from './httpCli'
import type { CliTokenScope } from './lib/cliScopes'

/**
 * The server-side auto-sync permission — wayfinder #102 (map #76).
 *
 * #100 decision 2 moved the permission off the machine: the stack owns it, and
 * `sync --auto` asks the server before it publishes. These tests hold the three
 * halves of that move — the seed from a local flag, the "server always wins"
 * rule that follows it, and the trigger stamp the web switch reads.
 */

const modules = import.meta.glob('./**/*.{js,ts}')

async function seedCreator(
  t: ReturnType<typeof convexTest>,
  userId: string,
): Promise<{ asCreator: ReturnType<typeof t.withIdentity> }> {
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: `Creator ${userId}`,
      slug: `creator-${userId}`,
      userId,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )
  return { asCreator: t.withIdentity({ tokenIdentifier: `convex|${userId}` }) }
}

async function seedStack(
  t: ReturnType<typeof convexTest>,
  userId: string,
  opts: { scopes?: CliTokenScope[]; linked?: boolean } = {},
): Promise<{
  stackId: Id<'stacks'>
  tokenId: Id<'cliTokens'>
  bearer: string
  asCreator: ReturnType<typeof t.withIdentity>
}> {
  const { asCreator } = await seedCreator(t, userId)
  const created = await asCreator.mutation(api.stacks.create, {
    name: 'S',
    oneLiner: 'o',
    toolSubscriptions: [],
    published: true,
  })
  const bearer = `bearer-${userId}`
  const tokenId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('cliTokens', {
      tokenHash: await sha256Hex(bearer),
      userId,
      scopes: opts.scopes ?? ['collect', 'sync'],
      ...(opts.linked === false ? {} : { stackId: created._id }),
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      lastUsedAt: Date.now(),
    }),
  )
  return { stackId: created._id, tokenId, bearer, asCreator }
}

/** The CLI's own view: a bearer against the real HTTP routes. */
function asMachine(
  t: ReturnType<typeof convexTest>,
  bearer: string,
): {
  post: (path: string, body: unknown) => Promise<Response>
  get: (path: string) => Promise<Response>
} {
  const headers = {
    Authorization: `Bearer ${bearer}`,
    'Content-Type': 'application/json',
  }
  return {
    post: (path, body) =>
      t.fetch(path, { method: 'POST', headers, body: JSON.stringify(body) }),
    get: (path) => t.fetch(path, { headers }),
  }
}

function payload(harness: string, tokens: number) {
  return {
    schemaVersion: 1,
    capturedAt: Date.now(),
    window: { days: 30, from: '2026-07-01', to: '2026-07-31' },
    harness: { name: harness, version: '1.0.0' },
    pricingTable: null,
    activity: {
      sessions: 3,
      activeDays: 2,
      projects: 1,
      totalTokens: tokens,
      cacheHitShare: 0.5,
      subagentShare: 0,
    },
    models: [],
    inventory: {
      builtinTools: [],
      mcpServers: [],
      skills: [],
      subagents: [],
      slashCommands: [],
      withheld: {
        builtinTools: 0,
        mcpServers: 0,
        skills: 0,
        subagents: 0,
        slashCommands: 0,
      },
    },
    coverage: { filesScanned: 1, filesUnreadable: 0, linesParsed: 10, linesFailed: 0 },
    excludedTokens: { unpriced: 0, synthetic: 0 },
  }
}

async function stack(
  t: ReturnType<typeof convexTest>,
  stackId: Id<'stacks'>,
): Promise<Doc<'stacks'> | null> {
  return await t.run((ctx: MutationCtx) => ctx.db.get(stackId))
}

// ---------------------------------------------------------------------------
// Seed from local (#102): the first sync from a machine that already opted in
// ---------------------------------------------------------------------------

test('a sync reporting a local opt-in seeds a stack that has no flag', async () => {
  const t = convexTest(schema, modules)
  const { stackId, tokenId } = await seedStack(t, 'seed1')

  await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 1)],
    autoSync: { enabled: true, frequencyHours: 6 },
  })

  expect((await stack(t, stackId))?.autoSync).toEqual({
    enabled: true,
    frequencyHours: 6,
  })
})

test('a sync reporting a local opt-OUT seeds nothing', async () => {
  const t = convexTest(schema, modules)
  const { stackId, tokenId } = await seedStack(t, 'seed2')

  await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 1)],
    autoSync: { enabled: false, frequencyHours: 24 },
  })

  // "Off" and "never chose" look the same on the wire, so the stack keeps the
  // one seed it gets for a machine that really did opt in.
  expect((await stack(t, stackId))?.autoSync).toBeUndefined()
})

test('once the flag exists the server wins — a later sync cannot move it', async () => {
  const t = convexTest(schema, modules)
  const { stackId, tokenId } = await seedStack(t, 'seed3')
  await t.run((ctx: MutationCtx) =>
    ctx.db.patch(stackId, { autoSync: { enabled: false, frequencyHours: 24 } }),
  )

  await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 1)],
    autoSync: { enabled: true, frequencyHours: 6 },
  })

  // The web revoke stands. A machine that still carries its local flag cannot
  // turn itself back on by publishing.
  expect((await stack(t, stackId))?.autoSync).toEqual({
    enabled: false,
    frequencyHours: 24,
  })
})

test('a seeded interval is clamped into the allowed range', async () => {
  const t = convexTest(schema, modules)
  const { stackId, tokenId } = await seedStack(t, 'seed4')

  await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 1)],
    autoSync: { enabled: true, frequencyHours: 0 },
  })

  expect((await stack(t, stackId))?.autoSync).toEqual({
    enabled: true,
    frequencyHours: 1,
  })
})

// ---------------------------------------------------------------------------
// The trigger stamp (#100 decision 5): how the sync fired
// ---------------------------------------------------------------------------

test('an automatic sync stamps the stack with when it landed', async () => {
  const t = convexTest(schema, modules)
  const { stackId, tokenId } = await seedStack(t, 'trig1')

  const result = await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 1)],
    trigger: 'auto',
  })

  expect((await stack(t, stackId))?.lastAutoSyncAt).toBe(result.receivedAt)
})

test('a manual sync leaves the stamp alone, and an old CLI reads as manual', async () => {
  const t = convexTest(schema, modules)
  const { stackId, tokenId } = await seedStack(t, 'trig2')

  await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 1)],
    trigger: 'manual',
  })
  expect((await stack(t, stackId))?.lastAutoSyncAt).toBeUndefined()

  // No `trigger` at all is the 0.6.x wire, and it must not claim automation.
  await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 2)],
  })
  expect((await stack(t, stackId))?.lastAutoSyncAt).toBeUndefined()
})

test('a later manual sync does not erase the automatic stamp', async () => {
  const t = convexTest(schema, modules)
  const { stackId, tokenId } = await seedStack(t, 'trig3')

  const auto = await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 1)],
    trigger: 'auto',
  })
  await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 2)],
    trigger: 'manual',
  })

  // The switch asks "has a machine ever synced automatically", so the stamp
  // records the newest AUTOMATIC sync, not the newest sync.
  expect((await stack(t, stackId))?.lastAutoSyncAt).toBe(auto.receivedAt)
})

// ---------------------------------------------------------------------------
// The wire — the trigger a real machine sends over POST /api/cli/sync
// ---------------------------------------------------------------------------

test('the sync route carries the trigger through to the stamp', async () => {
  const t = convexTest(schema, modules)
  const { stackId, bearer } = await seedStack(t, 'wire1')

  const res = await asMachine(t, bearer).post('/api/cli/sync', {
    payloads: [payload('claude-code', 1)],
    trigger: 'auto',
  })

  expect(res.status).toBe(200)
  expect((await stack(t, stackId))?.lastAutoSyncAt).toBe(
    (await res.json()).receivedAt,
  )
})

test('a trigger the server does not know is read as manual, and the sync still lands', async () => {
  const t = convexTest(schema, modules)
  const { stackId, bearer } = await seedStack(t, 'wire2')

  const res = await asMachine(t, bearer).post('/api/cli/sync', {
    payloads: [payload('claude-code', 1)],
    trigger: 'cron',
  })

  // Losing the measurement over an unreadable telemetry field would cost the
  // owner the one thing they approved — the same rule `autoSync` already has.
  expect(res.status).toBe(200)
  expect((await stack(t, stackId))?.lastAutoSyncAt).toBeUndefined()
})

test('a revoked stack refuses an automatic publish', async () => {
  const t = convexTest(schema, modules)
  const { stackId, bearer } = await seedStack(t, 'wire3')
  await t.run((ctx: MutationCtx) =>
    ctx.db.patch(stackId, { autoSync: { enabled: false, frequencyHours: 24 } }),
  )

  const res = await asMachine(t, bearer).post('/api/cli/sync', {
    payloads: [payload('claude-code', 1)],
    trigger: 'auto',
  })

  // #103 makes the CLI exit before it gets here, so this is the second lock:
  // "off" is enforced by the server, not merely honored by the machine.
  expect(res.status).toBe(409)
  const snapshots = await t.run((ctx: MutationCtx) =>
    ctx.db.query('measuredSnapshots').collect(),
  )
  expect(snapshots).toHaveLength(0)
})

test('a manual publish still lands while auto-sync is off', async () => {
  const t = convexTest(schema, modules)
  const { stackId, bearer } = await seedStack(t, 'wire4')
  await t.run((ctx: MutationCtx) =>
    ctx.db.patch(stackId, { autoSync: { enabled: false, frequencyHours: 24 } }),
  )

  // The switch revokes automation, not the owner's own `npx ... sync`.
  const res = await asMachine(t, bearer).post('/api/cli/sync', {
    payloads: [payload('claude-code', 1)],
  })

  expect(res.status).toBe(200)
})

test('a stack with no flag accepts the automatic sync that seeds it', async () => {
  const t = convexTest(schema, modules)
  const { stackId, bearer } = await seedStack(t, 'wire5')

  const res = await asMachine(t, bearer).post('/api/cli/sync', {
    payloads: [payload('claude-code', 1)],
    autoSync: { enabled: true, frequencyHours: 24 },
    trigger: 'auto',
  })

  // Absent is not a refusal. Refusing here would deadlock the seed: the field
  // only ever gets written by a sync that is allowed to land.
  expect(res.status).toBe(200)
  expect((await stack(t, stackId))?.autoSync).toEqual({
    enabled: true,
    frequencyHours: 24,
  })
})

// ---------------------------------------------------------------------------
// Reading the flag — what gates `sync --auto` before it publishes
// ---------------------------------------------------------------------------

test('sync-config answers the bound stack flag', async () => {
  const t = convexTest(schema, modules)
  const { stackId, bearer } = await seedStack(t, 'read1')
  await t.run((ctx: MutationCtx) =>
    ctx.db.patch(stackId, { autoSync: { enabled: true, frequencyHours: 12 } }),
  )

  const res = await asMachine(t, bearer).get('/api/cli/sync-config')

  expect(await res.json()).toMatchObject({
    autoSync: { enabled: true, frequencyHours: 12 },
  })
})

test('a stack with no flag answers null, and so does a caller with no bearer', async () => {
  const t = convexTest(schema, modules)
  const { bearer } = await seedStack(t, 'read2')

  const linked = await asMachine(t, bearer).get('/api/cli/sync-config')
  // Null, never `{enabled: false}`: absent is the state the seed reads, and the
  // CLI has to tell "nobody has decided" from "the owner said no".
  expect((await linked.json()).autoSync).toBeNull()

  // Fails closed with the rest of the stack-level half: no bearer, no stack,
  // no permission to publish on a timer.
  const anonymous = await t.fetch('/api/cli/sync-config', {})
  expect((await anonymous.json()).autoSync).toBeNull()
})

// ---------------------------------------------------------------------------
// Setting the flag from a machine — the opt-in ask and `sync --auto on/off`
// ---------------------------------------------------------------------------

test('a machine turns the flag on for its bound stack', async () => {
  const t = convexTest(schema, modules)
  const { stackId, bearer } = await seedStack(t, 'set1')

  const res = await asMachine(t, bearer).post('/api/cli/auto-sync', {
    enabled: true,
    frequencyHours: 6,
  })

  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({
    autoSync: { enabled: true, frequencyHours: 6 },
    lastAutoSyncAt: null,
  })
  expect((await stack(t, stackId))?.autoSync).toEqual({
    enabled: true,
    frequencyHours: 6,
  })
})

test('turning it off keeps the interval the owner had chosen', async () => {
  const t = convexTest(schema, modules)
  const { stackId, bearer } = await seedStack(t, 'set2')
  const machine = asMachine(t, bearer)

  await machine.post('/api/cli/auto-sync', { enabled: true, frequencyHours: 6 })
  await machine.post('/api/cli/auto-sync', { enabled: false })

  // Off is a revoke, not a reset: turning it back on must not silently move a
  // machine from six hours to the default.
  expect((await stack(t, stackId))?.autoSync).toEqual({
    enabled: false,
    frequencyHours: 6,
  })
})

test('a machine with no linked stack is told to log in again', async () => {
  const t = convexTest(schema, modules)
  const { bearer } = await seedStack(t, 'set3', { linked: false })

  const res = await asMachine(t, bearer).post('/api/cli/auto-sync', {
    enabled: true,
  })

  expect(res.status).toBe(409)
})

test('a collect-only machine cannot set the flag', async () => {
  const t = convexTest(schema, modules)
  const { stackId, bearer } = await seedStack(t, 'set4', { scopes: ['collect'] })

  const res = await asMachine(t, bearer).post('/api/cli/auto-sync', {
    enabled: true,
  })

  // The permission to publish on a timer is part of syncing, so it takes the
  // `sync` scope — the same one the publish route takes.
  expect(res.status).toBe(403)
  expect((await stack(t, stackId))?.autoSync).toBeUndefined()
})

test('a request with no bearer sets nothing', async () => {
  const t = convexTest(schema, modules)
  const { stackId } = await seedStack(t, 'set5')

  const res = await t.fetch('/api/cli/auto-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: true }),
  })

  expect(res.status).toBe(401)
  expect((await stack(t, stackId))?.autoSync).toBeUndefined()
})

test('a body without a boolean is refused, and the flag stands', async () => {
  const t = convexTest(schema, modules)
  const { stackId, bearer } = await seedStack(t, 'set6')
  await t.run((ctx: MutationCtx) =>
    ctx.db.patch(stackId, { autoSync: { enabled: true, frequencyHours: 24 } }),
  )

  const res = await asMachine(t, bearer).post('/api/cli/auto-sync', {
    enabled: 'yes',
  })

  // This route CHANGES a permission, so a value the server cannot read is
  // refused outright — unlike the telemetry fields on a sync, which are
  // dropped so the measurement still lands.
  expect(res.status).toBe(400)
  expect((await stack(t, stackId))?.autoSync).toEqual({
    enabled: true,
    frequencyHours: 24,
  })
})

// ---------------------------------------------------------------------------
// The owner's seam — what the switch in the owner box calls (#104)
// ---------------------------------------------------------------------------

test('the owner sets the flag and reads back the pair the switch renders', async () => {
  const t = convexTest(schema, modules)
  const { stackId, tokenId, asCreator } = await seedStack(t, 'own1')

  expect(await asCreator.query(api.autoSync.get, { stackId })).toEqual({
    autoSync: null,
    lastAutoSyncAt: null,
  })

  await asCreator.mutation(api.autoSync.set, {
    stackId,
    enabled: true,
    frequencyHours: 12,
  })
  // On, but no machine has fired yet — the state the switch has to name.
  expect(await asCreator.query(api.autoSync.get, { stackId })).toEqual({
    autoSync: { enabled: true, frequencyHours: 12 },
    lastAutoSyncAt: null,
  })

  const auto = await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 1)],
    trigger: 'auto',
  })
  expect(await asCreator.query(api.autoSync.get, { stackId })).toEqual({
    autoSync: { enabled: true, frequencyHours: 12 },
    lastAutoSyncAt: auto.receivedAt,
  })
})

test('a revoke keeps the stamp of what already happened', async () => {
  const t = convexTest(schema, modules)
  const { stackId, tokenId, asCreator } = await seedStack(t, 'own2')
  await asCreator.mutation(api.autoSync.set, { stackId, enabled: true })
  const auto = await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 1)],
    trigger: 'auto',
  })

  await asCreator.mutation(api.autoSync.set, { stackId, enabled: false })

  expect(await asCreator.query(api.autoSync.get, { stackId })).toEqual({
    autoSync: { enabled: false, frequencyHours: 24 },
    lastAutoSyncAt: auto.receivedAt,
  })
})

test('nobody but the owner reads or writes the schedule', async () => {
  const t = convexTest(schema, modules)
  const { stackId } = await seedStack(t, 'own3')
  const stranger = t.withIdentity({ tokenIdentifier: 'convex|intruder' })

  await expect(
    stranger.mutation(api.autoSync.set, { stackId, enabled: true }),
  ).rejects.toThrow()
  // When somebody's machines run is a schedule only they have a reason to read.
  await expect(stranger.query(api.autoSync.get, { stackId })).rejects.toThrow()
  await expect(
    t.mutation(api.autoSync.set, { stackId, enabled: true }),
  ).rejects.toThrow()
})

/**
 * The done-bar of #104, end to end: a revoke made FROM THE WEB stops the next
 * `--auto` publish.
 *
 * The pieces exist separately — #102 proved the 409 against a flag patched
 * straight into the row, and the owner's setter against a query. This joins
 * them, because the switch is only a revoke if the mutation it calls is the one
 * the wire refuses on. It also checks what the machine itself is told, since
 * #103's client-side gate reads `sync-config` and not this route's status.
 */
test('a revoke from the web stops the next automatic publish', async () => {
  const t = convexTest(schema, modules)
  const { stackId, tokenId, bearer, asCreator } = await seedStack(t, 'web1')

  await asCreator.mutation(api.autoSync.set, { stackId, enabled: true })
  const landed = await t.mutation(internal.measured.publishForToken, {
    tokenId,
    payloads: [payload('claude-code', 1)],
    trigger: 'auto',
  })

  // The owner flips the switch off in the browser.
  await asCreator.mutation(api.autoSync.set, { stackId, enabled: false })

  // A machine whose hook is still installed fires anyway (#103: stale hooks).
  const res = await asMachine(t, bearer).post('/api/cli/sync', {
    payloads: [payload('claude-code', 2)],
    trigger: 'auto',
  })
  expect(res.status).toBe(409)

  // Nothing new was stored, and the reading from before the revoke is intact:
  // a revoke takes the permission, never the record.
  const snapshots = await t.run((ctx: MutationCtx) =>
    ctx.db.query('measuredSnapshots').collect(),
  )
  expect(snapshots).toHaveLength(1)
  expect(await asCreator.query(api.autoSync.get, { stackId })).toEqual({
    autoSync: { enabled: false, frequencyHours: 24 },
    lastAutoSyncAt: landed.receivedAt,
  })

  // And the machine's own gate sees the off, so #103 exits before it publishes.
  const config = await asMachine(t, bearer).get('/api/cli/sync-config')
  expect((await config.json()).autoSync).toEqual({
    enabled: false,
    frequencyHours: 24,
  })
})
