/**
 * Register the Discord slash commands (alp82/aistack#224).
 *
 * PUTs the whole command set, so a removed command disappears and a changed one
 * updates. Global by default; set DISCORD_GUILD_ID to register on one guild for
 * instant testing (global commands can take up to an hour to appear).
 *
 *   pnpm tsx scripts/discord-register-commands.ts [--dry-run]
 *
 * Needs DISCORD_APP_ID and DISCORD_BOT_TOKEN. The bot token is used here only;
 * the deployment never holds it.
 */

import {
  commandsUrl,
  DISCORD_COMMAND_DEFINITIONS,
} from './lib/discordCommandDefinitions'

const dryRun = process.argv.includes('--dry-run')
const { DISCORD_APP_ID, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID } = process.env

if (!DISCORD_APP_ID || (!dryRun && !DISCORD_BOT_TOKEN)) {
  console.error('Set DISCORD_APP_ID and DISCORD_BOT_TOKEN (DISCORD_GUILD_ID optional).')
  process.exit(1)
}

const url = commandsUrl(DISCORD_APP_ID, DISCORD_GUILD_ID || undefined)
const scope = DISCORD_GUILD_ID ? `guild ${DISCORD_GUILD_ID}` : 'global'

if (dryRun) {
  console.log(`PUT ${url} (${scope})`)
  console.log(JSON.stringify(DISCORD_COMMAND_DEFINITIONS, null, 2))
  process.exit(0)
}

const res = await fetch(url, {
  method: 'PUT',
  headers: {
    authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify(DISCORD_COMMAND_DEFINITIONS),
})

const text = await res.text()
console.log(`${res.status} ${res.statusText} (${scope})`)
if (!res.ok) {
  console.error(text)
  process.exit(1)
}

const registered = JSON.parse(text) as Array<{ name: string }>
console.log(`Registered: ${registered.map((c) => `/${c.name}`).join(' ')}`)
