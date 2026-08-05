/**
 * PROTOTYPE — throwaway. Wayfinder ticket #92 (map #76).
 *
 * The population the three variants are judged against.
 *
 * Three densities, because the binding constraint on #92 is **do not fit the
 * design to four stacks**:
 *
 *   real   — the 4 stacks measured on prod on 2026-08-04, at their real numbers
 *   grown  — ~50 stacks, the same 4 inside a plausible adopted population
 *   scale  — ~500 stacks, same shape
 *
 * The `real` rows carry the repriced figures from the #92 body, which came out
 * of the #93 investigation. They are the truth as of 2026-08-04, not what prod
 * publishes today (prod still shows the 11x-wrong frozen cost).
 *
 * Slugs and handles for three of the four are placeholders — a prototype link
 * does not have to resolve. `brilliant-insane` is the real slug.
 *
 * The model splits below reproduce the shares stated in #92 exactly. The tool
 * lists are illustrative: no tool-adoption figure left the ticket.
 */

/** One model inside a stack's 30-day window. */
export type ProtoModel = {
	readonly name: string;
	readonly tokens: number;
};

/** One harness inside a stack's window. A zero-token harness is kept here on
 *  purpose — excluding it is the consumer's job, and #82 locked that rule. */
export type ProtoHarness = {
	readonly name: string;
	readonly tokens: number;
};

export type ProtoStack = {
	readonly id: string;
	readonly name: string;
	readonly slug: string;
	readonly creator: string;
	readonly handle: string;
	/** 30-day measured tokens. The ranking metric, locked in #82. */
	readonly tokens: number;
	readonly sessions: number;
	readonly lastSyncMs: number;
	/** #82: a stack with the cost toggle off shows no cost at all, ever. */
	readonly publishCost: boolean;
	/** Always a lower bound (#93). `null` when `publishCost` is off. */
	readonly spendLowerBound: number | null;
	/** Share of this stack's tokens carrying a citable price. */
	readonly coverage: number;
	/** True when nothing had to be estimated — the CLI priced every response. */
	readonly spendExact: boolean;
	/** Descending by tokens. `unknown` is present and must not render. */
	readonly models: readonly ProtoModel[];
	readonly harnesses: readonly ProtoHarness[];
	readonly tools: readonly string[];
	/**
	 * Every published snapshot inside the window, oldest first.
	 *
	 * The value is the **rolling 30-day total as it stood that day**, which is
	 * what `measuredSnapshots` holds — so the last point always equals `tokens`.
	 * It is a level and not a rate, so it can fall: a quiet week drops the far
	 * end out of the window. #80 measured the best history on the site at 7
	 * readings over 5 days, and one real stack has exactly one reading.
	 */
	readonly history: readonly { readonly at: number; readonly value: number }[];
};

const B = 1_000_000_000;

/** UTC midnight for a 2026 day, so every fixture date is stable across zones. */
function day(month: number, date: number): number {
	return Date.UTC(2026, month - 1, date, 9, 0, 0);
}

/**
 * The four stacks measured on prod, 2026-08-04.
 *
 * Every rendering case #92 named lives in here:
 *   - one stack at 95% of all tokens .................. OrcDev
 *   - a second model of `unknown`, 43B, must not render  OrcDev
 *   - a stack with one harness ........................ GVASTE, Brilliant Insane
 *   - a harness reporting all zeros ................... Alper's Agent Stack
 *   - 100% coverage beside 85.2% coverage ............. Alper's beside OrcDev
 *   - a stale stack in the group below ................ see CLOCKS below
 */
const REAL_STACKS: readonly ProtoStack[] = [
	{
		id: "orcdev",
		name: "OrcDev",
		slug: "orcdev-a1b2c3",
		creator: "OrcDev",
		handle: "orcdev",
		tokens: 291.35 * B,
		sessions: 1347,
		lastSyncMs: day(8, 2),
		publishCost: true,
		spendLowerBound: 167_331,
		coverage: 0.852,
		spendExact: false,
		models: [
			{ name: "gpt-5.6-sol", tokens: 233.08 * B },
			// 14.8% of the biggest stack on the site has no model name. This is
			// the whole of the coverage gap, and it must never draw a bar.
			{ name: "unknown", tokens: 43.12 * B },
			{ name: "gpt-5.6-codex", tokens: 9.906 * B },
			{ name: "claude-opus-5", tokens: 5.244 * B },
		],
		harnesses: [
			{ name: "codex", tokens: 279.32 * B },
			{ name: "claude-code", tokens: 12.03 * B },
		],
		tools: ["Codex", "Claude Code", "Linear", "Vercel", "Neon"],
		history: [
			{ at: day(7, 29), value: 240.1 * B },
			{ at: day(7, 30), value: 255.4 * B },
			{ at: day(7, 31), value: 267.9 * B },
			{ at: day(8, 1), value: 279.2 * B },
			{ at: day(8, 2), value: 291.35 * B },
		],
	},
	{
		id: "gvaste",
		name: "GVASTE",
		slug: "gvaste-d4e5f6",
		creator: "GVASTE",
		handle: "gvaste",
		tokens: 5.88 * B,
		sessions: 138,
		lastSyncMs: day(8, 1),
		publishCost: true,
		// Published nothing before #93 — the CLI could not price gpt-5.6 at all.
		spendLowerBound: 3_648,
		coverage: 0.977,
		spendExact: false,
		models: [
			{ name: "gpt-5.6-sol", tokens: 4.998 * B },
			{ name: "gpt-5.6", tokens: 0.74676 * B },
			{ name: "unknown", tokens: 0.13524 * B },
		],
		harnesses: [{ name: "codex", tokens: 5.88 * B }],
		tools: ["Codex", "Cursor", "Supabase"],
		// Falling. The window forgot a busy week at its far end, so the total
		// dropped without anyone doing less today.
		history: [
			{ at: day(7, 27), value: 7.42 * B },
			{ at: day(8, 1), value: 5.88 * B },
		],
	},
	{
		id: "brilliant-insane",
		name: "Brilliant Insane",
		slug: "brilliant-insane",
		creator: "Brilliant Insane",
		handle: "brilliantinsane",
		tokens: 4.77 * B,
		sessions: 475,
		lastSyncMs: day(8, 2),
		publishCost: true,
		spendLowerBound: 3_642,
		coverage: 0.996,
		spendExact: false,
		models: [
			{ name: "gpt-5.6-sol", tokens: 4.3407 * B },
			{ name: "gpt-5.6-codex", tokens: 0.41022 * B },
			{ name: "unknown", tokens: 0.01908 * B },
		],
		harnesses: [{ name: "codex", tokens: 4.77 * B }],
		tools: ["Codex", "Claude Code", "Railway"],
		// One reading. A line needs two, so this row can draw no trend at all.
		history: [{ at: day(8, 2), value: 4.77 * B }],
	},
	{
		id: "alper",
		name: "Alper's Agent Stack",
		slug: "alpers-agent-stack-g7h8i9",
		creator: "Alper Ortac",
		handle: "alper",
		tokens: 4.71 * B,
		sessions: 577,
		lastSyncMs: day(8, 3),
		publishCost: true,
		// The only exact figure on the board: the CLI priced every response.
		spendLowerBound: 6_042,
		coverage: 1,
		spendExact: true,
		models: [
			{ name: "claude-opus-5", tokens: 1.884 * B },
			{ name: "claude-sonnet-5", tokens: 1.5543 * B },
			{ name: "claude-haiku-4-5", tokens: 1.263693 * B },
			{ name: "gpt-5.6-sol", tokens: 0.008007 * B },
		],
		harnesses: [
			{ name: "claude-code", tokens: 4.702 * B },
			{ name: "codex", tokens: 0.008 * B },
			// A configured harness that logged nothing. #82 excludes it.
			{ name: "gemini", tokens: 0 },
		],
		tools: ["Claude Code", "Codex", "Convex", "Better Auth", "Resend", "Biome"],
		history: [
			{ at: day(7, 28), value: 3.11 * B },
			{ at: day(7, 29), value: 3.58 * B },
			{ at: day(7, 30), value: 4.02 * B },
			{ at: day(7, 31), value: 4.35 * B },
			{ at: day(8, 1), value: 4.6 * B },
			{ at: day(8, 2), value: 4.68 * B },
			{ at: day(8, 3), value: 4.71 * B },
		],
	},
];

/**
 * The two clocks.
 *
 * All four real stacks synced within 7 days of 2026-08-05, so `now` has an
 * empty stale group. Moving the clock forward makes them fall out one by one,
 * against their real sync dates — no invented stack needed:
 *
 *   now    Aug 5  — 4 ranked, 0 quiet
 *   quiet  Aug 9  — 1 ranked, 3 quiet
 *   dark   Aug 12 — 0 ranked, 4 quiet, and the board has nothing to rank
 *
 * `dark` is not a stunt. Four stacks are one quiet week away from it.
 */
export const CLOCKS = {
	now: Date.UTC(2026, 7, 5, 12, 0, 0),
	quiet: Date.UTC(2026, 7, 9, 12, 0, 0),
	dark: Date.UTC(2026, 7, 12, 12, 0, 0),
} as const;

export type ClockKey = keyof typeof CLOCKS;

/** Living means synced inside the last 7 days. Locked in #82. */
export const LIVING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Generated populations
// ---------------------------------------------------------------------------

/** A seeded LCG, so a reload draws the same population every time. */
function rng(seed: number): () => number {
	let s = seed >>> 0;
	return () => {
		s = (s * 1_664_525 + 1_013_904_223) >>> 0;
		return s / 4_294_967_296;
	};
}

const ADJECTIVES = [
	"Quiet",
	"Blunt",
	"Iron",
	"Paper",
	"Neon",
	"Slow",
	"Loud",
	"Small",
	"Feral",
	"Plain",
	"Bright",
	"Hollow",
	"Rough",
	"Sharp",
	"Deep",
	"Wide",
	"Thin",
	"Odd",
	"Warm",
	"Cold",
	"Stray",
	"Bold",
	"Lean",
	"Dense",
];
const NOUNS = [
	"Compiler",
	"Bench",
	"Foundry",
	"Ledger",
	"Harbor",
	"Anvil",
	"Lantern",
	"Signal",
	"Quarry",
	"Beacon",
	"Cutter",
	"Mill",
	"Forge",
	"Loom",
	"Drift",
	"Relay",
	"Vault",
	"Prism",
	"Ember",
	"Rift",
	"Atlas",
	"Cinder",
	"Pylon",
	"Marrow",
];
const FIRST = [
	"Mara",
	"Devi",
	"Ilya",
	"Nour",
	"Sami",
	"Tove",
	"Ravi",
	"Juno",
	"Kian",
	"Lena",
	"Oyin",
	"Paz",
	"Rune",
	"Suki",
	"Theo",
	"Vera",
	"Yusuf",
	"Zara",
];
const LAST = [
	"Okafor",
	"Lindqvist",
	"Haddad",
	"Moreau",
	"Silva",
	"Novak",
	"Reyes",
	"Ahmadi",
	"Kowal",
	"Berg",
	"Tan",
	"Iyer",
	"Petrov",
	"Duarte",
	"Fischer",
];

/** The model catalog a generated stack draws from, with a rough house share. */
const MODEL_POOL = [
	{ name: "gpt-5.6-sol", weight: 30 },
	{ name: "claude-opus-5", weight: 22 },
	{ name: "claude-sonnet-5", weight: 20 },
	{ name: "gpt-5.6-codex", weight: 14 },
	{ name: "claude-haiku-4-5", weight: 10 },
	{ name: "gpt-5.6", weight: 9 },
	{ name: "gemini-3-pro", weight: 7 },
	{ name: "grok-code-2", weight: 4 },
	{ name: "kimi-k3", weight: 3 },
	{ name: "deepseek-v4", weight: 3 },
];

const HARNESS_POOL = ["claude-code", "codex", "gemini-cli", "opencode", "amp"];

const TOOL_POOL = [
	"Claude Code",
	"Codex",
	"Cursor",
	"Vercel",
	"Supabase",
	"Convex",
	"Linear",
	"Railway",
	"Neon",
	"Biome",
	"Playwright",
	"Resend",
	"Sentry",
	"Figma",
	"Notion",
	"PostHog",
	"Tailscale",
	"Fly.io",
	"Better Auth",
	"Turso",
];

/** Price per million tokens, only used to make generated spend self-consistent. */
const RATE_PER_MTOK = 0.6;

function pick<T>(r: () => number, list: readonly T[]): T {
	return list[Math.floor(r() * list.length)];
}

function generate(count: number, seed: number, nowMs: number): ProtoStack[] {
	const r = rng(seed);
	const out: ProtoStack[] = [];

	for (let i = 0; i < count; i++) {
		// A long tail: the head is big, the body is not, and most of the
		// population sits near the floor. Rank i is roughly i^-1.15.
		const decay = 420 * (i + 1) ** -1.15;
		const tokens = Math.max(0.04, decay * (0.45 + r() * 1.4)) * B;

		// Model mix: three to six named models plus, sometimes, an unnamed slice.
		const modelCount = 3 + Math.floor(r() * 4);
		const chosen: string[] = [];
		while (chosen.length < modelCount) {
			const m = pick(r, MODEL_POOL);
			if (!chosen.includes(m.name)) chosen.push(m.name);
		}
		// The leader takes a dominant share more often than not — that is what
		// the real four look like, and it is what makes a token-weighted share
		// read as a sentence about one stack.
		const leadShare = 0.34 + r() * 0.55;
		const unknownShare = r() < 0.45 ? r() * 0.22 : 0;
		const rest = 1 - leadShare - unknownShare;
		const restWeights = chosen.slice(1).map(() => 0.2 + r());
		const restTotal = restWeights.reduce((a, b) => a + b, 0) || 1;

		const models: ProtoModel[] = [
			{ name: chosen[0], tokens: tokens * leadShare },
			...chosen.slice(1).map((name, k) => ({
				name,
				tokens: (tokens * rest * restWeights[k]) / restTotal,
			})),
		];
		if (unknownShare > 0) {
			models.push({ name: "unknown", tokens: tokens * unknownShare });
		}
		models.sort((a, b) => b.tokens - a.tokens);

		// Harnesses: one for a third of the population, two or three otherwise,
		// and now and then one that logged nothing at all.
		const harnessCount = r() < 0.34 ? 1 : 1 + Math.floor(r() * 3);
		const names: string[] = [];
		while (names.length < harnessCount) {
			const h = pick(r, HARNESS_POOL);
			if (!names.includes(h)) names.push(h);
		}
		const hWeights = names.map(() => 0.15 + r());
		const hTotal = hWeights.reduce((a, b) => a + b, 0);
		const harnesses: ProtoHarness[] = names.map((name, k) => ({
			name,
			tokens: (tokens * hWeights[k]) / hTotal,
		}));
		if (r() < 0.18) {
			const idle = HARNESS_POOL.find((h) => !names.includes(h));
			if (idle) harnesses.push({ name: idle, tokens: 0 });
		}

		const toolCount = 3 + Math.floor(r() * 6);
		const tools: string[] = [];
		while (tools.length < toolCount) {
			const t = pick(r, TOOL_POOL);
			if (!tools.includes(t)) tools.push(t);
		}

		// A fifth of the population has gone quiet. Their last sync is anywhere
		// from just past the window to two months back.
		const stale = r() < 0.22;
		const ageDays = stale ? 8 + r() * 52 : r() * 6.5;
		const lastSyncMs = nowMs - ageDays * 24 * 60 * 60 * 1000;

		const coverage = 1 - unknownShare - (r() < 0.3 ? r() * 0.12 : 0);
		// A quarter keep cost private. #82: they show no cost at all.
		const publishCost = r() > 0.26;
		const priced = tokens * coverage;
		const spendLowerBound = publishCost
			? Math.round(((priced / 1_000_000) * RATE_PER_MTOK * (0.6 + r())) / 1)
			: null;

		const name = `${pick(r, ADJECTIVES)} ${pick(r, NOUNS)}`;
		const creator = `${pick(r, FIRST)} ${pick(r, LAST)}`;
		const handle = creator.toLowerCase().replace(/[^a-z]/g, "");

		// A short walk backwards from the last sync, one reading per day, ending
		// on today's total. A fifth of them trend down.
		const readings = 1 + Math.floor(r() * 13);
		const direction = r() < 0.2 ? -1 : 1;
		const history: { at: number; value: number }[] = [];
		let level = tokens;
		for (let k = 0; k < readings; k++) {
			history.unshift({
				at: lastSyncMs - k * 24 * 60 * 60 * 1000,
				value: Math.max(tokens * 0.05, level),
			});
			level -= direction * tokens * (0.02 + r() * 0.09);
		}

		out.push({
			id: `gen-${seed}-${i}`,
			name,
			slug: `${name.toLowerCase().replace(/ /g, "-")}-${(seed + i).toString(36)}`,
			creator,
			handle,
			tokens,
			sessions: Math.max(1, Math.round((tokens / B) * (2 + r() * 9))),
			lastSyncMs,
			publishCost,
			spendLowerBound,
			coverage,
			spendExact: coverage >= 0.999 && r() < 0.25,
			models,
			harnesses,
			tools,
			history,
		});
	}
	return out;
}

export type DensityKey = "real" | "grown" | "scale";

export const DENSITY_LABEL: Record<DensityKey, string> = {
	real: "4 — prod today",
	grown: "50 — adopted",
	scale: "500 — at scale",
};

/**
 * The population for a density.
 *
 * The four real stacks stay in every population at their real numbers, so the
 * cases they carry (an `unknown` second model, a zero-token harness, an exact
 * cost beside three estimates) never disappear as the board grows.
 */
export function populationFor(
	density: DensityKey,
	nowMs: number,
): readonly ProtoStack[] {
	if (density === "real") return REAL_STACKS;
	const count = density === "grown" ? 46 : 496;
	return [
		...REAL_STACKS,
		...generate(count, density === "grown" ? 7 : 19, nowMs),
	];
}
