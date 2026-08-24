import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { isDisplaySafeName } from './lib/names'
import type { CliTokenScope } from './lib/cliScopes'
import { DEFAULT_MAX_REQUESTS, SHARED_BUCKET_MAX_REQUESTS } from './rateLimit'

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

/**
 * Unsalted SHA-256, lowercase hex - the at-rest form of a bearer token (#49).
 *
 * Unsalted is the right primitive, not a shortcut: the token is 256 bits of
 * `crypto.getRandomValues`, so there is no dictionary to attack and a salt
 * defeats nothing. Password stretching would only tax every request.
 *
 * This runs in the `httpAction`, which is the whole point - the plaintext never
 * crosses into the database layer, so a `runQuery` argument log cannot leak one.
 */
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** The narrow slice of an httpAction ctx these helpers need. */
type TokenLookupCtx = {
  runQuery: (query: any, args: any) => Promise<any>
  runMutation: (mutation: any, args: any) => Promise<any>
}

/**
 * Resolve a raw bearer to its stored row, BY DIGEST AND NOTHING ELSE.
 *
 * The plaintext fallback phase A needed is gone with the column (#52). The
 * digest is computed here, in the action, which is the whole point: the raw
 * bearer never crosses into the database layer, so a `runQuery` argument log
 * cannot leak one.
 */
async function resolveToken(
  ctx: TokenLookupCtx,
  rawToken: string,
): Promise<{
  userId: string
  _id: string
  stackId?: Id<'stacks'>
  scopes: CliTokenScope[]
} | null> {
  return await ctx.runQuery(internal.cliTokens.getByTokenHash, {
    tokenHash: await sha256Hex(rawToken),
  })
}

/**
 * ONE choke point for every authenticated CLI route: identity, scope, budget.
 *
 * SCOPES ARE LATENT. Every token is minted with the full set, so no live
 * request is refused - what exists here is the enforcement point, so a narrower
 * token later needs no server change. An ABSENT `scopes` array is a token
 * minted before the field existed, and those were granted everything; the
 * scopes narrow makes that case unreachable rather than leaving it as a
 * permanent bypass.
 *
 * THE BUDGET KEYS ON THE TOKEN, NOT THE IP (#52). `/api/cli/*` are thin
 * TanStack proxies and the Convex site URL is directly reachable, so an
 * IP-keyed limit here is walked around by talking to Convex directly - while
 * the proxy forwards only `Authorization` and `Content-Type`, so a Convex-side
 * IP limiter would see one address for every user and throttle the world as a
 * single caller. The token id is already in hand at this exact line and
 * behaves identically down both paths.
 *
 * The key uses the token ID rather than its digest deliberately: the digest is
 * the credential-equivalent after phase C, and a rate-limit row is a second
 * place it would sit.
 */
async function validateBearerToken(
  ctx: TokenLookupCtx,
  request: Request,
  requiredScope: CliTokenScope,
): Promise<
  { userId: string; tokenId: string; stackId?: Id<'stacks'> } | Response
> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing or invalid Authorization header' }, 401)
  }
  const tokenDoc = await resolveToken(ctx, authHeader.slice(7))
  if (!tokenDoc) {
    return jsonResponse({ error: 'Invalid or expired token' }, 401)
  }
  if (!tokenDoc.scopes.includes(requiredScope)) {
    // 403, not 401: the credential is good and re-authenticating with the same
    // one changes nothing. Naming the scope keeps the message actionable
    // without disclosing what else the token can reach.
    return jsonResponse(
      { error: `This machine is not allowed to ${requiredScope}. Run login again to re-link it.` },
      403,
    )
  }

  const rl = await ctx.runMutation(internal.rateLimit.checkRateLimit, {
    key: `cli-token:${tokenDoc._id}`,
  })
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded', retryAfterSeconds: rl.retryAfterSeconds }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rl.retryAfterSeconds),
          'RateLimit-Limit': String(rl.limit),
          'RateLimit-Remaining': String(rl.remaining),
          'RateLimit-Reset': String(rl.retryAfterSeconds),
        },
      },
    )
  }

  return {
    userId: tokenDoc.userId,
    tokenId: tokenDoc._id as string,
    stackId: tokenDoc.stackId,
  }
}

/** The header pair the TanStack proxy uses to hand Convex the real caller. */
const CLIENT_IP_HEADER = 'x-aistack-client-ip'
const PROXY_AUTH_HEADER = 'x-aistack-proxy-auth'

/**
 * The rightmost X-Forwarded-For hop.
 *
 * A deliberate duplicate of `ipFromForwardedFor` in
 * `src/routes/api.stacks.$slug.tsx`: Convex functions cannot import from `src`,
 * and this is four lines. Same precondition - the rightmost hop is the real
 * address only because Coolify's Traefik APPENDS it and does not trust a
 * client-supplied header.
 */
function rightmostForwardedHop(xff: string | null): string | null {
  if (!xff) return null
  const hops = xff.split(',')
  for (let i = hops.length - 1; i >= 0; i--) {
    const hop = hops[i]?.trim()
    if (hop) return hop
  }
  return null
}

/**
 * Who to charge for an unauthenticated `authStart`, and how hard (#52).
 *
 * The proxy destroys the client address - it forwards only `Authorization` and
 * `Content-Type` - so Convex is handed it in a custom header AUTHENTICATED BY A
 * SHARED SECRET. Without the secret the header is ignored completely, so a
 * caller hitting `.convex.site` directly cannot claim to be any address it
 * likes.
 *
 * THE FALLBACK MATTERS MORE THAN THE HAPPY PATH. With no secret configured,
 * every proxied login on earth lands in ONE bucket, so it takes a HIGH cap and
 * a SEPARATE key namespace. At 60/min a missing env var would break login for
 * everybody at once - a misconfiguration must degrade, not lock out.
 *
 * The secret is compared as DIGESTS. A plain `===` on strings short-circuits at
 * the first differing byte; comparing SHA-256 output leaks only digest
 * prefixes, which say nothing about the secret.
 */
async function authStartBudget(
  request: Request,
): Promise<{ key: string; limit: number; trusted: boolean }> {
  const secret = process.env.CLI_PROXY_SECRET
  const presented = request.headers.get(PROXY_AUTH_HEADER)
  const claimed = request.headers.get(CLIENT_IP_HEADER)?.trim()

  if (secret && presented && claimed) {
    const [a, b] = await Promise.all([sha256Hex(presented), sha256Hex(secret)])
    if (a === b) {
      return { key: `cli-auth-ip:${claimed}`, limit: DEFAULT_MAX_REQUESTS, trusted: true }
    }
  }

  const hop = rightmostForwardedHop(request.headers.get('x-forwarded-for'))
  return {
    key: `cli-auth-hop:${hop ?? 'unknown'}`,
    limit: SHARED_BUCKET_MAX_REQUESTS,
    trusted: false,
  }
}

/**
 * POST /api/cli/auth/start - open a device-code session.
 *
 * The body is OPTIONAL and carries one field: `machineName`, the CLI's proposal
 * for what to call this machine (#49). It is a proposal, not a fact - the
 * approval page renders it in an editable field, so the string that reaches
 * `cliTokens.name` is always one the user saw and could overwrite.
 *
 * A name that fails the display bound is DROPPED, not rejected. Refusing the
 * whole login because a hostname carries a control character would break
 * authentication over a cosmetic field, and the user can type a name on the
 * approval page regardless.
 */
export const authStart = httpAction(async (ctx, request) => {
  // The abuse target on this whole surface (#36): unauthenticated, one
  // `cliSessions` row per call. The limit bounds the rate; the hourly cleanup
  // cron bounds the total.
  const budget = await authStartBudget(request)
  const rl = await ctx.runMutation(internal.rateLimit.checkRateLimit, {
    key: budget.key,
    limit: budget.limit,
  })
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many login attempts. Try again in a minute.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rl.retryAfterSeconds),
          'RateLimit-Limit': String(rl.limit),
          'RateLimit-Remaining': String(rl.remaining),
          'RateLimit-Reset': String(rl.retryAfterSeconds),
        },
      },
    )
  }

  const userCode = generateUserCode()
  const secretId = crypto.randomUUID()
  const now = Date.now()

  let machineName: string | undefined
  let cliVersion: string | undefined
  try {
    const body = (await request.json()) as {
      machineName?: unknown
      cliVersion?: unknown
    }
    if (typeof body?.machineName === 'string') {
      const trimmed = body.machineName.trim()
      if (isDisplaySafeName(trimmed)) machineName = trimmed
    }
    // Carried to the token exchange, where `cli_login_completed` reports it
    // (#77). Bounded and dropped when malformed, like the name above: a version
    // string must never be able to fail a login.
    if (typeof body?.cliVersion === 'string') {
      const trimmed = body.cliVersion.trim()
      if (trimmed.length > 0 && trimmed.length <= 32) cliVersion = trimmed
    }
  } catch {
    // No body, or not JSON - an older CLI. Proceed nameless.
  }

  await ctx.runMutation(internal.cliSessions.createSession, {
    userCode,
    secretId,
    status: 'pending',
    machineName,
    cliVersion,
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
      // The DIGEST is all the mutation gets (#52). The raw token was generated
      // three lines up and is returned from here, so the plaintext lives in
      // this action's memory and nowhere else on the server.
      tokenHash: await sha256Hex(token),
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
      token,
      userId: session.userId,
    })
  }

  return jsonResponse({ status: 'expired' })
})

/**
 * Drop wire fields the resource contract no longer has (#213).
 *
 * `scope` is the one: resources became stack-only in June 2026 and the field
 * has been ignored ever since, but `ResourceInput` kept tolerating it so that
 * installed CLIs would still publish. Tolerance belongs here rather than in the
 * validator - a validator lists the contract, and a field listed there reads as
 * part of it. Stripping at the edge retires the field from the contract without
 * breaking a single installed client.
 */
export function stripRetiredResourceFields(item: unknown): unknown {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    return item
  }
  const { scope: _retired, ...rest } = item as Record<string, unknown>
  return rest
}

export const stackCollect = httpAction(async (ctx, request) => {
  const authResult = await validateBearerToken(ctx as any, request, 'collect')
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
  // by_creatorId index happened to return first - fine while one-stack-per-
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
    resources: body.resources.map(stripRetiredResourceFields) as any,
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

/** The shape a client with no resolvable stack gets: every category, no names. */
const EMPTY_OPT_INS = {
  builtinTools: [],
  machines: [],
  mcpServers: [],
  skills: [],
  subagents: [],
  slashCommands: [],
}

/**
 * Read the auto-sync half of a sync body.
 *
 * A malformed value is DROPPED, not rejected. Refusing the whole sync because a
 * telemetry field is the wrong shape would cost the owner the one thing they
 * approved, over a field nothing user-facing reads.
 */
function parseAutoSync(
  raw: unknown,
): { enabled: boolean; frequencyHours: number } | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined
  const value = raw as { enabled?: unknown; frequencyHours?: unknown }
  if (typeof value.enabled !== 'boolean') return undefined
  if (typeof value.frequencyHours !== 'number') return undefined
  if (!Number.isFinite(value.frequencyHours)) return undefined
  return { enabled: value.enabled, frequencyHours: value.frequencyHours }
}

/**
 * Read how the sync fired (#102).
 *
 * ONE UNKNOWN VALUE READS AS MANUAL, exactly like an absent field. A stamp that
 * says "a machine published on its own" is a claim the web switch renders, so
 * anything the server cannot name must not make it - and the sync itself is
 * never refused over the field, for the same reason `parseAutoSync` drops
 * rather than rejects.
 */
function parseTrigger(raw: unknown): 'manual' | 'auto' | undefined {
  return raw === 'manual' || raw === 'auto' ? raw : undefined
}

/**
 * Read the publishing CLI's own version (#213).
 *
 * Dropped rather than rejected, like `parseAutoSync`: it answers an operational
 * question about the fleet, and refusing an approved sync over a malformed
 * version string would trade the measurement for the metadata. Bounded to the
 * same 32 characters the login route uses, so one field has one bound.
 */
function parseCliVersion(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  return trimmed.length > 0 && trimmed.length <= 32 ? trimmed : undefined
}

/**
 * POST /api/cli/sync - publish one approved measured-layer snapshot.
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
  const authResult = await validateBearerToken(ctx as any, request, 'sync')
  if (authResult instanceof Response) return authResult
  const { tokenId } = authResult

  let body: {
    payload?: unknown
    payloads?: unknown
    keptPrivate?: unknown
    autoSync?: unknown
    trigger?: unknown
    workflow?: unknown
    cliVersion?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  // `payloads` is the batch a #67 client sends - one per detected harness.
  // The old single `payload` stays accepted for installed CLIs until a wire
  // bump retires it, the way `scope` was retired in #213: strip it at this
  // edge, and leave the contract saying only what it means.
  if (!body.payload && !(Array.isArray(body.payloads) && body.payloads.length > 0)) {
    return jsonResponse({ error: 'Missing required field: payloads' }, 400)
  }

  let result: {
    snapshotIds: string[]
    receivedAt: number
    stackSlug: string
    keptPrivate: { stored: number; refused: boolean }
  }
  try {
    result = await ctx.runMutation(internal.measured.publishForToken, {
      tokenId: tokenId as Id<'cliTokens'>,
      payload: body.payload as any,
      payloads: body.payloads as any,
      keptPrivate: body.keptPrivate as any,
      // Additive and optional (#77): an installed CLI sends nothing here and
      // keeps working, which reads as "this machine has never told us".
      autoSync: parseAutoSync(body.autoSync),
      // Additive and optional (#102): a 0.6.x CLI sends nothing and its syncs
      // read as manual, which is what keeps the switch honest until #103 ships.
      trigger: parseTrigger(body.trigger),
      // Additive and optional (#213). Unlike the two fields above this one is
      // NOT parsed here: it goes to the closed `WorkflowSection` validator in
      // the mutation, exactly like the payloads, and a malformed section is the
      // client's fault and surfaces as a 400. The drop-rather-than-reject rule
      // above is for telemetry nothing user-facing reads; the workflow section
      // is measurement, and a silently dropped measurement is a wrong page.
      workflow: body.workflow as any,
      // Additive and optional (#213), bounded the same way the login route
      // bounds it.
      cliVersion: parseCliVersion(body.cliVersion),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // Not-linked, no-longer-authorized and auto-sync-off are all actionable by
    // the user, and all mean "do not retry this payload as-is". The third is
    // the server-side half of the web revoke (#102).
    const status = /not linked|no longer|auto-sync is off/i.test(message) ? 409 : 400
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
    // Reported rather than assumed: a client whose config fetch was stale needs
    // to know its staged names went nowhere, and the owner needs the switch to
    // be observably in force.
    keptPrivate: result.keptPrivate,
  })
})

/**
 * GET /api/cli/sync-config - the client's pre-send fetch (#33 decision 4).
 *
 * The allowlist half is genuinely public: filtering is fail-closed and must run
 * before the send, so a client that cannot authenticate still needs it.
 *
 * `publishCost` is a STACK-level preference, and an unauthenticated caller has
 * not said which stack it means - so the bearer is OPTIONAL here rather than
 * required. With a valid token the response carries the bound stack's
 * preference and name (the gate needs the name to say where the data is going);
 * without one it fails closed to `publishCost: false`, matching the client's
 * bundled default. This is the one place #38's "public, unauthenticated" wording
 * could not be taken literally without making the toggle unresolvable.
 *
 * `optIns` (#42 decision 2, built in #44) is stack-scoped for the same reason
 * and fails closed the same way: no bearer, no ticked names, so every
 * user-chosen name reverts to kept-private. Losing the network publishes LESS.
 */
export const syncConfig = httpAction(async (ctx, request) => {
  const config = await ctx.runQuery(internal.measured.getPublicSyncConfigInternal, {})
  const anonymous = {
    ...config,
    publishCost: false,
    // Fails closed with the rest of the stack-level half (#48): with no bearer
    // there is no stack to ask, and the direction that transmits LESS is off.
    reviewKeptPrivate: false,
    // And again for the workflow section (#213). The client's bundled default
    // matches, so an unreachable server publishes measurement and no workflow.
    publishWorkflow: false,
    optIns: EMPTY_OPT_INS,
    stack: null,
    // Fails closed too (#102): with no stack in hand there is no permission to
    // publish on a timer, and `sync --auto` reads that as "do not publish".
    autoSync: null,
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse(anonymous)
  }

  const tokenDoc = await resolveToken(ctx as any, authHeader.slice(7))
  if (!tokenDoc?.stackId) {
    return jsonResponse(anonymous)
  }
  // NO 401 AND NO 403 ON THIS ROUTE, ever (#52). A token without `sync` gets
  // the anonymous fail-closed body, because refusing it outright would break
  // the pre-send filter for exactly the tokens we most want filtered - and a
  // client that cannot fetch the allowlist publishes nothing it should have
  // held back only if the filter is fail-closed on its own, which it is, but
  // only because it still HAS a list.
  if (!tokenDoc.scopes.includes('sync')) {
    return jsonResponse(anonymous)
  }

  const stackConfig = await ctx.runQuery(internal.measured.getSyncConfigForStack, {
    stackId: tokenDoc.stackId,
  })
  return jsonResponse({
    ...config,
    publishCost: stackConfig.publishCost,
    reviewKeptPrivate: stackConfig.reviewKeptPrivate,
    publishWorkflow: stackConfig.publishWorkflow,
    optIns: stackConfig.optIns,
    stack: { name: stackConfig.stackName, slug: stackConfig.stackSlug },
    // What gates `sync --auto` (#103). Null means the stack has never had a
    // flag, which is the one state a local opt-in may still seed.
    autoSync: stackConfig.autoSync,
  })
})

/**
 * POST /api/cli/auto-sync - a machine sets the permission on its bound stack.
 *
 * Wayfinder ticket #102 (map #76), from #100 decision 2. The destination is the
 * stack bound to the BEARER, never anything in the body - the same rule the
 * publish route follows, and for the same reason.
 *
 * A MALFORMED BODY IS REFUSED HERE, unlike the telemetry fields on a sync. This
 * route changes a standing permission, so a value the server cannot read must
 * not be guessed at: "off" and "on every hour" are both wrong answers to an
 * unreadable one. A sync drops such a field instead, because there the cost of
 * refusing is the measurement the owner already approved.
 */
export const autoSyncSet = httpAction(async (ctx, request) => {
  const authResult = await validateBearerToken(ctx as any, request, 'sync')
  if (authResult instanceof Response) return authResult
  const { tokenId } = authResult

  let body: { enabled?: unknown; frequencyHours?: unknown }
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  if (typeof body.enabled !== 'boolean') {
    return jsonResponse({ error: 'Missing required field: enabled' }, 400)
  }
  if (
    body.frequencyHours !== undefined &&
    (typeof body.frequencyHours !== 'number' || !Number.isFinite(body.frequencyHours))
  ) {
    return jsonResponse({ error: 'frequencyHours must be a number' }, 400)
  }

  try {
    const result = await ctx.runMutation(internal.autoSync.setForToken, {
      tokenId: tokenId as Id<'cliTokens'>,
      enabled: body.enabled,
      frequencyHours: body.frequencyHours,
    })
    return jsonResponse(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const status = /not linked|no longer/i.test(message) ? 409 : 400
    return jsonResponse({ error: message }, status)
  }
})

export const stackGet = httpAction(async (ctx, request) => {
  const authResult = await validateBearerToken(ctx as any, request, 'collect')
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
