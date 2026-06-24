import { httpAction } from './_generated/server'
import { api, internal } from './_generated/api'
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
  ctx: { runQuery: (query: typeof internal.cliTokens.getByToken, args: { token: string }) => Promise<{ userId: string; _id: string } | null> },
  request: Request
): Promise<{ userId: string; tokenId: string } | Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing or invalid Authorization header' }, 401)
  }
  const token = authHeader.slice(7)
  const tokenDoc = await ctx.runQuery(internal.cliTokens.getByToken, { token })
  if (!tokenDoc) {
    return jsonResponse({ error: 'Invalid or expired token' }, 401)
  }
  return { userId: tokenDoc.userId, tokenId: tokenDoc._id as string }
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

  const session = await ctx.runQuery(api.cliSessions.getBySecretId, { secretId })

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
  const { userId, tokenId } = authResult

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

  const stack = await ctx.runQuery(internal.httpCliHelpers.getFirstStackByCreator, {
    creatorId: creator._id,
  })
  if (!stack) {
    return jsonResponse({ error: 'No stack found. Create a stack on aistack.to first.' }, 400)
  }

  const result = await ctx.runMutation(internal.httpCliHelpers.upsertStackResources, {
    creatorId: creator._id,
    stackId: stack._id as Id<'stacks'>,
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
