/// <reference types="vite/client" />
/**
 * Tests for convex/migrations/profileDecoupling.ts (plan.md Phase B).
 * RED until the migration module + `applyForCreator` internalMutation exist.
 *
 * VALIDATION: test — migration applyForCreator: most-recent stack avatar
 * wins, personalPageUrls merge deduped, consumed fields cleared, idempotent
 * rerun skips; failed-fetch rows keep stackImageUrl and a rerun completes them.
 */
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from '../schema'
import { internal } from '../_generated/api'
import type { StorageActionWriter } from 'convex/server'
import type { MutationCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'

// Vite keys same-directory files as './x.ts' while convex-test derives its
// module root ('../') from the _generated path — remap the sibling keys so
// 'migrations/profileDecoupling' resolves.
const modules = Object.fromEntries(
  Object.entries(import.meta.glob('../**/*.{js,ts}')).map(([key, loader]) => [
    key.replace(/^\.\//, '../migrations/'),
    loader,
  ]),
)

async function seedCreator(
  t: ReturnType<typeof convexTest>,
  slug: string,
): Promise<Id<'creators'>> {
  return await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: `Creator ${slug}`,
      slug,
      userId: slug,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )
}

async function seedStack(
  t: ReturnType<typeof convexTest>,
  opts: {
    creatorId: Id<'creators'>
    slug: string
    updatedAt: number
    avatarStorageId?: Id<'_storage'>
    stackImageUrl?: string
    personalPageUrl?: string
  },
): Promise<Id<'stacks'>> {
  return await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('stacks', {
      name: `Stack ${opts.slug}`,
      slug: opts.slug,
      shortId: `SK${opts.slug.toUpperCase().replace(/-/g, '').slice(0, 6)}`,
      creatorId: opts.creatorId,
      oneLiner: 'test',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: true,
      avatarStorageId: opts.avatarStorageId,
      stackImageUrl: opts.stackImageUrl,
      personalPageUrl: opts.personalPageUrl,
      createdAt: opts.updatedAt,
      updatedAt: opts.updatedAt,
    }),
  )
}

async function seedBlob(t: ReturnType<typeof convexTest>): Promise<Id<'_storage'>> {
  return await t.run(async (ctx: MutationCtx) =>
    (ctx.storage as StorageActionWriter).store(
      new Blob(['avatar-bytes'], { type: 'image/webp' }),
    ),
  )
}

// ---------------------------------------------------------------------------
// Most-recent-wins
// ---------------------------------------------------------------------------

test('TC-MIG-01: applyForCreator moves the most-recently-updated stack avatar onto the creator', async () => {
  const t = convexTest(schema, modules)
  const creatorId = await seedCreator(t, 'mig01')
  const olderAvatar = await seedBlob(t)
  const newerAvatar = await seedBlob(t)
  await seedStack(t, { creatorId, slug: 'mig01-old', updatedAt: 1000, avatarStorageId: olderAvatar })
  await seedStack(t, { creatorId, slug: 'mig01-new', updatedAt: 5000, avatarStorageId: newerAvatar })

  await t.run(async (ctx) =>
    ctx.runMutation(internal.migrations.profileDecoupling.applyForCreator, { creatorId }),
  )

  const creator = await t.run(async (ctx: MutationCtx) => ctx.db.get(creatorId))
  expect(creator?.avatarStorageId).toBe(newerAvatar)
})

// ---------------------------------------------------------------------------
// personalPages merge/dedupe
// ---------------------------------------------------------------------------

test('TC-MIG-02: applyForCreator merges personalPageUrls from all stacks, deduped by URL', async () => {
  const t = convexTest(schema, modules)
  const creatorId = await seedCreator(t, 'mig02')
  await seedStack(t, {
    creatorId,
    slug: 'mig02-a',
    updatedAt: 1000,
    personalPageUrl: 'https://example.com',
  })
  await seedStack(t, {
    creatorId,
    slug: 'mig02-b',
    updatedAt: 2000,
    personalPageUrl: 'https://example.com', // duplicate
  })
  await seedStack(t, {
    creatorId,
    slug: 'mig02-c',
    updatedAt: 3000,
    personalPageUrl: 'https://other.com',
  })

  await t.run(async (ctx) =>
    ctx.runMutation(internal.migrations.profileDecoupling.applyForCreator, { creatorId }),
  )

  const creator = await t.run(async (ctx: MutationCtx) => ctx.db.get(creatorId))
  const urls = (creator?.personalPages ?? []).map((p) => p.url).sort()
  expect(urls).toEqual(['https://example.com', 'https://other.com'])
})

// ---------------------------------------------------------------------------
// Consumed stack fields cleared
// ---------------------------------------------------------------------------

test('TC-MIG-03: applyForCreator clears avatarStorageId and personalPageUrl on the migrated stacks', async () => {
  const t = convexTest(schema, modules)
  const creatorId = await seedCreator(t, 'mig03')
  const avatarId = await seedBlob(t)
  const stackId = await seedStack(t, {
    creatorId,
    slug: 'mig03-stack',
    updatedAt: 1000,
    avatarStorageId: avatarId,
    personalPageUrl: 'https://example.com',
  })

  await t.run(async (ctx) =>
    ctx.runMutation(internal.migrations.profileDecoupling.applyForCreator, { creatorId }),
  )

  const stack = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  expect(stack?.avatarStorageId).toBeUndefined()
  expect(stack?.personalPageUrl).toBeUndefined()
})

// ---------------------------------------------------------------------------
// Idempotent rerun (skip-if-set)
// ---------------------------------------------------------------------------

test('TC-MIG-04: applyForCreator is idempotent — rerunning after the creator already has an avatar does not change it', async () => {
  const t = convexTest(schema, modules)
  const creatorId = await seedCreator(t, 'mig04')
  const preExistingAvatar = await seedBlob(t)
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.patch(creatorId, { avatarStorageId: preExistingAvatar }),
  )
  const stackAvatar = await seedBlob(t)
  await seedStack(t, {
    creatorId,
    slug: 'mig04-stack',
    updatedAt: 1000,
    avatarStorageId: stackAvatar,
  })

  await t.run(async (ctx) =>
    ctx.runMutation(internal.migrations.profileDecoupling.applyForCreator, { creatorId }),
  )
  // Rerun — should be a pure no-op re: the avatar.
  await t.run(async (ctx) =>
    ctx.runMutation(internal.migrations.profileDecoupling.applyForCreator, { creatorId }),
  )

  const creator = await t.run(async (ctx: MutationCtx) => ctx.db.get(creatorId))
  expect(creator?.avatarStorageId).toBe(preExistingAvatar)
})

// ---------------------------------------------------------------------------
// Failed-fetch retry path (corrections.md #1 constraint: the row must stay
// retryable, not vanish — this test asserts the retry contract itself, not
// the give-up escape hatch, which lives in the node script)
// ---------------------------------------------------------------------------

test('TC-MIG-05: a creator with no creator avatar and no storage-backed stack avatar keeps stackImageUrl dirty (no uploadedStorageId supplied)', async () => {
  const t = convexTest(schema, modules)
  const creatorId = await seedCreator(t, 'mig05')
  await seedStack(t, {
    creatorId,
    slug: 'mig05-stack',
    updatedAt: 1000,
    stackImageUrl: 'https://dead-host.example/avatar.png',
  })

  // Simulates the node script's failed-fetch path: no uploadedStorageId.
  await t.run(async (ctx) =>
    ctx.runMutation(internal.migrations.profileDecoupling.applyForCreator, { creatorId }),
  )

  const creator = await t.run(async (ctx: MutationCtx) => ctx.db.get(creatorId))
  expect(creator?.avatarStorageId).toBeUndefined()

  const stacks = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('stacks')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .collect(),
  )
  // Still dirty — stackImageUrl must survive an unfinished migration so a
  // rerun can retry it.
  expect(stacks[0].stackImageUrl).toBe('https://dead-host.example/avatar.png')
})

test('TC-MIG-06: rerunning applyForCreator with uploadedStorageId completes a previously-failed row and clears stackImageUrl', async () => {
  const t = convexTest(schema, modules)
  const creatorId = await seedCreator(t, 'mig06')
  await seedStack(t, {
    creatorId,
    slug: 'mig06-stack',
    updatedAt: 1000,
    stackImageUrl: 'https://dead-host.example/avatar.png',
  })

  // First run: fetch "failed" — no uploadedStorageId.
  await t.run(async (ctx) =>
    ctx.runMutation(internal.migrations.profileDecoupling.applyForCreator, { creatorId }),
  )

  // Second run: script retried, fetch succeeded this time.
  const uploadedStorageId = await seedBlob(t)
  await t.run(async (ctx) =>
    ctx.runMutation(internal.migrations.profileDecoupling.applyForCreator, {
      creatorId,
      uploadedStorageId,
    }),
  )

  const creator = await t.run(async (ctx: MutationCtx) => ctx.db.get(creatorId))
  expect(creator?.avatarStorageId).toBe(uploadedStorageId)

  const stacks = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('stacks')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .collect(),
  )
  expect(stacks[0].stackImageUrl).toBeUndefined()
})

// ---------------------------------------------------------------------------
// Zero-stack creator no-op
// ---------------------------------------------------------------------------

test('TC-MIG-07: applyForCreator is a no-op for a creator with zero stacks', async () => {
  const t = convexTest(schema, modules)
  const creatorId = await seedCreator(t, 'mig07')

  await expect(
    t.run(async (ctx) =>
      ctx.runMutation(internal.migrations.profileDecoupling.applyForCreator, { creatorId }),
    ),
  ).resolves.not.toThrow()

  const creator = await t.run(async (ctx: MutationCtx) => ctx.db.get(creatorId))
  expect(creator?.avatarStorageId).toBeUndefined()
  expect(creator?.personalPages).toEqual([])
})

// ---------------------------------------------------------------------------
// listCreatorsToMigrate
// ---------------------------------------------------------------------------

test('TC-MIG-08: listCreatorsToMigrate surfaces the winning stack avatar id and fallback stackImageUrl per creator', async () => {
  const t = convexTest(schema, modules)
  const creatorId = await seedCreator(t, 'mig08')
  const avatarId = await seedBlob(t)
  await seedStack(t, { creatorId, slug: 'mig08-a', updatedAt: 1000, avatarStorageId: avatarId })
  await seedStack(t, {
    creatorId,
    slug: 'mig08-b',
    updatedAt: 2000,
    stackImageUrl: 'https://example.com/x.png',
  })

  const rows = await t.run(async (ctx) =>
    ctx.runQuery(internal.migrations.profileDecoupling.listCreatorsToMigrate, {}),
  )

  const row = rows.find((r: { creatorId: Id<'creators'> }) => r.creatorId === creatorId)
  expect(row).toBeDefined()
  expect(row?.winningStackAvatarId).toBe(avatarId)
})
