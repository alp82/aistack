# PROTOTYPE: Discord bot message-type showcase

Throwaway code for [alp82/aistack#181](https://github.com/alp82/aistack/issues/181).
It answers one question: what does every message type from
[the Discord bot spec](../../docs/specs/discord-bot.md) look like in real Discord?

No dependencies. Node 20+.

## Files

- `payloads.mjs` - one payload per message type. The single source of truth.
- `routing.mjs` - the command routing, shared by both transports.
- `gateway.mjs` - receives interactions over the gateway websocket, an outbound
  connection, so no public URL is needed. The transport used for the showcase.
- `server.mjs` - demo page on GET `/`, plus the spec's transport: an
  interactions endpoint on POST `/interactions` with Ed25519 verification.
  Needs a publicly reachable URL, which this container does not have.
- `register.mjs` - registers the five commands on one test guild.
- `post-messages.mjs` - fallback: posts the four public types as plain bot messages.
- `gen-demo.mjs` - writes `index.html` from `payloads.mjs`.
- `index.html` - the generated demo page.

`/leaderboard` defers and then patches the reply, which walks the spec's
hosting model. The rendering in Discord is identical on either transport.

## Run

1. `PORT=9003 node server.mjs` serves the demo page.
2. `DISCORD_APP_ID=... DISCORD_BOT_TOKEN=... DISCORD_GUILD_ID=... node register.mjs`
3. `DISCORD_BOT_TOKEN=... node gateway.mjs` (leave the app's Interactions
   Endpoint URL empty, so interactions flow to the gateway).
4. Type the invocations from the demo page in the test channel.

Secrets stay in the environment. Nothing here stores them.
