/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { Infer } from 'convex/values'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema, { UsageDay } from './schema'
import { INTERACTIONS_PATH } from './discordInteractions'
import { bytesToHex, encodeUtf8 } from './lib/webCrypto'

/**
 * The /stack and /tokens commands - wayfinder #226 (map #199).
 *
 * The embeds are the ones the showcase (#181) proved. The tests seed real
 * rows and run the commands through the endpoint, because the visibility
 * rule lives there: an error state answers inside the request as an
 * ephemeral message, a good reply defers publicly and patches in.
 */

const modules = import.meta.glob('./**/*.{js,ts}')
type Ctx = Awaited<ReturnType<typeof convexTest>>
type UsageDayDoc = Infer<typeof UsageDay>

const LINKED_USER = '105048063873126400'
const STRANGER = '205048063873126400'
const NOW = Date.parse('2026-08-29T12:00:00Z')

const savedEnv = {
  DISCORD_PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY,
  APP_URL: process.env.APP_URL,
}
let keyPair: CryptoKeyPair

async function post(t: Ctx, body: string) {
  const timestamp = '1700000000'
  const signature = bytesToHex(
    await crypto.subtle.sign('Ed25519', keyPair.privateKey, encodeUtf8(`${timestamp}${body}`)),
  )
  return await t.fetch(INTERACTIONS_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature-Ed25519': signature,
      'X-Signature-Timestamp': timestamp,
    },
    body,
  })
}

function command(name: string, userId: string, slug?: string, option = 'stack') {
  return JSON.stringify({
    id: '1',
    application_id: '1540381573243736116',
    type: 2,
    token: 'interaction-token',
    data: {
      id: '2',
      name,
      type: 1,
      options: slug === undefined ? [] : [{ name: option, type: 3, value: slug }],
    },
    member: { user: { id: userId } },
  })
}

function usageDay(model: string, input: number, usd?: number, harness = 'claude-code'): UsageDayDoc {
  return {
    harnesses: [
      {
        harness,
        sessions: 2,
        projectKeys: ['AAAAAAAAAAAAAAAAAAAAAA'],
        models: [
          {
            model,
            tokens: { input, output: 0, cacheWrite: 0, cacheRead: 0 },
            ...(usd === undefined ? {} : { usd, pricingTable: 'anthropic-list-2026-07-25' }),
          },
        ],
        subagentTokens: 0,
        excludedTokens: { unpriced: 0, synthetic: 0 },
      },
    ],
  }
}

async function seed(t: Ctx, over: { publishCost?: boolean; published?: boolean } = {}) {
  return await t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: 'Alper',
      slug: 'alper',
      userId: 'user_alper',
      discordUserId: LINKED_USER,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: NOW,
    })
    const stackId = await ctx.db.insert('stacks', {
      name: "Alper's Agent Stack",
      slug: 'alpers-agent-stack',
      shortId: 'unw0sl',
      creatorId,
      oneLiner: 'A stack',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: over.published ?? true,
      publishCost: over.publishCost,
      createdAt: NOW,
      updatedAt: NOW,
    })
    await ctx.db.insert('models', {
      name: 'Claude Opus 5',
      slug: 'claude-opus-5',
      shortId: 'sidopus5',
      provider: 'Anthropic',
      category: 'coding',
      reviewStatus: 'approved',
      createdAt: 1,
      updatedAt: 1,
    })
    return { stackId }
  })
}

async function seedDays(t: Ctx, stackId: Id<'stacks'>) {
  await t.run(async (ctx) => {
    const days = [
      { date: '2026-08-27', usage: usageDay('claude-opus-5', 3_000_000_000, 3_000) },
      { date: '2026-08-28', usage: usageDay('claude-opus-5', 1_000_000_000, 1_000) },
      { date: '2026-08-28', usage: usageDay('gpt-5.6-sol', 500_000_000, 380, 'codex') },
    ]
    for (const day of days) {
      await ctx.db.insert('measuredDays', {
        stackId,
        machine: 'laptop',
        date: day.date,
        capturedAt: NOW,
        receivedAt: NOW - 24 * 60 * 60 * 1000,
        aggregateVersion: 'measured-days/v1',
        fingerprint: `${day.date}-${day.usage.harnesses[0]?.harness}`,
        usage: day.usage,
      })
    }
  })
}

/** The board reads freshness off the inventory rows, so a ranked stack needs one. */
async function seedInventory(t: Ctx, stackId: Id<'stacks'>, harness = 'claude-code') {
  await t.run(async (ctx) => {
    await ctx.db.insert('measuredInventory', {
      stackId,
      machine: 'laptop',
      harness,
      harnessVersion: '2.1.220',
      capturedAt: NOW,
      receivedAt: NOW - 24 * 60 * 60 * 1000,
      inventory: {
        builtinTools: [],
        mcpServers: [],
        skills: [],
        subagents: [],
        slashCommands: [],
        withheld: { builtinTools: 0, mcpServers: 0, skills: 0, subagents: 0, slashCommands: 0 },
      },
      modelsSeen: ['claude-opus-5'],
      pricingTable: 'anthropic-list-2026-07-25',
    })
  })
}

async function seedSecondStack(t: Ctx) {
  const stackId = await t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: 'Sol',
      slug: 'sol',
      userId: 'user_sol',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: NOW,
    })
    return await ctx.db.insert('stacks', {
      name: 'Solomon',
      slug: 'solomon',
      shortId: 'qmqzh8',
      creatorId,
      oneLiner: 'A stack',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: true,
      publishCost: false,
      createdAt: NOW,
      updatedAt: NOW,
    })
  })
  await t.run(async (ctx) => {
    await ctx.db.insert('measuredDays', {
      stackId,
      machine: 'desk',
      date: '2026-08-28',
      capturedAt: NOW,
      receivedAt: NOW,
      aggregateVersion: 'measured-days/v1',
      fingerprint: 'sol-day',
      usage: usageDay('gpt-5.6-sol', 6_000_000_000, 5_000, 'codex'),
    })
  })
  await seedInventory(t, stackId, 'codex')
  return stackId
}

async function patchedReply(t: Ctx, body: string) {
  const fetchMock = vi.fn(async () => new Response(null, { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  const res = await post(t, body)
  const deferral = await res.json()
  await t.finishAllScheduledFunctions(vi.runAllTimers)
  const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit] | undefined
  return { deferral, patched: call ? JSON.parse(call[1].body as string) : null }
}

beforeEach(async () => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  keyPair = (await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])) as CryptoKeyPair
  process.env.DISCORD_PUBLIC_KEY = bytesToHex(
    await crypto.subtle.exportKey('raw', keyPair.publicKey),
  )
  process.env.APP_URL = 'https://aistack.test'
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  for (const [name, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

describe('/stack', () => {
  test('posts the stack card publicly for a slug argument', async () => {
    const t = convexTest(schema, modules)
    await seed(t)
    const { deferral, patched } = await patchedReply(
      t,
      command('stack', STRANGER, 'alpers-agent-stack-unw0sl'),
    )
    expect(deferral).toEqual({ type: 5, data: {} })
    expect(patched).toEqual({
      embeds: [
        {
          title: "Alper's Agent Stack",
          url: 'https://aistack.test/stacks/alpers-agent-stack-unw0sl',
          color: 0xa3e635,
          image: { url: `https://aistack.test/api/og/stack/alpers-agent-stack-unw0sl?v=${NOW}` },
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: 'View stack',
              url: 'https://aistack.test/stacks/alpers-agent-stack-unw0sl',
            },
          ],
        },
      ],
    })
  })

  test('with no argument uses the linked account\'s own stack', async () => {
    const t = convexTest(schema, modules)
    await seed(t)
    const { patched } = await patchedReply(t, command('stack', LINKED_USER))
    expect(patched.embeds[0].title).toBe("Alper's Agent Stack")
  })

  test('with no argument and no linked account answers the unlinked prompt, ephemeral, inside the request', async () => {
    const t = convexTest(schema, modules)
    await seed(t)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const res = await post(t, command('stack', STRANGER))
    const body = await res.json()
    expect(body.type).toBe(4)
    expect(body.data.flags).toBe(64)
    expect(body.data.content).toMatch(/Run `\/link`/)
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('an unknown slug answers the unknown-stack error, ephemeral', async () => {
    const t = convexTest(schema, modules)
    await seed(t, { published: false })
    const slug = 'my-cool-stack'
    const res = await post(t, command('stack', STRANGER, slug))
    const body = await res.json()
    expect(body.type).toBe(4)
    expect(body.data.flags).toBe(64)
    expect(body.data.content).toContain(`No stack matches "${slug}"`)
  })
})

describe('/tokens', () => {
  test('posts the measured numbers with spend where the stack consented', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seed(t)
    await seedDays(t, stackId)
    const { deferral, patched } = await patchedReply(
      t,
      command('tokens', STRANGER, 'alpers-agent-stack-unw0sl'),
    )
    expect(deferral).toEqual({ type: 5, data: {} })
    const embed = patched.embeds[0]
    expect(embed.title).toBe("Alper's Agent Stack · measured, last 30 days")
    expect(embed.url).toBe('https://aistack.test/stacks/alpers-agent-stack-unw0sl')
    expect(embed.fields).toEqual([
      { name: 'Tokens', value: '`4.50B` on `2` active days', inline: true },
      { name: 'Synced', value: 'yesterday', inline: true },
      {
        name: 'Models',
        value: 'Claude Opus 5 `89%` of tokens. 1 more model shares the rest.',
      },
      { name: 'Harnesses', value: 'Claude Code + Codex' },
      { name: 'Spend', value: '`$4,380` · `100%` of tokens priced' },
    ])
    expect(embed.footer.text).toBe(
      "Counted on the builder's machine, published by them. Prices: anthropic-list-2026-07-25.",
    )
    expect(patched.components[0].components[0].label).toBe('View stack')
  })

  test('prints no dollar figure when publishCost is off', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seed(t, { publishCost: false })
    await seedDays(t, stackId)
    const { patched } = await patchedReply(t, command('tokens', LINKED_USER))
    const names = patched.embeds[0].fields.map((f: { name: string }) => f.name)
    expect(names).toEqual(['Tokens', 'Synced', 'Models', 'Harnesses'])
    expect(JSON.stringify(patched)).not.toContain('$')
    expect(patched.embeds[0].footer.text).toBe(
      "Counted on the builder's machine, published by them.",
    )
  })

  test('a stack with no measured history answers the no-data error, ephemeral', async () => {
    const t = convexTest(schema, modules)
    await seed(t)
    const res = await post(t, command('tokens', STRANGER, 'alpers-agent-stack-unw0sl'))
    const body = await res.json()
    expect(body.type).toBe(4)
    expect(body.data.flags).toBe(64)
    expect(body.data.content).toContain('no measured history')
  })

  test('with no argument and no linked account answers the unlinked prompt', async () => {
    const t = convexTest(schema, modules)
    await seed(t)
    const res = await post(t, command('tokens', STRANGER))
    const body = await res.json()
    expect(body.data.flags).toBe(64)
    expect(body.data.content).toMatch(/Run `\/link`/)
  })
})

describe('/leaderboard', () => {
  test('posts the ranked rows, the population line, and the price tables', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seed(t)
    await seedDays(t, stackId)
    await seedInventory(t, stackId)
    await seedSecondStack(t)
    const { deferral, patched } = await patchedReply(t, command('leaderboard', STRANGER))
    expect(deferral).toEqual({ type: 5, data: {} })
    const embed = patched.embeds[0]
    expect(embed.title).toBe('AI coding leaderboard · measured, last 30 days')
    expect(embed.url).toBe('https://aistack.test/leaderboard')
    expect(embed.description).toBe(
      [
        '**1** [Solomon](https://aistack.test/stacks/solomon-qmqzh8) · `6.00B` · gpt-5.6-sol 100%',
        "**2** [Alper's Agent Stack](https://aistack.test/stacks/alpers-agent-stack-unw0sl) · `4.50B` · Claude Opus 5 89% · `$4,380`",
      ].join('\n'),
    )
    expect(embed.fields).toEqual([
      {
        name: 'All measured stacks',
        value: '`10.50B` tokens · `2` stacks · `$4,380` at least, 1 of 2 publish cost',
      },
    ])
    expect(embed.footer.text).toBe(
      'Spend is a lower bound. Prices: anthropic-list-2026-07-25.',
    )
    expect(patched.components[0].components[0]).toEqual({
      type: 2,
      style: 5,
      label: 'View leaderboard',
      url: 'https://aistack.test/leaderboard',
    })
  })

  test('prints no dollar figure when no stack publishes cost', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seed(t, { publishCost: false })
    await seedDays(t, stackId)
    await seedInventory(t, stackId)
    const { patched } = await patchedReply(t, command('leaderboard', STRANGER))
    expect(JSON.stringify(patched)).not.toContain('$')
    expect(patched.embeds[0].fields[0].value).toBe('`4.50B` tokens · `1` stack')
    expect(patched.embeds[0].footer.text).toBe(
      "Counted on the builders' machines, published by them.",
    )
  })

  test('with no living stack answers the empty-board error, ephemeral', async () => {
    const t = convexTest(schema, modules)
    await seed(t)
    const res = await post(t, command('leaderboard', STRANGER))
    const body = await res.json()
    expect(body.type).toBe(4)
    expect(body.data.flags).toBe(64)
    expect(body.data.content).toContain('No stack has synced')
  })
})

describe('/model', () => {
  test('posts the share, adoption, and lead counts for a catalog model', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seed(t)
    await seedDays(t, stackId)
    await seedInventory(t, stackId)
    await seedSecondStack(t)
    const { patched } = await patchedReply(
      t,
      command('model', STRANGER, 'claude opus 5', 'model'),
    )
    const embed = patched.embeds[0]
    expect(embed.title).toBe('Claude Opus 5 · measured, last 30 days')
    expect(embed.url).toBe('https://aistack.test/leaderboard')
    expect(embed.fields).toEqual([
      { name: 'Token share', value: '`38%` of attributed tokens', inline: true },
      { name: 'Measured on', value: '`1` stack', inline: true },
      { name: 'Leads', value: '`1` stack', inline: true },
    ])
    expect(embed.footer.text).toBe(
      'Share of tokens that carry a model name, across all measured stacks.',
    )
    expect(patched.components[0].components[0].label).toBe('View leaderboard')
  })

  test('resolves a raw measured id the catalog does not know', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seed(t)
    await seedDays(t, stackId)
    await seedInventory(t, stackId)
    const { patched } = await patchedReply(t, command('model', STRANGER, 'GPT-5.6-SOL', 'model'))
    expect(patched.embeds[0].title).toBe('gpt-5.6-sol · measured, last 30 days')
    expect(patched.embeds[0].fields[0].value).toBe('`11%` of attributed tokens')
  })

  test('an unknown model answers the unknown-model error, ephemeral', async () => {
    const t = convexTest(schema, modules)
    const { stackId } = await seed(t)
    await seedDays(t, stackId)
    await seedInventory(t, stackId)
    const res = await post(t, command('model', STRANGER, 'gpt-9', 'model'))
    const body = await res.json()
    expect(body.type).toBe(4)
    expect(body.data.flags).toBe(64)
    expect(body.data.content).toBe(
      'No model matches "gpt-9". Use a model name from the leaderboard, like `GPT-5.6 Sol` or `Claude Opus 5`.',
    )
  })

  test('a catalog model no stack measured answers the no-measurement error', async () => {
    const t = convexTest(schema, modules)
    await seed(t)
    const res = await post(t, command('model', STRANGER, 'claude-opus-5', 'model'))
    const body = await res.json()
    expect(body.data.flags).toBe(64)
    expect(body.data.content).toBe(
      'No measured stack ran Claude Opus 5 in the last 30 days.',
    )
  })
})

describe('resolveStack', () => {
  test('a linked legacy false stack resolves as public', async () => {
    const t = convexTest(schema, modules)
    await seed(t, { published: false })
    const result = await t.query(internal.discordStack.resolveStack, {
      discordUserId: LINKED_USER,
    })
    expect(result).toMatchObject({ kind: 'stack', slug: 'alpers-agent-stack-unw0sl' })
  })
})
