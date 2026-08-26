import { afterEach, describe, expect, test, vi } from "vitest";
import { authPoll, authStart, setAutoSync, stackGet, syncPublish } from "./api";

/**
 * The two statuses #52 introduced, as the user reads them.
 *
 * A bare `429` or `403` in a terminal tells nobody what to do next. These
 * assert the sentence, not the number, because the sentence is the feature -
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

/**
 * Setting the stack's auto-sync permission (#102's route, called by #103).
 *
 * The destination is the stack bound to the BEARER, never anything the caller
 * names, so these only pin the request the CLI makes and the sentences a
 * refusal turns into.
 */
describe("setAutoSync", () => {
	test("posts the flag to the bound stack", async () => {
		const fetchMock = vi.fn(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						autoSync: { enabled: true, frequencyHours: 12 },
						lastAutoSyncAt: null,
					}),
					{ status: 200 },
				),
			),
		);
		vi.stubGlobal("fetch", fetchMock);
		const res = await setAutoSync("tok", {
			enabled: true,
			frequencyHours: 12,
		});
		expect(res.autoSync).toEqual({ enabled: true, frequencyHours: 12 });
		const [url, init] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(url).toMatch(/\/api\/cli\/auto-sync$/);
		expect(init.method).toBe("POST");
		expect(JSON.parse(init.body as string)).toEqual({
			enabled: true,
			frequencyHours: 12,
		});
	});

	test("a revoke sends no frequency - off keeps no schedule", async () => {
		const fetchMock = vi.fn(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						autoSync: { enabled: false, frequencyHours: 24 },
						lastAutoSyncAt: null,
					}),
					{ status: 200 },
				),
			),
		);
		vi.stubGlobal("fetch", fetchMock);
		await setAutoSync("tok", { enabled: false });
		const [, init] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(JSON.parse(init.body as string)).toEqual({ enabled: false });
	});

	test("401 says the link expired, not that the flag is off", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => respond(401)),
		);
		await expect(setAutoSync("tok", { enabled: true })).rejects.toThrow(
			/Authentication expired/,
		);
	});

	test("409 carries the server's reason - the token has no stack", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				Promise.resolve(
					new Response(
						JSON.stringify({ error: "This machine is not linked" }),
						{
							status: 409,
						},
					),
				),
			),
		);
		await expect(setAutoSync("tok", { enabled: true })).rejects.toThrow(
			/not linked/,
		);
	});
});

/**
 * A server validation error carries the whole offending object (#217 fallout).
 *
 * Convex's `ArgumentValidationError` prints the reason, the path, and then the
 * ENTIRE object it refused. A real failed sync filled the terminal with several
 * screens of session rows, burying the one line that says what to fix. The
 * reason and the path are the message; the dump is not.
 */
describe("a server error that carries a payload dump", () => {
	const CONVEX_ERROR = [
		"ArgumentValidationError: Object contains extra field `aggregateVersion` that is not in the validator.",
		"Path: .workflow.harnesses[0]",
		`Object: {activity: [${"{events: 55.0, hourUtc: 0.0, weekdayUtc: 0.0}, ".repeat(400)}]}`,
		`Validator: v.object({${"harness: v.string(), ".repeat(200)}})`,
	].join("\n");

	function failWith(detail: string) {
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				Promise.resolve(
					new Response(JSON.stringify({ error: detail }), { status: 400 }),
				),
			),
		);
	}

	test("keeps the reason and the path, and drops the dump", async () => {
		failWith(CONVEX_ERROR);
		const error = await syncPublish("token", "{}").catch((e: Error) => e);
		const message = String((error as Error).message);
		expect(message).toContain("extra field `aggregateVersion`");
		expect(message).toContain("Path: .workflow.harnesses[0]");
		expect(message).not.toContain("weekdayUtc");
	});

	test("stays short enough to read in a terminal", async () => {
		failWith(CONVEX_ERROR);
		const error = await syncPublish("token", "{}").catch((e: Error) => e);
		const message = String((error as Error).message);
		expect(message.length).toBeLessThan(600);
		expect(message.split("\n").length).toBeLessThanOrEqual(6);
	});

	test("says the detail was cut rather than pretending it was all there", async () => {
		failWith(CONVEX_ERROR);
		const error = await syncPublish("token", "{}").catch((e: Error) => e);
		expect(String((error as Error).message)).toMatch(/truncated/i);
	});

	test("leaves a short error exactly as the server wrote it", async () => {
		failWith("Stack not found.");
		const error = await syncPublish("token", "{}").catch((e: Error) => e);
		expect(String((error as Error).message)).toBe(
			"Sync failed: 400 - Stack not found.",
		);
	});
});
