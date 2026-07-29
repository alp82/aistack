/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { internal } from '../_generated/api'
import schema from '../schema'
import { sha256Hex } from '../httpCli'

/**
 * Phase B of the hash-at-rest migration — wayfinder #49, plus the clear pass
 * #52 needs before its narrow (map #29).
 *
 * The test that matters most is the PRESENCE one. This repo has already been
 * bitten twice by a dirty-row check written as a truthiness test: an
 * empty-string field passes `!row.field`, survives the backfill, and then blocks
 * the narrow push with an ArgumentValidationError that surfaces in the browser
 * rather than at deploy time.
 *
 * THIS FILE ONLY COMPILES BEFORE THE NARROW. It seeds `cliTokens.token`, which
 * the narrow deletes from the schema — so it lives in the pre-narrow revision
 * and goes with the column. That is not an oversight; it is the same reason the
 * two cannot be one deploy.
 */

// Vite keys same-directory files as './x.ts' while convex-test derives its
// module root ('../') from the _generated path — remap the sibling keys so
// 'migrations/20260729_cli_token_hash' resolves. It is a convex-test quirk,
// not a repo one.
const modules = Object.fromEntries(
  Object.entries(import.meta.glob('../**/*.{js,ts}')).map(([key, loader]) => [
    key.replace(/^\.\//, '../migrations/'),
    loader,
  ]),
)

const DAY = 24 * 60 * 60 * 1000
const MIGRATION = internal.migrations['20260729_cli_token_hash']

type Ctx = Awaited<ReturnType<typeof convexTest>>

async function seedToken(t: Ctx, token: string, tokenHash?: string) {
  return await t.run(async (ctx) =>
    ctx.db.insert('cliTokens', {
      token,
      tokenHash,
      scopes: ['collect', 'sync'],
      userId: 'user_owner',
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      expiresAt: Date.now() + 90 * DAY,
    }),
  )
}

describe('backfill', () => {
  test('counts a row as hashed by PRESENCE, not truthiness', async () => {
    const t = convexTest(schema, modules)
    await seedToken(t, 'tok_none')
    await seedToken(t, 'tok_empty', '')

    const report = await t.query(MIGRATION.report, {})
    // The empty digest counts as HASHED. It is a real stored value, and a
    // truthiness check would silently re-hash it forever.
    expect(report).toEqual({ total: 2, hashed: 1, unhashed: 1 })
  })

  test('derives the digest from the stored plaintext', async () => {
    const t = convexTest(schema, modules)
    const id = await seedToken(t, 'tok_plaintext')

    const result = await t.action(MIGRATION.backfill, {})
    expect(result.patched).toBe(1)

    const row = await t.run(async (ctx) => ctx.db.get(id))
    expect(row?.tokenHash).toBe(await sha256Hex('tok_plaintext'))
    // The plaintext is still there. The narrow drops it — and cannot run
    // before this backfill, because the digest is derived FROM it.
    expect(row?.token).toBe('tok_plaintext')
  })

  test('the backfilled digest is what the read path looks up', async () => {
    // The whole migration is pointless if the two derivations disagree, so this
    // asserts the join rather than the value.
    const t = convexTest(schema, modules)
    const id = await seedToken(t, 'tok_join')
    await t.action(MIGRATION.backfill, {})

    const found = await t.query(internal.cliTokens.getByTokenHash, {
      tokenHash: await sha256Hex('tok_join'),
    })
    expect(found?._id).toBe(id)
  })

  test('leaves an already-hashed row alone and is idempotent', async () => {
    const t = convexTest(schema, modules)
    const id = await seedToken(t, 'tok_done', 'already')

    const first = await t.action(MIGRATION.backfill, {})
    expect(first.patched).toBe(0)

    const row = await t.run(async (ctx) => ctx.db.get(id))
    expect(row?.tokenHash).toBe('already')
  })

  test('an empty table is a no-op, not a loop', async () => {
    const t = convexTest(schema, modules)
    const result = await t.action(MIGRATION.backfill, {})
    expect(result).toEqual({ patched: 0, rounds: 0 })
  })
})

/**
 * The step between the backfill and the narrow (#52).
 *
 * Convex validates every existing document against the new schema on push, and
 * a document carrying a field the schema no longer declares FAILS that check —
 * so dropping `token` is refused while any row still holds one.
 */
describe('clearPlaintext', () => {
  test('blanks the column once every row is hashed', async () => {
    const t = convexTest(schema, modules)
    const id = await seedToken(t, 'tok_a')
    await t.action(MIGRATION.backfill, {})

    const result = await t.mutation(MIGRATION.clearPlaintext, {})
    expect(result).toEqual({ cleared: 1, remaining: 0, unhashed: 0 })

    const row = await t.run(async (ctx) => ctx.db.get(id))
    expect(row?.token).toBeUndefined()
    // The digest survives, so the machine keeps working. That is the whole
    // promise: nobody has to log in again.
    expect(row?.tokenHash).toBe(await sha256Hex('tok_a'))
  })

  test('REFUSES while any row is still unhashed', async () => {
    // Clearing an unhashed row would leave a token that can never authenticate
    // and can never be repaired, because the digest can only come from the
    // plaintext being deleted.
    const t = convexTest(schema, modules)
    const id = await seedToken(t, 'tok_unhashed')

    const result = await t.mutation(MIGRATION.clearPlaintext, {})
    expect(result.cleared).toBe(0)
    expect(result.unhashed).toBe(1)

    const row = await t.run(async (ctx) => ctx.db.get(id))
    expect(row?.token).toBe('tok_unhashed')
  })

  test('a second run finds nothing to clear', async () => {
    const t = convexTest(schema, modules)
    await seedToken(t, 'tok_b')
    await t.action(MIGRATION.backfill, {})
    await t.mutation(MIGRATION.clearPlaintext, {})

    const second = await t.mutation(MIGRATION.clearPlaintext, {})
    expect(second).toEqual({ cleared: 0, remaining: 0, unhashed: 0 })
  })
})
