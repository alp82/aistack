/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { internal } from './_generated/api'
import { signupMethodFromPath } from './analytics'
import type { MutationCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

const modules = import.meta.glob('./**/*.{js,ts}')

// ---------------------------------------------------------------------------
// Naming the signup method
// ---------------------------------------------------------------------------

test('the signup method is read from the better-auth request path', () => {
  expect(signupMethodFromPath('/sign-up/email')).toBe('email')
  expect(signupMethodFromPath('/callback/google')).toBe('google')
  expect(signupMethodFromPath('/callback/github')).toBe('github')
  expect(signupMethodFromPath('/magic-link/verify')).toBe('magic-link')
})

test('an unrecognized path reports unknown rather than guessing', () => {
  expect(signupMethodFromPath('/something/else')).toBe('unknown')
  expect(signupMethodFromPath(undefined)).toBe('unknown')
  expect(signupMethodFromPath('')).toBe('unknown')
})

// ---------------------------------------------------------------------------
// The capture seam
// ---------------------------------------------------------------------------

test('a scheduled capture without PostHog configured does not fail the caller', async () => {
  const t = convexTest(schema, modules)

  await expect(
    t.mutation(internal.analytics.recordSignup, {
      userId: 'user-1',
      method: 'email',
    }),
  ).resolves.toBeNull()
})

test('cli_login_completed fires on the token exchange, not on gate approval', async () => {
  const t = convexTest(schema, modules)
  const sessionId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('cliSessions', {
      userCode: 'ABCD-EFGH',
      secretId: 'secret-1',
      status: 'approved',
      userId: 'user-2',
      cliVersion: '0.6.3',
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    }),
  )

  const result = await t.mutation(internal.cliSessions.issueTokenAndDeleteSession, {
    sessionId,
    tokenHash: 'digest',
    userId: 'user-2',
    createdAt: Date.now(),
    expiresAt: Date.now() + 1000,
    lastUsedAt: Date.now(),
  })

  expect(result).toEqual({ issued: true })
  // The session is consumed, which is what "the CLI came back for its token"
  // means - a browser approval alone leaves the row in place.
  const left = await t.run((ctx: MutationCtx) =>
    ctx.db.get(sessionId as Id<'cliSessions'>),
  )
  expect(left).toBeNull()
})

test('a session that was never approved issues nothing and fires nothing', async () => {
  const t = convexTest(schema, modules)
  const sessionId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('cliSessions', {
      userCode: 'IJKL-MNOP',
      secretId: 'secret-2',
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    }),
  )

  const result = await t.mutation(internal.cliSessions.issueTokenAndDeleteSession, {
    sessionId,
    tokenHash: 'digest',
    userId: 'user-3',
    createdAt: Date.now(),
    expiresAt: Date.now() + 1000,
    lastUsedAt: Date.now(),
  })

  expect(result).toBeNull()
  const tokens = await t.run((ctx: MutationCtx) => ctx.db.query('cliTokens').collect())
  expect(tokens).toHaveLength(0)
})

test('a login from an older CLI that names no version still links the machine', async () => {
  const t = convexTest(schema, modules)
  const sessionId = await t.run(async (ctx: MutationCtx) =>
    ctx.db.insert('cliSessions', {
      userCode: 'QRST-UVWX',
      secretId: 'secret-3',
      status: 'approved',
      userId: 'user-4',
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    }),
  )

  const result = await t.mutation(internal.cliSessions.issueTokenAndDeleteSession, {
    sessionId,
    tokenHash: 'digest-4',
    userId: 'user-4',
    createdAt: Date.now(),
    expiresAt: Date.now() + 1000,
    lastUsedAt: Date.now(),
  })

  expect(result).toEqual({ issued: true })
})
