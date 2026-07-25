import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'

const USER_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateUserCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += USER_CODE_CHARS[Math.floor(Math.random() * USER_CODE_CHARS.length)]
  }
  return code
}

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function getAppUrl(): string {
  return process.env.APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3019'
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function validateBearerToken(
  ctx: {
    runQuery: (
      query: typeof internal.cliTokens.getByToken,
      args: { token: string }
    ) => Promise<{
      userId: string
      _id: string
      stackId?: Id<'stacks'>
    } | null>
  },
  request: Request
): Promise<
  { userId: string; tokenId: string; stackId?: Id<'stacks'> } | Response
> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing or invalid Authorization header' }, 401)
  }
  const token = authHeader.slice(7)
  const tokenDoc = await ctx.runQuery(internal.cliTokens.getByToken, { token })
  if (!tokenDoc) {
    return jsonResponse({ error: 'Invalid or expired token' }, 401)
  }
  return {
    userId: tokenDoc.userId,
    tokenId: tokenDoc._id as string,
    stackId: tokenDoc.stackId,
  }
}

export const authStart = httpAction(async (ctx) => {
  const userCode = generateUserCode()
  const secretId = crypto.randomUUID()
  const now = Date.now()

  await ctx.runMutation(internal.cliSessions.createSession, {
    userCode,
    secretId,
    status: 'pending',
    createdAt: now,
    expiresAt: now + 15 * 60 * 1000,
  })

  const appUrl = getAppUrl()
  return jsonResponse({
    secretId,
    userCode,
    authUrl: `${appUrl}/cli/auth?code=${userCode}`,
  })
})

export const authPoll = httpAction(async (ctx, request) => {
  const url = new URL(request.url)
  const secretId = url.searchParams.get('secretId')
  if (!secretId) {
    return jsonResponse({ error: 'Missing secretId parameter' }, 400)
  }

  const session = await ctx.runQuery(internal.cliSessions.getBySecretId, { secretId })

  if (!session || session.expiresAt <= Date.now()) {
    return jsonResponse({ status: 'expired' })
  }

  if (session.status === 'pending') {
    return jsonResponse({ status: 'pending' })
  }

  if (session.status === 'approved' && session.userId) {
    const token = generateToken()
    const now = Date.now()

    const result = await ctx.runMutation(internal.cliSessions.issueTokenAndDeleteSession, {
      sessionId: session._id,
      token,
      userId: session.userId,
      createdAt: now,
      expiresAt: now + 90 * 24 * 60 * 60 * 1000,
      lastUsedAt: now,
    })

    if (!result) {
      return jsonResponse({ status: 'expired' })
    }

    return jsonResponse({
      status: 'approved',
      token: result.token,
      userId: session.userId,
    })
  }

  return jsonResponse({ status: 'expired' })
})

export const stackCollect = httpAction(async (ctx, request) => {
  const authResult = await validateBearerToken(ctx as any, request)
  if (authResult instanceof Response) return authResult
  const { userId, tokenId, stackId: tokenStackId } = authResult

  let body: { resources: any[] }
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.resources) {
    return jsonResponse({ error: 'Missing required field: resources' }, 400)
  }

  const creator = await ctx.runQuery(internal.httpCliHelpers.getCreatorByUserId, { userId })
  if (!creator) {
    return jsonResponse({ error: 'Creator profile not found' }, 404)
  }

  // The token's bound stack (#33 decision 7) replaces the old
  // `getFirstStackByCreator` guess, which silently picked whichever stack the
  // by_creatorId index happened to return first — fine while one-stack-per-
  // creator was assumed, wrong the moment a second stack exists.
  if (!tokenStackId) {
    return jsonResponse(
      {
        error:
          'This machine is not linked to a stack. Run `npx @use-aistack/cli login` again to pick one.',
      },
      409,
    )
  }

  const result = await ctx.runMutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId: creator._id,
    stackId: tokenStackId,
    resources: body.resources,
  })

  const now = Date.now()
  await ctx.runMutation(internal.cliTokens.refreshToken, {
    id: tokenId as Id<'cliTokens'>,
    lastUsedAt: now,
    expiresAt: now + 90 * 24 * 60 * 60 * 1000,
  })

  const appUrl = getAppUrl()
  return jsonResponse({
    slug: result.slug,
    shortId: result.shortId,
    url: `${appUrl}/stacks/${result.slug}`,
  })
})

/**
 * POST /api/cli/sync — publish one approved measured-layer snapshot.
 *
 * Wayfinder ticket #38 (map #29). The destination is the stack bound to the
 * BEARER TOKEN, never anything in the body: a payload that could name its own
 * target would undo #33 decision 7 and make the approve gate unable to say
 * truthfully where the data is going.
 *
 * The payload is validated against the closed `MeasuredPayload` validator in
 * the mutation. A validation failure is the client's fault, so it surfaces as
 * 400 with the reason rather than an opaque 500.
 */
export const syncPublish = httpAction(async (ctx, request) => {
  const authResult = await validateBearerToken(ctx as any, request)
  if (authResult instanceof Response) return authResult
  const { tokenId } = authResult

  let body: { payload?: unknown }
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  if (!body.payload) {
    return jsonResponse({ error: 'Missing required field: payload' }, 400)
  }

  let result: { snapshotId: string; receivedAt: number; stackSlug: string }
  try {
    result = await ctx.runMutation(internal.measured.publishForToken, {
      tokenId: tokenId as Id<'cliTokens'>,
      payload: body.payload as any,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // Not-linked and no-longer-authorized are both actionable by the user, and
    // both mean "do not retry this payload as-is".
    const status = /not linked|no longer/i.test(message) ? 409 : 400
    return jsonResponse({ error: message }, status)
  }

  const now = Date.now()
  await ctx.runMutation(internal.cliTokens.refreshToken, {
    id: tokenId as Id<'cliTokens'>,
    lastUsedAt: now,
    expiresAt: now + 90 * 24 * 60 * 60 * 1000,
  })

  const appUrl = getAppUrl()
  return jsonResponse({
    receivedAt: result.receivedAt,
    stackSlug: result.stackSlug,
    url: `${appUrl}/stacks/${result.stackSlug}`,
  })
})

/**
 * GET /api/cli/sync-config — the client's pre-send fetch (#33 decision 4).
 *
 * The allowlist half is genuinely public: filtering is fail-closed and must run
 * before the send, so a client that cannot authenticate still needs it.
 *
 * `publishCost` is a STACK-level preference, and an unauthenticated caller has
 * not said which stack it means — so the bearer is OPTIONAL here rather than
 * required. With a valid token the response carries the bound stack's
 * preference and name (the gate needs the name to say where the data is going);
 * without one it fails closed to `publishCost: false`, matching the client's
 * bundled default. This is the one place #38's "public, unauthenticated" wording
 * could not be taken literally without making the toggle unresolvable.
 */
export const syncConfig = httpAction(async (ctx, request) => {
  const config = await ctx.runQuery(internal.measured.getPublicSyncConfigInternal, {})

  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ ...config, publishCost: false, stack: null })
  }

  const tokenDoc = await ctx.runQuery(internal.cliTokens.getByToken, {
    token: authHeader.slice(7),
  })
  if (!tokenDoc?.stackId) {
    return jsonResponse({ ...config, publishCost: false, stack: null })
  }

  const stackConfig = await ctx.runQuery(internal.measured.getSyncConfigForStack, {
    stackId: tokenDoc.stackId,
  })
  return jsonResponse({
    ...config,
    publishCost: stackConfig.publishCost,
    stack: { name: stackConfig.stackName },
  })
})

export const stackGet = httpAction(async (ctx, request) => {
  const authResult = await validateBearerToken(ctx as any, request)
  if (authResult instanceof Response) return authResult
  const { userId } = authResult

  const creator = await ctx.runQuery(internal.httpCliHelpers.getCreatorByUserId, { userId })
  if (!creator) {
    return jsonResponse({ error: 'Creator profile not found' }, 404)
  }

  const stack = await ctx.runQuery(internal.httpCliHelpers.getStackWithResourcesByCreator, {
    creatorId: creator._id,
  })
  if (!stack) {
    return jsonResponse({ error: 'No stack found. Create a stack on aistack.to first.' }, 404)
  }

  return jsonResponse(stack)
})
