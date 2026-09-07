import { describe, expect, test } from "vitest";
import {
	bucketMid,
	bucketMidV2,
	bucketRange,
	bucketRangeV2,
	effortLevelOf,
	foldContextDays,
	foldGitDays,
	foldHarnessDays,
	foldWorkflowDays,
	logBucket,
	logBucketV2,
	MAX_CHANGED_LINES_PER_COMMIT,
	median,
	medianBucket,
	quantileBucket,
	WORKFLOW_AGGREGATES_V2,
} from "./daily.js";
import {
	contextDay,
	gitDay,
	harnessDay,
	lengthBucket,
	workflowDay,
} from "./fixtures.js";

describe("log-buckets/v1", () => {
	test("bucket 0 holds everything under 1, bucket k holds [2^(k-1), 2^k)", () => {
		expect(logBucket(0)).toBe(0);
		expect(logBucket(0.9)).toBe(0);
		expect(logBucket(1)).toBe(1);
		expect(logBucket(1.99)).toBe(1);
		expect(logBucket(2)).toBe(2);
		expect(logBucket(3)).toBe(2);
		expect(logBucket(90)).toBe(7);
		expect(bucketRange(7)).toEqual({ low: 64, high: 128 });
		expect(bucketRange(0)).toEqual({ low: 0, high: 1 });
	});

	test("a bucket quotes at its geometric middle", () => {
		expect(bucketMid(1)).toBeCloseTo(Math.sqrt(2));
		expect(bucketMid(7)).toBeCloseTo(Math.sqrt(64 * 128));
		expect(bucketMid(0)).toBe(0.5);
	});

	test("the median bucket holds the middle item", () => {
		expect(medianBucket([])).toBeUndefined();
		expect(
			medianBucket([
				{ bucket: 2, count: 3 },
				{ bucket: 5, count: 1 },
			]),
		).toBe(2);
		expect(
			medianBucket([
				{ bucket: 5, count: 5 },
				{ bucket: 2, count: 4 },
			]),
		).toBe(5);
		expect(median([3, 1, 2])).toBe(2);
		expect(median([4, 1, 2, 3])).toBe(2.5);
		expect(median([])).toBeUndefined();
	});

	test("effort strings map onto four public levels", () => {
		expect(effortLevelOf("xhigh")).toBe("high");
		expect(effortLevelOf("Medium")).toBe("medium");
		expect(effortLevelOf("minimal")).toBe("low");
		expect(effortLevelOf("turbo")).toBe("other");
	});
});

describe("log-buckets/v2", () => {
	test("bucket 0 holds everything under 1, bucket k holds [2^((k-1)/2), 2^(k/2))", () => {
		expect(logBucketV2(0)).toBe(0);
		expect(logBucketV2(0.9)).toBe(0);
		expect(logBucketV2(1)).toBe(1);
		expect(logBucketV2(1.41)).toBe(1);
		expect(logBucketV2(1.42)).toBe(2);
		expect(logBucketV2(2)).toBe(3);
		expect(logBucketV2(50_000)).toBe(32);
		expect(logBucketV2(200_000)).toBe(36);
		expect(bucketRangeV2(3)).toEqual({ low: 2, high: 2 ** 1.5 });
		expect(bucketRangeV2(0)).toEqual({ low: 0, high: 1 });
	});

	test("about twenty buckets separate 1k from 1M, and the middle is within 20% of any value", () => {
		expect(logBucketV2(1_000_000) - logBucketV2(1_000)).toBe(20);
		for (const value of [1_000, 37_000, 61_162, 258_400, 999_999]) {
			const mid = bucketMidV2(logBucketV2(value));
			expect(Math.abs(mid - value) / value).toBeLessThan(0.2);
		}
		expect(bucketMidV2(0)).toBe(0.5);
	});

	test("the median over half-octave buckets quotes the middle item's bucket", () => {
		// Eleven calls: the sixth is the median, the tenth is p90.
		const histogram = [
			{ bucket: logBucketV2(40_000), count: 6 },
			{ bucket: logBucketV2(120_000), count: 4 },
			{ bucket: logBucketV2(300_000), count: 1 },
		];
		expect(medianBucket(histogram)).toBe(logBucketV2(40_000));
		expect(quantileBucket(histogram, 0.9)).toBe(logBucketV2(120_000));
		expect(quantileBucket(histogram, 1)).toBe(logBucketV2(300_000));
		expect(quantileBucket(histogram, 0)).toBe(logBucketV2(40_000));
		expect(quantileBucket([], 0.9)).toBeUndefined();
	});
});

describe("foldContextDays", () => {
	test("merges histograms by bucket, adds the sums, maxes the max, and keeps the last window", () => {
		const folded = foldContextDays([
			contextDay({ window: 200_000 }),
			contextDay({
				calls: {
					main: [
						{ bucket: 34, calls: 1 },
						{ bucket: 36, calls: 2 },
					],
					subagents: [],
				},
				firstCalls: { main: [{ bucket: 33, sessions: 2 }] },
				firstCallHarnessTokens: 50_000,
				firstCallInstructionsTokens: 40_000,
				firstCallCount: 2,
				maxContext: 260_000,
				compactions: 2,
				window: 1_000_000,
			}),
			contextDay(),
		]);
		expect(folded.calls.main).toEqual([
			{ bucket: 32, calls: 12 },
			{ bucket: 34, calls: 9 },
			{ bucket: 36, calls: 2 },
		]);
		expect(folded.calls.subagents).toEqual([{ bucket: 30, calls: 10 }]);
		expect(folded.firstCalls.main).toEqual([
			{ bucket: 32, sessions: 20 },
			{ bucket: 33, sessions: 2 },
		]);
		expect(folded.firstCallHarnessTokens).toBe(510_000);
		expect(folded.firstCallInstructionsTokens).toBe(480_000);
		expect(folded.firstCallCount).toBe(22);
		expect(folded.maxContext).toBe(260_000);
		expect(folded.compactions).toBe(4);
		expect(folded.window).toBe(1_000_000);
		expect(folded.bucketRuleVersion).toBe("log-buckets/v2");
	});

	test("no day with a window means no window on the fold", () => {
		expect(
			foldContextDays([contextDay(), contextDay()]).window,
		).toBeUndefined();
	});

	test("the harness fold carries the block when any day has it, and the window fold takes the latest date's window", () => {
		const bare = harnessDay({ context: undefined });
		expect(foldHarnessDays([bare, bare]).context).toBeUndefined();
		expect(foldHarnessDays([bare, harnessDay()]).context?.firstCallCount).toBe(
			10,
		);
		const folded = foldWorkflowDays(
			[
				workflowDay({
					date: "2026-08-25",
					harnesses: [harnessDay({ context: contextDay({ window: 2 }) })],
				}),
				workflowDay({
					date: "2026-08-23",
					harnesses: [harnessDay({ context: contextDay({ window: 1 }) })],
				}),
			],
			{ aggregateVersion: WORKFLOW_AGGREGATES_V2 },
		);
		expect(folded?.harnesses[0]?.context?.window).toBe(2);
	});
});

describe("foldHarnessDays", () => {
	test("sums counts, maxes the fan-out, and merges histograms by key", () => {
		const folded = foldHarnessDays([
			harnessDay(),
			harnessDay({
				sessions: 5,
				startHours: [{ hourUtc: 21, sessions: 5 }],
				delegation: {
					mainToolCalls: 10,
					subagentToolCalls: 40,
					widestFanOut: 7,
					mostSubagents: 1,
				},
				activity: [{ weekdayUtc: 2, hourUtc: 20, events: 5 }],
				effort: [{ level: "high", turns: 4 }],
				turnDurations: {
					bucketRuleVersion: "log-buckets/v1",
					buckets: [{ bucket: 6, turns: 1 }],
				},
				webSearches: 1,
			}),
		]);
		expect(folded.sessions).toBe(15);
		expect(folded.startHours).toEqual([
			{ hourUtc: 20, sessions: 6 },
			{ hourUtc: 21, sessions: 9 },
		]);
		expect(folded.delegation).toEqual({
			mainToolCalls: 100,
			subagentToolCalls: 50,
			widestFanOut: 7,
			mostSubagents: 3,
		});
		expect(folded.activity).toEqual([
			{ weekdayUtc: 1, hourUtc: 20, events: 70 },
			{ weekdayUtc: 1, hourUtc: 21, events: 30 },
			{ weekdayUtc: 2, hourUtc: 20, events: 5 },
		]);
		expect(folded.effort).toEqual([
			{ level: "low", turns: 1 },
			{ level: "medium", turns: 3 },
			{ level: "high", turns: 10 },
		]);
		expect(folded.turnDurations?.buckets).toEqual([
			{ bucket: 5, turns: 4 },
			{ bucket: 6, turns: 7 },
		]);
		expect(folded.webSearches).toBe(4);
		expect(folded.phase?.sessions).toBe(20);
		expect(folded.phase?.lengths).toEqual([
			lengthBucket({
				sessions: 20,
				phaseSec: {
					scout: 7200,
					build: 3600,
					verify: 600,
					handoff: 600,
					unknown: 1200,
				},
				merged: 4,
				verified: 8,
				mergedVerified: 4,
				openedWithScout: 12,
			}),
		]);
		expect(folded.routing?.main).toEqual([
			{ model: "claude-opus-5", tokens: 1600 },
			{ model: "claude-sonnet-5", tokens: 400 },
		]);
	});

	test("an optional block is present when any day carried it, and absent otherwise", () => {
		const bare = harnessDay({
			phase: undefined,
			routing: undefined,
			delegation: undefined,
			effort: undefined,
			thinking: undefined,
			turnDurations: undefined,
			questions: undefined,
			webSearches: undefined,
			context: undefined,
		});
		const none = foldHarnessDays([bare, bare]);
		expect(none.phase).toBeUndefined();
		expect(none.webSearches).toBeUndefined();
		expect(none.thinking).toBeUndefined();

		const some = foldHarnessDays([bare, harnessDay()]);
		expect(some.phase?.sessions).toBe(10);
		expect(some.webSearches).toBe(3);
		expect(some.thinking).toEqual({
			thinkingTokens: 250,
			responseTokens: 1000,
		});
	});

	test("a window that straddles a rule bump names both rules", () => {
		const folded = foldHarnessDays([
			harnessDay(),
			harnessDay({
				phase: {
					...(harnessDay().phase as NonNullable<
						ReturnType<typeof harnessDay>["phase"]
					>),
					ruleVersion: "phase-rules/v2",
				},
			}),
		]);
		expect(folded.phase?.ruleVersion).toBe("phase-rules/v1 · phase-rules/v2");
	});

	test("folding one day returns that day", () => {
		expect(foldHarnessDays([harnessDay()])).toEqual(harnessDay());
	});
});

describe("foldGitDays", () => {
	test("sums the counts, concatenates the strip, and merges extensions", () => {
		const folded = foldGitDays([
			gitDay(),
			gitDay({
				commits: 1,
				lateNightCommits: 0,
				additions: 10,
				removals: 5,
				changedLinesPerCommit: [15],
				testFileCommits: 0,
				changedLinesByExtension: [{ extension: ".ts", changedLines: 15 }],
				withheldExtensionLines: 0,
				weekdayHourCells: [{ weekdayUtc: 1, hourUtc: 22, commits: 1 }],
			}),
		]);
		expect(folded.commits).toBe(6);
		expect(folded.lateNightCommits).toBe(2);
		expect(folded.additions).toBe(410);
		expect(folded.changedLinesPerCommit).toEqual([10, 15, 20, 70, 100, 300]);
		expect(folded.changedLinesByExtension).toEqual([
			{ extension: ".md", changedLines: 100 },
			{ extension: ".ts", changedLines: 315 },
		]);
		expect(folded.weekdayHourCells).toEqual([
			{ weekdayUtc: 1, hourUtc: 22, commits: 6 },
		]);
		expect(folded.commitSetRuleVersion).toBe("commit-set/v1");
	});

	test("caps the strip at the sample limit and keeps the quantiles", () => {
		// Three days of 5000 commits each, like the window that broke prod:
		// the fold must stay under Convex's 8192-entry array cap.
		const day = gitDay({
			changedLinesPerCommit: Array.from({ length: 5000 }, (_, i) => i + 1),
		});
		const folded = foldGitDays([day, day, day]);
		expect(folded.changedLinesPerCommit.length).toBe(
			MAX_CHANGED_LINES_PER_COMMIT,
		);
		const strip = folded.changedLinesPerCommit;
		expect(strip[0]).toBe(1);
		expect(strip[strip.length - 1]).toBe(5000);
		// The median of the sample sits at the median of the input.
		expect(strip[Math.floor(strip.length / 2)]).toBeCloseTo(2500, -2);
		// Sorted ascending.
		expect([...strip].sort((a, b) => a - b)).toEqual(strip);
	});
});

describe("foldWorkflowDays", () => {
	test("no days is no window", () => {
		expect(
			foldWorkflowDays([], { aggregateVersion: WORKFLOW_AGGREGATES_V2 }),
		).toBeUndefined();
	});

	test("carries the dates, the daily parallel-project counts, and the web-search days", () => {
		const folded = foldWorkflowDays(
			[
				workflowDay({ date: "2026-08-25", parallelProjects: 3 }),
				workflowDay({ date: "2026-08-24" }),
				workflowDay({
					date: "2026-08-23",
					parallelProjects: undefined,
					harnesses: [harnessDay({ webSearches: undefined })],
				}),
			],
			{ aggregateVersion: WORKFLOW_AGGREGATES_V2, utcOffsetMinutes: 120 },
		);
		expect(folded?.dates).toEqual(["2026-08-23", "2026-08-24", "2026-08-25"]);
		expect(folded?.parallelProjectDays).toEqual([3, 2]);
		expect(folded?.parallelProjects).toBe(3);
		expect(folded?.webSearchDays).toBe(2);
		expect(folded?.utcOffsetMinutes).toBe(120);
		expect(folded?.harnesses).toHaveLength(1);
		expect(folded?.harnesses[0]?.sessions).toBe(30);
		expect(folded?.git.commits).toBe(15);
	});

	test("carries one Git entry per stored day, dated and sorted, for the per-day picture (#288)", () => {
		const folded = foldWorkflowDays(
			[
				workflowDay({
					date: "2026-08-25",
					git: gitDay({ additions: 50, removals: 5, commits: 1 }),
				}),
				workflowDay({
					date: "2026-08-23",
					git: gitDay({ additions: 0, removals: 0, commits: 0 }),
				}),
			],
			{ aggregateVersion: WORKFLOW_AGGREGATES_V2 },
		);
		expect(folded?.gitDays).toEqual([
			{ date: "2026-08-23", additions: 0, removals: 0, commits: 0 },
			{ date: "2026-08-25", additions: 50, removals: 5, commits: 1 },
		]);
	});

	test("groups harnesses by name across days", () => {
		const folded = foldWorkflowDays(
			[
				workflowDay({ harnesses: [harnessDay({ harness: "codex" })] }),
				workflowDay({ date: "2026-08-25", harnesses: [harnessDay()] }),
			],
			{ aggregateVersion: WORKFLOW_AGGREGATES_V2 },
		);
		expect(folded?.harnesses.map((h) => h.harness)).toEqual([
			"claude-code",
			"codex",
		]);
	});
});
