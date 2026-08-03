import { describe, expect, it } from "vitest";
import {
	delimitedJoin,
	isCountableRequest,
	rateKeyFor,
	visitorHashFor,
} from "../view-hash";

describe("delimitedJoin", () => {
	it("keeps two different tuples apart that raw concatenation would collide", () => {
		expect(delimitedJoin(["ab", "c"])).not.toBe(delimitedJoin(["a", "bc"]));
	});

	it("is stable for the same input", () => {
		expect(delimitedJoin(["a", "b"])).toBe(delimitedJoin(["a", "b"]));
	});
});

describe("visitorHashFor", () => {
	const base = {
		secret: "s3cret",
		ip: "1.2.3.4",
		userAgent: "Mozilla/5.0",
		targetKind: "stack",
		targetId: "abc",
		dayStartMs: 1_700_000_000_000,
	};

	it("gives the same hash for the same visitor, target and day", () => {
		expect(visitorHashFor(base)).toBe(visitorHashFor({ ...base }));
	});

	it("rotates the hash on the next day", () => {
		expect(
			visitorHashFor({ ...base, dayStartMs: base.dayStartMs + 86_400_000 }),
		).not.toBe(visitorHashFor(base));
	});

	it("gives a different hash per target, so one pseudonym cannot be traced across pages", () => {
		expect(visitorHashFor({ ...base, targetId: "def" })).not.toBe(
			visitorHashFor(base),
		);
	});

	it("changes with the IP and with the User-Agent", () => {
		expect(visitorHashFor({ ...base, ip: "5.6.7.8" })).not.toBe(
			visitorHashFor(base),
		);
		expect(visitorHashFor({ ...base, userAgent: "curl/8" })).not.toBe(
			visitorHashFor(base),
		);
	});

	it("changes with the secret, so one deployment's hashes mean nothing in another", () => {
		expect(visitorHashFor({ ...base, secret: "other" })).not.toBe(
			visitorHashFor(base),
		);
	});

	it("never contains the raw IP", () => {
		expect(visitorHashFor(base)).not.toContain("1.2.3.4");
	});
});

describe("rateKeyFor", () => {
	it("is one bucket per address, whatever page is being read", () => {
		expect(rateKeyFor("s", "1.2.3.4")).toBe(rateKeyFor("s", "1.2.3.4"));
		expect(rateKeyFor("s", "1.2.3.4")).not.toBe(rateKeyFor("s", "5.6.7.8"));
	});

	it("differs from the visitor hash for the same address", () => {
		expect(rateKeyFor("s", "1.2.3.4")).not.toBe(
			visitorHashFor({
				secret: "s",
				ip: "1.2.3.4",
				userAgent: "u",
				targetKind: "stack",
				targetId: "t",
				dayStartMs: 0,
			}),
		);
	});
});

describe("isCountableRequest", () => {
	const browser =
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

	it("counts a real browser", () => {
		expect(isCountableRequest({ userAgent: browser, secPurpose: null })).toBe(
			true,
		);
	});

	it("refuses a known bot", () => {
		expect(
			isCountableRequest({
				userAgent:
					"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
				secPurpose: null,
			}),
		).toBe(false);
	});

	it("refuses a request with no User-Agent at all", () => {
		expect(isCountableRequest({ userAgent: null, secPurpose: null })).toBe(
			false,
		);
	});

	it("refuses a browser prefetch", () => {
		expect(
			isCountableRequest({ userAgent: browser, secPurpose: "prefetch" }),
		).toBe(false);
		expect(
			isCountableRequest({
				userAgent: browser,
				secPurpose: "Prefetch;Prerender",
			}),
		).toBe(false);
	});
});
