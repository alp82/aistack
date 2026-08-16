/**
 * Making a token count tangible (#80's deck, built by #81).
 *
 * The expected values here are the ones #80 published while the owner judged
 * the cards - 4,709,720,000 real tokens reading as 39,000 novels, 72% of
 * Wikipedia, 21.2 GB and 486 hours of video. They are the specification, not a
 * recomputation of the code.
 *
 * Every framing rests on stated assumptions, and the one rule the audit added is
 * that no card may change modality halfway: the video card converts tokens to
 * visual tokens to frames to runtime and never borrows the words-per-token rule.
 */
import { describe, expect, it } from "vitest";
import {
	fmtBytes,
	fmtCount,
	fmtDuration,
	tokenScale,
} from "../tokens/tokenScale";

/** The owner's own window, to the token, as #80 measured it. */
const REAL = 4_709_720_000;

describe("tokenScale", () => {
	it("reads the real window as 3.5 billion words", () => {
		expect(fmtCount(tokenScale(REAL).words)).toBe("3.5 billion");
	});

	it("counts a shelf of 39,000 novels, and 3,300 runs of Harry Potter", () => {
		const s = tokenScale(REAL);
		expect(fmtCount(s.novels)).toBe("39,000");
		expect(fmtCount(s.harryPotter)).toBe("3,300");
	});

	it("comes to 72% of every word in the English Wikipedia", () => {
		expect(Math.round(tokenScale(REAL).wikipedia * 100)).toBe(72);
	});

	it("fills 21.2 GB as plain text", () => {
		expect(fmtBytes(tokenScale(REAL).bytes)).toBe("21.2 GB");
	});

	it("buys 486 hours of full HD video, or 43 runs of the trilogy", () => {
		// Vision math, not words: a frame costs ceil(w/28) x ceil(h/28) visual
		// tokens, so 1920x1080 is 2,691 and video is sampled about once a second.
		const s = tokenScale(REAL);
		expect(Math.round(s.videoHours)).toBe(486);
		expect(Math.round(s.lotrTrilogies)).toBe(43);
	});

	it("scales to nothing when a stack has nothing measured", () => {
		const s = tokenScale(0);
		expect(s.words).toBe(0);
		expect(s.novels).toBe(0);
		expect(s.videoHours).toBe(0);
	});
});

describe("the formats a person can say out loud", () => {
	it("rounds a count to the digits worth reading", () => {
		expect(fmtCount(39_247)).toBe("39,000");
		expect(fmtCount(3_258)).toBe("3,300");
		expect(fmtCount(42.8)).toBe("43");
		expect(fmtCount(0.42)).toBe("0.42");
	});

	it("drops to months, days and hours when years would round to zero", () => {
		expect(fmtDuration(4.4)).toBe("4 years");
		expect(fmtDuration(0.5)).toBe("6 months");
		expect(fmtDuration(0.02)).toBe("7 days");
		expect(fmtDuration(0.0001)).toBe("1 hour");
	});
});
