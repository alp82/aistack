import { afterEach, describe, expect, test } from "vitest";
import {
	disableTrace,
	enableTrace,
	trace,
	traceEnabled,
	traceRequestedByEnv,
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
		expect(lines[0]).toMatch(/^\[aistack +\+\d+\.\d+s\] Checking prices$/);
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
