# PROTOTYPE: Discord bot message-type showcase

Throwaway code for [alp82/aistack#181](https://github.com/alp82/aistack/issues/181).
It answers one question: what does every message type from
[the Discord bot spec](../../docs/specs/discord-bot.md) look like in real Discord?

No dependencies. Node 20+.

## Files

- `payloads.mjs` - one payload per message type. The single source of truth.
- `server.mjs` - demo page on GET `/`, real interactions endpoint on POST `/interactions`.
  Verifies the Ed25519 signature, answers the ping, replies to the commands.
  `/leaderboard` defers and then patches, which walks the spec's hosting model.
- `register.mjs` - registers the five commands on one test guild.
- `post-messages.mjs` - fallback: posts the four public types as plain bot messages.
- `gen-demo.mjs` - writes `index.html` from `payloads.mjs`.
- `index.html` - the generated demo page.

## Run

1. `DISCORD_PUBLIC_KEY=<hex> PORT=9003 node server.mjs`
2. Point the Discord app's Interactions Endpoint URL at `<public-url>/interactions`.
3. `DISCORD_APP_ID=... DISCORD_BOT_TOKEN=... DISCORD_GUILD_ID=... node register.mjs`
4. Type the invocations from the demo page in the test channel.

Secrets stay in the environment. Nothing here stores them.
