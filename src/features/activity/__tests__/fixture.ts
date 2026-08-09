import type { Band, FeedRow, Stream } from "../feed";

export const NOW = new Date("2026-08-05T12:00:00Z").getTime();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

let counter = 0;

export function syncRow(over: Partial<FeedRow> = {}): FeedRow {
	counter += 1;
	return {
		id: `row-${counter}`,
		at: NOW - 4 * HOUR,
		stack: { name: "AI Stack", slug: "ai-stack-ab12", creator: "alp" },
		event: {
			type: "sync.landed",
			harnesses: [
				{
					harness: "claude-code",
					windowDays: 30,
					sessions: 400,
					activeDays: 20,
					projects: 30,
					totalTokens: 3_000_000_000,
				},
				{
					harness: "codex",
					windowDays: 30,
					sessions: 196,
					activeDays: 9,
					projects: 11,
					totalTokens: 1_990_000_000,
				},
			],
		},
		deltaTokens: 285_000_000,
		firstReading: false,
		...over,
	};
}

export function publishedRow(over: Partial<FeedRow> = {}): FeedRow {
	counter += 1;
	return {
		id: `row-${counter}`,
		at: NOW - 2 * DAY,
		stack: { name: "Kestrel", slug: "kestrel-cd34", creator: "diego" },
		event: { type: "stack.published", toolCount: 7 },
		deltaTokens: null,
		firstReading: false,
		...over,
	};
}

export function changedRow(over: Partial<FeedRow> = {}): FeedRow {
	counter += 1;
	return {
		id: `row-${counter}`,
		at: NOW - 26 * HOUR,
		stack: { name: "Halfpipe", slug: "halfpipe-ef56", creator: "rin" },
		event: {
			type: "stack.composition_changed",
			added: [{ kind: "tool", slug: "zed", name: "Zed" }],
			removed: [{ kind: "tool", slug: "vscode", name: "VS Code" }],
		},
		deltaTokens: null,
		firstReading: false,
		...over,
	};
}

export function points(values: number[]): Band["points"] {
	return values.map((value, i) => ({
		at: NOW - (values.length - 1 - i) * DAY,
		value,
	}));
}

export function band(over: Partial<Band> = {}): Band {
	return {
		totals: {
			syncs: 2,
			updates: 1,
			stacksSeen: 4,
		},
		usage: {
			sessions: 596,
			projects: 41,
			models: 8,
			tools: 22,
			// Deliberately NOT one row's delta: the tile is the level the whole
			// site carries, and a test that shares a number cannot tell them
			// apart.
			tokens: 512_000_000,
			stacks: 2,
		},
		points: points([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1e8, 2e8, 0, 3e8]),
		rows: [syncRow(), changedRow(), publishedRow()],
		...over,
	};
}

export function stream(over: Partial<Stream> = {}): Stream {
	return {
		rows: [syncRow(), changedRow(), publishedRow()],
		hasMore: false,
		pageSize: 25,
		maxRows: 500,
		...over,
	};
}
