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

function getAppUrl(): string {
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

export const projectsCheck = httpAction(async (ctx, request) => {
  const authResult = await validateBearerToken(ctx as any, request)
  if (authResult instanceof Response) return authResult
  const { userId } = authResult

  const url = new URL(request.url)
  const name = url.searchParams.get('name')
  if (!name) {
    return jsonResponse({ error: 'Missing name parameter' }, 400)
  }

  const creator = await ctx.runQuery(internal.httpCliHelpers.getCreatorByUserId, { userId })
  if (!creator) {
    return jsonResponse({ error: 'Creator profile not found' }, 404)
  }

  const project = await ctx.runQuery(internal.httpCliHelpers.getProjectByCreatorAndName, {
    creatorId: creator._id,
    name,
  })

  if (project) {
    return jsonResponse({ exists: true, slug: `${project.slug}-${project.shortId}` })
  }
  return jsonResponse({ exists: false })
})

export const projectsCollect = httpAction(async (ctx, request) => {
  const authResult = await validateBearerToken(ctx as any, request)
  if (authResult instanceof Response) return authResult
  const { userId, tokenId } = authResult

  let body: { name: string; resources: any[]; stackShortId?: string; source?: string }
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.name || !body.resources) {
    return jsonResponse({ error: 'Missing required fields: name, resources' }, 400)
  }

  const creator = await ctx.runQuery(internal.httpCliHelpers.getCreatorByUserId, { userId })
  if (!creator) {
    return jsonResponse({ error: 'Creator profile not found' }, 404)
  }

  let stackId: string | null = null
  let stackSlugComposed: string | null = null

  if (body.stackShortId) {
    const stack = await ctx.runQuery(internal.httpCliHelpers.getStackByShortId, {
      shortId: body.stackShortId,
    })
    if (stack) {
      if (stack.creatorId !== creator._id) {
        return jsonResponse({ error: 'Not authorized to write to this stack' }, 403)
      }
      stackId = stack._id
      stackSlugComposed = `${stack.slug}-${stack.shortId}`
    }
  }

  if (!stackId) {
    // TODO: enforce one-stack-per-creator invariant — currently silently picks first
    const stack = await ctx.runQuery(internal.httpCliHelpers.getFirstStackByCreator, {
      creatorId: creator._id,
    })
    if (!stack) {
      return jsonResponse({ error: 'No stack found. Create a stack on aistack.to first.' }, 400)
    }
    stackId = stack._id
    stackSlugComposed = `${stack.slug}-${stack.shortId}`
  }

  const result = await ctx.runMutation(internal.httpCliHelpers.upsertProject, {
    creatorId: creator._id,
    stackId: stackId as Id<'stacks'>,
    name: body.name,
    resources: body.resources,
    source: body.source ?? 'cli',
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
    url: `${appUrl}/stacks/${stackSlugComposed}/projects/${result.slug}`,
  })
})

export const projectsGet = httpAction(async (ctx, request) => {
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/').filter(Boolean)
  const shortId = pathSegments[pathSegments.length - 1]

  if (!shortId) {
    return jsonResponse({ error: 'Missing project shortId' }, 400)
  }

  const project = await ctx.runQuery(api.projects.getByShortId, { shortId })
  if (!project) {
    return jsonResponse({ error: 'Project not found' }, 404)
  }

  await ctx.runMutation(internal.httpCliHelpers.incrementCloneCount, {
    projectId: project._id,
  })

  return jsonResponse(project)
})
