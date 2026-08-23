// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import {
	KnowledgeBaseIndex,
	type KnowledgeBaseIndexData,
	KnowledgeTopicPage,
	type KnowledgeTopicPageData,
} from "../KnowledgeBase";

afterEach(cleanup);

describe("the knowledge base topic index", () => {
	test("shows the latest five before the owner-ordered topic cards", () => {
		const data: KnowledgeBaseIndexData = {
			latest: Array.from({ length: 5 }, (_, index) => ({
				licenseClass: "article" as const,
				headline: `Latest ${5 - index}`,
				url: `https://example.com/${5 - index}`,
				publishedAt: Date.UTC(2026, 7, 18 + index),
				topicName: "Agents",
				topicSlug: "agents",
			})),
			topics: [
				{
					name: "Agents",
					slug: "agents",
					itemCount: 8,
					headlines: ["Latest 5", "Latest 4", "Latest 3"],
				},
				{
					name: "Models",
					slug: "models",
					itemCount: 3,
					headlines: ["Model one"],
				},
			],
		};

		render(<KnowledgeBaseIndex data={data} />);

		expect(screen.getAllByTestId("latest-item")).toHaveLength(5);
		const cards = screen.getAllByTestId("topic-card");
		expect(cards.map((card) => card.textContent)).toEqual([
			expect.stringContaining("Agents"),
			expect.stringContaining("Models"),
		]);
		expect(cards[0]).toHaveAttribute("href", "/news/topics/agents");
		expect(
			screen
				.getByRole("heading", { name: "Latest" })
				.compareDocumentPosition(
					screen.getByRole("heading", { name: "Topics" }),
				) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});
});

describe("a knowledge base topic", () => {
	test("renders every license class with its permitted content", () => {
		const data: KnowledgeTopicPageData = {
			topic: { name: "Models", slug: "models" },
			itemCount: 6,
			thinReleases: [
				{
					licenseClass: "unlicensed-release-notes",
					headline: "Claude Code 2.1.241",
					url: "https://example.com/claude-code",
					sourceName: "claude-code releases",
				},
			],
			entries: [
				{
					licenseClass: "cc-by",
					headline: "Gemini API update",
					url: "https://example.com/gemini",
					sourceName: "Gemini API changelog",
					publishedAt: Date.UTC(2026, 7, 20),
					summary: "Our Gemini summary.",
					sourceText: "The CC-BY source text.",
					attribution: "Google, CC BY 4.0",
				},
				{
					licenseClass: "permissive-release-notes",
					headline: "opencode 1.18.21",
					url: "https://example.com/opencode",
					sourceName: "opencode releases",
					publishedAt: Date.UTC(2026, 7, 19),
					summary: "Our opencode summary.",
					sourceText: "The release fixes endpoint selection and file search.",
					attribution: "opencode contributors, MIT",
				},
				{
					licenseClass: "article",
					headline: "A model article",
					url: "https://example.com/article",
					sourceName: "Example",
					publishedAt: Date.UTC(2026, 7, 18),
					summary: "Our article summary.",
				},
				{
					licenseClass: "hn",
					headline: "A Hacker News story",
					url: "https://example.com/story",
					sourceName: "Hacker News",
					publishedAt: Date.UTC(2026, 7, 17),
					summary: "Our Hacker News summary.",
					points: 120,
					comments: 34,
					discussionUrl: "https://news.ycombinator.com/item?id=42",
				},
				{
					licenseClass: "x",
					summary: "Our X summary.",
					embedHtml:
						'<blockquote class="twitter-tweet"><p>Static X post</p><a href="https://x.com/example/status/7" target="_blank" rel="noopener noreferrer">August 20, 2026</a></blockquote>',
				},
			],
		};

		const { container } = render(<KnowledgeTopicPage data={data} />);

		expect(screen.getByRole("heading", { name: "Models" })).toBeTruthy();
		expect(screen.getAllByTestId("release-strip")).toHaveLength(1);
		expect(screen.getByText("Claude Code 2.1.241")).toHaveAttribute(
			"href",
			"https://example.com/claude-code",
		);
		expect(screen.getByText("The CC-BY source text.")).toBeTruthy();
		expect(screen.getByText("Google, CC BY 4.0")).toBeTruthy();
		expect(
			screen.getByText("The release fixes endpoint selection and file search."),
		).toBeTruthy();
		expect(screen.getByText("opencode contributors, MIT")).toBeTruthy();
		expect(screen.getByText("120 points")).toBeTruthy();
		expect(screen.getByText("34 comments")).toHaveAttribute(
			"href",
			"https://news.ycombinator.com/item?id=42",
		);
		expect(screen.getByText("Our X summary.")).toBeTruthy();
		expect(container.querySelector(".twitter-tweet")).not.toBeNull();
		expect(container.innerHTML).not.toMatch(/<script|platform\.twitter\.com/i);
		for (const link of container.querySelectorAll('a[target="_blank"]')) {
			expect(link).toHaveAttribute("rel", "noopener noreferrer");
		}
	});
});
