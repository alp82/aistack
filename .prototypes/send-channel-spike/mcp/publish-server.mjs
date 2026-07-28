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
//   publish_elicit — added after Round 1. Deliberately carries NO `_meta` gate: 1C already
//                    proved an unmarked tool runs silently under bypass, so any prompt this
//                    one raises comes from the mid-call `elicitation/create` and nothing
//                    else. Its message is byte-identical to publish_desc's description, so
//                    its truncation point is directly comparable with 1A and 1B.
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
  // NO `_meta` gate, on purpose — see the header. This tool asks the CLIENT for consent
  // mid-call via `elicitation/create`, which is a server-initiated request rather than a
  // tool invocation, so no permission rule names it and no "don't ask again" can allow it.
  {
    name: 'publish_elicit',
    title: 'SPIKE-MARKER-TITLE — Publish measured usage (elicitation variant)',
    description: 'Publish the measured-usage aggregate. Asks for confirmation during the call.',
    inputSchema: minimalSchema,
    annotations: { title: 'SPIKE-MARKER-ANNOTATION-TITLE (elicit variant)', destructiveHint: false, openWorldHint: true },
  },
  // 1F. The 26-line message in publish_elicit rendered in full and then could not be
  // answered — no visible control, keyboard did nothing, ESC resolved it to `cancel`. Two
  // candidate causes: the form is unusable in this client, or the long message pushed the
  // control out of the viewport. This variant changes ONE thing, the message length. If it
  // is answerable, the cause is length and the aggregate has to live somewhere else; if it
  // is not, elicitation cannot carry consent at all in 2.1.220.
  {
    name: 'publish_elicit_short',
    title: 'SPIKE-MARKER-TITLE — Publish measured usage (short elicitation variant)',
    description: 'Publish the measured-usage aggregate. Asks a one-line confirmation during the call.',
    inputSchema: minimalSchema,
    annotations: { title: 'SPIKE-MARKER-ANNOTATION-TITLE (elicit short variant)', destructiveHint: false, openWorldHint: true },
  },
]

// 1G. The boolean widget rendered and ignored every key except ESC, at both message
// lengths. This variant changes the FIELD TYPE and nothing else: a string enum, which
// renders as a select list rather than a checkbox. It separates "elicitation is unusable in
// 2.1.220" from "the boolean widget is unusable". Last elicitation probe either way.
// 1H. The enum widget accepts input (1G) but was only ever shown with the one-line message,
// and the 26-line message was only ever shown with the dead boolean widget (1E). The
// combination that the shipped design actually wants — whole aggregate AND an answerable
// control — is therefore still untested. This is that combination and nothing else.
TOOLS.push({
  name: 'publish_elicit_full',
  title: 'SPIKE-MARKER-TITLE — Publish measured usage (full message + enum)',
  description: 'Publish the measured-usage aggregate. Shows the whole summary and asks a single-choice confirmation.',
  inputSchema: minimalSchema,
  annotations: { title: 'SPIKE-MARKER-ANNOTATION-TITLE (elicit full variant)', destructiveHint: false, openWorldHint: true },
})

TOOLS.push({
  name: 'publish_elicit_enum',
  title: 'SPIKE-MARKER-TITLE — Publish measured usage (enum elicitation variant)',
  description: 'Publish the measured-usage aggregate. Asks a single-choice confirmation during the call.',
  inputSchema: minimalSchema,
  annotations: { title: 'SPIKE-MARKER-ANNOTATION-TITLE (elicit enum variant)', destructiveHint: false, openWorldHint: true },
})

const SHORT_MESSAGE =
  'Publish 30d measured usage to stack "alps-daily-driver"? $5,407.59 API-equivalent, 12 names withheld. SPIKE-MARKER-SHORT-END'

const send = (msg) => {
  log('<-', msg)
  process.stdout.write(`${JSON.stringify(msg)}\n`)
}

const ok = (id, result) => send({ jsonrpc: '2.0', id, result })
const err = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } })

// --- server-initiated requests (elicitation) -------------------------------
// The client answers a server request on the same stdio pipe, as a JSON-RPC response
// carrying the id WE chose. Ids are prefixed so they can never collide with the client's.
let clientCapabilities = {}
let nextRequestId = 1
const pending = new Map()

const request = (method, params, onReply) => {
  const id = `spike-${nextRequestId++}`
  pending.set(id, onReply)
  send({ jsonrpc: '2.0', id, method, params })
  // A client that does not implement the method may answer with an error, or may never
  // answer at all. Without this the tool call hangs forever and the round reads as a
  // freeze rather than as an unsupported capability.
  setTimeout(() => {
    if (pending.delete(id)) onReply({ timedOut: true })
  }, 120_000).unref?.()
}

const handle = (msg) => {
  log('->', msg)
  const { id, method, params } = msg

  // A reply to something we asked, not a new request.
  if (method === undefined && id !== undefined && pending.has(id)) {
    const onReply = pending.get(id)
    pending.delete(id)
    return onReply(msg)
  }

  switch (method) {
    case 'initialize':
      clientCapabilities = params?.capabilities ?? {}
      appendFileSync(
        LOG,
        `${new Date().toISOString()} !! CLIENT CAPABILITIES: ${JSON.stringify(clientCapabilities)} (elicitation ${'elicitation' in clientCapabilities ? 'DECLARED' : 'absent'})\n`,
      )
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

      if (name.startsWith('publish_elicit')) {
        const short = name === 'publish_elicit_short'
        const isEnum = name === 'publish_elicit_enum' || name === 'publish_elicit_full'
        const fullMessage = name === 'publish_elicit' || name === 'publish_elicit_full'
        appendFileSync(
          LOG,
          `${new Date().toISOString()} !! ELICITATION REQUESTED (${fullMessage ? 'FULL' : 'SHORT'} message + ${isEnum ? 'ENUM' : 'BOOLEAN'} field, nothing executed yet)\n`,
        )
        // `message` is byte-identical to publish_desc's description, so the truncation point
        // here is directly comparable with 1A. requestedSchema takes primitives only.
        return request(
          'elicitation/create',
          {
            message: fullMessage ? SUMMARY : SHORT_MESSAGE,
            requestedSchema: isEnum
              ? {
                  type: 'object',
                  properties: {
                    decision: {
                      type: 'string',
                      enum: ['publish', 'cancel'],
                      title: 'SPIKE-MARKER-ELICIT-FIELD — publish this aggregate?',
                      description: 'Approve the send described above.',
                    },
                  },
                  required: ['decision'],
                }
              : {
                  type: 'object',
                  properties: {
                    confirm: {
                      type: 'boolean',
                      title: 'SPIKE-MARKER-ELICIT-FIELD — publish this aggregate?',
                      description: 'Approve the send described above.',
                    },
                  },
                  required: ['confirm'],
                },
          },
          (reply) => {
            const action = reply?.timedOut ? 'TIMED OUT' : (reply?.result?.action ?? 'error')
            const approved =
              reply?.result?.action === 'accept' &&
              (isEnum
                ? reply?.result?.content?.decision === 'publish'
                : reply?.result?.content?.confirm === true)
            appendFileSync(
              LOG,
              `${new Date().toISOString()} !! ELICITATION REPLY: action=${action} approved=${approved} raw=${JSON.stringify(reply?.result ?? reply?.error ?? null)}\n`,
            )
            if (approved) {
              appendFileSync(LOG, `${new Date().toISOString()} !! TOOL EXECUTED: ${name}\n`)
            }
            ok(id, {
              content: [
                {
                  type: 'text',
                  text: approved
                    ? `SPIKE: ${name} executed after an approved elicitation. Nothing was actually sent anywhere.`
                    : `SPIKE: ${name} did NOT execute. Elicitation outcome: ${action}. Nothing was sent.`,
                },
              ],
            })
          },
        )
      }

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
