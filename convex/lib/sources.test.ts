import { describe, expect, it } from 'vitest'
import {
  newestBySource,
  newestPerSource,
  sourceKey,
  sourceOrder,
  visibleSources,
} from './sources'

const row = (harness: string, machine: string | undefined, capturedAt: number) =>
  machine === undefined
    ? { harness, capturedAt }
    : { harness, machine, capturedAt }

describe('sourceKey', () => {
  it('separates the two halves so they cannot collide across the boundary', () => {
    // Without a separator both of these would key on "claude-codelaptop".
    expect(sourceKey({ harness: 'claude-code', machine: 'laptop' })).not.toBe(
      sourceKey({ harness: 'claude', machine: 'codelaptop' })
    )
  })

  it('gives an untagged row its own key, distinct from any machine', () => {
    expect(sourceKey({ harness: 'claude-code' })).not.toBe(
      sourceKey({ harness: 'claude-code', machine: '' })
    )
  })
})

describe('sourceOrder', () => {
  it('puts Claude Code first, then harnesses alphabetically', () => {
    const sorted = [
      { harness: 'codex' },
      { harness: 'claude-code' },
      { harness: 'pi-mono' },
    ].sort(sourceOrder)
    expect(sorted.map((s) => s.harness)).toEqual([
      'claude-code',
      'codex',
      'pi-mono',
    ])
  })

  it('orders machines alphabetically inside one harness', () => {
    const sorted = [
      { harness: 'claude-code', machine: 'vps' },
      { harness: 'claude-code', machine: 'laptop' },
    ].sort(sourceOrder)
    expect(sorted.map((s) => s.machine)).toEqual(['laptop', 'vps'])
  })
})

describe('newestPerSource', () => {
  it('holds one reading per MACHINE, not one per harness', () => {
    // The #243 bug exactly: before this, the later row replaced the earlier one
    // because both said `claude-code`, and the stack lost a machine's usage.
    const rows = [
      row('claude-code', 'laptop', 100),
      row('claude-code', 'vps', 200),
    ]
    expect(newestPerSource(rows)).toHaveLength(2)
  })

  it('still holds only the newest reading of one machine', () => {
    const rows = [
      row('claude-code', 'laptop', 100),
      row('claude-code', 'laptop', 300),
      row('claude-code', 'laptop', 200),
    ]
    const held = newestPerSource(rows)
    expect(held).toHaveLength(1)
    expect(held[0].capturedAt).toBe(300)
  })

  it('separates two harnesses on the same machine', () => {
    const rows = [
      row('claude-code', 'laptop', 100),
      row('codex', 'laptop', 100),
    ]
    expect(newestPerSource(rows)).toHaveLength(2)
  })

  it('returns sources in display order', () => {
    const rows = [
      row('codex', 'laptop', 100),
      row('claude-code', 'vps', 100),
      row('claude-code', 'laptop', 100),
    ]
    expect(
      newestPerSource(rows).map((r) => `${r.harness}/${r.machine}`)
    ).toEqual(['claude-code/laptop', 'claude-code/vps', 'codex/laptop'])
  })
})

describe('the untagged rule', () => {
  it('holds an untagged reading when nothing else measures that harness', () => {
    const rows = [row('claude-code', undefined, 100)]
    expect(newestPerSource(rows)).toHaveLength(1)
  })

  it('drops an untagged reading once a machine of that harness reports', () => {
    // An untagged row is a WHOLE-HARNESS reading: it already counts whatever
    // sessions the tagged row counts, so holding both would double them - and
    // carry-forward is unconditional, so it would do so forever.
    const rows = [
      row('claude-code', undefined, 100),
      row('claude-code', 'laptop', 200),
    ]
    const held = newestPerSource(rows)
    expect(held).toHaveLength(1)
    expect(held[0].machine).toBe('laptop')
  })

  it('drops the untagged reading even when it is the NEWER row', () => {
    // Freshness does not rescue it. The eviction is about what the reading
    // means, not when it landed.
    const rows = [
      row('claude-code', 'laptop', 100),
      row('claude-code', undefined, 900),
    ]
    const held = newestPerSource(rows)
    expect(held).toHaveLength(1)
    expect(held[0].machine).toBe('laptop')
  })

  it('evicts per harness, so another harness keeps its untagged reading', () => {
    const rows = [
      row('claude-code', undefined, 100),
      row('claude-code', 'laptop', 200),
      row('codex', undefined, 100),
    ]
    const held = newestPerSource(rows)
    expect(held.map((r) => `${r.harness}/${r.machine ?? '-'}`)).toEqual([
      'claude-code/laptop',
      'codex/-',
    ])
  })
})

describe('newestBySource', () => {
  it('keeps a superseded untagged row, which is what retention must not delete', () => {
    // It still seeds every historical point that predates the first tagged
    // sync, so being superseded today is no licence to throw it away.
    const rows = [
      row('claude-code', undefined, 100),
      row('claude-code', 'laptop', 200),
    ]
    expect(newestBySource(rows)).toHaveLength(2)
    expect(newestPerSource(rows)).toHaveLength(1)
  })
})

describe('visibleSources', () => {
  it('reads the source off whatever the caller happens to hold', () => {
    const held = [
      { row: { harness: 'claude-code' }, tokens: 10 },
      { row: { harness: 'claude-code', machine: 'laptop' }, tokens: 20 },
    ]
    expect(visibleSources(held, (h) => h.row).map((h) => h.tokens)).toEqual([20])
  })
})
