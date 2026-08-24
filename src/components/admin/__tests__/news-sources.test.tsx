// @vitest-environment jsdom
/**
 * The Sources view of the admin News tab (#262, map #198).
 *
 * One decision is guarded here: A PAUSED SOURCE IS NOT A FAILING SOURCE.
 *
 * `lastError` is what the last poll of an ACTIVE source said. Pausing retires
 * the poll, so the red goes with it, and the row reads as paused rather than
 * broken. The text itself stays, muted, because the reason you paused the
 * source is the record you want when you come back to the row.
 *
 * The inbox already reads it this way: its own failing-source banner gates on
 * `enabled` (NewsInboxSection). This view was the one that did not, which is
 * how the Claude blog lane held a permanent red banner.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NewsSourcesSection } from "@/components/admin/NewsSourcesSection";

const queryMock = vi.fn();
const mutationMock = vi.fn();
const actionMock = vi.fn();

vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args?: unknown) => queryMock(ref, args),
	useMutation: (ref: unknown) => mutationMock(ref),
	useAction: (ref: unknown) => actionMock(ref),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

function source(over: Record<string, unknown> = {}) {
	return {
		_id: "src_1",
		name: "Claude blog",
		slug: "claude-blog",
		scraperSlug: "claude-blog",
		kind: "sitemap",
		url: "https://claude.com/sitemap.xml",
		licenseClass: "article",
		enabled: true,
		collectFrom: 1_000,
		consecutiveFailures: 4,
		lastPolledAt: 1_000,
		lastError: "HTTP 502",
		createdAt: 1_000,
		updatedAt: 1_000,
		...over,
	};
}

function setup(sources: unknown[]) {
	queryMock.mockImplementation((ref: never) => {
		const name = getFunctionName(ref);
		if (name.endsWith("listSources")) return sources;
		return undefined;
	});
	mutationMock.mockImplementation(() => vi.fn().mockResolvedValue(null));
	actionMock.mockImplementation(() => vi.fn().mockResolvedValue([]));
	return render(<NewsSourcesSection />);
}

/** The row card, found from the error line it carries. */
function rowOf(errorText: string): HTMLElement {
	const line = screen.getByText(errorText);
	const row = line.closest("div.border-2");
	if (!row) throw new Error("the source row is not on the page");
	return row as HTMLElement;
}

describe("a source row that reports an error", () => {
	it("shows it in red while the source is enabled", () => {
		setup([source()]);

		const row = rowOf("HTTP 502");
		expect(row.className).toContain("border-red-400/40");
		expect(screen.getByText("HTTP 502").className).toContain("text-red-400");
	});

	it("keeps the text but drops the red once the source is paused", () => {
		setup([source({ enabled: false })]);

		const row = rowOf("HTTP 502");
		expect(row.className).not.toContain("border-red-400/40");
		expect(row.className).toContain("border-stroke-strong");
		expect(screen.getByText("HTTP 502").className).not.toContain(
			"text-red-400",
		);
		// The row says what it is instead.
		expect(row).toHaveTextContent("paused");
	});
});
