/**
 * The Discord command set the registration script PUTs (alp82/aistack#224).
 *
 * Names and option names must match the `COMMANDS` registry in
 * convex/discordInteractions.ts and the option lookups in
 * convex/discordCommands.ts. `discordCommandDefinitions.test.ts` asserts that.
 *
 * Discord API constants (docs.discord.com/developers/interactions/application-commands):
 *   option type 3 = STRING
 *   integration_types 0 = GUILD_INSTALL, 1 = USER_INSTALL
 *   contexts 0 = GUILD, 1 = BOT_DM, 2 = PRIVATE_CHANNEL
 */

export const GUILD_INSTALL = 0
export const USER_INSTALL = 1
export const CONTEXT_GUILD = 0
export const CONTEXT_BOT_DM = 1
export const CONTEXT_PRIVATE_CHANNEL = 2
const STRING_OPTION = 3

export interface CommandOptionDefinition {
  type: number
  name: string
  description: string
  required: boolean
}

export interface CommandDefinition {
  name: string
  description: string
  options?: CommandOptionDefinition[]
  integration_types: number[]
  contexts: number[]
}

const stackOption: CommandOptionDefinition = {
  type: STRING_OPTION,
  name: 'stack',
  description: 'Stack slug, like alpers-agent-stack-unw0sl. Empty: your own stack.',
  required: false,
}

const everywhere = {
  integration_types: [GUILD_INSTALL, USER_INSTALL],
  contexts: [CONTEXT_GUILD, CONTEXT_BOT_DM, CONTEXT_PRIVATE_CHANNEL],
}

export const DISCORD_COMMAND_DEFINITIONS: CommandDefinition[] = [
  { name: 'stack', description: 'Post a stack card', options: [stackOption], ...everywhere },
  {
    name: 'tokens',
    description: 'Post the measured numbers for a stack',
    options: [stackOption],
    ...everywhere,
  },
  { name: 'leaderboard', description: 'Top builders by 30-day token volume', ...everywhere },
  {
    name: 'model',
    description: 'Adoption and token share for a model',
    options: [
      {
        type: STRING_OPTION,
        name: 'model',
        description: 'Model name, like gpt-5.6-sol',
        required: true,
      },
    ],
    ...everywhere,
  },
  { name: 'link', description: 'Link your aistack account', ...everywhere },
]

/** The endpoint for the command set: global, or one guild when `guildId` is given. */
export function commandsUrl(appId: string, guildId?: string): string {
  const base = `https://discord.com/api/v10/applications/${appId}`
  return guildId ? `${base}/guilds/${guildId}/commands` : `${base}/commands`
}
