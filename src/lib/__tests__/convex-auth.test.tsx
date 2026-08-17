// @vitest-environment jsdom
/**
 * Tests for the timeout-hardened Convex auth bridge (src/lib/convex-auth.ts).
 *
 * Hung-endpoint recovery: a never-settling /api/auth/convex/token must
 * degrade to `null` (unauthenticated) at AUTH_TOKEN_TIMEOUT_MS instead of
 * hanging forever. Signed-in flow: SSR-seeded token, caching, force-refresh,
 * session-driven state, and in-flight dedup all stay intact.
 */
import { act, render, renderHook } from "@testing-library/react";
import { useLayoutEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	useSession: vi.fn(),
	token: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
	authClient: {
		useSession: mocks.useSession,
		convex: { token: mocks.token },
	},
}));

import {
	AUTH_RETRY_BASE_MS,
	AUTH_TOKEN_TIMEOUT_MS,
	fetchConvexTokenWithTimeout,
	useConvexAuthFromBetterAuth,
	withTimeoutToNull,
} from "@/lib/convex-auth";

const signedInSession = (id = "session-1") => ({
	data: { session: { id } },
	isPending: false,
});

afterEach(async () => {
	// Flush timers past the timeout so the module-level in-flight dedup
	// promise always settles between tests. Wrapped in act: the flush can
	// fire a scheduled auth retry tick (fix 6), which is a React state update.
	if (vi.isFakeTimers()) {
		await act(async () => {
			await vi.advanceTimersByTimeAsync(AUTH_TOKEN_TIMEOUT_MS + 1);
		});
		vi.useRealTimers();
	}
	vi.restoreAllMocks();
	mocks.useSession.mockReset();
	mocks.token.mockReset();
});

describe("withTimeoutToNull", () => {
	it("resolves null when the promise never settles, at exactly the deadline", async () => {
		vi.useFakeTimers();
		let settled = false;
		let value: unknown = "unset";
		withTimeoutToNull(new Promise(() => {}), 4000).then((v) => {
			settled = true;
			value = v;
		});

		await vi.advanceTimersByTimeAsync(3999);
		expect(settled).toBe(false);

		await vi.advanceTimersByTimeAsync(1);
		expect(settled).toBe(true);
		expect(value).toBeNull();
	});

	it("resolves null when the promise rejects (never rejects itself)", async () => {
		await expect(
			withTimeoutToNull(Promise.reject(new Error("boom")), 4000),
		).resolves.toBeNull();
	});

	it("resolves the value when the promise settles before the deadline", async () => {
		await expect(withTimeoutToNull(Promise.resolve("ok"), 4000)).resolves.toBe(
			"ok",
		);
	});
});

describe("fetchConvexTokenWithTimeout", () => {
	it("resolves null at exactly AUTH_TOKEN_TIMEOUT_MS when the token request hangs, and aborts it", async () => {
		vi.useFakeTimers();
		mocks.token.mockReturnValue(new Promise(() => {}));

		let settled = false;
		let value: unknown = "unset";
		fetchConvexTokenWithTimeout().then((v) => {
			settled = true;
			value = v;
		});

		await vi.advanceTimersByTimeAsync(AUTH_TOKEN_TIMEOUT_MS - 1);
		expect(settled).toBe(false);

		await vi.advanceTimersByTimeAsync(1);
		expect(settled).toBe(true);
		expect(value).toBeNull();

		// Opportunistic cleanup: the hung request's signal was aborted.
		const signal = mocks.token.mock.calls[0][0]?.fetchOptions?.signal;
		expect(signal).toBeInstanceOf(AbortSignal);
		expect(signal.aborted).toBe(true);
	});

	it("resolves null when the token request rejects", async () => {
		mocks.token.mockRejectedValue(new Error("network down"));
		await expect(fetchConvexTokenWithTimeout()).resolves.toBeNull();
	});
});

describe("useConvexAuthFromBetterAuth", () => {
	const setup = (initialToken: string | null = null) =>
		renderHook(() => useConvexAuthFromBetterAuth(initialToken)());

	it("fetchAccessToken with a hung endpoint resolves null at exactly AUTH_TOKEN_TIMEOUT_MS, never rejects", async () => {
		vi.useFakeTimers();
		mocks.useSession.mockReturnValue(signedInSession());
		mocks.token.mockReturnValue(new Promise(() => {}));

		const { result } = setup(null);

		let settled = false;
		let value: unknown = "unset";
		result.current
			.fetchAccessToken({ forceRefreshToken: false })
			.then((v) => {
				settled = true;
				value = v;
			})
			.catch(() => {
				throw new Error("fetchAccessToken must never reject");
			});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(AUTH_TOKEN_TIMEOUT_MS - 1);
		});
		expect(settled).toBe(false);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
		});
		expect(settled).toBe(true);
		expect(value).toBeNull();
	});

	it("returns the seeded initialToken on the first non-forced call with zero token fetches", async () => {
		mocks.useSession.mockReturnValue(signedInSession());

		const { result } = setup("ssr-token");

		await expect(result.current.fetchAccessToken()).resolves.toBe("ssr-token");
		expect(mocks.token).not.toHaveBeenCalled();
	});

	it("returns a fetched token and caches it (second non-forced call hits the cache)", async () => {
		mocks.useSession.mockReturnValue(signedInSession());
		mocks.token.mockResolvedValue({ data: { token: "fresh-token" } });

		const { result } = setup(null);

		await expect(result.current.fetchAccessToken()).resolves.toBe(
			"fresh-token",
		);
		await expect(result.current.fetchAccessToken()).resolves.toBe(
			"fresh-token",
		);
		expect(mocks.token).toHaveBeenCalledTimes(1);
	});

	it("forceRefreshToken: true bypasses the cache and fetches", async () => {
		mocks.useSession.mockReturnValue(signedInSession());
		mocks.token.mockResolvedValue({ data: { token: "refreshed-token" } });

		const { result } = setup("ssr-token");

		await expect(
			result.current.fetchAccessToken({ forceRefreshToken: true }),
		).resolves.toBe("refreshed-token");
		expect(mocks.token).toHaveBeenCalledTimes(1);
	});

	it("isAuthenticated tracks the session and isLoading mirrors isPending", () => {
		mocks.useSession.mockReturnValue(signedInSession());
		const authed = setup(null);
		expect(authed.result.current.isAuthenticated).toBe(true);
		expect(authed.result.current.isLoading).toBe(false);

		mocks.useSession.mockReturnValue({ data: null, isPending: false });
		const signedOut = setup(null);
		expect(signedOut.result.current.isAuthenticated).toBe(false);
		expect(signedOut.result.current.isLoading).toBe(false);

		mocks.useSession.mockReturnValue({ data: undefined, isPending: true });
		const pending = setup(null);
		expect(pending.result.current.isAuthenticated).toBe(false);
		expect(pending.result.current.isLoading).toBe(true);
	});

	it("session going away clears the cached token", async () => {
		mocks.useSession.mockReturnValue(signedInSession());
		const { result, rerender } = setup("cached-token");

		// Sign-out: session gone and settled → cache cleared by the effect.
		mocks.useSession.mockReturnValue({ data: null, isPending: false });
		rerender();

		// Sign-in again: a non-forced call must miss the cache and fetch.
		mocks.useSession.mockReturnValue(signedInSession("session-2"));
		rerender();
		mocks.token.mockResolvedValue({ data: { token: "next-user-token" } });

		await expect(result.current.fetchAccessToken()).resolves.toBe(
			"next-user-token",
		);
		expect(mocks.token).toHaveBeenCalledTimes(1);
	});

	it("does not serve the cached token after a direct sessionId swap (A→B, no null pass)", async () => {
		// User A: the SSR-seeded token is bound to A's session and served.
		mocks.useSession.mockReturnValue(signedInSession("session-A"));
		const { result, rerender } = setup("token-A");

		await expect(result.current.fetchAccessToken()).resolves.toBe("token-A");
		expect(mocks.token).not.toHaveBeenCalled();

		// Direct account swap to B with NO intervening null-session render.
		mocks.useSession.mockReturnValue(signedInSession("session-B"));
		rerender();
		mocks.token.mockResolvedValue({ data: { token: "token-B" } });

		// The sessionId no longer matches the cached token's owner → re-fetch,
		// never A's still-cached JWT.
		await expect(result.current.fetchAccessToken()).resolves.toBe("token-B");
		expect(mocks.token).toHaveBeenCalledTimes(1);
	});

	it("a failed fetch with a live session schedules a retry that re-arms setAuth (new fetchAccessToken identity), and recovery resets the backoff", async () => {
		vi.useFakeTimers();
		mocks.useSession.mockReturnValue(signedInSession());
		mocks.token.mockRejectedValue(new Error("network down"));

		const { result } = setup(null);
		const initialFetch = result.current.fetchAccessToken;

		await act(async () => {
			await expect(initialFetch()).resolves.toBeNull();
		});
		// Identity is stable until the backoff elapses...
		expect(result.current.fetchAccessToken).toBe(initialFetch);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(AUTH_RETRY_BASE_MS);
		});
		// ...then the tick hands ConvexProviderWithAuth a fresh identity, which
		// is what re-runs client.setAuth and makes Convex fetch again.
		const second = result.current.fetchAccessToken;
		expect(second).not.toBe(initialFetch);

		// The retried fetch succeeds → authenticated again, backoff reset.
		mocks.token.mockResolvedValue({ data: { token: "recovered-token" } });
		await act(async () => {
			await expect(second()).resolves.toBe("recovered-token");
		});
	});

	it("doubles the retry delay on consecutive failures", async () => {
		vi.useFakeTimers();
		mocks.useSession.mockReturnValue(signedInSession());
		mocks.token.mockRejectedValue(new Error("still down"));

		const { result } = setup(null);

		// First failure → retry after BASE.
		await act(async () => {
			await result.current.fetchAccessToken();
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(AUTH_RETRY_BASE_MS);
		});
		const afterFirstRetry = result.current.fetchAccessToken;

		// Second failure → retry after 2×BASE: nothing at BASE...
		await act(async () => {
			await afterFirstRetry();
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(AUTH_RETRY_BASE_MS);
		});
		expect(result.current.fetchAccessToken).toBe(afterFirstRetry);

		// ...the bump lands at 2×BASE.
		await act(async () => {
			await vi.advanceTimersByTimeAsync(AUTH_RETRY_BASE_MS);
		});
		expect(result.current.fetchAccessToken).not.toBe(afterFirstRetry);
	});

	it("does not schedule a retry when there is no session (null token is the correct answer)", async () => {
		vi.useFakeTimers();
		mocks.useSession.mockReturnValue({ data: null, isPending: false });
		mocks.token.mockRejectedValue(new Error("network down"));

		const { result } = setup(null);
		const initialFetch = result.current.fetchAccessToken;

		await act(async () => {
			await expect(initialFetch()).resolves.toBeNull();
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(AUTH_RETRY_BASE_MS * 64);
		});
		expect(result.current.fetchAccessToken).toBe(initialFetch);
	});

	// A syntactically valid JWT whose exp lies `expSecFromNow` in the future,
	// for the failed-refresh fallback's isNearExpiry gate.
	const fakeJwt = (expSecFromNow: number) =>
		`e30.${btoa(
			JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSecFromNow }),
		)}.sig`;

	it("serves the SSR seed when called before the binding effect commits (the wedge's guest-on-reload race)", async () => {
		// ConvexProviderWithAuth calls fetchAccessToken from an effect that can
		// run before this module's passive binding effect. Pre-fix, that call
		// treated the unbound seed as a cache miss, fetched (here: hung/failed),
		// and wiped the seed with null. useLayoutEffect reproduces the ordering.
		mocks.useSession.mockReturnValue(signedInSession());
		mocks.token.mockRejectedValue(new Error("wedged"));

		const tokens: Array<string | null> = [];
		function Probe() {
			const useAuth = useConvexAuthFromBetterAuth("ssr-token");
			const auth = useAuth();
			// biome-ignore lint/correctness/useExhaustiveDependencies: fire once, before passive effects
			useLayoutEffect(() => {
				auth.fetchAccessToken().then((t) => tokens.push(t));
			}, []);
			return null;
		}
		await act(async () => {
			render(<Probe />);
		});

		expect(tokens).toEqual(["ssr-token"]);
		expect(mocks.token).not.toHaveBeenCalled();
	});

	it("a failed forced refresh re-serves a still-valid cached token instead of wiping it, and schedules a retry", async () => {
		vi.useFakeTimers();
		mocks.useSession.mockReturnValue(signedInSession());
		mocks.token.mockRejectedValue(new Error("wedged"));
		const seed = fakeJwt(900);

		const { result } = setup(seed);
		const initialFetch = result.current.fetchAccessToken;

		// Bind the seed, then hit the Convex client's mandatory forced refetch
		// while the endpoint is down: the just-validated token must survive.
		await act(async () => {
			await expect(initialFetch()).resolves.toBe(seed);
			await expect(initialFetch({ forceRefreshToken: true })).resolves.toBe(
				seed,
			);
		});
		// A later non-forced call still hits the cache.
		await act(async () => {
			await expect(initialFetch()).resolves.toBe(seed);
		});
		// The failure still armed the fix-6 backoff, so a real refresh happens
		// once the transport heals.
		await act(async () => {
			await vi.advanceTimersByTimeAsync(AUTH_RETRY_BASE_MS);
		});
		expect(result.current.fetchAccessToken).not.toBe(initialFetch);
	});

	it("a failed forced refresh with a near-expiry cached token resolves null (no rejected-token loop)", async () => {
		mocks.useSession.mockReturnValue(signedInSession());
		mocks.token.mockRejectedValue(new Error("wedged"));
		const stale = fakeJwt(30);

		const { result } = setup(stale);

		await act(async () => {
			await expect(result.current.fetchAccessToken()).resolves.toBe(stale);
			await expect(
				result.current.fetchAccessToken({ forceRefreshToken: true }),
			).resolves.toBeNull();
		});
	});

	it("two concurrent forced calls share one token fetch (dedup)", async () => {
		mocks.useSession.mockReturnValue(signedInSession());
		let resolveToken: (value: { data: { token: string } }) => void = () => {};
		mocks.token.mockReturnValue(
			new Promise((resolve) => {
				resolveToken = resolve;
			}),
		);

		const { result } = setup(null);

		const first = result.current.fetchAccessToken({ forceRefreshToken: true });
		const second = result.current.fetchAccessToken({
			forceRefreshToken: true,
		});
		resolveToken({ data: { token: "shared-token" } });

		await expect(first).resolves.toBe("shared-token");
		await expect(second).resolves.toBe("shared-token");
		expect(mocks.token).toHaveBeenCalledTimes(1);
	});
});
