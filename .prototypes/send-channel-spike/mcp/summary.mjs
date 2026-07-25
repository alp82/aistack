// The human-readable rendering of the aggregate — what the approve gate is supposed to
// show. Deliberately long and multi-line: if a consent dialog renders it, we learn both
// that it can carry our own body text AND where it truncates.
//
// Shared by the MCP server (as tool `description`) and by fixtures/summary.txt (as tool
// input), so both candidate-A variants are compared on byte-identical text. That identity
// is only real if the fixture is current — run `node mcp/summary.mjs` (see README Round 1
// precondition) to rewrite fixtures/summary.txt from this function, with no trailing
// newline so it matches the description byte for byte.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export function buildSummary(payload) {
  return [
    'AI STACK — PUBLISH MEASURED USAGE',
    '',
    'Destination:  stack "alps-daily-driver" on aistack.to (bound to this machine\'s token)',
    `Window:       ${payload.window.days} days (${payload.window.from} .. ${payload.window.to})`,
    `Harness:      ${payload.harness.name} ${payload.harness.version}`,
    '',
    'MODELS (token share / API-equivalent)',
    ...payload.models.map(
      (m) => `  ${m.id.padEnd(28)} ${(m.tokenShare * 100).toFixed(1).padStart(5)}%   $${m.apiEquivalentUSD.toFixed(2)}`,
    ),
    '',
    'INVENTORY (names that will publish)',
    `  built-in tools: ${payload.inventory.builtinTools.map((t) => t.name).join(', ')}`,
    `  mcp servers:    ${payload.inventory.mcpServers.map((t) => t.name).join(', ')}`,
    `  skills:         ${payload.inventory.skills.map((t) => t.name).join(', ')}`,
    `  subagents:      ${payload.inventory.subagents.map((t) => t.name).join(', ')}`,
    `  slash commands: ${payload.inventory.slashCommands.map((t) => t.name).join(', ')}`,
    `  withheld:       ${Object.entries(payload.inventory.withheld)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${n} ${k}`)
      .join(', ')} (unmatched names publish as counts only)`,
    '',
    'ACTIVITY',
    `  ${payload.activity.sessions} sessions over ${payload.activity.activeDays} active days, ${payload.activity.projects} projects (count only, never names)`,
    `  ${(payload.activity.totalTokens / 1e9).toFixed(2)}B tokens, ${(payload.activity.cacheHitShare * 100).toFixed(1)}% cache hit, ${(payload.activity.subagentShare * 100).toFixed(1)}% subagent`,
    '',
    'NOT SENT: raw transcripts, prompts, file paths, repo names.',
    '',
    'SPIKE-MARKER-SUMMARY-END',
  ].join('\n')
}

// Run directly to regenerate the fixture: `node mcp/summary.mjs`
// (No top-level await here — publish-server.mjs imports this module.)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
  const payload = JSON.parse(readFileSync(join(ROOT, 'fixtures/payload.json'), 'utf8'))
  const out = join(ROOT, 'fixtures/summary.txt')
  writeFileSync(out, buildSummary(payload))
  process.stderr.write(`regenerated ${out}\n`)
}
