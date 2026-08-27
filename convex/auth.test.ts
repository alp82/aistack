/// <reference types="vite/client" />
import betterAuthTest from '@convex-dev/better-auth/test'
import { convexTest } from 'convex-test'
import { beforeEach, expect, test, vi } from 'vitest'
import schema from './schema'

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mocks.sendEmail }
  },
}))

process.env.APP_URL = 'http://localhost:3019'
process.env.BETTER_AUTH_URL = 'http://localhost:3019'
process.env.BETTER_AUTH_SECRET = 'test-secret-that-is-at-least-32-characters'
process.env.RESEND_API_KEY = 'test-resend-key'
process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-google-id'
process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-google-secret'
process.env.GITHUB_OAUTH_CLIENT_ID = 'test-github-id'
process.env.GITHUB_OAUTH_CLIENT_SECRET = 'test-github-secret'

const modules = import.meta.glob('./**/*.{js,ts}')

beforeEach(() => {
  mocks.sendEmail.mockReset()
  mocks.sendEmail.mockResolvedValue({ data: { id: 'email-1' }, error: null })
})

test('the Convex auth route forwards the last-used cookie from a magic-link login', async () => {
  const t = convexTest(schema, modules)
  betterAuthTest.register(t)

  const signInResponse = await t.fetch('/api/auth/sign-in/magic-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3019',
    },
    body: JSON.stringify({
      email: 'reader@example.com',
      callbackURL: '/signin',
    }),
  })

  expect(signInResponse.status).toBe(200)
  const html = mocks.sendEmail.mock.calls[0]?.[0]?.html
  expect(html).toEqual(expect.stringContaining('/api/auth/magic-link/verify'))

  const encodedUrl = html.match(/href="([^"]*\/api\/auth\/magic-link\/verify[^"]*)"/)?.[1]
  expect(encodedUrl).toBeDefined()
  const url = new URL(encodedUrl.replaceAll('&amp;', '&'))

  const response = await t.fetch(`${url.pathname}${url.search}`, {
    method: 'GET',
    headers: { Origin: 'http://localhost:3019' },
  })

  expect(response.headers.get('set-cookie')).toContain('better-auth.session_token=')
  expect(response.headers.get('set-cookie')).toContain(
    'better-auth.last_used_login_method=magic-link',
  )
})
