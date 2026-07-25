#!/usr/bin/env node
// Spike CLI for wayfinder ticket #35 — candidate B (bundled CLI called via Bash).
//
// Stands in for the real `aistack-sync publish`. It sends nothing; it prints the
// summary it *would* show and records the attempt. The point of the spike is that
// this process has no TTY under the Bash tool, so it structurally cannot prompt —
// whatever consent the user gives has to come from the harness, before this runs.

import { readFileSync, appendFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const variant = process.argv[2] ?? 'unknown'

const payload = JSON.parse(readFileSync(join(ROOT, 'fixtures/payload.json'), 'utf8'))

appendFileSync(
  join(ROOT, 'spike-cli.log'),
  `${new Date().toISOString()} !! CLI EXECUTED variant=${variant} tty=${process.stdout.isTTY ? 'yes' : 'no'} stdinTty=${process.stdin.isTTY ? 'yes' : 'no'}\n`,
)

console.log('SPIKE-MARKER-CLI-STDOUT-BEGIN')
console.log(`variant: ${variant}`)
console.log(`stdout is a TTY: ${Boolean(process.stdout.isTTY)}   stdin is a TTY: ${Boolean(process.stdin.isTTY)}`)
console.log(`destination: stack "alps-daily-driver" on aistack.to`)
console.log(`window: ${payload.window.days}d (${payload.window.from} .. ${payload.window.to})`)
for (const m of payload.models) {
  console.log(`  ${m.id.padEnd(28)} ${(m.tokenShare * 100).toFixed(1).padStart(5)}%  $${m.apiEquivalentUSD.toFixed(2)}`)
}
console.log(`withheld: ${JSON.stringify(payload.inventory.withheld)}`)
console.log('NOTHING WAS SENT — this is a spike.')
console.log('SPIKE-MARKER-CLI-STDOUT-END')
