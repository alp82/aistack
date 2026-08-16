#!/usr/bin/env node
// Spike hook for wayfinder ticket #35 - candidate B, gate variant "PreToolUse returns ask".
//
// Returns `ask` only for publish-hookask, so the ask-RULE variant and the HOOK variant stay
// distinguishable within one session. Everything else passes through untouched.
// Binary names are deliberately non-prefix-colliding: Bash permission rules are
// prefix matches, so `publish-ruleask` must not be a prefix of the others.
//
// The matcher in .claude/settings.json is an unscoped "Bash", so this runs for EVERY Bash
// call in the spike session. It therefore logs the verbatim command line only for the three
// spike binaries - the exact text is needed to cross-check the `ask` rule prefixes in Round 2
// - and redacts everything else to a length, so unrelated shell commands (which can carry
// tokens, admin keys, etc.) are never transcribed into spike-hook.log. See also the
// .gitignore beside this directory: the logs must never be committed.

import { appendFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { text } from 'node:stream/consumers'
import { fileURLToPath } from 'node:url'

const LOG = join(dirname(fileURLToPath(import.meta.url)), '..', 'spike-hook.log')
const note = (line) => {
  try {
    appendFileSync(LOG, `${new Date().toISOString()} ${line}\n`)
  } catch {}
}

const stdin = await text(process.stdin)

let input = {}
try {
  input = JSON.parse(stdin)
} catch {
  note(`parse-error: ${stdin.length} chars of non-JSON on stdin`)
  process.exit(0)
}

const command = input?.tool_input?.command ?? ''

// Only the spike's own binaries get their command line recorded verbatim.
const SPIKE_BINARIES = ['publish-ruleask', 'publish-hookask', 'publish-nogate']
const isSpikeCommand = SPIKE_BINARIES.some((b) => command.includes(b))

note(
  `PreToolUse tool=${input.tool_name} mode=${input.permission_mode ?? '?'} session=${input.session_id ?? '?'} ` +
    (isSpikeCommand ? `cmd=${command.slice(0, 300)}` : `cmd=<redacted non-spike command, ${command.length} chars>`),
)

if (!command.includes('publish-hookask')) process.exit(0)

note('-> returning permissionDecision:"ask"')

// No process.exit() after this write: node's stdout is async when piped, and exit() does not
// flush pending writes - a truncated decision JSON would be read as malformed hook output, no
// `ask` would be applied, and Round 2B (the load-bearing question) would silently answer wrong.
// Let the process end naturally once stdout has drained.
process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason:
        'SPIKE-MARKER-HOOK-REASON - publish 30d measured usage to stack "alps-daily-driver". 3 models, 5 built-in tools, 2 MCP servers, 3 skills; 12 names withheld. $5,407.59 API-equivalent. No transcripts, prompts, paths or repo names leave this machine.',
    },
  }),
)
