// Diff-only sync (#307, ADR-0010): which days go.

import { dayFingerprint, type MeasuredDay } from "@aistack/workflow-rules";
import { describe, expect, test } from "vitest";
import {
	type DayManifest,
	retentionFloor,
	selectDaysToPublish,
} from "./diff.js";

const day = (date: string, sessions = 1): MeasuredDay => ({
	date,
	usage: {
		harnesses: [
			{
				harness: "claude-code",
				sessions,
				projectKeys: [],
				models: [],
				subagentTokens: 0,
				excludedTokens: { unpriced: 0, synthetic: 0 },
			},
		],
	},
});

const TODAY = "2026-08-28";
const local = [
	day("2026-08-25"),
	day("2026-08-26"),
	day("2026-08-27"),
	day(TODAY),
];

const manifestOf = (
	days: MeasuredDay[],
	over: Partial<DayManifest> = {},
): DayManifest => ({
	retentionDays: 400,
	aggregateVersion: "measured-days/v1",
	days: days.map((d) => ({ date: d.date, fingerprint: dayFingerprint(d) })),
	...over,
});

describe("selectDaysToPublish", () => {
	test("no manifest sends everything, in full mode", () => {
		const out = selectDaysToPublish({ local, manifest: null, todayUtc: TODAY });
		expect(out.send.map((d) => d.date)).toEqual(local.map((d) => d.date));
		expect(out.unchanged).toBe(0);
		expect(out.mode).toBe("full");
	});

	test("a matching manifest sends only today", () => {
		const out = selectDaysToPublish({
			local,
			manifest: manifestOf(local),
			todayUtc: TODAY,
		});
		expect(out.send.map((d) => d.date)).toEqual([TODAY]);
		expect(out.unchanged).toBe(3);
		expect(out.mode).toBe("diff");
	});

	test("a missing date and a changed fingerprint both send", () => {
		const held = [day("2026-08-25"), day("2026-08-26", 9)];
		const out = selectDaysToPublish({
			local,
			manifest: manifestOf(held),
			todayUtc: TODAY,
		});
		expect(out.send.map((d) => d.date)).toEqual([
			"2026-08-26",
			"2026-08-27",
			TODAY,
		]);
		expect(out.unchanged).toBe(1);
	});

	test("a manifest on another version is not comparable: everything sends", () => {
		const out = selectDaysToPublish({
			local,
			manifest: manifestOf(local, { aggregateVersion: "measured-days/v2" }),
			todayUtc: TODAY,
		});
		expect(out.send).toHaveLength(4);
		expect(out.mode).toBe("full");
	});

	test("dates older than the retention are dropped, never sent", () => {
		const out = selectDaysToPublish({
			local: [day("2026-08-20"), ...local],
			manifest: manifestOf([], { retentionDays: 3 }),
			todayUtc: TODAY,
		});
		expect(out.send.map((d) => d.date)).toEqual([
			"2026-08-26",
			"2026-08-27",
			TODAY,
		]);
		expect(
			out.skipped.filter((s) => s.reason === "expired").map((s) => s.date),
		).toEqual(["2026-08-20", "2026-08-25"]);
	});

	test("the retention never exceeds 400 days", () => {
		expect(retentionFloor(TODAY, 100_000)).toBe(retentionFloor(TODAY, 400));
		expect(retentionFloor(TODAY, 1)).toBe(TODAY);
		expect(retentionFloor(TODAY, 3)).toBe("2026-08-26");
	});
});
