#!/usr/bin/env node
// Spike server for wayfinder ticket #35 — candidate A (local stdio MCP + requiresUserInteraction).
//
// Hand-rolled JSON-RPC over stdio so the spike has zero dependencies and nothing
// between us and the wire. Three tools, each probing a different rendering surface
// of the consent dialog:
//
//   publish_desc   — body text lives in the tool `description`
//   publish_input  — body text lives in a `humanSummary` input param, alongside the
//                    full nested payload (probes serialization + truncation)
//   publish_ungated — byte-identical to publish_desc except for its `name` and the missing
//                    `_meta` marker (control). Nothing else may differ, or 1C stops being a
//                    one-variable control: identify it in the dialog by the tool name.
//
// Every request is appended to spike-mcp.log next to this file, so the transcript
// of what the harness actually asked for survives the session.

import { readFileSync, appendFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSummary } from './summary.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const LOG = join(ROOT, 'spike-mcp.log')

const payload = JSON.parse(readFileSync(join(ROOT, 'fixtures/payload.json'), 'utf8'))

const log = (direction, msg) => {
  try {
    appendFileSync(LOG, `${new Date().toISOString()} ${direction} ${JSON.stringify(msg)}\n`)
  } catch {
    /* logging must never break the server */
  }
}

const SUMMARY = buildSummary(payload)

// The description IS the summary, with no headline prefix. 1A (description) and 1B (input)
// must be compared on byte-identical text — a prepended headline would push 1A's truncation
// point two lines later than 1B's and make the comparison read backwards. `fixtures/summary.txt`
// is regenerated from this same function (`node mcp/summary.mjs`), so the two are equal by
// construction, not by hand.
const DESCRIPTION = SUMMARY

const inputSchema = {
  type: 'object',
  properties: {
    humanSummary: {
      type: 'string',
      description: 'Human-readable rendering of exactly what will be sent. Pass verbatim.',
    },
    payload: { type: 'object', description: 'The wire payload (schemaVersion 1).' },
  },
  required: ['humanSummary', 'payload'],
}

const minimalSchema = {
  type: 'object',
  properties: { confirm: { type: 'boolean', description: 'Set true to publish.' } },
  required: ['confirm'],
}

const GATE = { 'anthropic/requiresUserInteraction': true }

const TOOLS = [
  {
    name: 'publish_desc',
    title: 'SPIKE-MARKER-TITLE — Publish measured usage (description variant)',
    description: DESCRIPTION,
    inputSchema: minimalSchema,
    annotations: { title: 'SPIKE-MARKER-ANNOTATION-TITLE (desc variant)', destructiveHint: false, openWorldHint: true },
    _meta: { ...GATE },
  },
  {
    name: 'publish_input',
    title: 'SPIKE-MARKER-TITLE — Publish measured usage (input variant)',
    description: 'Publish the approved measured-usage aggregate. The exact bytes are in the arguments.',
    inputSchema,
    annotations: { title: 'SPIKE-MARKER-ANNOTATION-TITLE (input variant)', destructiveHint: false, openWorldHint: true },
    _meta: { ...GATE },
  },
  // CONTROL. Deliberately a byte-for-byte clone of publish_desc above except for `name` and
  // the absent `_meta` — that single difference is the whole experiment. Do not "clarify" the
  // title or description here: any extra difference gives 1C a second variable and the marker
  // stops being provably the thing that produces the prompt.
  {
    name: 'publish_ungated',
    title: 'SPIKE-MARKER-TITLE — Publish measured usage (description variant)',
    description: DESCRIPTION,
    inputSchema: minimalSchema,
    annotations: { title: 'SPIKE-MARKER-ANNOTATION-TITLE (desc variant)', destructiveHint: false, openWorldHint: true },
  },
]

const send = (msg) => {
  log('<-', msg)
  process.stdout.write(`${JSON.stringify(msg)}\n`)
}

const ok = (id, result) => send({ jsonrpc: '2.0', id, result })
const err = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } })

const handle = (msg) => {
  log('->', msg)
  const { id, method, params } = msg

  switch (method) {
    case 'initialize':
      return ok(id, {
        // Echo the client's version back so we never fail negotiation over a version bump.
        protocolVersion: params?.protocolVersion ?? '2025-06-18',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'aistack-spike', version: '0.0.1' },
      })

    case 'notifications/initialized':
    case 'notifications/cancelled':
      return // notifications take no response

    case 'ping':
      return ok(id, {})

    case 'tools/list':
      return ok(id, { tools: TOOLS })

    case 'tools/call': {
      const name = params?.name
      if (!TOOLS.some((t) => t.name === name)) return err(id, -32602, `Unknown tool: ${name}`)
      appendFileSync(LOG, `${new Date().toISOString()} !! TOOL EXECUTED: ${name}\n`)
      return ok(id, {
        content: [
          {
            type: 'text',
            text: `SPIKE: ${name} executed. Nothing was actually sent anywhere. Logged to spike-mcp.log.`,
          },
        ],
      })
    }

    default:
      if (method?.startsWith('notifications/')) return
      return err(id, -32601, `Method not found: ${method}`)
  }
}

let buffer = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
  buffer += chunk
  let nl
  while ((nl = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, nl).trim()
    buffer = buffer.slice(nl + 1)
    if (!line) continue
    try {
      handle(JSON.parse(line))
    } catch (e) {
      log('!!', { parseError: String(e), line })
    }
  }
})
