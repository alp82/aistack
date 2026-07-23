/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { internal } from './_generated/api'
import type { StorageActionWriter } from 'convex/server'
import type { MutationCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

const modules = import.meta.glob('./**/*.{js,ts}')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function seedTool(
  t: ReturnType<typeof convexTest>,
  opts: { slug: string; iconStorageId?: Id<'_storage'> },
): Promise<Id<'tools'>> {
  return await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('tools', {
      name: `Tool ${opts.slug}`,
      slug: opts.slug,
      shortId: `TL${opts.slug.toUpperCase().replace(/-/g, '').slice(0, 6)}`,
      categories: ['ide'],
      tiers: [],
      reviewStatus: 'approved',
      iconStorageId: opts.iconStorageId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  )
}

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
    avatarStorageId?: Id<'_storage'>
  },
): Promise<Id<'stacks'>> {
  const now = Date.now()
  return await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('stacks', {
      name: `Stack ${opts.slug}`,
      slug: opts.slug,
      shortId: `SK${opts.slug.toUpperCase().replace(/-/g, '').slice(0, 6)}`,
      creatorId: opts.creatorId,
      oneLiner: 'test',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      avatarStorageId: opts.avatarStorageId,
      createdAt: now,
      updatedAt: now,
    }),
  )
}

async function seedBlob(t: ReturnType<typeof convexTest>): Promise<Id<'_storage'>> {
  return await t.run(async (ctx: MutationCtx) =>
    (ctx.storage as StorageActionWriter).store(
      new Blob(['icon-bytes'], { type: 'image/png' }),
    ),
  )
}

// ---------------------------------------------------------------------------
// TC-GC-01: _collectReferencedStorageIds includes stacks.avatarStorageId (RED)
// ---------------------------------------------------------------------------

test('TC-GC-01: _collectReferencedStorageIds includes a stacks.avatarStorageId', async () => {
  const t = convexTest(schema, modules)
  const storageId = await seedBlob(t)
  const creatorId = await seedCreator(t, 'gc-creator-01')
  await seedStack(t, { creatorId, slug: 'gc-stack-01', avatarStorageId: storageId })

  // _collectReferencedStorageIds is an internalQuery — call via t.run using
  // ctx.runQuery on the internal reference (convex-test exposes internal via t.run)
  const referenced: string[] = await t.run(async (ctx) =>
    ctx.runQuery(internal.iconStorage._collectReferencedStorageIds, {}),
  )

  expect(referenced).toContain(storageId)
})

// ---------------------------------------------------------------------------
// TC-GC-02: excludes stacks without avatarStorageId; includes tool iconStorageIds; no nulls (RED)
// ---------------------------------------------------------------------------

test('TC-GC-02: excludes stacks without avatarStorageId; includes tool iconStorageIds; no null entries', async () => {
  const t = convexTest(schema, modules)
  const toolStorageId = await seedBlob(t)
  const creatorId = await seedCreator(t, 'gc-creator-02')

  // Stack WITHOUT avatarStorageId
  await seedStack(t, { creatorId, slug: 'gc-stack-02-no-avatar' })
  // Tool WITH iconStorageId
  await seedTool(t, { slug: 'gc-tool-02', iconStorageId: toolStorageId })

  const referenced: string[] = await t.run(async (ctx) =>
    ctx.runQuery(internal.iconStorage._collectReferencedStorageIds, {}),
  )

  // Tool storage id must be present
  expect(referenced).toContain(toolStorageId)
  // No null/undefined entries
  expect(referenced.every((id) => id != null && id !== '')).toBe(true)
})

// ---------------------------------------------------------------------------
// TC-GC-03: MANUAL — gcOrphans does NOT delete a referenced avatarStorageId
// _creationTime cannot be backdated in convex-test (system-assigned), so the
// "older than 24h" cutoff cannot be triggered deterministically in unit tests.
// Verify manually: seed a stack with avatarStorageId, set clock past cutoff,
// run gcOrphans, assert blob still exists.
// ---------------------------------------------------------------------------

test.skip('TC-GC-03 (MANUAL): gcOrphans does NOT delete a referenced avatarStorageId older than 24h cutoff', () => {
  // Cannot backdate _creationTime in convex-test — verify manually.
})

// ---------------------------------------------------------------------------
// TC-GC-04: MANUAL — gcOrphans DOES delete an unreferenced blob older than cutoff
// Same _creationTime limitation as TC-GC-03.
// ---------------------------------------------------------------------------

test.skip('TC-GC-04 (MANUAL): gcOrphans DOES delete an unreferenced blob older than 24h cutoff', () => {
  // Cannot backdate _creationTime in convex-test — verify manually.
})

// ---------------------------------------------------------------------------
// TC-GC-05: gcOrphans skips an unreferenced blob newer than cutoff (deleted===0)
// Note: convex-test storage blobs get _creationTime=now, which is always newer
// than cutoff (now - 24h), so this IS unit-testable.
// ---------------------------------------------------------------------------

test('TC-GC-05: gcOrphans skips an unreferenced blob newer than cutoff (deleted===0)', async () => {
  const t = convexTest(schema, modules)
  // Seed a blob but reference nothing — it stays unreferenced
  await seedBlob(t)

  const result = await t.action(internal.iconStorage.gcOrphans, {})

  // Blob is newer than cutoff → must NOT be deleted
  expect(result.deleted).toBe(0)
  expect(result.scanned).toBeGreaterThanOrEqual(1)
})

// ---------------------------------------------------------------------------
// TC-GC-06: _collectReferencedStorageIds includes creators.avatarStorageId
// (plan.md Phase A — profile avatars must survive GC) (RED)
// ---------------------------------------------------------------------------

test('TC-GC-06: _collectReferencedStorageIds includes a creators.avatarStorageId', async () => {
  const t = convexTest(schema, modules)
  const storageId = await seedBlob(t)
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: 'GC Creator',
      slug: 'gc-creator-06',
      userId: 'gc-creator-06',
      verified: false,
      personalPages: [],
      projectPages: [],
      avatarStorageId: storageId,
      createdAt: Date.now(),
    }),
  )

  const referenced: string[] = await t.run(async (ctx) =>
    ctx.runQuery(internal.iconStorage._collectReferencedStorageIds, {}),
  )

  expect(referenced).toContain(storageId)
})
