/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')
const USER = 'user_models'
const OTHER = 'user_other'

function modelRow(slug: string, name: string, aliases?: string[]) {
  return {
    name,
    slug,
    shortId: `sid-${slug}`.slice(0, 12),
    aliases,
    provider: 'Anthropic',
    category: 'coding' as const,
    reviewStatus: 'approved' as const,
    createdAt: 1,
    updatedAt: 1,
  }
}

function payload(models: Array<{ id: string; tokenShare: number; tokens: number }>) {
  const today = new Date().toISOString().slice(0, 10)
  return {
    schemaVersion: 2 as const,
    capturedAt: Date.now(),
    window: { days: 1, from: today, to: today },
    harness: { name: 'claude-code', version: '2.1.245' },
    pricingTable: 'anthropic-list-2026-07-25',
    activity: {
      sessions: 1,
      activeDayDates: [today],
      projectKeys: ['AAAAAAAAAAAAAAAAAAAAAA'],
      totalTokens: models.reduce((n, m) => n + m.tokens, 0),
      cacheHitShare: 0,
      subagentShare: 0,
    },
    models: models.map((m) => ({
      id: m.id,
      tokenShare: m.tokenShare,
      tokens: { input: m.tokens, output: 0, cacheWrite: 0, cacheRead: 0 },
    })),
    inventory: {
      builtinTools: [],
      mcpServers: [],
      skills: [],
      subagents: [],
      slashCommands: [],
      withheld: { builtinTools: 0, mcpServers: 0, skills: 0, subagents: 0, slashCommands: 0 },
      calls: { builtinTools: 0, mcpServers: 0, skills: 0, subagents: 0, slashCommands: 0 },
    },
    coverage: { filesScanned: 1, filesUnreadable: 0, linesParsed: 1, linesFailed: 0 },
    excludedTokens: { unpriced: 0, synthetic: 0 },
  }
}

/** The day wire the CLI ships beside the payload; the fold reads these rows. */
function days(models: Array<{ id: string; tokens: number }>) {
  const today = new Date().toISOString().slice(0, 10)
  return {
    aggregateVersion: 'measured-days/v1',
    days: [
      {
        date: today,
        usage: {
          harnesses: [
            {
              harness: 'claude-code',
              sessions: 1,
              projectKeys: ['AAAAAAAAAAAAAAAAAAAAAA'],
              models: models.map((m) => ({
                model: m.id,
                tokens: { input: m.tokens, output: 0, cacheWrite: 0, cacheRead: 0 },
              })),
              subagentTokens: 0,
              excludedTokens: { unpriced: 0, synthetic: 0 },
            },
          ],
        },
      },
    ],
  }
}

const MEASURED = [
  { id: 'claude-fable-5', tokenShare: 0.25, tokens: 25 },
  { id: 'claude-opus-5', tokenShare: 0.75, tokens: 75 },
]

async function sync(t: ReturnType<typeof convexTest>, stackId: Id<'stacks'>) {
  await t.mutation(internal.measured.publishSnapshot, {
    stackId,
    payload: payload(MEASURED),
    measuredDays: days(MEASURED),
  })
}

async function seed(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    await ctx.db.insert('models', modelRow('claude-opus-5', 'Claude Opus 5'))
    await ctx.db.insert('models', modelRow('claude-fable-5', 'Claude Fable 5', ['fable-5']))
    await ctx.db.insert('models', modelRow('gpt-5.4', 'GPT-5.4'))
    const creatorId = await ctx.db.insert('creators', {
      name: 'Owner',
      slug: 'owner-models',
      userId: USER,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    })
    const stackId = await ctx.db.insert('stacks', {
      name: 'My Stack',
      slug: 'my-stack-sidmodels',
      shortId: 'sidmodels',
      creatorId,
      oneLiner: 'A stack',
      toolSubscriptions: [],
      // Picks in stored order: one the fold also measures (older spelling),
      // one no adapter sees, one that names no row.
      modelSubscriptions: [
        { modelSlug: 'gpt-5.4', description: 'chat app' },
        { modelSlug: 'fable-5' },
        { modelSlug: 'nope' },
      ],
      hasUsageComponent: false,
      published: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return { stackId }
  })
}

const SLUG = 'my-stack-sidmodels'

describe('the stack model list is derived from measured usage (#338)', () => {
  test('measured models by share first, then picks, no duplicates, no roles', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seed(t)
    await sync(t, stackId)

    const stack = await t.query(api.stacks.getBySlug, { slug: SLUG })
    expect(stack?.models.map((m) => [m.slug, m.measured, m.tokenShare])).toEqual([
      ['claude-opus-5', true, 0.75],
      ['claude-fable-5', true, 0.25],
      ['gpt-5.4', false, null],
    ])
    expect(stack?.models[2].description).toBe('chat app')
    expect(Object.keys(stack?.models[0] ?? {})).not.toContain('role')

    const summary = await t.query(api.stacks.getPublicSummary, { slug: SLUG })
    expect(summary?.models).toEqual(['Claude Opus 5', 'Claude Fable 5', 'GPT-5.4'])
    expect(summary?.modelCount).toBe(3)
  })

  test('with nothing measured the list is the picks in stored order', async () => {
    const t = convexTest(schema, modules)
    await seed(t)
    const stack = await t.query(api.stacks.getBySlug, { slug: SLUG })
    expect(stack?.models.map((m) => m.slug)).toEqual(['gpt-5.4', 'claude-fable-5'])
  })

  test('hide is display only: the public list drops it, usage keeps counting it', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seed(t)
    await sync(t, stackId)
    const owner = t.withIdentity({ tokenIdentifier: `convex|${USER}`, subject: USER })
    await owner.mutation(api.stacks.setModelHidden, {
      stackId,
      modelSlug: 'claude-opus-5',
      hidden: true,
    })

    const stack = await t.query(api.stacks.getBySlug, { slug: SLUG })
    expect(stack?.models.map((m) => m.slug)).toEqual(['claude-fable-5', 'gpt-5.4'])
    const summary = await t.query(api.stacks.getPublicSummary, { slug: SLUG })
    expect(summary?.models).toEqual(['Claude Fable 5', 'GPT-5.4'])

    const usage = await t.query(api.measured.getUsageByStackSlug, { slug: SLUG })
    expect(usage?.current?.models.map((m) => m.id)).toContain('claude-opus-5')

    const mine = await owner.query(api.stacks.listMeasuredModels, { stackId })
    expect(mine.map((m) => [m.slug, m.hidden])).toEqual([
      ['claude-opus-5', true],
      ['claude-fable-5', false],
    ])

    await owner.mutation(api.stacks.setModelHidden, {
      stackId,
      modelSlug: 'claude-opus-5',
      hidden: false,
    })
    const back = await t.query(api.stacks.getBySlug, { slug: SLUG })
    expect(back?.models[0].slug).toBe('claude-opus-5')
  })

  test('only the owner can hide', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seed(t)
    await expect(
      t
        .withIdentity({ tokenIdentifier: `convex|${OTHER}`, subject: OTHER })
        .mutation(api.stacks.setModelHidden, { stackId, modelSlug: 'gpt-5.4', hidden: true })
    ).rejects.toThrow(/Not authorized/)
  })
})
