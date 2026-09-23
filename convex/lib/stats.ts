/** Fixed-window web projection. Git never enters the all-machine session fold. */
import {
  buildPlaybook,
  foldGitDays,
  foldHarnessDays,
  medianSessionRange,
  phaseShare,
  type HarnessDay,
} from '@aistack/workflow-rules'
import type { Doc } from '../_generated/dataModel'
import { newestInventoryPerSource } from './measuredDays'
import type { ModelCatalog } from './modelCatalog'
import { visibleSources } from './sources'
import {
  contextAcrossMachines,
  emptyWorkflowWindow,
  utcDayOf,
  type WorkflowDayRow,
} from './workflow'

const DAY = 86_400_000
const CATEGORIES = ['skills', 'mcpServers', 'subagents'] as const

/** Latest publication first; ties are stable without exposing machine identity. */
function newestFirst(a: WorkflowDayRow, b: WorkflowDayRow): number {
  return (
    b.receivedAt - a.receivedAt ||
    (a.machine ?? '').localeCompare(b.machine ?? '') ||
    b.date.localeCompare(a.date) ||
    a._id.localeCompare(b._id)
  )
}

/** Evict legacy untagged harness evidence when a tagged source exists in this window. */
export function sessionRows(rows: readonly WorkflowDayRow[]): WorkflowDayRow[] {
  const visible = visibleSources(
    rows.flatMap((row) =>
      row.workflow.harnesses.map((h) => ({
        row,
        harness: h.harness,
        machine: row.machine,
      })),
    ),
    (source) => source,
  )
  const kept = new Map<WorkflowDayRow, Set<string>>()
  for (const source of visible) {
    const names = kept.get(source.row) ?? new Set<string>()
    names.add(source.harness)
    kept.set(source.row, names)
  }
  return [...kept].map(([row, names]) => ({
    ...row,
    workflow: {
      ...row.workflow,
      harnesses: row.workflow.harnesses.filter((h) => names.has(h.harness)),
    },
    ...(row.usage
      ? {
          usage: {
            ...row.usage,
            harnesses: row.usage.harnesses.filter((h) => names.has(h.harness)),
          },
        }
      : {}),
  }))
}

function sessionReading(rows: readonly WorkflowDayRow[]) {
  const byHarness = new Map<string, HarnessDay[]>()
  for (const row of rows) {
    for (const harness of row.workflow.harnesses) {
      const held = byHarness.get(harness.harness) ?? []
      held.push(harness)
      byHarness.set(harness.harness, held)
    }
  }
  return {
    ...emptyWorkflowWindow('web-stats/v1', undefined),
    harnesses: [...byHarness.values()]
      .map(foldHarnessDays)
      .sort((a, b) => a.harness.localeCompare(b.harness)),
  }
}

/** Known counts remain useful when a legacy source prevents an exact percentage. */
export function statsInventory(inventory: readonly Doc<'measuredInventory'>[]) {
  const sources = newestInventoryPerSource(inventory)
  return Object.fromEntries(
    CATEGORIES.map((category) => {
      const names = new Map<
        string,
        { name: string; knownCalls: number; countsComplete: boolean }
      >()
      let total = 0
      let totalComplete = true
      let withheldNames = 0
      for (const { inventory: inv } of sources) {
        const denominator = inv.calls?.[category]
        if (denominator === undefined) totalComplete = false
        else total += denominator
        withheldNames += inv.withheld[category]
        for (const atom of inv[category]) {
          const held = names.get(atom.name) ?? {
            name: atom.name,
            knownCalls: 0,
            countsComplete: true,
          }
          if (atom.calls === undefined) held.countsComplete = false
          else held.knownCalls += atom.calls
          names.set(atom.name, held)
        }
      }
      return [
        category,
        {
          totalCalls: totalComplete ? total : null,
          // Sum of source-local withheld name counts, not a global distinct count.
          withheldNames,
          atoms: [...names.values()]
            .map((atom) => ({
              ...atom,
              callShare:
                totalComplete && atom.countsComplete && total > 0
                  ? atom.knownCalls / total
                  : null,
            }))
            .sort(
              (a, b) =>
                b.knownCalls - a.knownCalls || a.name.localeCompare(b.name),
            ),
        },
      ]
    }),
  ) as Record<
    (typeof CATEGORIES)[number],
    {
      totalCalls: number | null
      withheldNames: number
      atoms: {
        name: string
        knownCalls: number
        countsComplete: boolean
        callShare: number | null
      }[]
    }
  >
}

export function readStats(
  all: readonly WorkflowDayRow[],
  inventory: readonly Doc<'measuredInventory'>[],
  now: number,
  catalog: ModelCatalog,
) {
  const to = utcDayOf(now)
  const from = utcDayOf(now - 29 * DAY)
  const previousFrom = utcDayOf(now - 59 * DAY)
  const previousTo = utcDayOf(now - 30 * DAY)
  const current = all.filter((row) => row.date >= from && row.date <= to)
  const rows = sessionRows(current)
  const reading = sessionReading(rows)
  const previous = sessionReading(
    sessionRows(
      all.filter((row) => row.date >= previousFrom && row.date <= previousTo),
    ),
  )
  const combined = reading.harnesses.length
    ? foldHarnessDays(reading.harnesses)
    : null
  const playbook = buildPlaybook(reading)
  // The newest published offset applies to every session source and both clock visuals.
  const offset =
    [...current]
      .sort(newestFirst)
      .find((row) => row.utcOffsetMinutes !== undefined)?.utcOffsetMinutes ??
    null
  const byMachine = new Map<string | undefined, WorkflowDayRow[]>()
  for (const row of current) {
    const held = byMachine.get(row.machine) ?? []
    held.push(row)
    byMachine.set(row.machine, held)
  }
  const gitSources = [...byMachine.values()].filter((source) =>
    source.some(
      ({ workflow: { git } }) =>
        git.commits > 0 ||
        git.additions > 0 ||
        git.removals > 0 ||
        git.changedLinesByExtension.length > 0 ||
        git.withheldExtensionLines > 0,
    ),
  )
  // Rank eligible machines by their newest current-window publication, including
  // zero-commit days. A machine with no Git history cannot displace a measured one.
  const gitRows = (
    gitSources
      .map((source) => [...source].sort(newestFirst))
      .sort((a, b) => newestFirst(a[0], b[0]))[0] ?? []
  ).sort((a, b) => a.date.localeCompare(b.date))
  const git = gitRows.length
    ? foldGitDays(gitRows.map((row) => row.workflow.git))
    : null
  const context = contextAcrossMachines(rows, catalog)
  return {
    window: { from, to, previousFrom, previousTo },
    utcOffsetMinutes: offset,
    medianSession: {
      current: medianSessionRange(reading) ?? null,
      previous: medianSessionRange(previous) ?? null,
    },
    routing: combined?.routing ?? null,
    activity: combined?.activity ?? [],
    startHours: combined?.startHours ?? [],
    phaseShare: phaseShare(reading) ?? null,
    phaseTracks: playbook
      ? {
          splitMinutes: playbook.splitMinutes,
          tracks: playbook.tracks.map((track) => ({
            id: track.id,
            sessions: track.sessions,
            phaseShare: track.phaseShare,
          })),
        }
      : null,
    context: context.length ? { harnesses: context } : null,
    inventory: statsInventory(inventory),
    git: git
      ? {
          additions: git.additions,
          removals: git.removals,
          changedLinesByExtension: git.changedLinesByExtension,
          withheldExtensionLines: git.withheldExtensionLines,
          days: gitRows.map((row) => ({
            date: row.date,
            additions: row.workflow.git.additions,
            removals: row.workflow.git.removals,
          })),
        }
      : null,
  }
}
