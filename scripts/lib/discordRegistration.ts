import { commandsUrl, DISCORD_COMMAND_DEFINITIONS } from './discordCommandDefinitions.ts'

type Command = Record<string, unknown>
type Fetch = typeof fetch

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)]))
  }
  return value
}

/** Compare the complete writable contract, ignoring Discord IDs and implicit defaults. */
export function commandPayload(commands: readonly object[]): Command[] {
  return commands.map(entry => {
    const { id, application_id, guild_id, version, ...command }: Command = { ...entry }
    const clean = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(clean)
      if (!value || typeof value !== 'object') return value
      return Object.fromEntries(Object.entries(value).filter(([key, v]) =>
        v !== null && !(Array.isArray(v) && v.length === 0) &&
        !(['required', 'autocomplete', 'nsfw'].includes(key) && v === false) &&
        key !== 'dm_permission' && key !== 'default_permission'
      ).map(([key, v]) => [key, ['contexts', 'integration_types'].includes(key) && Array.isArray(v) ? [...v].sort() : clean(v)]))
    }
    return canonical(clean({ type: 1, ...command })) as Command
  }).sort((a, b) => `${a.type}:${a.name}`.localeCompare(`${b.type}:${b.name}`))
}

export async function rendererReady(origin: string, commit: string, request: Fetch = fetch): Promise<boolean> {
  try {
    const response = await request(`${origin}/api/discord/render`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) })
    if (!response.ok) return false
    const status = await response.json()
    if (status.commit !== commit || status.ready !== true) return false
    const unsigned = await request(`${origin}/api/discord/render`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(10_000),
    })
    return unsigned.status === 401
  } catch { return false }
}

export async function registerCommands(options: {
  appId: string
  token: string
  guildId?: string
  request?: Fetch
  snapshot: (name: string, data: unknown) => Promise<void>
  beforeWrite?: () => Promise<void>
}): Promise<{ changed: boolean; names: string[] }> {
  const request = options.request ?? fetch
  const call = async (url: string, method = 'GET', body?: unknown) => {
    const response = await request(url, {
      method,
      headers: { authorization: `Bot ${options.token}`, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!response.ok) throw new Error(`Discord ${method} failed with HTTP ${response.status}`)
    return response.json()
  }
  const application = await call('https://discord.com/api/v10/oauth2/applications/@me')
  if (application.id !== options.appId) throw new Error('Discord credential belongs to a different application')
  const url = commandsUrl(options.appId, options.guildId)
  const before: Command[] = await call(url)
  if (!Array.isArray(before)) throw new Error('Discord returned an invalid command list')
  // Persist before mutation so a failed write or readback still has recovery evidence.
  await options.snapshot('before.json', before)
  await options.snapshot('approved.json', DISCORD_COMMAND_DEFINITIONS)
  const approved = commandPayload(DISCORD_COMMAND_DEFINITIONS)
  const changed = JSON.stringify(commandPayload(before)) !== JSON.stringify(approved)
  await options.beforeWrite?.()
  if (changed) await call(url, 'PUT', DISCORD_COMMAND_DEFINITIONS)
  const after: Command[] = await call(url)
  await options.snapshot('after.json', after)
  if (JSON.stringify(commandPayload(after)) !== JSON.stringify(approved)) throw new Error('Discord registration readback does not match the approved command set')
  return { changed, names: after.map(c => String(c.name)).sort() }
}
