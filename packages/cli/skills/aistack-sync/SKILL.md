---
name: aistack-sync
description: Publish measured Claude Code usage (rolling 30 days) to the user's aistack stack. Use when the user says "sync my stack", "aistack sync", "publish my usage", or asks to update the measured layer of their stack.
---

# aistack sync

Publish the local measured-usage snapshot to the user's aistack stack. The
`aistack` MCP server does all the work: it scans the transcripts on this
machine, stages the exact bytes, and gates the send behind a dialog only the
user can answer. You trigger and display. You never decide.

## Steps

1. Call the `sync_preview` tool on the `aistack` MCP server. No arguments.
2. Show the returned text to the user verbatim, in a code block. Do not
   summarize it. Do not omit lines. Do not add numbers of your own.
3. If the output says `publish unavailable`, stop and relay the reason.
4. If the user asked for a sync, call `sync_publish` with the `preview id`
   from the output. A confirmation dialog appears. The user answers it
   themselves. Wait; the dialog can take minutes.
5. Relay the tool result verbatim. "Not published" is a valid outcome, not an
   error to work around.

## Rules

- Never call `sync_publish` without a `sync_preview` in the same conversation.
- Never replace the preview text with your own summary. The preview is the
  review surface the user consents on.
- A cancel or a timeout is the user's answer. Do not raise the gate again in
  the same turn. Retry only when the user asks.
- If the `aistack` MCP server is not connected, say so and point at the setup
  step below. Do not publish through any other channel. There is none.

## Setup (one time, done by the user)

```sh
claude mcp add aistack -- npx -y @use-aistack/cli mcp
```

The machine must be linked once with `npx @use-aistack/cli login`.
