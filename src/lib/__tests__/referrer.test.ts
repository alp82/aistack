import { beforeEach, describe, expect, it } from "vitest";
import { classifyReferrer, sessionReferrerBucket } from "../referrer";

const HERE = "https://aistack.to";

describe("classifyReferrer", () => {
	it("calls an empty referrer direct", () => {
		expect(classifyReferrer("", HERE)).toBe("direct");
	});

	it("calls a same-origin referrer internal", () => {
		expect(classifyReferrer(`${HERE}/stacks`, HERE)).toBe("internal");
	});

	it("puts assistants in their own bucket, not in search", () => {
		expect(classifyReferrer("https://chatgpt.com/c/123", HERE)).toBe("ai");
		expect(classifyReferrer("https://claude.ai/chat/1", HERE)).toBe("ai");
		expect(classifyReferrer("https://www.perplexity.ai/search", HERE)).toBe(
			"ai",
		);
		expect(classifyReferrer("https://gemini.google.com/app", HERE)).toBe("ai");
	});

	it("recognizes search engines, including country domains", () => {
		expect(classifyReferrer("https://www.google.com/search?q=x", HERE)).toBe(
			"search",
		);
		expect(classifyReferrer("https://google.de/search?q=x", HERE)).toBe(
			"search",
		);
		expect(classifyReferrer("https://duckduckgo.com/", HERE)).toBe("search");
	});

	it("recognizes social and community sources", () => {
		expect(classifyReferrer("https://x.com/someone/status/1", HERE)).toBe(
			"social",
		);
		expect(
			classifyReferrer("https://news.ycombinator.com/item?id=1", HERE),
		).toBe("social");
		expect(classifyReferrer("https://www.reddit.com/r/x", HERE)).toBe("social");
	});

	it("falls back to other for an unknown site", () => {
		expect(classifyReferrer("https://some-blog.example/post", HERE)).toBe(
			"other",
		);
	});

	it("falls back to other for an unparseable referrer rather than throwing", () => {
		expect(classifyReferrer("not a url", HERE)).toBe("other");
	});

	it("prefers gemini.google.com over the google search rule", () => {
		expect(classifyReferrer("https://gemini.google.com/", HERE)).toBe("ai");
	});
});

describe("sessionReferrerBucket", () => {
	beforeEach(() => {
		window.sessionStorage.clear();
	});

	it("decides once and holds the answer for the rest of the session", () => {
		Object.defineProperty(document, "referrer", {
			value: "https://news.ycombinator.com/",
			configurable: true,
		});
		expect(sessionReferrerBucket()).toBe("social");

		// A later page in the same session has a same-origin referrer, which would
		// classify as `internal` — the stored first touch must win.
		Object.defineProperty(document, "referrer", {
			value: window.location.origin,
			configurable: true,
		});
		expect(sessionReferrerBucket()).toBe("social");
	});

	it("classifies a fresh session from its own first referrer", () => {
		Object.defineProperty(document, "referrer", {
			value: "https://chatgpt.com/",
			configurable: true,
		});
		expect(sessionReferrerBucket()).toBe("ai");
	});
});
