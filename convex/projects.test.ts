/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { normalizeProjectUrl } from './projects'
import schema from './schema'
import { api } from './_generated/api'
import type { MutationCtx } from './_generated/server'

const modules = import.meta.glob('./**/*.{js,ts}')

// ---------------------------------------------------------------------------
// Unit tests for normalizeProjectUrl (pure function, no DB needed)
// ---------------------------------------------------------------------------

describe('normalizeProjectUrl', () => {
  // TC-N-01: undefined returns undefined
  test('TC-N-01: undefined input returns undefined', () => {
    expect(normalizeProjectUrl(undefined)).toBeUndefined()
  })

  // TC-N-02: empty string returns undefined
  test('TC-N-02: empty string returns undefined', () => {
    expect(normalizeProjectUrl('')).toBeUndefined()
  })

  // TC-N-03: whitespace-only string returns undefined
  test('TC-N-03: whitespace-only string returns undefined', () => {
    expect(normalizeProjectUrl('   ')).toBeUndefined()
  })

  // TC-N-04: scheme-less "example.com" is prefixed with https:// and returns normalized href
  test('TC-N-04: scheme-less "example.com" is stored as "https://example.com/"', () => {
    const result = normalizeProjectUrl('example.com')
    expect(result).toBe('https://example.com/')
  })

  // TC-N-05: scheme-less "example.com/path" is prefixed with https://
  test('TC-N-05: scheme-less "example.com/path" becomes "https://example.com/path"', () => {
    const result = normalizeProjectUrl('example.com/path')
    expect(result).toBe('https://example.com/path')
  })

  // TC-N-06: "https://x.com" remains https and gets trailing slash from URL parser
  test('TC-N-06: already-https URL is returned as parsed href (trailing slash)', () => {
    const result = normalizeProjectUrl('https://x.com')
    expect(result).toBe('https://x.com/')
  })

  // TC-N-07: "http://x.com/page" is allowed and returned as-is (http is accepted)
  test('TC-N-07: http:// URL is allowed and returns normalized href', () => {
    const result = normalizeProjectUrl('http://x.com/page')
    expect(result).toBe('http://x.com/page')
  })

  // TC-N-08: "javascript:alert(1)" is disallowed — it becomes "https://javascript:alert(1)"
  //   which fails URL parsing (invalid port), so normalizeProjectUrl throws 'Invalid URL'.
  test('TC-N-08: "javascript:alert(1)" (scheme-less interpretation) throws Invalid URL', () => {
    expect(() => normalizeProjectUrl('javascript:alert(1)')).toThrow()
  })

  // TC-N-09: an unparseable string throws
  test('TC-N-09: unparseable string (e.g. with spaces) throws Invalid URL', () => {
    expect(() => normalizeProjectUrl('not a url at all !!!')).toThrow('Invalid URL')
  })

  // TC-N-10: "data:text/plain,hello" — not http(s), throws "Only http and https URLs are allowed"
  //   "data:text/plain,hello" matches https?:// ? No → becomes "https://data:text/plain,hello"
  //   which fails parse → throws Invalid URL. Behavior: throws (either message is fine).
  test('TC-N-10: "data:text/plain,hello" throws', () => {
    expect(() => normalizeProjectUrl('data:text/plain,hello')).toThrow()
  })

  // TC-N-11: "ftp://example.com" — does not start with https?://, so is treated as a scheme-less
  //   string and prefixed with "https://", yielding "https://ftp://example.com". The URL parser
  //   accepts this as host="ftp", path="//example.com", so it returns a mangled-but-valid https URL
  //   rather than throwing. This documents the actual behavior (no SSRF risk since protocol is https).
  test('TC-N-11: "ftp://example.com" is treated as scheme-less and returns a mangled https URL', () => {
    const result = normalizeProjectUrl('ftp://example.com')
    // The URL constructor parses "https://ftp://example.com" as https://ftp//example.com
    expect(result).toMatch(/^https:\/\//)
    expect(result).not.toBeUndefined()
  })

  // TC-N-12: leading/trailing whitespace is trimmed before processing
  test('TC-N-12: whitespace around a valid URL is trimmed', () => {
    const result = normalizeProjectUrl('  https://trimmed.com  ')
    expect(result).toBe('https://trimmed.com/')
  })
})

// ---------------------------------------------------------------------------
// Integration tests via convex-test — createProject normalizes URLs at the DB layer
// ---------------------------------------------------------------------------

async function seedAuthenticatedCreator(
  t: ReturnType<typeof convexTest>,
  opts: { userId: string; slug: string },
) {
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
  // A stack is required before createProject (no stackId arg falls back to first stack).
  const stackId = await t.run(async (ctx: MutationCtx) => {
    const now = Date.now()
    return ctx.db.insert('stacks', {
      name: 'Test Stack',
      slug: 'test-stack',
      shortId: `STK${opts.userId}`,
      creatorId,
      oneLiner: 'test',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      createdAt: now,
      updatedAt: now,
    })
  })
  const asCreator = t.withIdentity({ tokenIdentifier: `convex|${opts.userId}` })
  return { creatorId, stackId, asCreator }
}

// TC-N-13: createProject with a scheme-less URL stores the https-prefixed href
test('TC-N-13: createProject with scheme-less "github.com/user/repo" stores "https://github.com/user/repo"', async () => {
  const t = convexTest(schema, modules)
  const { stackId, asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-n13',
    slug: 'creator-n13',
  })

  const result = await asCreator.mutation(api.projects.createProject, {
    name: 'Scheme-less URL Project',
    url: 'github.com/user/repo',
    stackId,
  })

  const project = await t.run(async (ctx: MutationCtx) => ctx.db.get(result._id))
  expect(project?.url).toBe('https://github.com/user/repo')
})

// TC-N-14: createProject with an invalid URL throws
test('TC-N-14: createProject with unparseable URL throws', async () => {
  const t = convexTest(schema, modules)
  const { stackId, asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-n14',
    slug: 'creator-n14',
  })

  await expect(
    asCreator.mutation(api.projects.createProject, {
      name: 'Bad URL Project',
      url: 'not a url at all !!!',
      stackId,
    }),
  ).rejects.toThrow()
})

// TC-N-15: updateProject with a scheme-less URL normalizes to https at the DB layer
test('TC-N-15: updateProject with scheme-less URL stores https-prefixed href', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId, asCreator } = await seedAuthenticatedCreator(t, {
    userId: 'user-n15',
    slug: 'creator-n15',
  })

  // Insert the project directly so we control the initial state.
  const projectId = await t.run(async (ctx: MutationCtx) => {
    const now = Date.now()
    return ctx.db.insert('projects', {
      name: 'Original',
      slug: 'original',
      shortId: 'PRJn15',
      creatorId,
      stackId,
      source: 'web',
      published: false,
      createdAt: now,
      updatedAt: now,
    })
  })

  await asCreator.mutation(api.projects.updateProject, {
    projectId,
    url: 'example.org/page',
  })

  const project = await t.run(async (ctx: MutationCtx) => ctx.db.get(projectId))
  expect(project?.url).toBe('https://example.org/page')
})
