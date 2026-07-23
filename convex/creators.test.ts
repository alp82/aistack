/// <reference types="vite/client" />
/**
 * Tests for the profile-first decoupling additions to convex/creators.ts
 * (plan.md Phase A). All of these functions are new — this file is RED
 * until updateProfile is extended and getByHandle/getOwnProfileView/
 * checkHandle/landStagedAvatar are added.
 *
 * VALIDATION: test entries covered (plan.md Acceptance):
 *  - updateProfile: handle uniqueness (excl self) + reserved words only on
 *    change; unchanged-handle bypass for a grandfathered short slug;
 *    personalPages https-only rejection; updates name/bio/links/avatarStorageId
 *  - getByHandle: auth-independent, published-only, most-recent-first,
 *    creator-first avatar resolution, null for unknown handle
 *  - getOwnProfileView: owner sees drafts, non-owner/guest gets null
 *  - landStagedAvatar: skip-if-set
 *  - checkHandle: self-exclusion
 */
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { api } from './_generated/api'
import type { StorageActionWriter } from 'convex/server'
import type { MutationCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

const modules = import.meta.glob('./**/*.{js,ts}')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function seedCreator(
  t: ReturnType<typeof convexTest>,
  opts: { userId: string; slug: string; name?: string },
): Promise<{ creatorId: Id<'creators'>; asCreator: ReturnType<typeof t.withIdentity> }> {
  const creatorId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: opts.name ?? `Creator ${opts.userId}`,
      slug: opts.slug,
      userId: opts.userId,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )
  const asCreator = t.withIdentity({ tokenIdentifier: `convex|${opts.userId}` })
  return { creatorId, asCreator }
}

async function seedStack(
  t: ReturnType<typeof convexTest>,
  opts: {
    creatorId: Id<'creators'>
    slug: string
    published?: boolean
    updatedAt?: number
  },
): Promise<Id<'stacks'>> {
  const now = opts.updatedAt ?? Date.now()
  return await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('stacks', {
      name: `Stack ${opts.slug}`,
      slug: opts.slug,
      shortId: `SK${opts.slug.toUpperCase().replace(/-/g, '').slice(0, 6)}`,
      creatorId: opts.creatorId,
      oneLiner: 'test stack',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: opts.published ?? true,
      createdAt: now,
      updatedAt: now,
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
// updateProfile
// ---------------------------------------------------------------------------

test('TC-CP-01: updateProfile updates name/bio/xHandle/personalPages/avatarStorageId', async () => {
  const t = convexTest(schema, modules)
  const { asCreator, creatorId } = await seedCreator(t, {
    userId: 'user-cp01',
    slug: 'creator-cp01',
  })
  const storageId = await seedBlob(t)

  await asCreator.mutation(api.creators.updateProfile, {
    name: 'New Name',
    bio: 'A short bio',
    xHandle: 'newhandle',
    personalPages: [{ name: 'Site', url: 'https://example.com' }],
    avatarStorageId: storageId,
  })

  const creator = await t.run(async (ctx: MutationCtx) => ctx.db.get(creatorId))
  expect(creator?.name).toBe('New Name')
  expect(creator?.bio).toBe('A short bio')
  expect(creator?.xHandle).toBe('newhandle')
  expect(creator?.personalPages).toEqual([{ name: 'Site', url: 'https://example.com' }])
  expect(creator?.avatarStorageId).toBe(storageId)
})

test('TC-CP-02: updateProfile rejects a taken handle', async () => {
  const t = convexTest(schema, modules)
  await seedCreator(t, { userId: 'user-cp02-a', slug: 'taken-handle' })
  const { asCreator } = await seedCreator(t, {
    userId: 'user-cp02-b',
    slug: 'creator-cp02-b',
  })

  await expect(
    asCreator.mutation(api.creators.updateProfile, { handle: 'taken-handle' }),
  ).rejects.toThrow(/already taken/i)
})

test('TC-CP-03: updateProfile rejects a reserved-word handle (via real validateHandle, not just arg-shape validation)', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, {
    userId: 'user-cp03',
    slug: 'creator-cp03',
  })

  let error: unknown
  try {
    await asCreator.mutation(api.creators.updateProfile, { handle: 'admin' })
  } catch (e) {
    error = e
  }
  expect(error).toBeDefined()
  // Must be rejected by validateHandle/uniqueness logic, not merely because
  // `handle` isn't yet a recognized arg on the current mutation.
  expect(String(error)).not.toMatch(/unexpected field/i)
})

test('TC-CP-04: updateProfile rejects a badly formatted handle (via real validateHandle, not just arg-shape validation)', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, {
    userId: 'user-cp04',
    slug: 'creator-cp04',
  })

  let error: unknown
  try {
    await asCreator.mutation(api.creators.updateProfile, { handle: 'Not Valid!' })
  } catch (e) {
    error = e
  }
  expect(error).toBeDefined()
  expect(String(error)).not.toMatch(/unexpected field/i)
})

test('TC-CP-05: updateProfile accepts submitting your own current handle unchanged (grandfathered short slug)', async () => {
  const t = convexTest(schema, modules)
  const { asCreator, creatorId } = await seedCreator(t, {
    userId: 'user-cp05',
    slug: 'ab', // 2-char legacy slug, shorter than the 3-char format minimum
  })

  await asCreator.mutation(api.creators.updateProfile, {
    handle: 'ab',
    bio: 'Unrelated edit while keeping the grandfathered handle',
  })

  const creator = await t.run(async (ctx: MutationCtx) => ctx.db.get(creatorId))
  expect(creator?.slug).toBe('ab')
  expect(creator?.bio).toBe('Unrelated edit while keeping the grandfathered handle')
})

test('TC-CP-06: updateProfile allows changing to a new valid, available handle', async () => {
  const t = convexTest(schema, modules)
  const { asCreator, creatorId } = await seedCreator(t, {
    userId: 'user-cp06',
    slug: 'creator-cp06-old',
  })

  await asCreator.mutation(api.creators.updateProfile, { handle: 'creator-cp06-new' })

  const creator = await t.run(async (ctx: MutationCtx) => ctx.db.get(creatorId))
  expect(creator?.slug).toBe('creator-cp06-new')
})

test('TC-CP-07: updateProfile rejects a non-https personalPages URL (javascript:), via assertValidPersonalPageUrl not just arg-shape validation', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, {
    userId: 'user-cp07',
    slug: 'creator-cp07',
  })

  let error: unknown
  try {
    await asCreator.mutation(api.creators.updateProfile, {
      personalPages: [{ name: 'evil', url: 'javascript:alert(1)' }],
    })
  } catch (e) {
    error = e
  }
  expect(error).toBeDefined()
  expect(String(error)).not.toMatch(/unexpected field/i)
})

test('TC-CP-08: updateProfile rejects a non-https personalPages URL (plain http:), via assertValidPersonalPageUrl not just arg-shape validation', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, {
    userId: 'user-cp08',
    slug: 'creator-cp08',
  })

  let error: unknown
  try {
    await asCreator.mutation(api.creators.updateProfile, {
      personalPages: [{ name: 'insecure', url: 'http://example.com' }],
    })
  } catch (e) {
    error = e
  }
  expect(error).toBeDefined()
  expect(String(error)).not.toMatch(/unexpected field/i)
})

test('TC-CP-09: updateProfile rejects a data: personalPages URL, via assertValidPersonalPageUrl not just arg-shape validation', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, {
    userId: 'user-cp09',
    slug: 'creator-cp09',
  })

  let error: unknown
  try {
    await asCreator.mutation(api.creators.updateProfile, {
      personalPages: [{ name: 'data', url: 'data:text/html,hi' }],
    })
  } catch (e) {
    error = e
  }
  expect(error).toBeDefined()
  expect(String(error)).not.toMatch(/unexpected field/i)
})

// ---------------------------------------------------------------------------
// getByHandle
// ---------------------------------------------------------------------------

test('TC-GH-01: getByHandle returns null for an unknown handle (no auth required)', async () => {
  const t = convexTest(schema, modules)
  const result = await t.query(api.creators.getByHandle, { handle: 'nobody-here' })
  expect(result).toBeNull()
})

test('TC-GH-02: getByHandle returns published stacks only, most-recent first', async () => {
  const t = convexTest(schema, modules)
  const { creatorId } = await seedCreator(t, {
    userId: 'user-gh02',
    slug: 'creator-gh02',
  })
  await seedStack(t, {
    creatorId,
    slug: 'gh02-old',
    published: true,
    updatedAt: 1000,
  })
  await seedStack(t, {
    creatorId,
    slug: 'gh02-new',
    published: true,
    updatedAt: 5000,
  })
  await seedStack(t, {
    creatorId,
    slug: 'gh02-draft',
    published: false,
    updatedAt: 9000,
  })

  const result = await t.query(api.creators.getByHandle, { handle: 'creator-gh02' })

  expect(result).not.toBeNull()
  expect(result?.stacks).toHaveLength(2)
  expect(result?.stacks[0].name).toBe('Stack gh02-new')
  expect(result?.stacks[1].name).toBe('Stack gh02-old')
  expect(result?.stacks.some((s) => s.name === 'Stack gh02-draft')).toBe(false)
})

test('TC-GH-03: getByHandle resolves the creator avatarStorageId to a storage URL', async () => {
  const t = convexTest(schema, modules)
  const creatorAvatarId = await seedBlob(t)
  const { creatorId } = await seedCreator(t, {
    userId: 'user-gh03',
    slug: 'creator-gh03',
  })
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.patch(creatorId, { avatarStorageId: creatorAvatarId }),
  )
  await seedStack(t, {
    creatorId,
    slug: 'gh03-stack',
    published: true,
  })

  const result = await t.query(api.creators.getByHandle, { handle: 'creator-gh03' })

  const expectedUrl = await t.run(async (ctx: MutationCtx) =>
    ctx.storage.getUrl(creatorAvatarId),
  )
  expect(result?.profile.avatarUrl).toBe(expectedUrl)
})

test('TC-GH-04: getByHandle exposes the handle as profile.handle', async () => {
  const t = convexTest(schema, modules)
  await seedCreator(t, { userId: 'user-gh04', slug: 'creator-gh04' })

  const result = await t.query(api.creators.getByHandle, { handle: 'creator-gh04' })
  expect(result?.profile.handle).toBe('creator-gh04')
})

// ---------------------------------------------------------------------------
// getOwnProfileView
// ---------------------------------------------------------------------------

test('TC-OP-01: getOwnProfileView returns isOwner+drafts for the authenticated owner', async () => {
  const t = convexTest(schema, modules)
  const { asCreator, creatorId } = await seedCreator(t, {
    userId: 'user-op01',
    slug: 'creator-op01',
  })
  await seedStack(t, { creatorId, slug: 'op01-draft', published: false })

  const result = await asCreator.query(api.creators.getOwnProfileView, {
    handle: 'creator-op01',
  })

  expect(result).not.toBeNull()
  expect(result?.isOwner).toBe(true)
  expect(result?.draftStacks).toHaveLength(1)
})

test('TC-OP-02: getOwnProfileView returns null for a different authenticated creator', async () => {
  const t = convexTest(schema, modules)
  await seedCreator(t, { userId: 'user-op02-a', slug: 'creator-op02-a' })
  const { asCreator: otherCreator } = await seedCreator(t, {
    userId: 'user-op02-b',
    slug: 'creator-op02-b',
  })

  const result = await otherCreator.query(api.creators.getOwnProfileView, {
    handle: 'creator-op02-a',
  })

  expect(result).toBeNull()
})

test('TC-OP-03: getOwnProfileView returns null for an unauthenticated (guest) caller', async () => {
  const t = convexTest(schema, modules)
  await seedCreator(t, { userId: 'user-op03', slug: 'creator-op03' })

  const result = await t.query(api.creators.getOwnProfileView, {
    handle: 'creator-op03',
  })

  expect(result).toBeNull()
})

// ---------------------------------------------------------------------------
// landStagedAvatar
// ---------------------------------------------------------------------------

test('TC-LS-01: landStagedAvatar sets the avatar when unset', async () => {
  const t = convexTest(schema, modules)
  const { asCreator, creatorId } = await seedCreator(t, {
    userId: 'user-ls01',
    slug: 'creator-ls01',
  })
  const storageId = await seedBlob(t)

  await asCreator.mutation(api.creators.landStagedAvatar, { storageId })

  const creator = await t.run(async (ctx: MutationCtx) => ctx.db.get(creatorId))
  expect(creator?.avatarStorageId).toBe(storageId)
})

test('TC-LS-02: landStagedAvatar does not clobber an existing avatar (skip-if-set)', async () => {
  const t = convexTest(schema, modules)
  const existingId = await seedBlob(t)
  const { asCreator, creatorId } = await seedCreator(t, {
    userId: 'user-ls02',
    slug: 'creator-ls02',
  })
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.patch(creatorId, { avatarStorageId: existingId }),
  )
  const newId = await seedBlob(t)

  await asCreator.mutation(api.creators.landStagedAvatar, { storageId: newId })

  const creator = await t.run(async (ctx: MutationCtx) => ctx.db.get(creatorId))
  expect(creator?.avatarStorageId).toBe(existingId)
})

// ---------------------------------------------------------------------------
// checkHandle
// ---------------------------------------------------------------------------

test('TC-CH-01: checkHandle reports an available handle as available', async () => {
  const t = convexTest(schema, modules)
  const result = await t.query(api.creators.checkHandle, { handle: 'brand-new-handle' })
  expect(result.available).toBe(true)
})

test('TC-CH-02: checkHandle reports a taken handle as unavailable', async () => {
  const t = convexTest(schema, modules)
  await seedCreator(t, { userId: 'user-ch02', slug: 'ch02-taken' })

  const result = await t.query(api.creators.checkHandle, { handle: 'ch02-taken' })
  expect(result.available).toBe(false)
})

test('TC-CH-03: checkHandle reports a reserved word as unavailable', async () => {
  const t = convexTest(schema, modules)
  const result = await t.query(api.creators.checkHandle, { handle: 'admin' })
  expect(result.available).toBe(false)
})

test("TC-CH-04: checkHandle excludes the caller's own current handle (always reads available)", async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedCreator(t, {
    userId: 'user-ch04',
    slug: 'ch04-own-handle',
  })

  const result = await asCreator.query(api.creators.checkHandle, {
    handle: 'ch04-own-handle',
  })
  expect(result.available).toBe(true)
})
