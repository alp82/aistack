import { describe, expect, test } from 'vitest'
import { DISCORD_COMMAND_DEFINITIONS } from './discordCommandDefinitions'
import { commandPayload, registerCommands, rendererReady } from './discordRegistration'

const appId = '1540381573243736116'
const deployed = DISCORD_COMMAND_DEFINITIONS.map((c, i) => ({ ...c, id: String(i), application_id: appId, version: '1', type: 1, nsfw: false, default_member_permissions: null }))

function harness(responses: unknown[]) {
  const calls: { url: string; method: string; body?: unknown }[] = []
  const snapshots: Record<string, unknown> = {}
  const request: typeof fetch = async (url, options) => {
    calls.push({ url: String(url), method: options?.method ?? 'GET', body: options?.body && JSON.parse(String(options.body)) })
    const data = responses.shift()
    return data instanceof Response ? data : Response.json(data)
  }
  return { calls, snapshots, request, snapshot: async (name: string, data: unknown) => { snapshots[name] = data } }
}

describe('automatic Discord registration', () => {
  test('captures recovery before updating and verifies the full command set', async () => {
    const h = harness([{ id: appId }, [], deployed, deployed])
    const result = await registerCommands({ ...h, appId, token: 'test', beforeWrite: async () => {
      expect(h.snapshots['before.json']).toEqual([])
      expect(h.calls.every(c => c.method === 'GET')).toBe(true)
    } })
    expect(result.changed).toBe(true)
    expect(result.names).toHaveLength(9)
    expect(h.calls.find(c => c.method === 'PUT')?.body).toEqual(DISCORD_COMMAND_DEFINITIONS)
    expect(h.snapshots['after.json']).toEqual(deployed)
  })
  test('an unchanged registration only reads and still records verification', async () => {
    const h = harness([{ id: appId }, [...deployed].reverse(), deployed])
    expect((await registerCommands({ ...h, appId, token: 'test' })).changed).toBe(false)
    expect(h.calls.map(c => c.method)).toEqual(['GET', 'GET', 'GET'])
  })
  test('wrong application credentials cannot write commands', async () => {
    const h = harness([{ id: 'test-application' }])
    await expect(registerCommands({ ...h, appId, token: 'test' })).rejects.toThrow('different application')
    expect(h.calls).toHaveLength(1)
  })
  test('failed recovery snapshot prevents mutation', async () => {
    const h = harness([{ id: appId }, []])
    await expect(registerCommands({ ...h, appId, token: 'test', snapshot: async () => { throw new Error('disk full') } })).rejects.toThrow('disk full')
    expect(h.calls.every(c => c.method === 'GET')).toBe(true)
  })
  test('readiness recheck failure prevents mutation', async () => {
    const h = harness([{ id: appId }, []])
    await expect(registerCommands({ ...h, appId, token: 'test', beforeWrite: async () => { throw new Error('renderer changed') } })).rejects.toThrow('renderer changed')
    expect(h.calls.every(c => c.method === 'GET')).toBe(true)
  })
  test('mismatched readback fails while preserving before and after evidence', async () => {
    const h = harness([{ id: appId }, [], deployed, deployed.slice(1)])
    await expect(registerCommands({ ...h, appId, token: 'test' })).rejects.toThrow('readback')
    expect(h.snapshots['before.json']).toEqual([])
    expect(h.snapshots['after.json']).toHaveLength(8)
  })
  test('permission failures are explicit without printing response bodies or credentials', async () => {
    const h = harness([new Response('private details', { status: 401 })])
    await expect(registerCommands({ ...h, appId, token: 'secret' })).rejects.toThrow('HTTP 401')
  })
  test('option, context and extra-command drift is detected', () => {
    expect(commandPayload(deployed)).toEqual(commandPayload(DISCORD_COMMAND_DEFINITIONS))
    expect(commandPayload([{ ...deployed[0], contexts: [0] }, ...deployed.slice(1)])).not.toEqual(commandPayload(deployed))
    expect(commandPayload([...deployed, { name: 'extra', description: 'Extra' }])).not.toEqual(commandPayload(deployed))
  })
})

test('renderer readiness requires matching revision, configured secret and authentication', async () => {
  for (const status of [{ commit: 'old', ready: true }, { commit: 'expected', ready: false }]) {
    expect(await rendererReady('https://aistack.to', 'expected', harness([status]).request)).toBe(false)
  }
  expect(await rendererReady('https://aistack.to', 'expected', harness([{ commit: 'expected', ready: true }, new Response('', { status: 401 })]).request)).toBe(true)
  expect(await rendererReady('https://aistack.to', 'expected', harness([{ commit: 'expected', ready: true }, new Response('', { status: 503 })]).request)).toBe(false)
})
