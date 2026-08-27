/// <reference types="vite/client" />
/**
 * The stack page's own read query (#217 fallout).
 *
 * WHY THIS FILE EXISTS. `getCurrentByStackSlug` is what section 01 calls on
 * every stack page, and until this file nothing called it in a test. #213 added
 * three fields to the wire and to storage - per-atom `calls`, the
 * `inventory.calls` denominators, and the `cacheWriteTtl` split - and widened
 * `schema.ts` for all three. It did not widen the RETURNS validator here, and a
 * Convex returns validator refuses an undeclared field exactly the way an args
 * validator does.
 *
 * Nothing failed until a machine actually published a payload carrying them.
 * Then every stack page for that stack answered `ReturnsValidationError` and
 * rendered nothing. The fixtures in `measured.test.ts` predate #213, so they
 * could not have caught it: these carry the new fields on purpose.
 */
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import schema from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')

const USER = 'user_owner'

type StoredPayload = Doc<'measuredSnapshots'>['payload']
type PayloadV2 = Extract<StoredPayload, { schemaVersion: 2 }>

/** A payload from a CLI that ships every #213 field. */
function payloadWithCounts(): PayloadV2 {
  return {
    schemaVersion: 2,
    capturedAt: Date.now(),
    window: { days: 30, from: '2026-07-27', to: '2026-08-25' },
    harness: { name: 'claude-code', version: '2.1.245' },
    pricingTable: 'anthropic-list-2026-07-25',
    activity: {
      sessions: 459,
      activeDayDates: ['2026-08-01', '2026-08-02'],
      projectKeys: ['AAAAAAAAAAAAAAAAAAAAAA'],
      totalTokens: 1_000_000,
      cacheHitShare: 0.9,
      subagentShare: 0.07,
    },
    models: [
      {
        id: 'claude-opus-5',
        tokenShare: 1,
        tokens: {
          input: 10,
          output: 20,
          cacheWrite: 30,
          cacheRead: 40,
          // The split #213 put on the wire so the repricer can charge each
          // tier its own rate.
          cacheWriteTtl: { fiveMinute: 10, oneHour: 20, unsplit: 0 },
        },
        apiEquivalentUSD: 12.34,
      },
    ],
    inventory: {
      // The absolute count behind each share.
      builtinTools: [{ name: 'Bash', callShare: 0.713, calls: 22_634 }],
      mcpServers: [],
      skills: [{ name: 'grilling', callShare: 0.3067, calls: 50 }],
      subagents: [],
      slashCommands: [],
      withheld: {
        builtinTools: 1,
        mcpServers: 2,
        skills: 7,
        subagents: 1,
        slashCommands: 5,
      },
      // The denominator those counts need to be interpretable.
      calls: {
        builtinTools: 31_745,
        mcpServers: 9,
        skills: 163,
        subagents: 169,
        slashCommands: 649,
      },
    },
    coverage: {
      filesScanned: 646,
      filesUnreadable: 0,
      linesParsed: 170_912,
      linesFailed: 8,
    },
    excludedTokens: { unpriced: 0, synthetic: 0 },
  } as unknown as PayloadV2
}

type Ctx = Awaited<ReturnType<typeof convexTest>>

async function seedStack(t: Ctx) {
  return await t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: 'Owner',
      slug: 'owner-read',
      userId: USER,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    })
    // The query resolves a stack by the shortId suffix of the slug, so the
    // page's URL form is what a test has to ask for.
    const stackId = await ctx.db.insert('stacks', {
      name: 'My Stack',
      slug: 'my-stack-sidread',
      shortId: 'sidread',
      creatorId,
      oneLiner: 'A stack',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return { stackId }
  })
}

describe('getCurrentByStackSlug reads what the CLI publishes', () => {
  test('answers a payload carrying every #213 field', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payloadWithCounts(),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: 'my-stack-sidread',
    })

    expect(current).not.toBeNull()
    expect(current?.harnesses).toHaveLength(1)
  })

  test('carries the per-atom counts and their denominator through to the page', async () => {
    // Not just "does not throw": the counts are what the kit component reads,
    // so a validator that dropped them silently would be a second bug.
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payloadWithCounts(),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: 'my-stack-sidread',
    })
    const inventory = current?.harnesses[0]?.inventory

    expect(inventory?.builtinTools[0]).toMatchObject({
      name: 'Bash',
      calls: 22_634,
    })
    expect(inventory?.calls?.builtinTools).toBe(31_745)
  })

  test('carries the cache-write TTL split through to the page', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payloadWithCounts(),
    })

    const current = await t.query(api.measured.getCurrentByStackSlug, {
      slug: 'my-stack-sidread',
    })

    expect(current?.models[0]?.tokens.cacheWriteTtl).toEqual({
      fiveMinute: 10,
      oneHour: 20,
      unsplit: 0,
    })
  })
})

describe('getReconcileSuggestions resolves authored slugs through aliases (#294)', () => {
  test('a stack listing an older spelling is not asked to add the model again', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seedStack(t)
    await t.run(async (ctx) => {
      await ctx.db.insert('models', {
        name: 'Claude Opus 5',
        slug: 'claude-opus-5',
        shortId: 'sid-opus5',
        aliases: ['claude-opus-50'],
        provider: 'Anthropic',
        category: 'coding',
        reviewStatus: 'approved',
        createdAt: 1,
        updatedAt: 1,
      })
      await ctx.db.patch(stackId, {
        modelSubscriptions: [{ modelSlug: 'claude-opus-50', role: 'primary' }],
      })
    })
    await t.mutation(internal.measured.publishSnapshot, {
      stackId,
      payload: payloadWithCounts(),
    })

    const result = await t
      .withIdentity({ tokenIdentifier: `convex|${USER}`, subject: USER })
      .query(api.measured.getReconcileSuggestions, { stackId })

    expect(result.suggestions.filter((s) => s.atomKind === 'model')).toEqual([])
  })
})
