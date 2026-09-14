import { afterEach, describe, expect, test, vi } from "vitest";
import {
	disableTrace,
	enableTrace,
	trace,
	traceEnabled,
	traceError,
	traceRequestedByEnv,
	traceStartedAt,
	traceTimer,
} from "./trace.js";

afterEach(() => disableTrace());

describe("trace", () => {
	test("prints nothing until enabled, then stamps each line with the elapsed time", () => {
		const lines: string[] = [];
		trace("silent");
		expect(traceEnabled()).toBe(false);
		enableTrace((line) => lines.push(line));
		trace("Checking prices");
		expect(lines).toHaveLength(1);
		expect(lines[0]).toMatch(
			/^\[aistack +\+\d+\.\d+s\] INFO {2}Checking prices$/,
		);
	});

	test("a timer reports its label, the duration and the note", () => {
		const lines: string[] = [];
		enableTrace((line) => lines.push(line));
		const done = traceTimer("detect cursor");
		done("yes");
		expect(lines[0]).toMatch(/detect cursor · \d+ ms · yes$/);
	});

	test("a timer taken while tracing is off stays a no-op", () => {
		const lines: string[] = [];
		const done = traceTimer("never");
		enableTrace((line) => lines.push(line));
		done("late");
		expect(lines).toEqual([]);
	});

	test("AISTACK_DEBUG turns tracing on without a flag", () => {
		expect(traceRequestedByEnv({ AISTACK_DEBUG: "1" })).toBe(true);
		expect(traceRequestedByEnv({ AISTACK_DEBUG: "true" })).toBe(true);
		expect(traceRequestedByEnv({ AISTACK_DEBUG: "0" })).toBe(false);
		expect(traceRequestedByEnv({})).toBe(false);
	});
});

describe("exception diagnostics", () => {
	test("prints the operation, error class, code and nested cause without private text", () => {
		const lines: string[] = [];
		enableTrace((line) => lines.push(line));
		const cause = Object.assign(new Error("/private/file bearer secret"), {
			code: "EACCES",
		});
		traceError(
			"cursor history",
			new TypeError("private transcript", { cause }),
		);
		expect(lines[0]).toContain(
			"cursor history failed · TypeError · cause: Error · EACCES",
		);
		expect(lines[0]).not.toMatch(/private|secret|bearer/);
	});
	test("includes numeric SQLite, HTTP and source limit details", () => {
		const lines: string[] = [];
		enableTrace((line) => lines.push(line));
		traceError(
			"database",
			Object.assign(new Error("secret"), {
				code: "SOURCE_LIMIT_EXCEEDED",
				errcode: 18,
				status: 503,
				details: {
					bound: "sqlite-page-bytes",
					limit: 2048,
					observedAtLeast: 3288,
					path: "/secret",
					remedy: "secret",
				},
			}),
		);
		expect(lines[0]).toContain(
			"SOURCE_LIMIT_EXCEEDED · sqlite-page-bytes · limit=2048 · observedAtLeast=3288",
		);
		expect(lines[0]).toContain("status=503");
		expect(lines[0]).toContain("errcode=18");
		expect(lines[0]).not.toContain("secret");
	});
	test("handles primitive throws and circular causes with bounded output", () => {
		const lines: string[] = [];
		enableTrace((line) => lines.push(line));
		const error = new Error("secret");
		error.cause = error;
		traceError("read", error);
		traceError("read", "secret");
		traceError("read", null);
		expect(lines).toHaveLength(3);
		expect(lines.join("\n")).not.toContain("secret");
		expect(lines.join("\n").length).toBeLessThan(500);
	});
	test("is silent when verbose tracing is disabled", () => {
		const lines: string[] = [];
		enableTrace((line) => lines.push(line));
		disableTrace();
		traceError("read", new Error("secret"));
		expect(lines).toEqual([]);
	});
});

describe("verbose formatting", () => {
	test("aligns timestamps, status labels and multiline continuations without ANSI in plain logs", () => {
		const lines: string[] = [];
		let now = 0;
		enableTrace((line) => lines.push(line), 0, {
			color: false,
			now: () => now,
		});
		trace("scan started");
		now = 275000;
		trace("cursor failed\nCAUSE: EACCES", "error");
		expect(lines[0]).toBe("[aistack     +0.00s] INFO  scan started");
		expect(lines[1]).toBe("[aistack   +275.00s] ERROR cursor failed");
		expect(lines[2]).toBe(
			`${" ".repeat(lines[1].indexOf("cursor"))}CAUSE: EACCES`,
		);
		expect(lines.join("\n")).not.toContain("\u001b");
	});
	test("uses distinct colors for each severity while keeping text readable without colors", () => {
		const lines: string[] = [];
		enableTrace((line) => lines.push(line), 0, { color: true, now: () => 0 });
		trace("progress");
		trace("finished", "success");
		trace("fallback", "warn");
		trace("failed", "error");
		expect(lines[0]).toContain("\u001b[1mINFO ");
		expect(lines[1]).toContain("38;2;163;230;53m OK  ");
		expect(lines[2]).toContain("38;2;250;204;21mWARN ");
		expect(lines[3]).toContain("38;2;248;113;113mERROR");
	});
});

test("wraps long diagnostics at terminal width with aligned continuations", () => {
	const lines: string[] = [];
	enableTrace((line) => lines.push(line), 0, {
		color: false,
		columns: 60,
		now: () => 0,
	});
	trace(
		"cursor history failed · SOURCE_LIMIT_EXCEEDED · sqlite-page-bytes · limit=268435456 · observedAtLeast=300000000",
		"error",
	);
	expect(lines.length).toBeGreaterThan(1);
	expect(lines.every((line) => line.length <= 60)).toBe(true);
	expect(lines.slice(1).every((line) => line.startsWith(" ".repeat(25)))).toBe(
		true,
	);
});

test("honors NO_COLOR on a terminal", () => {
	const descriptor = Object.getOwnPropertyDescriptor(process.stderr, "isTTY");
	const lines: string[] = [];
	try {
		Object.defineProperty(process.stderr, "isTTY", {
			value: true,
			configurable: true,
		});
		vi.stubEnv("NO_COLOR", "1");
		enableTrace((line) => lines.push(line));
		trace("failure", "error");
		expect(lines[0]).toContain("ERROR failure");
		expect(lines[0]).not.toContain("\u001b");
	} finally {
		vi.unstubAllEnvs();
		if (descriptor) Object.defineProperty(process.stderr, "isTTY", descriptor);
		else Reflect.deleteProperty(process.stderr, "isTTY");
	}
});

test("shares the trace epoch with workers", () => {
	const lines: string[] = [];
	enableTrace((line) => lines.push(line), 1000, {
		color: false,
		now: () => 2000,
	});
	const epoch = traceStartedAt();
	trace("main");
	enableTrace((line) => lines.push(line), epoch, {
		color: false,
		now: () => 3000,
	});
	trace("worker");
	expect(lines[0]).toContain("+1.00s");
	expect(lines[1]).toContain("+2.00s");
});
