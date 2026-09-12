/** Register the canonical command set. Production runs in deploy-convex.yml. */
import { mkdir, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { join } from 'node:path'
import { DISCORD_COMMAND_DEFINITIONS } from './lib/discordCommandDefinitions.ts'
import { registerCommands, rendererReady } from './lib/discordRegistration.ts'

const { values } = parseArgs({ options: {
  'dry-run': { type: 'boolean' },
  'output-dir': { type: 'string', default: '/tmp/aistack-discord-registration' },
} })
if (values['dry-run']) {
  console.log(JSON.stringify(DISCORD_COMMAND_DEFINITIONS, null, 2))
} else {
  const { DISCORD_APP_ID, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, EXPECTED_COMMIT, DISCORD_RENDER_ORIGIN } = process.env
  if (!DISCORD_APP_ID || !DISCORD_BOT_TOKEN) {
    throw new Error('Set the repository Actions secret DISCORD_BOT_TOKEN once, then rerun the production workflow. DISCORD_APP_ID is configured by the workflow.')
  }
  const directory = values['output-dir']!
  await mkdir(directory, { recursive: true })
  const result = await registerCommands({
    appId: DISCORD_APP_ID, token: DISCORD_BOT_TOKEN, guildId: DISCORD_GUILD_ID,
    snapshot: (name, data) => writeFile(join(directory, name), `${JSON.stringify(data, null, 2)}\n`),
    beforeWrite: async () => {
      if (EXPECTED_COMMIT && (!DISCORD_RENDER_ORIGIN || !await rendererReady(DISCORD_RENDER_ORIGIN, EXPECTED_COMMIT))) {
        throw new Error('Web renderer is not ready at the deployment revision; registration was not changed')
      }
    },
  })
  console.log(`${result.changed ? 'Registered' : 'Already registered'} and verified: ${result.names.map(name => `/${name}`).join(' ')}`)
}
