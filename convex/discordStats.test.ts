/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { internal } from './_generated/api'
import schema from './schema'
import type { Doc } from './_generated/dataModel'
import { discordRange, contextForDiscord } from './discordStats'
import { catalogFrom } from './lib/modelCatalog'
import { emptyWorkflowWindow } from './lib/workflow'
const modules = import.meta.glob('./**/*.{js,ts}')
const day = '2026-09-12'
async function seed(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: 'Alice',
      slug: 'alice',
      userId: 'alice',
      discordUserId: '123',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: 1,
    })
    const stackId = await ctx.db.insert('stacks', {
      name: 'Alice stack',
      slug: 'alice-stack',
      shortId: 'abcdef',
      creatorId,
      oneLiner: 'Tools',
      toolSubscriptions: [],
      hasUsageComponent: false,
      publishCost: true,
      createdAt: 1,
      updatedAt: 1,
    })
    return { creatorId, stackId }
  })
}
function usage(amounts = [90, 5, 4.999, 0.001]) {
  return {
    harnesses: [
      {
        harness: 'codex',
        sessions: 1,
        projectKeys: [],
        subagentTokens: 0,
        excludedTokens: { unpriced: 0, synthetic: 0 },
        models: amounts.map((input, i) => ({
          model: `unknown-${i}`,
          tokens: { input, output: 0, cacheRead: 0, cacheWrite: 0 },
          ...(i === 0 ? { usd: 2, pricingTable: 'receipt-source' } : {}),
        })),
      },
    ],
  }
}
describe('Discord dated data contract', () => {
  test.each([1, 7, 30, 180])(
    '%i inclusive dates and immediately preceding dates',
    (days) => {
      const r = discordRange(day, days),
        span = (a: string, b: string) =>
          (Date.parse(b) - Date.parse(a)) / 86400000 + 1
      expect(span(r.current.from, r.current.to)).toBe(days)
      expect(span(r.previous.from, r.previous.to)).toBe(days)
      expect(span(r.previous.to, r.current.from)).toBe(2)
      expect(discordRange(r.endDate, days).endDate).toBe(day)
    },
  )
  test.each([1, 7, 30, 180])(
    'bounds the database read to %i dates per period',
    async (days) => {
      const t = convexTest(schema, modules),
        target = await seed(t)
      const range = discordRange(day, days)
      await t.run(async (ctx) => {
        const before = new Date(Date.parse(range.previous.from) - 86400000)
          .toISOString()
          .slice(0, 10)
        for (const [date, amount] of [
          [before, 999],
          [range.previous.from, 2],
          [range.current.from, 3],
          ['2026-09-13', 999],
        ] as const) {
          await ctx.db.insert('measuredDays', {
            stackId: target.stackId,
            date,
            capturedAt: 1,
            receivedAt: 1,
            aggregateVersion: 'measured-days/v1',
            fingerprint: date,
            usage: usage([amount]),
          })
        }
      })
      const answer = await t.query(internal.discordStats.readAnswer, {
        ...target,
        endDate: day,
        days,
      })
      expect(answer?.current.usage?.totalTokens).toBe(3)
      expect(answer?.previous.usage?.totalTokens).toBe(2)
      expect(answer?.range).toEqual(range)
    },
  )
  test('rejects invalid dates and ranges', () => {
    for (const days of [0, 181, 1.5, NaN])
      expect(() => discordRange(day, days)).toThrow()
    expect(() => discordRange('2026-02-30')).toThrow()
  })
  test('creator recovery, search, stable first stack and pinned deletion', async () => {
    const t = convexTest(schema, modules),
      target = await seed(t)
    expect(
      await t.query(internal.discordStats.resolveCreator, {
        discordUserId: 'other',
      }),
    ).toEqual({ kind: 'unlinked' })
    expect(
      await t.query(internal.discordStats.resolveCreator, {
        discordUserId: 'other',
        handle: ' @alice ',
      }),
    ).toEqual({ kind: 'target', ...target })
    expect(
      await t.query(internal.discordStats.searchCreators, { text: '@ali' }),
    ).toMatchObject([{ handle: 'alice' }])
    expect(
      await t.query(internal.discordStats.resolveCreator, {
        discordUserId: '123',
        handle: 'missing',
      }),
    ).toEqual({ kind: 'not-found' })
    const second = await t.run(async (ctx) => {
      const stack = await ctx.db.get(target.stackId)
      if (!stack) throw Error()
      const { _id, _creationTime, ...fields } = stack
      return ctx.db.insert('stacks', fields)
    })
    const first = [target.stackId, second].sort((a, b) => a.localeCompare(b))[0]
    expect(
      await t.query(internal.discordStats.resolveCreator, {
        discordUserId: '123',
      }),
    ).toMatchObject({ stackId: first })
    await t.run((ctx) => ctx.db.delete(target.stackId))
    expect(
      await t.query(internal.discordStats.readAnswer, {
        ...target,
        endDate: day,
        days: 7,
      }),
    ).toBeNull()
    await t.run((ctx) => ctx.db.delete(second))
    expect(
      await t.query(internal.discordStats.resolveCreator, {
        discordUserId: '123',
      }),
    ).toEqual({ kind: 'no-stack', creatorId: target.creatorId })
  })
  test('missing versus zero, exact threshold, pricing coverage and consent reread', async () => {
    const t = convexTest(schema, modules),
      target = await seed(t),
      args = { ...target, endDate: day, days: 1 }
    expect(
      (await t.query(internal.discordStats.readAnswer, args))?.current.usage,
    ).toBeNull()
    await t.run(async (ctx) => {
      for (const [date, data] of [
        [day, usage()],
        ['2026-09-11', usage([0])],
        ['2026-09-10', usage([9999])],
      ] as const)
        await ctx.db.insert('measuredDays', {
          stackId: target.stackId,
          date,
          capturedAt: 1,
          receivedAt: 1,
          aggregateVersion: 'measured-days/v1',
          fingerprint: date,
          usage: data,
        })
    })
    const a = await t.query(internal.discordStats.readAnswer, args)
    expect(a?.current.usage?.totalTokens).toBe(100)
    expect(a?.current.modelIds).toEqual(['unknown-0', 'unknown-1'])
    expect(a?.current.hasMoreModels).toBe(true)
    expect(a?.previous.usage?.totalTokens).toBe(0)
    expect(a?.current.usage?.cost).toEqual({
      usd: 2,
      estimated: true,
      pricedShare: 0.9,
      pricingTables: ['receipt-source'],
    })
    expect(a?.selectedTokenHarness).toBe('codex')
    expect(
      (
        await t.query(internal.discordStats.readAnswer, {
          ...args,
          tokenHarness: 'absent',
          contextHarness: 'absent',
        })
      )?.selectedContextHarness,
    ).toBe('absent')
    await t.run((ctx) =>
      ctx.db.patch(target.stackId, {
        publishCost: false,
        publishWorkflow: false,
      }),
    )
    const hidden = await t.query(internal.discordStats.readAnswer, args)
    expect(hidden?.current.usage?.cost).toBeNull()
    expect(
      hidden?.current.usage?.models.every(
        (m) => m.usd === null && m.pricingTables.length === 0,
      ),
    ).toBe(true)
    expect(JSON.stringify(hidden)).not.toContain('machine')
  })
  test('all-machine context folds atoms before medians, with deterministic window evidence', async () => {
    const t = convexTest(schema, modules),
      target = await seed(t)
    const rows = await t.run(async (ctx) => {
      for (const [machine, calls, bucket, window] of [
        ['z', 1, 36, 200000],
        ['a', 9, 30, 100000],
      ] as const) {
        const empty = emptyWorkflowWindow('workflow-aggregates/v3', undefined)
        await ctx.db.insert('measuredDays', {
          stackId: target.stackId,
          machine,
          date: day,
          capturedAt: 1,
          receivedAt: 1,
          aggregateVersion: 'measured-days/v1',
          fingerprint: machine,
          workflow: {
            date: day,
            git: {
              ...empty.git,
              changedLinesPerCommit: [],
              changedLinesByExtension: [],
              weekdayHourCells: [],
            },
            parallelProjects: 0,
            harnesses: [
              {
                harness: 'codex',
                sessions: calls,
                startHours: [],
                activity: [],
                context: {
                  bucketRuleVersion: 'log-buckets/v2',
                  calls: { main: [{ bucket, calls }], subagents: [] },
                  firstCalls: { main: [] },
                  firstCallHarnessTokens: calls * 100,
                  firstCallInstructionsTokens: calls * 200,
                  firstCallCount: calls,
                  maxContext: 100000,
                  compactions: calls,
                  window,
                },
              },
            ],
          },
        })
      }
      return ctx.db.query('measuredDays').collect()
    })
    const catalog = catalogFrom([], []),
      fold = contextForDiscord(rows, catalog)
    expect(fold).toEqual(contextForDiscord([...rows].reverse(), catalog))
    expect(fold[0]).toMatchObject({
      calls: 10,
      window: 200000,
      harnessTokens: 100,
      instructionsTokens: 200,
      compactions: 10,
    })
    expect(fold[0].medianCall).toBeLessThan(40000)
    expect(
      (
        await t.query(internal.discordStats.readAnswer, {
          ...target,
          endDate: day,
          days: 1,
        })
      )?.current.context,
    ).toEqual(fold)
    await t.run((ctx) =>
      ctx.db.patch(target.stackId, { publishWorkflow: false }),
    )
    expect(
      (
        await t.query(internal.discordStats.readAnswer, {
          ...target,
          endDate: day,
          days: 1,
        })
      )?.current.context,
    ).toEqual([])
  })
  test('bundle charged once, annual normalization, zero sponsorship and five-row fill', async () => {
    const t = convexTest(schema, modules),
      target = await seed(t)
    await t.run(async (ctx) => {
      const base = {
        shortId: 'x',
        reviewStatus: 'approved' as const,
        createdAt: 1,
        updatedAt: 1,
      }
      await ctx.db.insert('bundles', {
        ...base,
        name: 'Bundle',
        slug: 'bundle',
        toolSlugs: [],
        tiers: [
          {
            tierId: 'paid',
            name: 'Paid',
            pricing: {
              pricingType: 'fixed',
              fixed: { amount: 240, period: 'year', currency: 'USD' },
            },
          },
        ],
      })
      const subs: Doc<'stacks'>['toolSubscriptions'] = []
      for (let i = 0; i < 7; i++) {
        await ctx.db.insert('tools', {
          ...base,
          name: `Tool ${i}`,
          slug: `tool-${i}`,
          categories: [],
          tiers: [],
          iconUrl: i === 0 ? 'https://example.com/icon.png' : undefined,
        })
        subs.push({
          toolSlug: `tool-${i}`,
          kind: 'main',
          primaryUsageLabel: 'Coding',
          priceKind: i === 0 ? 'bundle' : 'sponsored',
          bundleSlug: i === 0 ? 'bundle' : undefined,
          price: {
            pricingType: 'fixed',
            fixed: { amount: 999, period: 'month', currency: 'USD' },
          },
        })
      }
      await ctx.db.patch(target.stackId, {
        toolSubscriptions: subs,
        bundleSubscriptions: [
          { bundleSlug: 'bundle', tierId: 'paid' },
          { bundleSlug: 'bundle', tierId: 'paid' },
        ],
      })
    })
    const a = await t.query(internal.discordStats.readAnswer, {
      ...target,
      endDate: day,
      days: 30,
    })
    expect(a?.subscriptions.monthlyUSD).toBe(20)
    expect(a?.subscriptions.rows).toHaveLength(8)
    expect(a?.subscriptions.preview).toHaveLength(5)
    expect(a?.subscriptions.preview[0]).toMatchObject({
      id: 'bundle:bundle',
      monthlyUSD: 20,
    })
    expect(a?.subscriptions.preview[1]).toMatchObject({
      id: 'tool:tool-0',
      monthlyUSD: 0,
      state: 'included',
      iconUrl: 'https://example.com/icon.png',
    })
    await t.run(async (ctx) => {
      const stack = await ctx.db.get(target.stackId)
      await ctx.db.patch(target.stackId, {
        bundleSubscriptions: [],
        toolSubscriptions: stack?.toolSubscriptions.filter(
          (s) => s.priceKind === 'sponsored',
        ),
      })
    })
    const b = await t.query(internal.discordStats.readAnswer, {
      ...target,
      endDate: day,
      days: 7,
    })
    expect(b?.subscriptions.monthlyUSD).toBe(0)
    expect(b?.subscriptions.preview).toHaveLength(5)
    expect(b?.subscriptions.preview.every((r) => r.state === 'sponsored')).toBe(
      true,
    )
  })
})
