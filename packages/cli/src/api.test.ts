import { afterEach, describe, expect, test, vi } from "vitest";
import { authPoll, authStart, stackGet } from "./api";

/**
 * The two statuses #52 introduced, as the user reads them.
 *
 * A bare `429` or `403` in a terminal tells nobody what to do next. These
 * assert the sentence, not the number, because the sentence is the feature —
 * the rate limit and the scope check are both invisible until one fires.
 */

function respond(status: number, headers: Record<string, string> = {}) {
	return Promise.resolve(
		new Response(JSON.stringify({ error: "nope" }), { status, headers }),
	);
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("HTTP failures the user can act on", () => {
	test("429 names the wait, using Retry-After when the server sent one", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => respond(429, { "Retry-After": "37" })),
		);
		await expect(authStart()).rejects.toThrow(
			/too many requests. Try again in 37 seconds/,
		);
	});

	test("429 without Retry-After still says something actionable", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => respond(429)),
		);
		await expect(authPoll("secret")).rejects.toThrow(
			/too many requests. Try again in a minute/,
		);
	});

	test("403 says the machine is not allowed, and how to fix it", async () => {
		// The scope refusal. Re-authenticating IS the remedy here, unlike a 401
		// where the credential itself is the problem.
		vi.stubGlobal(
			"fetch",
			vi.fn(() => respond(403)),
		);
		await expect(stackGet("tok")).rejects.toThrow(
			/not allowed to do that. Run `aistack login` again/,
		);
	});

	test("every other status keeps its number, because that is all we know", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => respond(503)),
		);
		await expect(authStart()).rejects.toThrow(/Auth start failed: 503/);
	});
});
