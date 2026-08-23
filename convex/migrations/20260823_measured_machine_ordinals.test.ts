/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { internal } from '../_generated/api'
import schema from '../schema'

const modules = Object.fromEntries(
  Object.entries(import.meta.glob('../**/*.{js,ts}')).map(([key, loader]) => [
    key.replace(/^\.\//, '../migrations/'),
    loader,
  ])
)

const MIGRATION = internal.migrations['20260823_measured_machine_ordinals']
type Ctx = Awaited<ReturnType<typeof convexTest>>

function payload(capturedAt: number) {
  return {
    schemaVersion: 1 as const,
    capturedAt,
    window: { days: 30, from: '2026-06-26', to: '2026-07-25' },
    harness: { name: 'claude-code', version: null },
    pricingTable: null,
    activity: {
      sessions: 1,
      activeDays: 1,
      projects: 1,
      totalTokens: 1,
      cacheHitShare: 0,
      subagentShare: 0,
    },
    models: [],
    inventory: {
      builtinTools: [],
      mcpServers: [],
      skills: [],
      subagents: [],
      slashCommands: [],
      withheld: {
        builtinTools: 0,
        mcpServers: 0,
        skills: 0,
        subagents: 0,
        slashCommands: 0,
      },
    },
    coverage: {
      filesScanned: 1,
      filesUnreadable: 0,
      linesParsed: 1,
      linesFailed: 0,
    },
    excludedTokens: { unpriced: 0, synthetic: 0 },
  }
}

async function seedLegacyStack(t: Ctx) {
  return await t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: 'Owner',
      slug: 'owner',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: 1,
    })
    const stackId = await ctx.db.insert('stacks', {
      name: 'Stack',
      slug: 'stack',
      shortId: 'stack-id',
      creatorId,
      oneLiner: 'A stack',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: true,
      createdAt: 1,
      updatedAt: 1,
    })
    for (const [receivedAt, machine] of [
      [100, 'z-machine'],
      [200, 'a-machine'],
      [300, 'z-machine'],
    ] as const) {
      await ctx.db.insert('measuredSnapshots', {
        stackId,
        capturedAt: receivedAt,
        receivedAt,
        schemaVersion: 1,
        harness: 'claude-code',
        machine,
        payload: payload(receivedAt),
      })
    }
    return stackId
  })
}

describe('20260823_measured_machine_ordinals', () => {
  test('backfills first-sight positions and is idempotent', async () => {
    const t = convexTest(schema, modules)
    await seedLegacyStack(t)

    expect(await t.action(MIGRATION.run, {})).toEqual({
      corrected: 0,
      inserted: 2,
    })
    const rows = await t.run((ctx) =>
      ctx.db.query('measuredMachineOrdinals').collect()
    )
    expect(
      rows
        .sort((a, b) => a.ordinal - b.ordinal)
        .map((row) => [row.machine, row.ordinal, row.assignedAt])
    ).toEqual([
      ['z-machine', 1, 100],
      ['a-machine', 2, 200],
    ])
    expect(await t.action(MIGRATION.run, {})).toEqual({
      corrected: 0,
      inserted: 0,
    })
  })

  test('corrects a position assigned before legacy rows were read', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedLegacyStack(t)
    await t.run((ctx) =>
      ctx.db.insert('measuredMachineOrdinals', {
        stackId,
        machine: 'a-machine',
        ordinal: 1,
        assignedAt: 200,
      })
    )

    expect(await t.action(MIGRATION.run, {})).toEqual({
      corrected: 1,
      inserted: 1,
    })
    const rows = await t.run((ctx) =>
      ctx.db.query('measuredMachineOrdinals').collect()
    )
    expect(
      rows
        .sort((a, b) => a.ordinal - b.ordinal)
        .map((row) => [row.machine, row.ordinal])
    ).toEqual([
      ['z-machine', 1],
      ['a-machine', 2],
    ])
  })
})
