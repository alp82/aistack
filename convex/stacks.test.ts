/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { api } from './_generated/api'
import type { StorageActionWriter } from 'convex/server'
import type { MutationCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

// ---------------------------------------------------------------------------
// Helper: seed a blob into convex storage and return its Id<'_storage'>
// ---------------------------------------------------------------------------
async function seedStorageBlob(t: ReturnType<typeof convexTest>): Promise<Id<'_storage'>> {
  return await t.run(async (ctx: MutationCtx) => {
    return await (ctx.storage as StorageActionWriter).store(
      new Blob(['avatar-data'], { type: 'image/jpeg' }),
    )
  })
}

const modules = import.meta.glob('./**/*.{js,ts}')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Seeds a creator row with a given userId and returns both the creatorId and a
 * convexTest instance scoped to that identity. Each caller must supply a
 * unique userId string to avoid the one-stack-per-creator throw.
 */
async function seedAuthenticatedCreator(
  t: ReturnType<typeof convexTest>,
  opts: { userId: string; slug: string },
): Promise<{ creatorId: Id<'creators'>; asCreator: ReturnType<typeof t.withIdentity> }> {
  const creatorId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: `Creator ${opts.userId}`,
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

/** Minimal args to call stacks.create successfully (no projects). */
const minimalCreateArgs = {
  name: 'My Stack',
  oneLiner: 'A test stack',
  toolSubscriptions: [],
  published: false,
}

// ---------------------------------------------------------------------------
// Group I - create() with a `projects` argument
// ---------------------------------------------------------------------------

test('TC-I-01: create() with projects array inserts matching project rows for the new stack', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-i01',
    slug: 'creator-i01',
  })

  const result = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
    projects: [
      {
        name: 'App',
        description: 'D',
        url: 'https://x.com',
        tags: ['web'],
      },
    ],
  })

  expect(result).toMatchObject({ _id: expect.any(String), slug: expect.any(String) })

  const projects = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('projects')
      .withIndex('by_stackId', (q) => q.eq('stackId', result._id))
      .collect(),
  )
  expect(projects).toHaveLength(1)
  expect(projects[0].name).toBe('App')
  expect(projects[0].description).toBe('D')
  // normalizeProjectUrl canonicalizes via parsed.href, so a bare host gains a trailing
  // slash - identical to the view-page createProject path (one shared normalizer).
  expect(projects[0].url).toBe('https://x.com/')
  expect(projects[0].tags).toEqual(['web'])
  // Projects no longer carry a publish state - the stack's flag must not propagate.
  expect((projects[0] as Record<string, unknown>).published).toBeUndefined()
})

test('TC-I-04: create() with projects:[] inserts no project rows', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-i04',
    slug: 'creator-i04',
  })

  const result = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
    projects: [],
  })

  const projects = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('projects')
      .withIndex('by_stackId', (q) => q.eq('stackId', result._id))
      .collect(),
  )
  expect(projects).toHaveLength(0)
})

test('TC-I-05: create() with projects omitted inserts no project rows', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-i05',
    slug: 'creator-i05',
  })

  const result = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
    // no projects key
  })

  const projects = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('projects')
      .withIndex('by_stackId', (q) => q.eq('stackId', result._id))
      .collect(),
  )
  expect(projects).toHaveLength(0)
})

test('TC-I-06: create() with projects:[P1, P2, P3] inserts all 3 rows', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-i06',
    slug: 'creator-i06',
  })

  const result = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
    projects: [{ name: 'P1' }, { name: 'P2' }, { name: 'P3' }],
  })

  const projects = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('projects')
      .withIndex('by_stackId', (q) => q.eq('stackId', result._id))
      .collect(),
  )
  expect(projects).toHaveLength(3)
  const names = projects.map((p) => p.name).sort()
  expect(names).toEqual(['P1', 'P2', 'P3'])
})

test('TC-I-07: each inserted project row carries the correct stackId and creatorId', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-i07',
    slug: 'creator-i07',
  })

  const result = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
    projects: [{ name: 'App' }, { name: 'Blog' }],
  })

  const projects = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('projects')
      .withIndex('by_stackId', (q) => q.eq('stackId', result._id))
      .collect(),
  )
  expect(projects).toHaveLength(2)
  for (const project of projects) {
    expect(project.stackId).toBe(result._id)
    expect(project.creatorId).toBe(creatorId)
  }
})

// ---------------------------------------------------------------------------
// Group J - update() does NOT bulk-publish project rows
// ---------------------------------------------------------------------------

test('TC-J-01: stacks.update with only stack fields does not alter any project published value', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-j01',
    slug: 'creator-j01',
  })

  // Seed a stack directly (bypass create to avoid one-stack-per-creator
  // interactions and to have full control over project rows).
  const stackId = await t.run(async (ctx: MutationCtx) => {
    const now = Date.now()
    return ctx.db.insert('stacks', {
      name: 'J01 Stack',
      slug: 'j01-stack',
      shortId: 'STKJ01',
      creatorId,
      oneLiner: 'original one liner',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      createdAt: now,
      updatedAt: now,
    })
  })

  // Insert two project rows.
  const { projectId1, projectId2 } = await t.run(
    async (ctx: MutationCtx) => {
      const now = Date.now()
      const projectId1 = await ctx.db.insert('projects', {
        name: 'Project One',
        slug: 'project-one',
        shortId: 'PRJ001',
        creatorId,
        stackId,
        createdAt: now,
        updatedAt: now,
      })
      const projectId2 = await ctx.db.insert('projects', {
        name: 'Project Two',
        slug: 'project-two',
        shortId: 'PRJ002',
        creatorId,
        stackId,
        createdAt: now,
        updatedAt: now,
      })
      return { projectId1, projectId2 }
    },
  )

  // Call stacks.update changing only oneLiner (a stack-level field).
  await asCreator.mutation(api.stacks.update, {
    stackId,
    oneLiner: 'changed one liner',
  })

  // Both project rows must still exist with their names unchanged.
  const row1 = await t.run(async (ctx: MutationCtx) => ctx.db.get(projectId1))
  const row2 = await t.run(async (ctx: MutationCtx) => ctx.db.get(projectId2))

  expect(row1?.name).toBe('Project One')
  expect(row2?.name).toBe('Project Two')
})

// ---------------------------------------------------------------------------
// Group K - create() with avatarStorageId (RED: arg not yet accepted)
// ---------------------------------------------------------------------------

test('TC-K-01: create rejects the retired avatarStorageId arg (Phase C narrow)', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-k01',
    slug: 'creator-k01',
  })
  const storageId = await seedStorageBlob(t)

  await expect(
    asCreator.mutation(api.stacks.create, {
      ...minimalCreateArgs,
      avatarStorageId: storageId,
    } as never),
  ).rejects.toThrow(/unexpected field/i)
})

test('TC-K-03: create passing a plain string as avatarStorageId → validator throws', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-k03',
    slug: 'creator-k03',
  })

  await expect(
    asCreator.mutation(api.stacks.create, {
      ...minimalCreateArgs,
      avatarStorageId: 'not-a-storage-id',
    } as never),
  ).rejects.toThrow()
})

// ---------------------------------------------------------------------------
// Group L - update() with avatarStorageId (RED: arg not yet accepted)
// ---------------------------------------------------------------------------

async function seedStackForUpdate(
  t: ReturnType<typeof convexTest>,
  opts: { userId: string; slug: string },
): Promise<{ stackId: Id<'stacks'>; creatorId: Id<'creators'>; asCreator: ReturnType<typeof t.withIdentity> }> {
  const { creatorId, asCreator } = await seedAuthenticatedCreator(t, opts)
  const now = Date.now()
  const stackId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('stacks', {
      name: 'L Stack',
      slug: `${opts.slug}-stack`,
      shortId: `STK${opts.slug.toUpperCase().replace(/-/g, '')}`,
      creatorId,
      oneLiner: 'test',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      createdAt: now,
      updatedAt: now,
    }),
  )
  return { stackId, creatorId, asCreator }
}

test('TC-L-01: update rejects the retired avatarStorageId arg (Phase C narrow)', async () => {
  const t = convexTest(schema, modules)
  const { stackId, asCreator } = await seedStackForUpdate(t, {
    userId: 'user-l01',
    slug: 'creator-l01',
  })
  const storageId = await seedStorageBlob(t)

  await expect(
    asCreator.mutation(api.stacks.update, {
      stackId,
      avatarStorageId: storageId,
    } as never),
  ).rejects.toThrow(/unexpected field/i)
})

// TC-L-02/TC-L-03 retired with stacks.avatarStorageId (Phase C narrow):
// legacy stack-avatar rows can no longer exist after the migration.

// ---------------------------------------------------------------------------
// Group M - read resolvers use avatarStorageId, not stackImageUrl (RED)
// ---------------------------------------------------------------------------

// Helper: seed a published stack with full control over the creator's avatar
async function seedPublishedStack(
  t: ReturnType<typeof convexTest>,
  opts: {
    userId: string
    slug: string
    creatorAvatarUrl?: string
    creatorAvatarStorageId?: Id<'_storage'>
  },
): Promise<{ stackId: Id<'stacks'>; shortId: string }> {
  const creatorId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: `Creator ${opts.userId}`,
      slug: opts.slug,
      userId: opts.userId,
      verified: false,
      personalPages: [],
      projectPages: [],
      avatarUrl: opts.creatorAvatarUrl,
      avatarStorageId: opts.creatorAvatarStorageId,
      createdAt: Date.now(),
    }),
  )
  const shortId = `SM${opts.userId.replace(/-/g, '').toUpperCase().slice(0, 6)}`
  const now = Date.now()
  const stackId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('stacks', {
      name: 'M Stack',
      slug: `${opts.slug}-stack`,
      shortId,
      creatorId,
      oneLiner: 'test',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: true,
      createdAt: now,
      updatedAt: now,
    }),
  )
  return { stackId, shortId }
}

test('TC-M-01: getBySlug WITH creator avatarStorageId → creator.avatarUrl === storage URL', async () => {
  const t = convexTest(schema, modules)
  const storageId = await seedStorageBlob(t)
  const { shortId } = await seedPublishedStack(t, {
    userId: 'user-m01',
    slug: 'creator-m01',
    creatorAvatarUrl: 'https://creator-row.example.com/avatar.jpg',
    creatorAvatarStorageId: storageId,
  })

  const result = await t.query(api.stacks.getBySlug, { slug: `m-stack-${shortId}` })
  expect(result).not.toBeNull()
  // Must resolve to the storage URL, not the creator row URL
  const storageUrl = await t.run(async (ctx: MutationCtx) => ctx.storage.getUrl(storageId))
  expect(result?.creator.avatarUrl).toBe(storageUrl)
  expect(result?.creator.avatarUrl).not.toBe('https://creator-row.example.com/avatar.jpg')
})

test('TC-M-02: getBySlug WITHOUT avatarStorageId → creator.avatarUrl === creator row avatarUrl', async () => {
  const t = convexTest(schema, modules)
  const { shortId } = await seedPublishedStack(t, {
    userId: 'user-m02',
    slug: 'creator-m02',
    creatorAvatarUrl: 'https://creator-row.example.com/avatar.jpg',
  })

  const result = await t.query(api.stacks.getBySlug, { slug: `m-stack-${shortId}` })
  expect(result?.creator.avatarUrl).toBe('https://creator-row.example.com/avatar.jpg')
})

// TC-M-03/TC-M-06 retired with stacks.stackImageUrl (Phase C narrow): the
// SSRF-prone column no longer exists, so there is nothing to guard against.

test('TC-M-04: listPublished WITH creator avatarStorageId → resolved storage URL', async () => {
  const t = convexTest(schema, modules)
  const storageId = await seedStorageBlob(t)
  await seedPublishedStack(t, {
    userId: 'user-m04',
    slug: 'creator-m04',
    creatorAvatarUrl: 'https://creator-row.example.com/avatar.jpg',
    creatorAvatarStorageId: storageId,
  })

  const results = await t.query(api.stacks.listPublished, {})
  const stack = results.find((s) => s.creator.name === 'Creator user-m04')
  expect(stack).toBeDefined()
  const storageUrl = await t.run(async (ctx: MutationCtx) => ctx.storage.getUrl(storageId))
  expect(stack?.creator.avatarUrl).toBe(storageUrl)
})

test('TC-M-05: listPublished WITHOUT avatarStorageId → creator row avatarUrl', async () => {
  const t = convexTest(schema, modules)
  await seedPublishedStack(t, {
    userId: 'user-m05',
    slug: 'creator-m05',
    creatorAvatarUrl: 'https://creator-row.example.com/avatar.jpg',
  })

  const results = await t.query(api.stacks.listPublished, {})
  const stack = results.find((s) => s.creator.name === 'Creator user-m05')
  expect(stack?.creator.avatarUrl).toBe('https://creator-row.example.com/avatar.jpg')
})

test('TC-M-07: getForEdit no longer surfaces avatarStorageId (editor is artifact-only)', async () => {
  const t = convexTest(schema, modules)
  const { stackId: _stackId, shortId } = await seedPublishedStack(t, {
    userId: 'user-m07',
    slug: 'creator-m07',
  })
  const asCreator = t.withIdentity({ tokenIdentifier: 'convex|user-m07' })

  const result = await asCreator.query(api.stacks.getForEdit, {
    slug: `creator-m07-stack-${shortId}`,
  })
  expect(result).not.toBeNull()
  expect((result as Record<string, unknown>)?.avatarStorageId).toBeUndefined()
})

test('TC-M-08: getForEdit returns avatarStorageId as undefined when unset', async () => {
  const t = convexTest(schema, modules)
  const { shortId } = await seedPublishedStack(t, {
    userId: 'user-m08',
    slug: 'creator-m08',
  })
  const asCreator = t.withIdentity({ tokenIdentifier: 'convex|user-m08' })

  const result = await asCreator.query(api.stacks.getForEdit, {
    slug: `creator-m08-stack-${shortId}`,
  })
  expect((result as Record<string, unknown>)?.avatarStorageId).toBeUndefined()
})

test('TC-M-09: getForEdit surfaces neither identity ids nor stackImageUrl as avatar fields', async () => {
  const t = convexTest(schema, modules)
  const { shortId } = await seedPublishedStack(t, {
    userId: 'user-m09',
    slug: 'creator-m09',
  })
  const asCreator = t.withIdentity({ tokenIdentifier: 'convex|user-m09' })

  const result = await asCreator.query(api.stacks.getForEdit, {
    slug: `creator-m09-stack-${shortId}`,
  }) as Record<string, unknown> | null
  expect(result).not.toBeNull()
  expect(result?.avatarStorageId).toBeUndefined()
  expect(result?.stackImageUrl).toBeUndefined()
  // stackImageUrl must NOT be surfaced as an avatar field
  expect(result?.avatarUrl).toBeUndefined()
})

// ---------------------------------------------------------------------------
// Group N - personalPageUrl validation via assertValidPersonalPageUrl (RED)
// ---------------------------------------------------------------------------

// Group N (Phase C): personalPageUrl is no longer a stack concept - the arg is
// rejected outright. Https-only validation of profile links lives in
// creators.updateProfile (TC-CP-07..09 in creators.test.ts).

test('TC-N-01: create rejects the retired personalPageUrl arg (Phase C narrow)', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-n01',
    slug: 'creator-n01',
  })

  await expect(
    asCreator.mutation(api.stacks.create, {
      ...minimalCreateArgs,
      personalPageUrl: 'https://example.com',
    } as never),
  ).rejects.toThrow(/unexpected field/i)
})

// TC-N-02..TC-N-06 retired (Phase C): every personalPageUrl value now fails
// the same way - the arg itself no longer exists on create/update.

test('TC-N-07: update rejects the retired personalPageUrl arg (Phase C narrow)', async () => {
  const t = convexTest(schema, modules)
  const { stackId, asCreator } = await seedStackForUpdate(t, {
    userId: 'user-n07',
    slug: 'creator-n07',
  })

  await expect(
    asCreator.mutation(api.stacks.update, {
      stackId,
      personalPageUrl: 'https://example.com',
    } as never),
  ).rejects.toThrow(/unexpected field/i)
})

// ---------------------------------------------------------------------------
// Group O - accentPreset key validation, persistence, read (RED)
// ---------------------------------------------------------------------------

test('TC-O-01: update with accentPreset "violet" persists it', async () => {
  const t = convexTest(schema, modules)
  const { stackId, asCreator } = await seedStackForUpdate(t, {
    userId: 'user-o01',
    slug: 'creator-o01',
  })

  await asCreator.mutation(api.stacks.update, {
    stackId,
    accentPreset: 'violet',
  } as never)

  const row = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  expect((row as Record<string, unknown>)?.accentPreset).toBe('violet')
})

test('TC-O-02: create with accentPreset "cyan" persists it on the new row', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-o02',
    slug: 'creator-o02',
  })

  const result = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
    accentPreset: 'cyan',
  } as never)

  const row = await t.run(async (ctx: MutationCtx) => ctx.db.get(result._id))
  expect((row as Record<string, unknown>)?.accentPreset).toBe('cyan')
})

test('TC-O-03: create with unknown accentPreset "notapreset" throws /accentPreset/', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-o03',
    slug: 'creator-o03',
  })

  await expect(
    asCreator.mutation(api.stacks.create, {
      ...minimalCreateArgs,
      accentPreset: 'notapreset',
    } as never),
  ).rejects.toThrow(/accentPreset/)
})

test('TC-O-04: update with unknown accentPreset "notapreset" throws /accentPreset/', async () => {
  const t = convexTest(schema, modules)
  const { stackId, asCreator } = await seedStackForUpdate(t, {
    userId: 'user-o04',
    slug: 'creator-o04',
  })

  await expect(
    asCreator.mutation(api.stacks.update, {
      stackId,
      accentPreset: 'notapreset',
    } as never),
  ).rejects.toThrow(/accentPreset/)
})

test('TC-O-05: update with accentPreset "" coerces to undefined (clears)', async () => {
  const t = convexTest(schema, modules)
  const { stackId, asCreator } = await seedStackForUpdate(t, {
    userId: 'user-o05',
    slug: 'creator-o05',
  })

  // First set a preset
  await asCreator.mutation(api.stacks.update, {
    stackId,
    accentPreset: 'violet',
  } as never)

  // Then clear with empty string
  await asCreator.mutation(api.stacks.update, {
    stackId,
    accentPreset: '',
  } as never)

  const row = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  expect((row as Record<string, unknown>)?.accentPreset).toBeUndefined()
})

test('TC-O-06: update omitting accentPreset leaves prior "violet" intact', async () => {
  const t = convexTest(schema, modules)
  const { stackId, asCreator } = await seedStackForUpdate(t, {
    userId: 'user-o06',
    slug: 'creator-o06',
  })

  await asCreator.mutation(api.stacks.update, {
    stackId,
    accentPreset: 'violet',
  } as never)

  await asCreator.mutation(api.stacks.update, {
    stackId,
    oneLiner: 'changed',
  })

  const row = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  expect((row as Record<string, unknown>)?.accentPreset).toBe('violet')
})

test('TC-O-07: getForEdit returns accentPreset key when set', async () => {
  const t = convexTest(schema, modules)
  const { shortId } = await seedPublishedStack(t, {
    userId: 'user-o07',
    slug: 'creator-o07',
  })
  const asCreator = t.withIdentity({ tokenIdentifier: 'convex|user-o07' })

  // Patch accentPreset directly for the read test
  await t.run(async (ctx: MutationCtx) => {
    const stack = await ctx.db
      .query('stacks')
      .withIndex('by_shortId', (q) => q.eq('shortId', shortId))
      .unique()
    if (stack) {
      await ctx.db.patch(stack._id, { accentPreset: 'fuchsia' } as never)
    }
  })

  const result = await asCreator.query(api.stacks.getForEdit, {
    slug: `creator-o07-stack-${shortId}`,
  }) as Record<string, unknown> | null
  expect(result).not.toBeNull()
  expect(result?.accentPreset).toBe('fuchsia')
})

test('TC-O-08: getForEdit returns accentPreset as undefined when unset', async () => {
  const t = convexTest(schema, modules)
  const { shortId } = await seedPublishedStack(t, {
    userId: 'user-o08',
    slug: 'creator-o08',
  })
  const asCreator = t.withIdentity({ tokenIdentifier: 'convex|user-o08' })

  const result = await asCreator.query(api.stacks.getForEdit, {
    slug: `creator-o08-stack-${shortId}`,
  }) as Record<string, unknown> | null
  expect(result).not.toBeNull()
  expect(result?.accentPreset).toBeUndefined()
})

test('TC-O-09: getBySlug returns accentPreset key when set', async () => {
  const t = convexTest(schema, modules)
  const { shortId } = await seedPublishedStack(t, {
    userId: 'user-o09',
    slug: 'creator-o09',
  })

  await t.run(async (ctx: MutationCtx) => {
    const stack = await ctx.db
      .query('stacks')
      .withIndex('by_shortId', (q) => q.eq('shortId', shortId))
      .unique()
    if (stack) {
      await ctx.db.patch(stack._id, { accentPreset: 'teal' } as never)
    }
  })

  const result = await t.query(api.stacks.getBySlug, {
    slug: `creator-o09-stack-${shortId}`,
  }) as Record<string, unknown> | null
  expect(result).not.toBeNull()
  expect(result?.accentPreset).toBe('teal')
})

test('TC-O-10: getBySlug returns accentPreset as undefined when not set', async () => {
  const t = convexTest(schema, modules)
  const { shortId } = await seedPublishedStack(t, {
    userId: 'user-o10',
    slug: 'creator-o10',
  })

  const result = await t.query(api.stacks.getBySlug, {
    slug: `creator-o10-stack-${shortId}`,
  }) as Record<string, unknown> | null
  expect(result).not.toBeNull()
  expect(result?.accentPreset).toBeUndefined()
})

test('TC-O-11: update by non-owner with accentPreset is rejected', async () => {
  const t = convexTest(schema, modules)
  const { stackId } = await seedStackForUpdate(t, {
    userId: 'user-o11-owner',
    slug: 'creator-o11-owner',
  })

  const asStranger = t.withIdentity({ tokenIdentifier: 'convex|user-o11-stranger' })

  await expect(
    asStranger.mutation(api.stacks.update, {
      stackId,
      accentPreset: 'violet',
    } as never),
  ).rejects.toThrow()
})

// ---------------------------------------------------------------------------
// Group P - getPublicSummary query (does NOT exist yet - RED)
// ---------------------------------------------------------------------------

// Helper: seed a published stack with tool/model/bundle subscriptions
async function seedPublishedStackWithSubs(
  t: ReturnType<typeof convexTest>,
  opts: {
    userId: string
    slug: string
    published?: boolean
  },
): Promise<{ stackId: Id<'stacks'>; shortId: string }> {
  const creatorId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: `Creator ${opts.userId}`,
      slug: opts.slug,
      userId: opts.userId,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )

  // Seed a tool
  const toolShortId = `TL${opts.userId.replace(/-/g, '').toUpperCase().slice(0, 5)}`
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('tools', {
      name: `Tool for ${opts.userId}`,
      slug: `tool-${opts.userId}`,
      shortId: toolShortId,
      categories: ['editor'],
      tiers: [
        {
          tierId: 'free',
          name: 'Free',
          pricing: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 0, period: 'month' } },
        },
      ],
      reviewStatus: 'approved',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  )

  // Seed a model
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('models', {
      name: `Model for ${opts.userId}`,
      slug: `model-${opts.userId}`,
      shortId: `MD${opts.userId.replace(/-/g, '').toUpperCase().slice(0, 5)}`,
      provider: 'openai',
      category: 'language',
      reviewStatus: 'approved',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  )

  // Seed a bundle
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('bundles', {
      name: `Bundle for ${opts.userId}`,
      slug: `bundle-${opts.userId}`,
      shortId: `BN${opts.userId.replace(/-/g, '').toUpperCase().slice(0, 5)}`,
      toolSlugs: [],
      tiers: [
        {
          tierId: 'pro',
          name: 'Pro',
          pricing: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 10, period: 'month' } },
        },
      ],
      reviewStatus: 'approved',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  )

  const shortId = `SP${opts.userId.replace(/-/g, '').toUpperCase().slice(0, 6)}`
  const now = Date.now()
  const stackId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('stacks', {
      name: `Stack ${opts.userId}`,
      slug: `${opts.slug}-stack`,
      shortId,
      creatorId,
      oneLiner: 'test stack',
      toolSubscriptions: [
        {
          toolSlug: `tool-${opts.userId}`,
          kind: 'main',
          primaryUsageLabel: 'Main editor',
          price: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 0, period: 'month' } },
          priceKind: 'regular',
        },
      ],
      bundleSubscriptions: [
        {
          bundleSlug: `bundle-${opts.userId}`,
          tierId: 'pro',
        },
      ],
      modelSubscriptions: [
        {
          modelSlug: `model-${opts.userId}`,
          role: 'primary',
        },
      ],
      hasUsageComponent: false,
      published: opts.published ?? true,
      createdAt: now,
      updatedAt: now,
    }),
  )
  return { stackId, shortId }
}

test('TC-P-01: getPublicSummary on published stack returns correct shape - name matches, tools/models/bundles are bare string arrays, counts match', async () => {
  const t = convexTest(schema, modules)
  const { shortId } = await seedPublishedStackWithSubs(t, {
    userId: 'user-p01',
    slug: 'creator-p01',
  })

  const result = await t.query(api.stacks.getPublicSummary, {
    slug: `creator-p01-stack-${shortId}`,
  })

  expect(result).not.toBeNull()
  expect(result!.name).toBe('Stack user-p01')

  // tools/models/bundles must be string[] of names only - no internal fields
  expect(Array.isArray(result!.tools)).toBe(true)
  expect(Array.isArray(result!.models)).toBe(true)
  expect(Array.isArray(result!.bundles)).toBe(true)
  for (const toolName of result!.tools) {
    expect(typeof toolName).toBe('string')
  }
  for (const modelName of result!.models) {
    expect(typeof modelName).toBe('string')
  }
  for (const bundleName of result!.bundles) {
    expect(typeof bundleName).toBe('string')
  }

  // No internal fields on the bare string elements
  expect(result!.tools).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ _id: expect.anything() })]),
  )

  // Counts equal array lengths
  expect(result!.toolCount).toBe(result!.tools.length)
  expect(result!.modelCount).toBe(result!.models.length)
  expect(result!.bundleCount).toBe(result!.bundles.length)
})

test('TC-P-02: getPublicSummary on unpublished stack returns null', async () => {
  const t = convexTest(schema, modules)
  const { shortId } = await seedPublishedStackWithSubs(t, {
    userId: 'user-p02',
    slug: 'creator-p02',
    published: false,
  })

  const result = await t.query(api.stacks.getPublicSummary, {
    slug: `creator-p02-stack-${shortId}`,
  })

  expect(result).toBeNull()
})

test('TC-P-03: getPublicSummary with unknown shortId returns null', async () => {
  const t = convexTest(schema, modules)

  const result = await t.query(api.stacks.getPublicSummary, {
    slug: 'anything-zzzzzz',
  })

  expect(result).toBeNull()
})

test('TC-P-04: getPublicSummary resolves by shortId suffix regardless of slug prefix (tolerant slug)', async () => {
  const t = convexTest(schema, modules)
  const { shortId } = await seedPublishedStackWithSubs(t, {
    userId: 'user-p04',
    slug: 'creator-p04',
  })

  // Query with wrong prefix but correct shortId suffix
  const result = await t.query(api.stacks.getPublicSummary, {
    slug: `wrong-prefix-${shortId}`,
  })

  expect(result).not.toBeNull()
  expect(result!.name).toBe('Stack user-p04')
})

test('TC-P-05: getPublicSummary monthlyCost deep-equals getBySlug fixedTotal and hasUsageComponent is absent', async () => {
  const t = convexTest(schema, modules)
  const { shortId } = await seedPublishedStackWithSubs(t, {
    userId: 'user-p05',
    slug: 'creator-p05',
  })

  const slug = `creator-p05-stack-${shortId}`

  const summary = await t.query(api.stacks.getPublicSummary, { slug })
  const full = await t.query(api.stacks.getBySlug, { slug })

  expect(summary).not.toBeNull()
  expect(full).not.toBeNull()

  // monthlyCost must deep-equal getBySlug's fixedTotal
  expect(summary!.monthlyCost).toEqual(full!.fixedTotal)
  // hasUsageComponent must NOT be present in the public summary
  expect(summary).not.toHaveProperty('hasUsageComponent')
})

test('TC-P-06: upvoteCount equals number of seeded stackUpvotes rows, 0 when none', async () => {
  const t = convexTest(schema, modules)
  const { stackId, shortId } = await seedPublishedStackWithSubs(t, {
    userId: 'user-p06',
    slug: 'creator-p06',
  })

  // No upvotes yet
  const noVotes = await t.query(api.stacks.getPublicSummary, {
    slug: `creator-p06-stack-${shortId}`,
  })
  expect(noVotes).not.toBeNull()
  expect(noVotes!.upvoteCount).toBe(0)

  // Seed 3 upvotes
  await t.run(async (ctx: MutationCtx) => {
    const now = Date.now()
    await ctx.db.insert('stackUpvotes', { stackId, userId: 'voter-1', createdAt: now })
    await ctx.db.insert('stackUpvotes', { stackId, userId: 'voter-2', createdAt: now })
    await ctx.db.insert('stackUpvotes', { stackId, userId: 'voter-3', createdAt: now })
  })

  const withVotes = await t.query(api.stacks.getPublicSummary, {
    slug: `creator-p06-stack-${shortId}`,
  })
  expect(withVotes).not.toBeNull()
  expect(withVotes!.upvoteCount).toBe(3)
})

test('TC-P-07: deleted/missing tool slug is filtered out - not in tools[], query does not throw', async () => {
  const t = convexTest(schema, modules)

  // Seed a stack whose toolSubscription references a tool that does not exist in tools table
  const creatorId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: 'Creator user-p07',
      slug: 'creator-p07',
      userId: 'user-p07',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )

  const shortId = 'SPP07XX'
  const now = Date.now()
  const stackId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('stacks', {
      name: 'Stack user-p07',
      slug: 'creator-p07-stack',
      shortId,
      creatorId,
      oneLiner: 'test',
      toolSubscriptions: [
        {
          toolSlug: 'tool-does-not-exist',
          kind: 'main',
          primaryUsageLabel: 'Ghost tool',
          price: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 0, period: 'month' } },
          priceKind: 'regular',
        },
      ],
      hasUsageComponent: false,
      published: true,
      createdAt: now,
      updatedAt: now,
    }),
  )
  void stackId

  // Must not throw, and tools array must not include the missing slug
  const result = await t.query(api.stacks.getPublicSummary, {
    slug: `creator-p07-stack-${shortId}`,
  })

  expect(result).not.toBeNull()
  expect(result!.tools).not.toContain('tool-does-not-exist')
  // The phantom entry is filtered; array is empty or contains only real names
  for (const name of result!.tools) {
    expect(typeof name).toBe('string')
    expect(name).not.toBe('tool-does-not-exist')
  }
})

test('TC-P-08: getPublicSummary tools ordered main-group-first then misc, price-desc within group', async () => {
  const t = convexTest(schema, modules)

  const creatorId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: 'Creator user-p08',
      slug: 'creator-p08',
      userId: 'user-p08',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )

  const now = Date.now()
  // Tool A: main, $5/mo
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('tools', {
      name: 'Tool-Main-Cheap',
      slug: 'tool-main-cheap',
      shortId: 'TLMCHEAP',
      categories: ['editor'],
      tiers: [
        {
          tierId: 'pro',
          name: 'Pro',
          pricing: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 5, period: 'month' } },
        },
      ],
      reviewStatus: 'approved',
      createdAt: now,
      updatedAt: now,
    }),
  )

  // Tool B: main, $50/mo
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('tools', {
      name: 'Tool-Main-Expensive',
      slug: 'tool-main-expensive',
      shortId: 'TLMEXP',
      categories: ['editor'],
      tiers: [
        {
          tierId: 'pro',
          name: 'Pro',
          pricing: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 50, period: 'month' } },
        },
      ],
      reviewStatus: 'approved',
      createdAt: now,
      updatedAt: now,
    }),
  )

  // Tool C: misc, $100/mo
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('tools', {
      name: 'Tool-Misc-Expensive',
      slug: 'tool-misc-expensive',
      shortId: 'TLMISCEXP',
      categories: ['editor'],
      tiers: [
        {
          tierId: 'pro',
          name: 'Pro',
          pricing: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 100, period: 'month' } },
        },
      ],
      reviewStatus: 'approved',
      createdAt: now,
      updatedAt: now,
    }),
  )

  const shortId = 'SPP08XX'
  const stackId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('stacks', {
      name: 'Stack user-p08',
      slug: 'creator-p08-stack',
      shortId,
      creatorId,
      oneLiner: 'test',
      toolSubscriptions: [
        {
          toolSlug: 'tool-main-cheap',
          kind: 'main',
          primaryUsageLabel: 'Main cheap',
          price: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 5, period: 'month' } },
          priceKind: 'regular',
        },
        {
          toolSlug: 'tool-main-expensive',
          kind: 'main',
          primaryUsageLabel: 'Main expensive',
          price: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 50, period: 'month' } },
          priceKind: 'regular',
        },
        {
          toolSlug: 'tool-misc-expensive',
          kind: 'misc',
          primaryUsageLabel: 'Misc expensive',
          price: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 100, period: 'month' } },
          priceKind: 'regular',
        },
      ],
      hasUsageComponent: false,
      published: true,
      createdAt: now,
      updatedAt: now,
    }),
  )
  void stackId

  const result = await t.query(api.stacks.getPublicSummary, {
    slug: `creator-p08-stack-${shortId}`,
  })

  expect(result).not.toBeNull()
  // main group price-desc first, then misc group
  expect(result!.tools).toStrictEqual(['Tool-Main-Expensive', 'Tool-Main-Cheap', 'Tool-Misc-Expensive'])
  expect(result!.toolCount).toBe(3)
})

test('TC-P-08b: getPublicSummary all-free tools fall back to name-alphabetical', async () => {
  const t = convexTest(schema, modules)

  const creatorId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: 'Creator user-p08b',
      slug: 'creator-p08b',
      userId: 'user-p08b',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )

  const now = Date.now()
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('tools', {
      name: 'Zebra',
      slug: 'tool-zebra',
      shortId: 'TLZEBRA',
      categories: ['editor'],
      tiers: [
        {
          tierId: 'free',
          name: 'Free',
          pricing: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 0, period: 'month' } },
        },
      ],
      reviewStatus: 'approved',
      createdAt: now,
      updatedAt: now,
    }),
  )

  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('tools', {
      name: 'Alpha',
      slug: 'tool-alpha',
      shortId: 'TLALPHA',
      categories: ['editor'],
      tiers: [
        {
          tierId: 'free',
          name: 'Free',
          pricing: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 0, period: 'month' } },
        },
      ],
      reviewStatus: 'approved',
      createdAt: now,
      updatedAt: now,
    }),
  )

  const shortId = 'SPP08BX'
  const stackId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('stacks', {
      name: 'Stack user-p08b',
      slug: 'creator-p08b-stack',
      shortId,
      creatorId,
      oneLiner: 'test',
      toolSubscriptions: [
        {
          toolSlug: 'tool-zebra',
          kind: 'main',
          primaryUsageLabel: 'Zebra tool',
          price: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 0, period: 'month' } },
          priceKind: 'regular',
        },
        {
          toolSlug: 'tool-alpha',
          kind: 'main',
          primaryUsageLabel: 'Alpha tool',
          price: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 0, period: 'month' } },
          priceKind: 'regular',
        },
      ],
      hasUsageComponent: false,
      published: true,
      createdAt: now,
      updatedAt: now,
    }),
  )
  void stackId

  const result = await t.query(api.stacks.getPublicSummary, {
    slug: `creator-p08b-stack-${shortId}`,
  })

  expect(result).not.toBeNull()
  // both free same group → alphabetical
  expect(result!.tools).toStrictEqual(['Alpha', 'Zebra'])
})

test('TC-P-08c: getPublicSummary bundle-priced tool sorts between paid and free', async () => {
  const t = convexTest(schema, modules)

  const creatorId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('creators', {
      name: 'Creator user-p08c',
      slug: 'creator-p08c',
      userId: 'user-p08c',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    }),
  )

  const now = Date.now()
  // Tool-X: regular, $10/mo
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('tools', {
      name: 'Tool-X',
      slug: 'tool-x',
      shortId: 'TLTOOLX',
      categories: ['editor'],
      tiers: [
        {
          tierId: 'pro',
          name: 'Pro',
          pricing: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 10, period: 'month' } },
        },
      ],
      reviewStatus: 'approved',
      createdAt: now,
      updatedAt: now,
    }),
  )

  // Tool-Y: bundle-priced, amount 0 in sub price
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('tools', {
      name: 'Tool-Y',
      slug: 'tool-y',
      shortId: 'TLTOOLYU',
      categories: ['editor'],
      tiers: [
        {
          tierId: 'pro',
          name: 'Pro',
          pricing: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 0, period: 'month' } },
        },
      ],
      reviewStatus: 'approved',
      createdAt: now,
      updatedAt: now,
    }),
  )

  // Tool-Z: regular, $0/mo (free)
  await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('tools', {
      name: 'Tool-Z',
      slug: 'tool-z',
      shortId: 'TLTOOLZ',
      categories: ['editor'],
      tiers: [
        {
          tierId: 'free',
          name: 'Free',
          pricing: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 0, period: 'month' } },
        },
      ],
      reviewStatus: 'approved',
      createdAt: now,
      updatedAt: now,
    }),
  )

  const shortId = 'SPP08CX'
  const stackId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('stacks', {
      name: 'Stack user-p08c',
      slug: 'creator-p08c-stack',
      shortId,
      creatorId,
      oneLiner: 'test',
      toolSubscriptions: [
        {
          toolSlug: 'tool-x',
          kind: 'main',
          primaryUsageLabel: 'Tool X',
          price: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 10, period: 'month' } },
          priceKind: 'regular',
        },
        {
          toolSlug: 'tool-y',
          kind: 'main',
          primaryUsageLabel: 'Tool Y',
          price: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 0, period: 'month' } },
          priceKind: 'bundle',
        },
        {
          toolSlug: 'tool-z',
          kind: 'main',
          primaryUsageLabel: 'Tool Z',
          price: { pricingType: 'fixed', fixed: { currency: 'USD', amount: 0, period: 'month' } },
          priceKind: 'regular',
        },
      ],
      hasUsageComponent: false,
      published: true,
      createdAt: now,
      updatedAt: now,
    }),
  )
  void stackId

  const result = await t.query(api.stacks.getPublicSummary, {
    slug: `creator-p08c-stack-${shortId}`,
  })

  expect(result).not.toBeNull()
  // paid → bundle → free
  expect(result!.tools).toStrictEqual(['Tool-X', 'Tool-Y', 'Tool-Z'])
})

// ---------------------------------------------------------------------------
// Group PD - profile-first decoupling (plan.md Phase A)
// ---------------------------------------------------------------------------

test('TC-PD-01: create() allows a second stack for a creator who already has one', async () => {
  const t = convexTest(schema, modules)
  const { asCreator, creatorId } = await seedAuthenticatedCreator(t, {
    userId: 'user-pd01',
    slug: 'creator-pd01',
  })

  const first = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
    name: 'First Stack',
  })
  const second = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
    name: 'Second Stack',
  })

  expect(first._id).not.toBe(second._id)

  const stacks = await t.run(async (ctx: MutationCtx) =>
    ctx.db
      .query('stacks')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
      .collect(),
  )
  expect(stacks).toHaveLength(2)
  expect(stacks.map((s) => s.name).sort()).toEqual(['First Stack', 'Second Stack'])
})

test('TC-PD-02: create() rejects the retired identity args and writes no identity fields (Phase C narrow)', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-pd02',
    slug: 'creator-pd02',
  })
  const storageId = await t.run(async (ctx: MutationCtx) =>
    (ctx.storage as StorageActionWriter).store(new Blob(['x'], { type: 'image/webp' })),
  )

  await expect(
    asCreator.mutation(api.stacks.create, {
      ...minimalCreateArgs,
      avatarStorageId: storageId,
      personalPageUrl: 'https://example.com',
      stackImageUrl: 'https://example.com/img.png',
    } as never),
  ).rejects.toThrow(/unexpected field/i)

  const result = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
  })
  const stack = await t.run(async (ctx: MutationCtx) => ctx.db.get(result._id))
  expect((stack as Record<string, unknown> | null)?.avatarStorageId).toBeUndefined()
  expect((stack as Record<string, unknown> | null)?.personalPageUrl).toBeUndefined()
  expect((stack as Record<string, unknown> | null)?.stackImageUrl).toBeUndefined()
})

test('TC-PD-03: update() rejects the retired identity args (Phase C narrow)', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-pd03',
    slug: 'creator-pd03',
  })
  const created = await asCreator.mutation(api.stacks.create, { ...minimalCreateArgs })
  const storageId = await t.run(async (ctx: MutationCtx) =>
    (ctx.storage as StorageActionWriter).store(new Blob(['y'], { type: 'image/webp' })),
  )

  await expect(
    asCreator.mutation(api.stacks.update, {
      stackId: created._id,
      avatarStorageId: storageId,
      personalPageUrl: 'https://example.com/personal',
    } as never),
  ).rejects.toThrow(/unexpected field/i)
})
