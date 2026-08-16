#!/usr/bin/env node
// Spike probe for wayfinder ticket #35 - does an `async: true` hook outlive the session?
//
// The Stop hook fires on EVERY turn, so a bare start/complete pair proves nothing: a
// `completed` line written while the session was still alive is indistinguishable from one
// written after teardown. Two things make the null attributable:
//
//   1. Every line carries the `session_id` from the hook's stdin JSON, so a `completed` line
//      can be tied to the session you actually quit.
//   2. It ticks once a second while it waits. If Claude Code tears the process down at quit,
//      the ticks stop at the quit moment and there is no `completed` - that is a *killed at
//      teardown* reading. If ticks stop with no explanation and no `completed`, that is a
//      *timeout* reading. "Async hooks do not outlive the session" is only supportable when
//      ticks continue past the quit time and then stop short of DELAY_MS.
//
// Config async hooks are killed after `timeout` seconds (settings.json sets 120; the default
// is 600). DELAY_MS is far below both, so the timeout is not the thing under test.

import { appendFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { text } from 'node:stream/consumers'
import { fileURLToPath } from 'node:url'

const LOG = join(dirname(fileURLToPath(import.meta.url)), '..', 'spike-async.log')
const DELAY_MS = 20_000
const TICK_MS = 1_000

const note = (line) => {
  try {
    appendFileSync(LOG, `${new Date().toISOString()} ${line}\n`)
  } catch {}
}

// Claude Code writes the hook input then closes stdin, so this resolves. The race is a
// belt-and-braces guard: if the input never arrives we still log, marked session=unknown -
// and a session=unknown run means Round 4 is void, not that async hooks died.
const stdin = await Promise.race([
  text(process.stdin).catch(() => ''),
  new Promise((resolve) => setTimeout(() => resolve(''), 2_000)),
])

let session = 'unknown'
try {
  session = JSON.parse(stdin)?.session_id ?? 'unknown'
} catch {}

const tag = `session=${session} pid=${process.pid}`
note(`started ${tag} delay=${DELAY_MS}ms tick=${TICK_MS}ms`)

const startedAt = Date.now()
const ticker = setInterval(() => {
  note(`tick ${tag} +${Math.round((Date.now() - startedAt) / 1000)}s`)
}, TICK_MS)

setTimeout(() => {
  clearInterval(ticker)
  note(`completed ${tag} - survived ${DELAY_MS}ms after Stop`)
}, DELAY_MS)
