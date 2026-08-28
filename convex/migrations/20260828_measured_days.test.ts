/// <reference types="vite/client" />
import { dayFingerprint } from '@aistack/workflow-rules'
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import { internal } from '../_generated/api'
import type { Doc } from '../_generated/dataModel'
import schema from '../schema'

const modules = Object.fromEntries(
  Object.entries(import.meta.glob('../**/*.{js,ts}')).map(([key, loader]) => [
    key.replace(/^\.\//, '../migrations/'),
    loader,
  ])
)

const MIGRATION = internal.migrations['20260828_measured_days']

function day(date: string): Doc<'measuredWorkflowDays'>['day'] {
  return {
    date,
    harnesses: [],
    git: {
      testFileRuleVersion: 'test-file-rules/v1',
      fileTypeRuleVersion: 'file-type-rules/v1',
      commitSetRuleVersion: 'commit-set-rules/v1',
      commits: 3,
      lateNightCommits: 0,
      additions: 1,
      removals: 1,
      changedLinesPerCommit: [2],
      testFileCommits: 0,
      changedLinesByExtension: [],
      withheldExtensionLines: 0,
      weekdayHourCells: [],
    },
  }
}

test('copies workflow day rows into measuredDays once, skipping days already there', async () => {
  const t = convexTest(schema, modules)
  const stackId = await t.run(async (ctx) => {
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
    for (const date of ['2026-08-20', '2026-08-21']) {
      await ctx.db.insert('measuredWorkflowDays', {
        stackId,
        machine: 'laptop',
        date,
        capturedAt: 10,
        receivedAt: 20,
        cliVersion: '1.0.0',
        aggregateVersion: 'workflow-aggregates/v2',
        utcOffsetMinutes: 60,
        day: day(date),
      })
    }
    // One untagged row, its own bucket.
    await ctx.db.insert('measuredWorkflowDays', {
      stackId,
      date: '2026-08-20',
      capturedAt: 10,
      receivedAt: 20,
      aggregateVersion: 'workflow-aggregates/v2',
      day: day('2026-08-20'),
    })
    // A day a new sync already wrote: the migration must not overwrite it.
    await ctx.db.insert('measuredDays', {
      stackId,
      machine: 'laptop',
      date: '2026-08-21',
      capturedAt: 99,
      receivedAt: 99,
      aggregateVersion: 'measured-days/v1',
      fingerprint: 'fresh',
      workflow: { ...day('2026-08-21'), git: { ...day('2026-08-21').git, commits: 9 } },
    })
    return stackId
  })

  expect(await t.mutation(MIGRATION.run, {})).toEqual({ copied: 2, skipped: 1 })
  expect(await t.mutation(MIGRATION.run, {})).toEqual({ copied: 0, skipped: 3 })

  const rows = await t.run(async (ctx) => ctx.db.query('measuredDays').collect())
  expect(rows.map((row) => [row.machine ?? null, row.date]).sort()).toEqual([
    [null, '2026-08-20'],
    ['laptop', '2026-08-20'],
    ['laptop', '2026-08-21'],
  ])
  const copied = rows.find((row) => row.machine === 'laptop' && row.date === '2026-08-20')
  expect(copied).toMatchObject({
    stackId,
    capturedAt: 10,
    receivedAt: 20,
    cliVersion: '1.0.0',
    aggregateVersion: 'measured-days/v1',
    utcOffsetMinutes: 60,
    fingerprint: dayFingerprint({ date: '2026-08-20', workflow: day('2026-08-20') }),
  })
  expect(copied?.usage).toBeUndefined()
  const kept = rows.find((row) => row.machine === 'laptop' && row.date === '2026-08-21')
  expect(kept?.workflow?.git.commits).toBe(9)
})
