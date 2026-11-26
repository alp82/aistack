import { afterEach, describe, expect, test, vi } from "vitest";
import { authPoll, authStart, setAutoSync, stackGet, syncPublish } from "./api";

test("uploads 400 days of 8,000 IDs in bounded parts without reordering or dropping dates", async () => {
	const packed = Array.from({ length: 8_000 }, (_, i) =>
		i.toString(36).padStart(22, "0"),
	).join("");
	const days = Array.from({ length: 400 }, (_, i) => ({
		date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
		usage: { harnesses: [{ projectKeys: [], projectKeysPacked: packed }] },
	}));
	const body = JSON.stringify({ trigger: "auto", measuredDays: { days } });
	expect(Buffer.byteLength(body)).toBeGreaterThan(64 * 1024 * 1024);
	const delivered: string[] = [];
	let expectedParts = 0;
	let id: string | undefined;
	let next = 0;
	let lostResponse: string | undefined;
	let replays = 0;
	vi.stubGlobal("fetch", async (url: string, options: RequestInit) => {
		if (url.endsWith("/sync-manifest")) {
			return Response.json({ multipartUpload: true });
		}
		const part = options.body as string;
		expect(Buffer.byteLength(part)).toBeLessThanOrEqual(8 * 1024 * 1024);
		if (lostResponse !== undefined) {
			expect(part).toBe(lostResponse);
			replays++;
			if (replays === 1) return new Response("{", { status: 200 });
			if (replays === 2)
				return new Response("Synthetic proxy failure", { status: 502 });
			return Response.json({ receivedAt: next });
		}
		const request = JSON.parse(part);
		const upload = request.upload;
		expectedParts ||= upload.parts;
		id ??= upload.id;
		expect(upload).toEqual({ id, part: next++, parts: expectedParts });
		expect(request.trigger).toBe("auto");
		for (const day of request.measuredDays.days as typeof days) {
			expect(day.usage.harnesses[0].projectKeysPacked).toBe(packed);
			delivered.push(day.date);
		}
		if (next === expectedParts) {
			lostResponse = part;
			throw new Error("Synthetic connection loss after final part committed");
		}
		return Response.json({ receivedAt: next });
	});
	expect((await syncPublish("synthetic-token", body)).receivedAt).toBe(
		expectedParts,
	);
	expect(expectedParts).toBeGreaterThan(1);
	expect(replays).toBe(3);
	expect(delivered).toEqual(days.map((day) => day.date));
}, 20_000);

test("replays an ordinary sync after a broken receipt only on a server that advertises replay", async () => {
	const body = '{"payloads":[]}';
	let posts = 0;
	vi.stubGlobal("fetch", async (url: string, options: RequestInit) => {
		if (url.endsWith("/sync-manifest"))
			return Response.json({ syncReplay: true });
		expect(options.body).toBe(body);
		return ++posts === 1
			? new Response("{", { status: 200 })
			: Response.json({ receivedAt: 1 });
	});
	expect((await syncPublish("synthetic-token", body)).receivedAt).toBe(1);
	expect(posts).toBe(2);
});

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

describe("authStart machine label", () => {
	test("marks an explicit label as read-only", async () => {
		const fetchMock = vi.fn(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						secretId: "secret",
						userCode: "ABC123",
						authUrl: "/",
					}),
					{ status: 200 },
				),
			),
		);
		vi.stubGlobal("fetch", fetchMock);

		await authStart("build server", true);

		const [, init] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(JSON.parse(init.body as string)).toMatchObject({
			machineName: "build server",
			machineNameReadOnly: true,
		});
	});

	test("a sync relink sends the old credential and requires a destination", async () => {
		const fetchMock = vi.fn(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						secretId: "secret",
						userCode: "ABC123",
						authUrl: "/",
					}),
					{ status: 200 },
				),
			),
		);
		vi.stubGlobal("fetch", fetchMock);

		await authStart(undefined, false, {
			replaceToken: "old-token",
			destinationRequired: true,
		});

		const [, init] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(init.headers).toMatchObject({ Authorization: "Bearer old-token" });
		expect(JSON.parse(init.body as string)).toMatchObject({
			destinationRequired: true,
		});
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
