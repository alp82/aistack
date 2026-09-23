// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "../../../../convex/_generated/api";
import {
	type EfficiencyRead,
	ProfileEfficiencyPreview,
	SaveTokensBar,
	TokenEfficiencyPage,
} from "../TokenEfficiency";

const queryMock = vi.fn();
vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args: unknown) => queryMock(ref, args),
}));
vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		...rest
	}: {
		children: React.ReactNode;
		to: string;
		"aria-label"?: string;
	}) => (
		<a href={to} aria-label={rest["aria-label"]}>
			{children}
		</a>
	),
}));
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

type Tile = EfficiencyRead["tiles"][number];
const tile = (over: Partial<Tile>): Tile => ({
	id: "claude-code:cache",
	lever: "cache",
	harness: "claude-code",
	severity: "high",
	meter: 1,
	fix: "Use the 1h cache TTL",
	verdict: "Breaks are cold-starting your cache",
	keep: "Keep working in contiguous blocks",
	figure: { value: "502", label: "calls after a break" },
	evidence: [{ label: "tokens rewritten after a break", value: "17.7M" }],
	why: "The prompt cache expires 5 minutes after the last call.",
	action: "Set the cache TTL to 1h on API-key billing.",
	usd: 332,
	usdNote: null,
	...over,
});
const read: EfficiencyRead = {
	window: { from: "2026-08-25", to: "2026-09-23" },
	rulesVersion: "efficiency-rules/v1",
	tiles: [
		tile({}),
		tile({
			id: "claude-code:tools",
			lever: "tools",
			severity: "medium",
			fix: "Read with offset and limit",
			usd: null,
		}),
		tile({
			id: "claude-code:sessions",
			lever: "sessions",
			severity: "ok",
			fix: "Ask quick questions in a running session",
			verdict: "Sessions are worth their startup",
			keep: "Keep quick questions inside running sessions",
			usd: null,
		}),
	],
	recoverableUsd: 332,
	pricingTables: ["modelPrices/1-a"],
};
const answer = (value: EfficiencyRead | null) =>
	queryMock.mockImplementation((_ref: unknown, args: unknown) =>
		args === "skip" ? undefined : value,
	);

it("names the findings on the stack page for the owner and links to settings", () => {
	answer(read);
	render(<SaveTokensBar slug="my-stack-abc" isOwner />);
	const link = screen.getByRole("link");
	expect(link.getAttribute("href")).toBe("/settings/token-efficiency");
	expect(link.textContent).toContain("Save tokens: 2 findings");
	expect(link.textContent).not.toContain("$");
});

it("never asks for the findings on someone else's stack", () => {
	answer(read);
	const { container } = render(
		<SaveTokensBar slug="my-stack-abc" isOwner={false} />,
	);
	expect(queryMock).toHaveBeenCalledWith(
		api.workflow.getEfficiencyByStackSlug,
		"skip",
	);
	expect(container.textContent).toBe("");
});

it("previews the same boxes on the profile with the small text removed", () => {
	answer(read);
	render(<ProfileEfficiencyPreview />);
	const link = screen.getByRole("link", { name: "Token efficiency" });
	expect(link.getAttribute("href")).toBe("/settings/token-efficiency");
	expect(link.textContent).toContain("Use the 1h cache TTL");
	expect(link.textContent).toContain(
		"Keep quick questions inside running sessions",
	);
	expect(link.textContent).not.toContain("calls after a break");
	expect(link.textContent).not.toContain("Breaks are cold-starting");
});

it("puts the passing rule inside the settings grid and opens the fix on click", () => {
	answer(read);
	render(<TokenEfficiencyPage />);
	expect(getFunctionName(queryMock.mock.calls[0]?.[0])).toBe(
		getFunctionName(api.workflow.getMyEfficiency),
	);
	expect(screen.getByText("Save tokens: 2 findings")).toBeTruthy();
	const tiles = screen.getAllByRole("button");
	expect(tiles).toHaveLength(3);
	expect(tiles[2]?.textContent).toContain("Good");
	expect(tiles[2]?.textContent).toContain(
		"Keep quick questions inside running sessions",
	);
	expect(tiles[0]?.textContent).toContain("$332");
	expect(tiles[0]?.textContent).not.toContain("Set the cache TTL");
	fireEvent.click(tiles[0] as HTMLElement);
	expect(tiles[0]?.textContent).toContain("Set the cache TTL");
});

it("says so when there is nothing to read yet", () => {
	answer(null);
	render(<TokenEfficiencyPage />);
	expect(screen.getByText("No findings yet.")).toBeTruthy();
	expect(document.body.textContent).toContain("npx @use-aistack/cli sync");
});
