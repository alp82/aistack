import { describe, expect, test } from "vitest";
import { inferContextWindow, readContextReading } from "./context.js";
import { bucketMidV2, type ContextDay, logBucketV2 } from "./daily.js";
import { contextDay } from "./fixtures.js";

describe("inferContextWindow", () => {
	test("a max call inside the catalog window confirms it", () => {
		expect(inferContextWindow(200_000, 150_000)).toBe(200_000);
		expect(inferContextWindow(200_000, 200_000)).toBe(200_000);
	});

	test("a max call over the catalog window steps up to the next tier", () => {
		expect(inferContextWindow(200_000, 261_390)).toBe(1_000_000);
		expect(inferContextWindow(200_000, 580_322)).toBe(1_000_000);
	});

	test("nothing known is null, whatever the calls say", () => {
		expect(inferContextWindow(null, 40_000)).toBeNull();
		expect(inferContextWindow(undefined, 580_322)).toBeNull();
		expect(inferContextWindow(0, 1)).toBeNull();
	});

	test("a max call over every tier keeps the catalog window", () => {
		expect(inferContextWindow(272_000, 2_000_000)).toBe(272_000);
	});
});

describe("readContextReading", () => {
	test("quotes the median and p90 main call at their bucket middles and splits the fixed part", () => {
		const day: ContextDay = contextDay({
			calls: {
				main: [
					{ bucket: logBucketV2(40_000), calls: 6 },
					{ bucket: logBucketV2(120_000), calls: 4 },
					{ bucket: logBucketV2(300_000), calls: 1 },
				],
				subagents: [{ bucket: logBucketV2(20_000), calls: 8 }],
			},
			firstCallHarnessTokens: 46_000,
			firstCallInstructionsTokens: 44_000,
			firstCallCount: 2,
			compactions: 3,
		});
		const reading = readContextReading("claude-code", day, 200_000);
		const medianCall = Math.round(bucketMidV2(logBucketV2(40_000)));
		const p90Call = Math.round(bucketMidV2(logBucketV2(120_000)));
		expect(reading).toEqual({
			harness: "claude-code",
			window: 200_000,
			calls: 11,
			medianCall,
			p90Call,
			harnessTokens: 23_000,
			instructionsTokens: 22_000,
			usualChat: Math.max(0, medianCall - 45_000),
			longChat: p90Call - 45_000,
			compactions: 3,
		});
		// Subagent calls stay out of the main figures.
		expect(reading.calls).toBe(11);
	});

	test("the logged window wins over the caller's inference", () => {
		const reading = readContextReading(
			"codex",
			contextDay({ window: 258_400 }),
			1_000_000,
		);
		expect(reading.window).toBe(258_400);
	});

	test("no first calls means a zero fixed part, and an empty histogram a zero call", () => {
		const reading = readContextReading(
			"codex",
			contextDay({
				calls: { main: [], subagents: [] },
				firstCalls: { main: [] },
				firstCallHarnessTokens: 0,
				firstCallInstructionsTokens: 0,
				firstCallCount: 0,
			}),
			null,
		);
		expect(reading).toMatchObject({
			window: null,
			calls: 0,
			medianCall: 0,
			p90Call: 0,
			harnessTokens: 0,
			instructionsTokens: 0,
			usualChat: 0,
			longChat: 0,
		});
	});
});
