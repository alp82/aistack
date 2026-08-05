import type { Board, BoardRow } from "../board";

const DAY = 24 * 60 * 60 * 1000;
/** A fixed clock: fixtures must not drift with the test machine's day. */
export const NOW = Date.UTC(2026, 7, 4, 12, 0, 0);

export function row(over: Partial<BoardRow> = {}): BoardRow {
	return {
		rank: 1,
		slug: "orcdev-abc123",
		name: "OrcDev",
		creatorName: "Orc",
		tokens: 291_400_000_000,
		lastSyncMs: NOW - 1 * DAY,
		syncCount: 7,
		points: [
			{ at: NOW - 5 * DAY, tokens: 250_000_000_000 },
			{ at: NOW - 3 * DAY, tokens: 270_000_000_000 },
			{ at: NOW - 1 * DAY, tokens: 291_400_000_000 },
		],
		topModel: { name: "gpt-5.6-sol", share: 0.852 },
		harnesses: ["codex"],
		spend: { lowerBoundUSD: 167_331, coverage: 0.852, exact: false },
		...over,
	};
}

export function board(over: Partial<Board> = {}): Board {
	const rows = over.rows ?? [
		row(),
		row({
			rank: 2,
			slug: "alper-def456",
			name: "Alper's Agent Stack",
			creatorName: "Alper",
			tokens: 8_000_000,
			harnesses: ["claude-code"],
			topModel: { name: "Claude Fable 5", share: 0.91 },
			spend: { lowerBoundUSD: 6042, coverage: 1, exact: true },
			points: [
				{ at: NOW - 4 * DAY, tokens: 10_000_000 },
				{ at: NOW - 2 * DAY, tokens: 8_000_000 },
			],
			syncCount: 2,
		}),
	];
	return {
		stackCount: 4,
		livingCount: rows.length,
		totalTokens: 306_700_000_000,
		totalSessions: 2537,
		spendLowerBoundUSD: 177_021,
		costPublishers: 3,
		unattributedShare: 0.059,
		windowSpreadDays: 3,
		models: [
			{
				key: "gpt-5.6-sol",
				name: "gpt-5.6-sol",
				tokenShare: 0.8,
				stackCount: 3,
				leadsCount: 3,
			},
			{
				key: "claude-fable-5",
				name: "Claude Fable 5",
				tokenShare: 0.12,
				stackCount: 2,
				leadsCount: 1,
			},
		],
		harnesses: [
			{
				key: "codex",
				name: "codex",
				tokenShare: 0.95,
				stackCount: 3,
				leadsCount: 3,
			},
			{
				key: "claude-code",
				name: "claude-code",
				tokenShare: 0.05,
				stackCount: 2,
				leadsCount: 1,
			},
		],
		quiet: { count: 2, tokens: 302_000_000_000 },
		page: 1,
		pageSize: 10,
		totalPages: 1,
		rows,
		...over,
	};
}
