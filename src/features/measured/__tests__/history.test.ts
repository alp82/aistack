/**
 * The derivations behind the living stack page (#81, building #80's variant I).
 *
 * Three of these guard decisions rather than arithmetic:
 *
 *   1. THE ROWS ARE THE NEWEST READING'S MODELS. A model the machine no longer
 *      reports gets no row, because a 0% bar beside a downward arrow says a
 *      listed thing went unused, which #40 forbids.
 *   2. THE NOTCH IS WHERE THE SHARE STARTED, and it only exists once there are
 *      two readings to compare.
 *   3. A ROLLING WINDOW IS A LEVEL, so the token delta can be negative and the
 *      page must not read that as a fault.
 */
import { describe, expect, it } from "vitest";
import type { MeasuredHistory } from "../history";
import { modelTrails, tokenDelta, tokenTrail } from "../history";
import { buildHistory } from "./history.fixture";

/** The page ranks rows off the current reading and adds the series to them. */
const trailsOf = (history: MeasuredHistory) =>
	modelTrails(history.points.at(-1)?.models ?? [], history.points);

describe("modelTrails", () => {
	it("ranks the models of the newest reading, biggest first", () => {
		const trails = trailsOf(buildHistory({ claudeCodeOnly: true }));
		expect(trails.map((t) => t.label)).toEqual([
			"Claude Opus 5",
			"claude-fable-5",
			"Claude Opus 4.8",
			"Claude Sonnet 5",
			"Claude Haiku 4.5",
			"Claude Sonnet 4.6",
		]);
	});

	it("renders a model the catalog has never heard of as its raw id", () => {
		// claude-fable-5 is the second-largest row in the real window. Dropping it
		// or marking it an error would lose a third of the machine's tokens.
		const trails = trailsOf(buildHistory({ claudeCodeOnly: true }));
		const fable = trails.find((t) => t.id === "claude-fable-5");
		expect(fable?.label).toBe("claude-fable-5");
		expect(fable?.share).toBeCloseTo(0.3802, 4);
	});

	it("carries each model's whole trail, one value per reading", () => {
		const history = buildHistory({ claudeCodeOnly: true });
		const opus5 = trailsOf(history).find((t) => t.id === "claude-opus-5");
		expect(opus5?.points).toHaveLength(history.points.length);
		expect(opus5?.points[0].value).toBeCloseTo(0.3547, 4);
		expect(opus5?.points.at(-1)?.value).toBeCloseTo(0.4011, 4);
	});

	it("marks where a share started, and says which way it moved", () => {
		// The real five days: Opus 5 rose 35% → 40%, Opus 4.8 fell 18% → 13%.
		const trails = trailsOf(buildHistory({ claudeCodeOnly: true }));
		const opus5 = trails.find((t) => t.id === "claude-opus-5");
		const opus48 = trails.find((t) => t.id === "claude-opus-4-8");

		expect(opus5?.first).toBeCloseTo(0.3547, 4);
		expect(opus5?.driftPoints).toBeCloseTo(4.64, 2);
		expect(opus5?.moved).toBe(true);
		expect(opus48?.driftPoints).toBeCloseTo(-5.27, 2);
		expect(opus48?.moved).toBe(true);
	});

	it("has nothing to mark on a stack that has synced once", () => {
		const trails = trailsOf(
			buildHistory({ readings: 1, claudeCodeOnly: true }),
		);
		expect(trails).toHaveLength(6);
		for (const trail of trails) {
			expect(trail.moved).toBe(false);
			expect(trail.driftPoints).toBe(0);
			expect(trail.points).toHaveLength(1);
		}
	});

	it("gives every row its own paint, and never repaints a survivor", () => {
		const trails = trailsOf(buildHistory({ claudeCodeOnly: true }));
		const paints = trails.map((t) => t.paint);
		expect(new Set(paints).size).toBe(paints.length);
		// The lead model keeps slot one whether or not the tail exists.
		const shorter = trailsOf(
			buildHistory({ readings: 1, claudeCodeOnly: true }),
		);
		expect(shorter[0].paint).toBe(trails[0].paint);
	});

	it("folds a seventh model into one row rather than inventing a hue", () => {
		const history = buildHistory({ claudeCodeOnly: true });
		const last = history.points.at(-1);
		if (!last) throw new Error("fixture has no readings");
		const points = [
			...history.points.slice(0, -1),
			{
				...last,
				models: [
					...last.models.map((m) => ({ ...m, tokenShare: m.tokenShare * 0.9 })),
					{
						id: "gpt-5.5",
						catalogSlug: "gpt-5-5",
						catalogName: "GPT-5.5",
						tokenShare: 0.1,
					},
				],
			},
		];
		const trails = modelTrails(points.at(-1)?.models ?? [], points);
		expect(trails).toHaveLength(6);
		expect(trails.at(-1)?.id).toBe("__rest");
		expect(trails.at(-1)?.label).toBe("everything else");
		// Nothing is lost: the fold carries the tail's whole share.
		const total = trails.reduce((a, t) => a + t.share, 0);
		expect(total).toBeCloseTo(1, 6);
	});
});

describe("the trail behind the headline", () => {
	it("is one value per reading, in time order", () => {
		const history = buildHistory();
		const trail = tokenTrail(history.points);
		expect(trail).toHaveLength(7);
		expect(trail[0].at).toBeLessThan(trail[6].at);
		expect(trail[0].value).toBe(history.points[0].tokens);
	});

	it("reports a fall as a fall - the window forgets its far end", () => {
		const history = buildHistory({ readings: 5, claudeCodeOnly: true });
		expect(tokenDelta(history.points)).toBe(4_427_010_000 - 4_604_390_000);
	});

	it("has no delta to report on a first reading", () => {
		expect(tokenDelta(buildHistory({ readings: 1 }).points)).toBeNull();
	});
});
