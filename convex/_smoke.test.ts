import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')

test('convex-test edge-runtime smoke', async () => {
  const t = convexTest(schema, modules)
  const got = await t.run(async () => 'ok' as const)
  expect(got).toBe('ok')
})
