/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * Fixture events shaped exactly like the `activityEvents` rows written by
 * `convex/activity.ts`. No Convex query exists yet (the read path is #85), so
 * the feed is fed from here.
 *
 * Two densities, because the ticket's real question is whether a feed reads
 * alive or dead:
 *
 *   - `real`  — the THREE rows that are actually on prod right now, at their
 *               real spacing. Instrumentation shipped 2026-08-02, so this is
 *               the whole table. Two of the three are the same stack syncing.
 *   - `grown` — the same site at ~40 published stacks with auto-sync running.
 *               Invented, but the event mix and the burst pattern follow what
 *               the write side can actually emit.
 */

export type Atom = {
	kind: "tool" | "model" | "bundle";
	slug: string;
	name: string;
};

export type HarnessRoll = {
	harness: string;
	windowDays: number;
	sessions: number;
	activeDays: number;
	projects: number;
	totalTokens: number;
};

export type ActivityEvent =
	| { type: "stack.published"; toolCount: number }
	| { type: "stack.composition_changed"; added: Atom[]; removed: Atom[] }
	| { type: "sync.landed"; harnesses: HarnessRoll[] };

/**
 * What `measuredSnapshots` knows that the `sync.landed` EVENT does not.
 *
 * The event stores six fields per harness and nothing else (`convex/schema.ts`
 * `ActivityEvent`). Everything below lives on the snapshot the sync wrote, so a
 * surface that wants it either joins to the newest snapshot per stack at read
 * time, or the event gets widened. The band's aggregate numbers are the good
 * case for the join: they are not feed rows, they are the state of the site.
 *
 * NOT here, because it does not exist anywhere: an EXECUTION COUNT. The CLI
 * computes `a.count` per tool and then divides it away —
 * `packages/cli/src/harness/shared/payload.ts:157` sends `callShare` only. An
 * absolute call count is a CLI wire change, not a query change.
 */
export type SnapshotExtra = {
	/** Real vendor ids, so a union across stacks counts each model once. */
	modelIds: string[];
	/**
	 * Distinct named builtin tools. NAMES, not a count, because two stacks both
	 * running Bash are running one tool — a site-wide count has to union, and a
	 * count cannot be unioned. Names the owner kept private are already excluded
	 * by the CLI, before the send.
	 */
	toolNames: string[];
	mcpServers: number;
	skills: number;
	subagents: number;
	/** 0–1. Weighted by tokens when aggregated, never averaged flat. */
	cacheHitShare: number;
	subagentShare: number;
	/** Distinct names withheld across every category — a positive claim (#42). */
	keptPrivate: number;
};

export type FeedRow = {
	id: string;
	/** Minutes before "now". The variants turn this into a real timestamp. */
	minutesAgo: number;
	stack: { name: string; slug: string; creator: string };
	event: ActivityEvent;
	/**
	 * 30-day total minus the same stack's previous sync total. Computed by
	 * `withDeltas`, not stored — the table has no delta column.
	 */
	deltaTokens?: number;
	/** Present on sync rows only. See `SnapshotExtra`. */
	snapshot?: SnapshotExtra;
};

const ALP = { name: "AI Stack", slug: "ai-stack", creator: "alp" };
const RECENSIO = {
	name: "RecensioAI",
	slug: "recensioai",
	creator: "sebastian",
};

/**
 * The real table. Timestamps preserved as gaps: the two syncs are 19.6 hours
 * apart and the publish sits between them. Token totals are the real ones —
 * 4.709B then 4.994B, which is what makes the repeat-sync problem visible.
 */
export const REAL_ROWS: FeedRow[] = [
	{
		id: "r1",
		minutesAgo: 232,
		stack: ALP,
		event: {
			type: "sync.landed",
			harnesses: [
				{
					harness: "claude-code",
					windowDays: 30,
					sessions: 573,
					activeDays: 24,
					projects: 34,
					totalTokens: 4_985_376_093,
				},
				{
					harness: "codex",
					windowDays: 30,
					sessions: 23,
					activeDays: 5,
					projects: 7,
					totalTokens: 8_374_941,
				},
			],
		},
		// Straight off the real payload: 6 Anthropic models + 2 OpenAI, 21 named
		// Claude Code builtins + 1 Codex builtin, 1 MCP server, 9 skills, 4
		// subagents. keptPrivate = 4 + 10 + 6 + 46 + 1 withheld names.
		snapshot: {
			modelIds: [
				"claude-opus-5",
				"claude-fable-5",
				"claude-opus-4-8",
				"claude-sonnet-5",
				"claude-haiku-4-5",
				"claude-sonnet-4-6",
				"gpt-5.5",
				"gpt-5.6-sol",
			],
			toolNames: [
				"Bash",
				"Read",
				"Edit",
				"Write",
				"Agent",
				"Grep",
				"WebFetch",
				"Glob",
				"WebSearch",
				"AskUserQuestion",
				"ToolSearch",
				"Skill",
				"TaskOutput",
				"TaskUpdate",
				"ScheduleWakeup",
				"SendUserFile",
				"TaskCreate",
				"TaskStop",
				"Monitor",
				"SendMessage",
				"PushNotification",
				"exec_command",
			],
			mcpServers: 1,
			skills: 9,
			subagents: 4,
			cacheHitShare: 0.9652,
			subagentShare: 0.208,
			keptPrivate: 67,
		},
	},
	{
		id: "r2",
		minutesAgo: 813,
		stack: RECENSIO,
		event: { type: "stack.published", toolCount: 1 },
	},
	{
		id: "r3",
		minutesAgo: 1408,
		stack: ALP,
		event: {
			type: "sync.landed",
			harnesses: [
				{
					harness: "claude-code",
					windowDays: 30,
					sessions: 554,
					activeDays: 23,
					projects: 33,
					totalTokens: 4_700_804_343,
				},
				{
					harness: "codex",
					windowDays: 30,
					sessions: 23,
					activeDays: 5,
					projects: 7,
					totalTokens: 8_374_941,
				},
			],
		},
		// Straight off the real payload: 6 Anthropic models + 2 OpenAI, 21 named
		// Claude Code builtins + 1 Codex builtin, 1 MCP server, 9 skills, 4
		// subagents. keptPrivate = 4 + 10 + 6 + 46 + 1 withheld names.
		snapshot: {
			modelIds: [
				"claude-opus-5",
				"claude-fable-5",
				"claude-opus-4-8",
				"claude-sonnet-5",
				"claude-haiku-4-5",
				"claude-sonnet-4-6",
				"gpt-5.5",
				"gpt-5.6-sol",
			],
			toolNames: [
				"Bash",
				"Read",
				"Edit",
				"Write",
				"Agent",
				"Grep",
				"WebFetch",
				"Glob",
				"WebSearch",
				"AskUserQuestion",
				"ToolSearch",
				"Skill",
				"TaskOutput",
				"TaskUpdate",
				"ScheduleWakeup",
				"SendUserFile",
				"TaskCreate",
				"TaskStop",
				"Monitor",
				"SendMessage",
				"PushNotification",
				"exec_command",
			],
			mcpServers: 1,
			skills: 9,
			subagents: 4,
			cacheHitShare: 0.9642,
			subagentShare: 0.2206,
			keptPrivate: 67,
		},
	},
];

type Seed = {
	m: number;
	who: [string, string, string];
	e: ActivityEvent;
};

const tool = (slug: string, name: string): Atom => ({
	kind: "tool",
	slug,
	name,
});
const model = (slug: string, name: string): Atom => ({
	kind: "model",
	slug,
	name,
});

const sync = (
	cc: number,
	sessions: number,
	activeDays: number,
	projects: number,
	second?: [string, number, number],
): ActivityEvent => ({
	type: "sync.landed",
	harnesses: [
		{
			harness: "claude-code",
			windowDays: 30,
			sessions,
			activeDays,
			projects,
			totalTokens: cc,
		},
		...(second
			? [
					{
						harness: second[0],
						windowDays: 30,
						sessions: second[1],
						activeDays: 4,
						projects: 3,
						totalTokens: second[2],
					},
				]
			: []),
	],
});

/**
 * The same site with ~40 published stacks. Ordered newest first. Note the two
 * deliberate bursts (marco at 34m/91m, lena at 244m/1690m) — those are what a
 * collapse rule has to handle.
 */
const GROWN_SEED: Seed[] = [
	{
		m: 3,
		who: ["Shipfast Solo", "shipfast-solo", "marco"],
		e: sync(1_204_882_119, 188, 19, 11),
	},
	{
		m: 11,
		who: ["Ledger", "ledger", "priya"],
		e: {
			type: "stack.composition_changed",
			added: [tool("codex", "Codex"), model("gpt-5.6-sol", "GPT-5.6 Sol")],
			removed: [tool("cursor", "Cursor")],
		},
	},
	{
		m: 26,
		who: ["Nightshift", "nightshift", "tom"],
		e: sync(402_118_775, 61, 12, 4, ["codex", 40, 61_004_223]),
	},
	{
		m: 34,
		who: ["Shipfast Solo", "shipfast-solo", "marco"],
		e: sync(1_198_440_002, 186, 19, 11),
	},
	{
		m: 52,
		who: ["Docs Machine", "docs-machine", "hana"],
		e: { type: "stack.published", toolCount: 6 },
	},
	{
		m: 68,
		who: ["Kestrel", "kestrel", "diego"],
		e: sync(88_204_119, 22, 6, 3),
	},
	{
		m: 74,
		who: ["Nightshift", "nightshift", "tom"],
		e: {
			type: "stack.composition_changed",
			added: [tool("linear", "Linear")],
			removed: [],
		},
	},
	{
		m: 91,
		who: ["Shipfast Solo", "shipfast-solo", "marco"],
		e: sync(1_190_770_318, 184, 19, 11),
	},
	{
		m: 121,
		who: ["Ledger", "ledger", "priya"],
		e: sync(2_774_009_881, 311, 22, 18, ["codex", 96, 140_882_003]),
	},
	{
		m: 149,
		who: ["Quiet Studio", "quiet-studio", "eve"],
		e: {
			type: "stack.composition_changed",
			added: [model("claude-fable-5", "Claude Fable 5")],
			removed: [model("claude-sonnet-4-6", "Claude Sonnet 4.6")],
		},
	},
	{
		m: 182,
		who: ["Beacon", "beacon", "yusuf"],
		e: sync(640_119_004, 90, 14, 7),
	},
	{
		m: 211,
		who: ["Two Pizza", "two-pizza", "lena"],
		e: { type: "stack.published", toolCount: 11 },
	},
	{
		m: 244,
		who: ["Two Pizza", "two-pizza", "lena"],
		e: sync(3_910_776_221, 402, 26, 21),
	},
	{
		m: 288,
		who: ["Kestrel", "kestrel", "diego"],
		e: sync(84_006_400, 21, 6, 3),
	},
	{
		m: 331,
		who: ["Rowboat", "rowboat", "ines"],
		e: sync(1_502_884_119, 220, 20, 9, ["codex", 55, 22_004_118]),
	},
	{
		m: 402,
		who: ["Docs Machine", "docs-machine", "hana"],
		e: {
			type: "stack.composition_changed",
			added: [tool("obsidian", "Obsidian"), tool("raycast", "Raycast")],
			removed: [tool("notion", "Notion")],
		},
	},
	{
		m: 470,
		who: ["Quiet Studio", "quiet-studio", "eve"],
		e: sync(220_884_006, 44, 9, 5),
	},
	{
		m: 566,
		who: ["Shipfast Solo", "shipfast-solo", "marco"],
		e: sync(1_181_004_887, 181, 18, 11),
	},
	{
		m: 640,
		who: ["Ironwood", "ironwood", "sam"],
		e: { type: "stack.published", toolCount: 4 },
	},
	{
		m: 712,
		who: ["Beacon", "beacon", "yusuf"],
		e: sync(631_770_119, 88, 14, 7),
	},
	{
		m: 806,
		who: ["Ledger", "ledger", "priya"],
		e: sync(2_701_118_440, 302, 22, 18, ["codex", 92, 133_006_774]),
	},
	{
		m: 902,
		who: ["Rowboat", "rowboat", "ines"],
		e: {
			type: "stack.composition_changed",
			added: [],
			removed: [tool("windsurf", "Windsurf"), tool("v0", "v0")],
		},
	},
	{
		m: 1_044,
		who: ["Nightshift", "nightshift", "tom"],
		e: sync(388_440_112, 58, 12, 4, ["codex", 38, 58_119_004]),
	},
	{
		m: 1_190,
		who: ["Kestrel", "kestrel", "diego"],
		e: sync(80_774_006, 20, 6, 3),
	},
	{
		m: 1_310,
		who: ["Ironwood", "ironwood", "sam"],
		e: sync(96_004_881, 26, 7, 2),
	},
	{
		m: 1_444,
		who: ["Quiet Studio", "quiet-studio", "eve"],
		e: sync(214_118_770, 42, 9, 5),
	},
	{
		m: 1_602,
		who: ["Beacon", "beacon", "yusuf"],
		e: sync(622_004_118, 86, 13, 7),
	},
	{
		m: 1_690,
		who: ["Two Pizza", "two-pizza", "lena"],
		e: sync(3_844_119_770, 396, 26, 21),
	},
	{
		m: 1_811,
		who: ["Sable", "sable", "noor"],
		e: { type: "stack.published", toolCount: 8 },
	},
	{
		m: 1_996,
		who: ["Shipfast Solo", "shipfast-solo", "marco"],
		e: sync(1_170_884_003, 178, 18, 10),
	},
	{
		m: 2_140,
		who: ["Ledger", "ledger", "priya"],
		e: {
			type: "stack.composition_changed",
			added: [tool("bruno", "Bruno")],
			removed: [tool("postman", "Postman")],
		},
	},
	{
		m: 2_388,
		who: ["Rowboat", "rowboat", "ines"],
		e: sync(1_477_006_221, 214, 20, 9, ["codex", 51, 20_118_774]),
	},
	{
		m: 2_640,
		who: ["Sable", "sable", "noor"],
		e: sync(508_770_004, 74, 11, 6),
	},
	{
		m: 2_902,
		who: ["Nightshift", "nightshift", "tom"],
		e: sync(376_118_884, 55, 11, 4, ["codex", 35, 55_004_112]),
	},
	{
		m: 3_180,
		who: ["Ironwood", "ironwood", "sam"],
		e: sync(91_884_770, 24, 7, 2),
	},
	{
		m: 3_460,
		who: ["Two Pizza", "two-pizza", "lena"],
		e: sync(3_780_004_118, 388, 25, 20),
	},
	{
		m: 3_770,
		who: ["Beacon", "beacon", "yusuf"],
		e: sync(612_119_884, 84, 13, 7),
	},
	{
		m: 4_100,
		who: ["Quiet Studio", "quiet-studio", "eve"],
		e: sync(206_770_440, 40, 9, 5),
	},
];

/** Real Claude Code / Codex tool names, so a union across stacks is honest. */
const TOOL_POOL = [
	"Bash",
	"Read",
	"Edit",
	"Write",
	"Grep",
	"Glob",
	"Agent",
	"WebFetch",
	"WebSearch",
	"Skill",
	"ToolSearch",
	"exec_command",
	"apply_patch",
	"TaskCreate",
	"TaskUpdate",
	"SendMessage",
];

/** Real vendor ids only, so a union across stacks is a real model count. */
const MODEL_POOL = [
	"claude-opus-5",
	"claude-fable-5",
	"claude-sonnet-5",
	"claude-opus-4-8",
	"claude-haiku-4-5",
	"gpt-5.5",
	"gpt-5.6-sol",
];

/**
 * Deterministic snapshot extras for a grown-site sync, scaled off the stack's
 * own size. No randomness — the same stack always reports the same shape, which
 * is what a real stack does between two syncs a day apart.
 */
function grownSnapshot(index: number): SnapshotExtra {
	const breadth = 2 + (index % 4);
	return {
		modelIds: MODEL_POOL.slice(index % 3, (index % 3) + breadth),
		toolNames: TOOL_POOL.slice(index % 5, (index % 5) + 6 + (index % 8)),
		mcpServers: index % 3,
		skills: index % 7,
		subagents: index % 5,
		cacheHitShare: 0.78 + ((index * 7) % 20) / 100,
		subagentShare: ((index * 3) % 30) / 100,
		keptPrivate: (index * 5) % 40,
	};
}

export const GROWN_ROWS: FeedRow[] = GROWN_SEED.map((s, i) => ({
	id: `g${i}`,
	minutesAgo: s.m,
	stack: { name: s.who[0], slug: s.who[1], creator: s.who[2] },
	event: s.e,
	...(s.e.type === "sync.landed"
		? {
				snapshot: grownSnapshot(i),
			}
		: {}),
}));

/**
 * Attach each sync's movement against the same stack's previous sync.
 *
 * A snapshot is a rolling 30-day total (#80), so the delta is how the 30-day
 * figure MOVED, not tokens run since yesterday. The first sync seen for a
 * stack gets no delta — there is nothing to compare it to.
 */
export function withDeltas(rows: readonly FeedRow[]): FeedRow[] {
	const last = new Map<string, number>();
	const out: FeedRow[] = [];
	// Oldest first, so "previous" means previous.
	for (const row of [...rows].sort((a, b) => b.minutesAgo - a.minutesAgo)) {
		if (row.event.type !== "sync.landed") {
			out.push(row);
			continue;
		}
		const total = totalTokens(row.event);
		const prev = last.get(row.stack.slug);
		last.set(row.stack.slug, total);
		out.push(prev === undefined ? row : { ...row, deltaTokens: total - prev });
	}
	return out.reverse();
}

export function totalTokens(event: ActivityEvent): number {
	if (event.type !== "sync.landed") return 0;
	return event.harnesses.reduce((sum, h) => sum + h.totalTokens, 0);
}

export function rowsFor(density: "real" | "grown"): FeedRow[] {
	return withDeltas(density === "real" ? REAL_ROWS : GROWN_ROWS);
}
