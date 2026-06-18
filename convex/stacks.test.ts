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
// Group I — create() with a `projects` argument
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
// Group J — update() does NOT bulk-publish project rows
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
// Group K — create() with avatarStorageId (RED: arg not yet accepted)
// ---------------------------------------------------------------------------

test('TC-K-01: create with avatarStorageId persists it on the raw row', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-k01',
    slug: 'creator-k01',
  })
  const storageId = await seedStorageBlob(t)

  const result = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
    // avatarStorageId is not yet a recognised arg → this will throw (RED)
    avatarStorageId: storageId,
  } as never)

  const row = await t.run(async (ctx: MutationCtx) => ctx.db.get(result._id))
  expect(row?.avatarStorageId).toBe(storageId)
})

test('TC-K-02: create with avatarStorageId omitted → row.avatarStorageId is undefined', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-k02',
    slug: 'creator-k02',
  })

  const result = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
  })

  const row = await t.run(async (ctx: MutationCtx) => ctx.db.get(result._id))
  expect(row?.avatarStorageId).toBeUndefined()
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
// Group L — update() with avatarStorageId (RED: arg not yet accepted)
// ---------------------------------------------------------------------------

async function seedStackForUpdate(
  t: ReturnType<typeof convexTest>,
  opts: { userId: string; slug: string; avatarStorageId?: Id<'_storage'> },
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
      avatarStorageId: opts.avatarStorageId,
    }),
  )
  return { stackId, creatorId, asCreator }
}

test('TC-L-01: update with avatarStorageId persists new id', async () => {
  const t = convexTest(schema, modules)
  const { stackId, asCreator } = await seedStackForUpdate(t, {
    userId: 'user-l01',
    slug: 'creator-l01',
  })
  const storageId = await seedStorageBlob(t)

  await asCreator.mutation(api.stacks.update, {
    stackId,
    // avatarStorageId not yet accepted → RED
    avatarStorageId: storageId,
  } as never)

  const row = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  expect(row?.avatarStorageId).toBe(storageId)
})

test('TC-L-02: update with avatarStorageId:null clears a previously set id', async () => {
  const t = convexTest(schema, modules)
  const storageId = await seedStorageBlob(t)
  const { stackId, asCreator } = await seedStackForUpdate(t, {
    userId: 'user-l02',
    slug: 'creator-l02',
    avatarStorageId: storageId,
  })

  await asCreator.mutation(api.stacks.update, {
    stackId,
    avatarStorageId: null,
  } as never)

  const row = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  expect(row?.avatarStorageId).toBeUndefined()
})

test('TC-L-03: update without avatarStorageId arg leaves existing id intact', async () => {
  const t = convexTest(schema, modules)
  const storageId = await seedStorageBlob(t)
  const { stackId, asCreator } = await seedStackForUpdate(t, {
    userId: 'user-l03',
    slug: 'creator-l03',
    avatarStorageId: storageId,
  })

  await asCreator.mutation(api.stacks.update, {
    stackId,
    oneLiner: 'changed',
  })

  const row = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  expect(row?.avatarStorageId).toBe(storageId)
})

// ---------------------------------------------------------------------------
// Group M — read resolvers use avatarStorageId, not stackImageUrl (RED)
// ---------------------------------------------------------------------------

// Helper: seed a published stack with full control over avatarStorageId / stackImageUrl
async function seedPublishedStack(
  t: ReturnType<typeof convexTest>,
  opts: {
    userId: string
    slug: string
    creatorAvatarUrl?: string
    avatarStorageId?: Id<'_storage'>
    stackImageUrl?: string
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
      avatarStorageId: opts.avatarStorageId,
      stackImageUrl: opts.stackImageUrl,
      createdAt: now,
      updatedAt: now,
    }),
  )
  return { stackId, shortId }
}

test('TC-M-01: getBySlug WITH avatarStorageId → creator.avatarUrl === storage URL', async () => {
  const t = convexTest(schema, modules)
  const storageId = await seedStorageBlob(t)
  const { shortId } = await seedPublishedStack(t, {
    userId: 'user-m01',
    slug: 'creator-m01',
    creatorAvatarUrl: 'https://creator-row.example.com/avatar.jpg',
    avatarStorageId: storageId,
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

test('TC-M-03: getBySlug WITHOUT avatarStorageId but WITH stackImageUrl → creator row url used (SSRF-close)', async () => {
  const t = convexTest(schema, modules)
  const { shortId } = await seedPublishedStack(t, {
    userId: 'user-m03',
    slug: 'creator-m03',
    creatorAvatarUrl: 'https://creator-row.example.com/avatar.jpg',
    stackImageUrl: 'https://ssrf-target.example.com/secret.jpg',
  })

  const result = await t.query(api.stacks.getBySlug, { slug: `m-stack-${shortId}` })
  // Must NOT use stackImageUrl — must use creator row avatarUrl
  expect(result?.creator.avatarUrl).toBe('https://creator-row.example.com/avatar.jpg')
  expect(result?.creator.avatarUrl).not.toBe('https://ssrf-target.example.com/secret.jpg')
})

test('TC-M-04: listPublished WITH avatarStorageId → resolved storage URL', async () => {
  const t = convexTest(schema, modules)
  const storageId = await seedStorageBlob(t)
  await seedPublishedStack(t, {
    userId: 'user-m04',
    slug: 'creator-m04',
    creatorAvatarUrl: 'https://creator-row.example.com/avatar.jpg',
    avatarStorageId: storageId,
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

test('TC-M-06: listPublished WITHOUT avatarStorageId but WITH stackImageUrl → creator row url (not stackImageUrl)', async () => {
  const t = convexTest(schema, modules)
  await seedPublishedStack(t, {
    userId: 'user-m06',
    slug: 'creator-m06',
    creatorAvatarUrl: 'https://creator-row.example.com/avatar.jpg',
    stackImageUrl: 'https://ssrf-target.example.com/secret.jpg',
  })

  const results = await t.query(api.stacks.listPublished, {})
  const stack = results.find((s) => s.creator.name === 'Creator user-m06')
  expect(stack?.creator.avatarUrl).toBe('https://creator-row.example.com/avatar.jpg')
  expect(stack?.creator.avatarUrl).not.toBe('https://ssrf-target.example.com/secret.jpg')
})

test('TC-M-07: getForEdit returns avatarStorageId raw id when set', async () => {
  const t = convexTest(schema, modules)
  const storageId = await seedStorageBlob(t)
  const { stackId: _stackId, shortId } = await seedPublishedStack(t, {
    userId: 'user-m07',
    slug: 'creator-m07',
    avatarStorageId: storageId,
  })
  const asCreator = t.withIdentity({ tokenIdentifier: 'convex|user-m07' })

  const result = await asCreator.query(api.stacks.getForEdit, {
    slug: `creator-m07-stack-${shortId}`,
  })
  expect(result).not.toBeNull()
  // avatarStorageId must be returned as a raw id (not yet in the return shape → RED)
  expect((result as Record<string, unknown>)?.avatarStorageId).toBe(storageId)
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

test('TC-M-09: getForEdit avatarStorageId is present and stackImageUrl is not surfaced as avatar', async () => {
  const t = convexTest(schema, modules)
  const storageId = await seedStorageBlob(t)
  const { shortId } = await seedPublishedStack(t, {
    userId: 'user-m09',
    slug: 'creator-m09',
    avatarStorageId: storageId,
    stackImageUrl: 'https://ssrf-target.example.com/secret.jpg',
  })
  const asCreator = t.withIdentity({ tokenIdentifier: 'convex|user-m09' })

  const result = await asCreator.query(api.stacks.getForEdit, {
    slug: `creator-m09-stack-${shortId}`,
  }) as Record<string, unknown> | null
  expect(result).not.toBeNull()
  // avatarStorageId must be returned
  expect(result?.avatarStorageId).toBe(storageId)
  // stackImageUrl must NOT be surfaced as an avatar field
  expect(result?.avatarUrl).toBeUndefined()
})

// ---------------------------------------------------------------------------
// Group N — personalPageUrl validation via assertValidPersonalPageUrl (RED)
// ---------------------------------------------------------------------------

test('TC-N-01: create with https personalPageUrl is accepted', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-n01',
    slug: 'creator-n01',
  })

  const result = await asCreator.mutation(api.stacks.create, {
    ...minimalCreateArgs,
    personalPageUrl: 'https://example.com',
  })

  const row = await t.run(async (ctx: MutationCtx) => ctx.db.get(result._id))
  expect(row?.personalPageUrl).toBe('https://example.com')
})

test('TC-N-02: create with http personalPageUrl throws', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-n02',
    slug: 'creator-n02',
  })

  await expect(
    asCreator.mutation(api.stacks.create, {
      ...minimalCreateArgs,
      personalPageUrl: 'http://example.com',
    }),
  ).rejects.toThrow()
})

test('TC-N-03: create with javascript: personalPageUrl throws', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-n03',
    slug: 'creator-n03',
  })

  await expect(
    asCreator.mutation(api.stacks.create, {
      ...minimalCreateArgs,
      personalPageUrl: 'javascript:alert(1)',
    }),
  ).rejects.toThrow()
})

test('TC-N-04: create with data: personalPageUrl throws', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-n04',
    slug: 'creator-n04',
  })

  await expect(
    asCreator.mutation(api.stacks.create, {
      ...minimalCreateArgs,
      personalPageUrl: 'data:text/plain,hello',
    }),
  ).rejects.toThrow()
})

test('TC-N-05: create with malformed personalPageUrl throws', async () => {
  const t = convexTest(schema, modules)
  const { asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-n05',
    slug: 'creator-n05',
  })

  await expect(
    asCreator.mutation(api.stacks.create, {
      ...minimalCreateArgs,
      personalPageUrl: 'not a url!!!',
    }),
  ).rejects.toThrow()
})

test('TC-N-06: update with http personalPageUrl throws', async () => {
  const t = convexTest(schema, modules)
  const { stackId, asCreator } = await seedStackForUpdate(t, {
    userId: 'user-n06',
    slug: 'creator-n06',
  })

  await expect(
    asCreator.mutation(api.stacks.update, {
      stackId,
      personalPageUrl: 'http://example.com',
    }),
  ).rejects.toThrow()
})

test('TC-N-07: update with https personalPageUrl is accepted', async () => {
  const t = convexTest(schema, modules)
  const { stackId, asCreator } = await seedStackForUpdate(t, {
    userId: 'user-n07',
    slug: 'creator-n07',
  })

  await asCreator.mutation(api.stacks.update, {
    stackId,
    personalPageUrl: 'https://example.com',
  })

  const row = await t.run(async (ctx: MutationCtx) => ctx.db.get(stackId))
  expect(row?.personalPageUrl).toBe('https://example.com')
})

// ---------------------------------------------------------------------------
// Group O — accentPreset key validation, persistence, read (RED)
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
