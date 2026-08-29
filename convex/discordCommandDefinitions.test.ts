import { describe, expect, test } from 'vitest'
import { DISCORD_COMMAND_DEFINITIONS } from '../scripts/lib/discordCommandDefinitions'
import { COMMANDS } from './discordInteractions'

describe('the registered command set matches the COMMANDS registry', () => {
  test('the names are the registry keys', () => {
    const names = DISCORD_COMMAND_DEFINITIONS.map((c) => c.name).sort()
    expect(names).toEqual(Object.keys(COMMANDS).sort())
  })

  test('the option names are the ones the handlers read', () => {
    const optionNames = (name: string) =>
      DISCORD_COMMAND_DEFINITIONS.find((c) => c.name === name)?.options?.map((o) => o.name)
    expect(optionNames('stack')).toEqual(['stack'])
    expect(optionNames('tokens')).toEqual(['stack'])
    expect(optionNames('model')).toEqual(['model'])
    expect(optionNames('leaderboard')).toBeUndefined()
    expect(optionNames('link')).toBeUndefined()
  })

  test('every command allows both installs and all three contexts', () => {
    for (const c of DISCORD_COMMAND_DEFINITIONS) {
      expect(c.integration_types).toEqual([0, 1])
      expect(c.contexts).toEqual([0, 1, 2])
    }
  })
})
