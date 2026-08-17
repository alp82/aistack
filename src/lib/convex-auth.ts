/**
 * Timeout-hardened Convex auth bridge for Better Auth.
 *
 * Adapted from `@convex-dev/better-auth@0.10.9` `dist/react/index.js:40-82`
 * (`useUseAuthFromBetterAuth`). This local override exists to bound a hanging
 * `/api/auth/convex/token` request (prod incident 2026-07: browsers with a
 * session cookie whose token fetch never settled paused the Convex WebSocket
 * forever, wedging every page on "Loading..."). Delete this module when the
 * 0.11+/better-auth-1.5 upgrade lands IF upstream has timeout handling by then.
 *
 * Deliberate fixes over upstream:
 * 1. Token cache is a ref instead of `useState` (upstream's memoized closure
 *    captured a permanently stale `cachedToken`, so its cache never worked).
 * 2. `initialToken` seeds the cache directly (upstream's `initialTokenUsed`
 *    flag is inverted, so the SSR token was never used).
 * 3. `isAuthenticated` is `Boolean(session?.session)` instead of upstream's
 *    `session !== null` (an `undefined` session no longer counts as authed).
 * 4. The token fetch is raced against a timeout resolving `null`, so a hung
 *    endpoint degrades to "unauthenticated" instead of pausing the socket.
 * 5. The token cache is keyed on `sessionId` (upstream cleared only on a null
 *    session), so a direct A→B account swap with no null pass never serves
 *    user A's cached JWT under user B's cookie.
 * 6. A failed token fetch while a session exists schedules a backoff retry
 *    (1s doubling to a 30s cap) that bumps the returned hook's identity.
 *    `ConvexProviderWithAuth` re-arms `client.setAuth` only when
 *    `fetchAccessToken`'s identity changes, so without this a single timed-out
 *    fetch (fix 4 resolving `null`) left the client unauthenticated until a
 *    full reload - the "randomly logged out" symptom on flaky connections.
 *
 * Deliberate omission: upstream's `ott`/crossDomain one-time-token effect is
 * dropped; this app's authClient (src/lib/auth-client.ts) has only
 * `convexClient()` + `magicLinkClient()`, so that path is dead code here.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authClient } from "./auth-client";

/**
 * 4s, not ~8s: Convex's `authentication_manager.setConfig` runs a second
 * sequential token fetch (`initialRefetch` → `refetchToken`) before resuming
 * the socket, so the worst-case wedge is 2× this value. 4s × 2 = 8s stays
 * inside the ~10s recovery bound; ~8s would give 16s and miss it.
 */
export const AUTH_TOKEN_TIMEOUT_MS = 4000;

/** Fix 6 backoff: first retry after 1s, doubling per failure. */
export const AUTH_RETRY_BASE_MS = 1000;
/** Fix 6 backoff ceiling: retry at most every 30s while the endpoint is down. */
export const AUTH_RETRY_MAX_MS = 30_000;

/**
 * Race a promise against a timer that resolves `null`. Never rejects, never
 * hangs: a rejection also resolves `null`, and the timer is always cleared.
 * `onTimeout` (if given) fires just before the timer resolves `null`, used to
 * abort the losing request.
 */
export async function withTimeoutToNull<T>(
	promise: Promise<T>,
	ms: number,
	onTimeout?: () => void,
): Promise<T | null> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<null>((resolve) => {
		timer = setTimeout(() => {
			onTimeout?.();
			resolve(null);
		}, ms);
	});
	try {
		return await Promise.race([promise, timeout]);
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
}

/**
 * True when the JWT is expired, unreadable, or within `marginMs` of expiry.
 * Gate for the failed-refresh fallback: a token past this check must never be
 * re-served, or a server-side rejection could loop.
 */
export function isNearExpiry(jwt: string, marginMs = 60_000): boolean {
	try {
		const payload = JSON.parse(
			atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
		);
		return (
			typeof payload.exp !== "number" ||
			payload.exp * 1000 - marginMs <= Date.now()
		);
	} catch {
		return true;
	}
}

// Concurrent callers share one raced fetch; cleared on settle. Safe because
// the raced promise always settles within AUTH_TOKEN_TIMEOUT_MS (no
// hung-promise pinning), a post-timeout call starts a fresh fetch, which is
// what lets recovery work once the endpoint heals.
let inFlight: Promise<string | null> | null = null;

/**
 * One bounded, dedup'd Convex token fetch. Resolves the token, or `null` on
 * timeout, abort, network failure, or an unauthenticated response. The race
 * is the load-bearing guarantee; aborting the hung request is opportunistic
 * cleanup.
 */
export async function fetchConvexTokenWithTimeout(): Promise<string | null> {
	if (inFlight) return inFlight;
	inFlight = (async () => {
		const controller = new AbortController();
		const result = await withTimeoutToNull(
			authClient.convex.token({ fetchOptions: { signal: controller.signal } }),
			AUTH_TOKEN_TIMEOUT_MS,
			() => controller.abort(),
		);
		return result?.data?.token ?? null;
	})().finally(() => {
		inFlight = null;
	});
	return inFlight;
}

/**
 * Factory hook returning the stable `useAuth` hook for
 * `ConvexProviderWithAuth`, mirroring upstream's structure with the fixes
 * documented in the module header.
 */
export function useConvexAuthFromBetterAuth(
	initialToken: string | null | undefined,
) {
	// Fix 1+2: a ref (not useState) seeded from the SSR token, so a signed-in
	// user's first non-forced fetchAccessToken returns it with zero network,
	// instant WS auth even if the token endpoint is hung.
	const tokenRef = useRef<string | null>(initialToken ?? null);
	// The session id the cached token belongs to. A cache hit requires this to
	// match the current session id, so a direct A→B account swap (which changes
	// the id without a null-session pass) is treated as a miss and re-fetches,
	// this closes the cross-user cached-token window. `undefined` until bound.
	const tokenSessionIdRef = useRef<string | undefined>(undefined);
	// authClient is a module singleton, so the returned hook is stable.
	return useMemo(
		() =>
			// Biome doesn't recognize this memoized function expression as a
			// hook, so the inner hook calls each carry a useHookAtTopLevel
			// suppression (same structure as upstream, which relied on eslint).
			function useAuthFromBetterAuth() {
				// biome-ignore lint/correctness/useHookAtTopLevel: useAuthFromBetterAuth is a hook returned from a memoized factory, mirroring upstream
				const { data: session, isPending } = authClient.useSession();
				const sessionId = session?.session?.id;
				// Fix 6: bumped after a backoff delay when a token fetch fails
				// with a live session. It feeds fetchAccessToken's deps, so the
				// bump hands ConvexProviderWithAuth a new identity and re-arms
				// client.setAuth - the only thing that makes Convex fetch again.
				// biome-ignore lint/correctness/useHookAtTopLevel: useAuthFromBetterAuth is a hook returned from a memoized factory, mirroring upstream
				const [retryTick, setRetryTick] = useState(0);
				// biome-ignore lint/correctness/useHookAtTopLevel: useAuthFromBetterAuth is a hook returned from a memoized factory, mirroring upstream
				const retryAttemptsRef = useRef(0);
				// biome-ignore lint/correctness/useHookAtTopLevel: useAuthFromBetterAuth is a hook returned from a memoized factory, mirroring upstream
				const retryTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
					undefined,
				);
				// biome-ignore lint/correctness/useHookAtTopLevel: useAuthFromBetterAuth is a hook returned from a memoized factory, mirroring upstream
				useEffect(
					() => () => {
						clearTimeout(retryTimerRef.current);
						retryTimerRef.current = undefined;
					},
					[],
				);
				// Bind the SSR-seeded token to the first real session observed on
				// the client (its rightful owner), so a later account swap (which
				// changes sessionId) invalidates it via the cache-match check
				// below. Guarded by tokenSessionIdRef itself: once set (here or by
				// fetchAccessToken), it never returns to undefined, so a swap
				// never re-binds.
				// biome-ignore lint/correctness/useHookAtTopLevel: useAuthFromBetterAuth is a hook returned from a memoized factory, mirroring upstream
				useEffect(() => {
					if (
						tokenSessionIdRef.current === undefined &&
						sessionId &&
						tokenRef.current !== null
					) {
						tokenSessionIdRef.current = sessionId;
					}
				}, [sessionId]);
				// Keyed on sessionId: the callback both reads it (to match the
				// cached token's owner) and gets a fresh identity whenever the
				// session changes, which re-triggers setAuth() so users
				// re-authenticate once the endpoint recovers. retryTick is
				// deliberately unread in the body: its whole job is forcing a new
				// identity per scheduled retry so setAuth re-arms (fix 6).
				// biome-ignore lint/correctness/useHookAtTopLevel: useAuthFromBetterAuth is a hook returned from a memoized factory, mirroring upstream
				// biome-ignore lint/correctness/useExhaustiveDependencies: retryTick forces a fresh identity per retry
				const fetchAccessToken = useCallback(
					async ({
						forceRefreshToken = false,
					}: {
						forceRefreshToken?: boolean;
					} = {}) => {
						// Fix 6: after a failed fetch with a live session, Convex
						// sits unauthenticated (or on the fallback token) and never
						// asks again on its own - schedule one bump.
						const scheduleRetry = () => {
							if (!sessionId || retryTimerRef.current !== undefined) return;
							const delay = Math.min(
								AUTH_RETRY_MAX_MS,
								AUTH_RETRY_BASE_MS * 2 ** retryAttemptsRef.current,
							);
							retryAttemptsRef.current += 1;
							retryTimerRef.current = setTimeout(() => {
								retryTimerRef.current = undefined;
								setRetryTick((tick) => tick + 1);
							}, delay);
						};
						// Serve the cache only when it belongs to the current
						// session (a sessionId mismatch: sign-out/sign-in OR a
						// direct A→B swap with no null pass) forces a re-fetch and
						// subsumes the old null-session clear.
						// An unbound cache (`boundSid === undefined`) is the SSR seed
						// before any bind: the binding effect below runs after paint,
						// but ConvexProviderWithAuth can call in before that commit,
						// and treating the seed as a miss here wiped it with the
						// failed fetch's null - a wedged token endpoint then meant
						// GUEST forever even though every reload delivered a valid
						// seed. Bind lazily on first serve instead; `undefined` can
						// only match before the first bind, so the A→B swap guard
						// (bound id must equal the live session id) is unaffected.
						if (
							tokenRef.current &&
							!forceRefreshToken &&
							(tokenSessionIdRef.current === sessionId ||
								(tokenSessionIdRef.current === undefined && sessionId))
						) {
							tokenSessionIdRef.current = sessionId;
							return tokenRef.current;
						}
						const token = await fetchConvexTokenWithTimeout();
						// Failed fetch with a still-valid cached token for the live
						// session: serve the cache instead of wiping it. The Convex
						// client's mandatory post-auth forced refetch otherwise
						// destroys a token the server just validated whenever the
						// token endpoint is unreachable (the Vivaldi wedge), turning
						// one transport failure into "guest until browser restart".
						// Expiry-guarded so a genuinely rejected token can't loop.
						if (
							!token &&
							tokenRef.current &&
							tokenSessionIdRef.current === sessionId &&
							!isNearExpiry(tokenRef.current)
						) {
							scheduleRetry();
							return tokenRef.current;
						}
						tokenRef.current = token;
						tokenSessionIdRef.current = sessionId;
						if (token) {
							retryAttemptsRef.current = 0;
						} else {
							scheduleRetry();
						}
						return token;
					},
					[sessionId, retryTick],
				);
				// biome-ignore lint/correctness/useHookAtTopLevel: useAuthFromBetterAuth is a hook returned from a memoized factory, mirroring upstream
				// biome-ignore lint/correctness/useExhaustiveDependencies: sessionId stands in for the session object to keep identity stable across refetches
				return useMemo(
					() => ({
						isLoading: isPending,
						// Fix 3: undefined session data must not count as authed.
						isAuthenticated: Boolean(session?.session),
						fetchAccessToken,
					}),
					[isPending, sessionId, fetchAccessToken],
				);
			},
		[],
	);
}
