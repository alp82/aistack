/**
 * PROTOTYPE - throwaway. One card model for every OG image on the site, and the
 * loaders that fill it from the live local database. The three families in
 * `variants.tsx` render the same `OgCard` three different ways.
 *
 * Static subpages get fixed copy plus live counts. Dynamic pages (stack, builder,
 * news issue, topic) get their own row. When `id` is missing the loader picks a
 * real row so the gallery works without arguments, and falls back to a fixture
 * when the local database has none.
 */
import type { ConvexHttpClient } from "convex/browser";
import { ogAccentFor } from "@/features/stack-view/accentPresets";
import { formatPriceDisplay, orderToolsForDisplay } from "@/lib/pricing";
import { api } from "../../../../convex/_generated/api";

export type OgStat = { label: string; value: string };
export type OgIcon = { name: string; iconUrl?: string | null };

export type OgCard = {
	key: string;
	/** Site path the image belongs to, printed as a footer on some families. */
	path: string;
	/** Section word, e.g. "LEADERBOARD". Families print it in mono. */
	kicker: string;
	/** Headline lines. A word wrapped in `*` wears the accent. */
	titleLines: string[];
	/** The same headline in mixed case, for the family that does not shout. */
	sentence: string;
	description: string;
	/** Up to three. The first is the hero figure. */
	stats: OgStat[];
	avatarUrl?: string | null;
	icons?: OgIcon[];
	accent: { base: string; contrast: string };
	/** The window or date the figures cover. */
	range?: string;
};

export const STATIC_CARDS = [
	"home",
	"stacks",
	"tools",
	"leaderboard",
	"activity",
	"news",
	"about",
	"discord",
	"sync",
	"subscribe",
] as const;
export const DYNAMIC_CARDS = ["stack", "creator", "issue", "topic"] as const;
export type CardKey =
	| (typeof STATIC_CARDS)[number]
	| (typeof DYNAMIC_CARDS)[number];

export const isCardKey = (s: string): s is CardKey =>
	(STATIC_CARDS as readonly string[]).includes(s) ||
	(DYNAMIC_CARDS as readonly string[]).includes(s);

const LIME = ogAccentFor("lime");

export const compact = (n: number) =>
	Intl.NumberFormat("en-US", {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(n);

const shortDate = (ms: number) =>
	new Date(ms).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

/** Greedy word wrap into at most `maxLines` lines of about `maxChars`. */
export function wrapLines(text: string, maxChars: number, maxLines: number) {
	const words = text.split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let line = "";
	for (const word of words) {
		const next = line ? `${line} ${word}` : word;
		if (next.length > maxChars && line) {
			lines.push(line);
			line = word;
		} else {
			line = next;
		}
	}
	if (line) lines.push(line);
	if (lines.length > maxLines) {
		const kept = lines.slice(0, maxLines);
		kept[maxLines - 1] = `${kept[maxLines - 1].slice(0, maxChars - 1)}…`;
		return kept;
	}
	return lines;
}

/** Most-used tools across the public stacks, as icon chips. */
function topTools(
	stacks: Array<{ tools: Array<{ name: string; iconUrl?: string | null }> }>,
	n: number,
): OgIcon[] {
	const count = new Map<string, { n: number; icon: OgIcon }>();
	for (const s of stacks)
		for (const t of s.tools) {
			const c = count.get(t.name) ?? {
				n: 0,
				icon: { name: t.name, iconUrl: t.iconUrl },
			};
			c.n += 1;
			count.set(t.name, c);
		}
	return [...count.values()]
		.sort((a, b) => b.n - a.n)
		.slice(0, n)
		.map((c) => c.icon);
}

export async function loadCard(
	convex: ConvexHttpClient,
	key: CardKey,
	id?: string,
): Promise<OgCard> {
	switch (key) {
		case "home": {
			const [band, stacks] = await Promise.all([
				convex.query(api.activityFeed.band, {}),
				convex.query(api.stacks.listPublic, {}),
			]);
			return {
				key,
				path: "/",
				kicker: "AISTACK.TO",
				titleLines: ["SEE EXACTLY WHAT", "REAL *BUILDERS*", "USE TO SHIP"],
				sentence: "See exactly what real builders use to ship",
				description:
					"The setups builders actually work in, synced straight from their machines: what they run, what it costs, how it fits together.",
				stats: [
					{ label: "tokens, last 24h", value: compact(band.usage.tokens) },
					{ label: "public stacks", value: String(stacks.length) },
					{ label: "sessions", value: compact(band.usage.sessions) },
				],
				icons: topTools(stacks, 6),
				accent: LIME,
				range: "last 24 hours",
			};
		}
		case "stacks": {
			const stacks = await convex.query(api.stacks.listPublic, {});
			const builders = new Set(stacks.map((s) => s.creator.name)).size;
			const tools = new Set(stacks.flatMap((s) => s.tools.map((t) => t.name)))
				.size;
			return {
				key,
				path: "/stacks",
				kicker: "STACKS",
				titleLines: ["EVERY STACK,", "*MEASURED*", "FROM THE MACHINE"],
				sentence: "Every stack, measured from the machine",
				description:
					"Browse the AI stacks real builders run in production. Tools, costs and workflows side by side.",
				stats: [
					{ label: "stacks", value: String(stacks.length) },
					{ label: "builders", value: String(builders) },
					{ label: "tools", value: String(tools) },
				],
				icons: topTools(stacks, 6),
				accent: LIME,
			};
		}
		case "tools": {
			const [tools, stacks] = await Promise.all([
				convex.query(api.tools.listAll, {}),
				convex.query(api.stacks.listPublic, {}),
			]);
			const categories = new Set(tools.flatMap((t) => t.categories)).size;
			const used = new Set(stacks.flatMap((s) => s.tools.map((t) => t.name)))
				.size;
			return {
				key,
				path: "/tools",
				kicker: "TOOLS",
				titleLines: ["THE TOOLS", "BUILDERS", "*ACTUALLY* USE"],
				sentence: "The tools builders actually use",
				description:
					"A directory of AI tools drawn from real production stacks. Filter by category and compare pricing.",
				stats: [
					{ label: "tools", value: String(tools.length) },
					{ label: "categories", value: String(categories) },
					{ label: "in a stack", value: String(used) },
				],
				icons: topTools(stacks, 6),
				accent: LIME,
			};
		}
		case "leaderboard": {
			const board = await convex.query(api.leaderboard.get, {});
			const top = board.rows.slice(0, 3).map((r) => r.name);
			const model = board.models[0];
			return {
				key,
				path: "/leaderboard",
				kicker: "LEADERBOARD",
				titleLines: ["RANKED BY", "*TOKENS*,", "NOT OPINIONS"],
				sentence: "Ranked by tokens, not opinions",
				description: top.length
					? `Measured stacks ranked by 30-day token volume, counted on each builder's own machine. Leading: ${top.join(", ")}.`
					: "Measured stacks ranked by 30-day token volume, counted on each builder's own machine.",
				stats: [
					{ label: "tokens, 30 days", value: compact(board.totalTokens) },
					{ label: "measured stacks", value: String(board.stackCount) },
					model
						? {
								label: `top model · ${model.name}`,
								value: `${Math.round(model.tokenShare * 100)}%`,
							}
						: { label: "sessions", value: compact(board.totalSessions) },
				],
				accent: LIME,
				range: "30 days",
			};
		}
		case "activity": {
			const band = await convex.query(api.activityFeed.band, {});
			return {
				key,
				path: "/activity",
				kicker: "ACTIVITY",
				titleLines: ["SYNCS AND", "CHANGES", "AS THEY *LAND*"],
				sentence: "Syncs and changes as they land",
				description:
					"Every sync, new stack and composition change across public AI stacks, newest first.",
				stats: [
					{ label: "syncs, last 24h", value: String(band.totals.syncs) },
					{ label: "updates", value: String(band.totals.updates) },
					{ label: "stacks seen", value: String(band.totals.stacksSeen) },
				],
				accent: LIME,
				range: "last 24 hours",
			};
		}
		case "news": {
			const issues = await convex.query(api.newsletter.listSentIssues, {});
			const latest = issues[0];
			const items = issues.reduce((n, i) => n + i.itemCount, 0);
			return {
				key,
				path: "/news",
				kicker: "NEWS",
				titleLines: ["ONE WEEK OF", "AI TOOLING,", "*COLLECTED*"],
				sentence: "One week of AI tooling, collected",
				description: latest
					? `Model releases, agent harness changes and tooling, every week. Latest: #${latest.number} ${latest.subject}.`
					: "Model releases, agent harness changes and tooling, every week, for people who build with AI tools.",
				stats: [
					{ label: "issues", value: String(issues.length) },
					{ label: "items", value: String(items) },
					{ label: "cadence", value: "weekly" },
				],
				accent: LIME,
			};
		}
		case "about": {
			const stats = await convex.query(api.stacks.getLandingStats, {});
			return {
				key,
				path: "/about",
				kicker: "ABOUT",
				titleLines: ["HOW", "AI STACK", "*WORKS*"],
				sentence: "How AI Stack works",
				description:
					"Explore, compare and share real AI workflows. Costs, tools and configs side by side, measured rather than described.",
				stats: [
					{ label: "stacks", value: String(stats.stackCount) },
					{ label: "tools", value: String(stats.toolCount) },
					{ label: "avg fixed / mo", value: `$${Math.round(stats.avgCost)}` },
				],
				accent: LIME,
			};
		}
		case "discord":
			return {
				key,
				path: "/discord",
				kicker: "DISCORD",
				titleLines: ["YOUR AI USAGE,", "*IN DISCORD*"],
				sentence: "Your AI usage, in Discord",
				description:
					"Add AI Stack to any server or DM. Five commands for totals, models, cost, context and comparisons.",
				stats: [
					{ label: "commands", value: "5" },
					{ label: "privileged intents", value: "0" },
					{ label: "install", value: "user + guild" },
				],
				accent: LIME,
			};
		case "sync":
			return {
				key,
				path: "/sync",
				kicker: "SYNC",
				titleLines: ["SHOW WHAT", "*ACTUALLY*", "RAN"],
				sentence: "Show what actually ran",
				description:
					"Publish the sessions, models, tokens and cost behind your stack, straight from your own machine. One command with an approval gate.",
				stats: [
					{ label: "command", value: "1" },
					{ label: "window", value: "30 days" },
					{ label: "leaves without approval", value: "0" },
				],
				accent: LIME,
			};
		case "subscribe": {
			const issues = await convex.query(api.newsletter.listSentIssues, {});
			return {
				key,
				path: "/subscribe",
				kicker: "NEWSLETTER",
				titleLines: ["ONE EMAIL", "A *WEEK*"],
				sentence: "One email a week",
				description:
					"Model releases, agent harness changes, and what people actually run. Nothing else.",
				stats: [
					{ label: "per week", value: "1" },
					{ label: "issues so far", value: String(issues.length) },
				],
				accent: LIME,
			};
		}
		case "stack": {
			const slug =
				id ??
				(await convex.query(api.leaderboard.get, {})).rows[0]?.slug ??
				(await convex.query(api.stacks.listPublic, {}))[0]?.slug;
			const stack = slug
				? await convex.query(api.stacks.getBySlug, { slug })
				: null;
			if (!stack) return fixtureStack();
			const price = formatPriceDisplay(
				stack.fixedTotal?.amount ?? 0,
				"month",
				"floor",
			);
			const tools = orderToolsForDisplay(stack.tools);
			return {
				key,
				path: `/stacks/${stack.slug}`,
				kicker: `STACK · @${stack.creator.xHandle ?? stack.creator.name}`,
				titleLines: wrapLines(stack.name.toUpperCase(), 16, 3),
				sentence: stack.name,
				description: stack.oneLiner,
				stats: [
					{
						label: "fixed / month",
						value: `$${price.amountText}${stack.hasUsageComponent ? "+" : ""}`,
					},
					{ label: "tools", value: String(tools.length) },
					{
						label: "team",
						value: stack.teamSize ? String(stack.teamSize) : "solo",
					},
				],
				avatarUrl: stack.creator.avatarUrl,
				icons: tools
					.slice(0, 6)
					.map((t) => ({ name: t.name, iconUrl: t.iconUrl })),
				accent: ogAccentFor(stack.accentPreset),
			};
		}
		case "creator": {
			const handle =
				id ??
				(await convex.query(api.stacks.listPublic, {})).find(
					(s) => s.creator.avatarUrl,
				)?.creator.handle;
			const data = handle
				? await convex.query(api.creators.getByHandle, { handle })
				: null;
			if (!data) return fixtureCreator();
			const { profile, stacks } = data;
			const mine = (await convex.query(api.stacks.listPublic, {})).filter(
				(s) => s.creator.handle === profile.handle,
			);
			const tools = topTools(mine, 6);
			return {
				key,
				path: `/@${profile.handle}`,
				kicker: `BUILDER · @${profile.handle}`,
				titleLines: wrapLines(profile.name.toUpperCase(), 14, 3),
				sentence: profile.name,
				description:
					profile.bio ??
					`${profile.name} shares ${stacks.length === 1 ? "one AI stack" : `${stacks.length} AI stacks`} on AI Stack.`,
				stats: [
					{ label: "stacks", value: String(stacks.length) },
					{
						label: "tools",
						value: String(
							new Set(mine.flatMap((s) => s.tools.map((t) => t.name))).size,
						),
					},
					{
						label: "since",
						value: String(new Date(profile.joinedAt).getFullYear()),
					},
				],
				avatarUrl: profile.avatarUrl,
				icons: tools,
				accent: LIME,
			};
		}
		case "issue": {
			const slug =
				id ?? (await convex.query(api.newsletter.listSentIssues, {}))[0]?.slug;
			const issue = slug
				? await convex.query(api.newsletter.getSentIssue, { slug })
				: null;
			if (!issue) return fixtureIssue();
			return {
				key,
				path: `/news/${issue.slug}`,
				kicker: `NEWS · ISSUE #${issue.number}`,
				titleLines: wrapLines(issue.subject.toUpperCase(), 18, 3),
				sentence: issue.subject,
				description: issue.intro ?? "",
				stats: [
					{ label: "issue", value: `#${issue.number}` },
					{ label: "items", value: String(issue.items.length) },
					{
						label: "sent",
						value: issue.sentAt ? shortDate(issue.sentAt) : "draft",
					},
				],
				accent: LIME,
				range: issue.sentAt ? shortDate(issue.sentAt) : undefined,
			};
		}
		case "topic": {
			let slug = id;
			if (!slug) {
				const index = (await convex.query(api.knowledgeBase.getIndex, {})) as {
					topics?: Array<{ slug: string }>;
				};
				slug = index?.topics?.[0]?.slug;
			}
			const topic = slug
				? await convex.query(api.knowledgeBase.getTopic, { slug })
				: null;
			if (!topic) return fixtureTopic();
			return {
				key,
				path: `/news/topics/${topic.topic.slug}`,
				kicker: "NEWS · TOPIC",
				titleLines: wrapLines(topic.topic.name.toUpperCase(), 14, 3),
				sentence: topic.topic.name,
				description: `Published AI tooling news about ${topic.topic.name}, collected week by week.`,
				stats: [
					{ label: "items", value: String(topic.itemCount) },
					{ label: "cadence", value: "weekly" },
				],
				accent: LIME,
			};
		}
	}
}

// --- fixtures for an empty local database -----------------------------------

const fixtureStack = (): OgCard => ({
	key: "stack",
	path: "/stacks/fixture",
	kicker: "STACK · @fixture",
	titleLines: ["FIXTURE", "STACK"],
	sentence: "Fixture stack",
	description: "No public stack in the local database. Run sync-prod-db.sh.",
	stats: [
		{ label: "fixed / month", value: "$120+" },
		{ label: "tools", value: "6" },
		{ label: "team", value: "solo" },
	],
	icons: ["Claude Code", "Cursor", "Codex", "Vercel", "Convex", "Linear"].map(
		(name) => ({ name }),
	),
	accent: LIME,
});
const fixtureCreator = (): OgCard => ({
	key: "creator",
	path: "/@fixture",
	kicker: "BUILDER · @fixture",
	titleLines: ["FIXTURE", "BUILDER"],
	sentence: "Fixture builder",
	description: "No creator in the local database.",
	stats: [
		{ label: "stacks", value: "2" },
		{ label: "tools", value: "11" },
		{ label: "since", value: "2026" },
	],
	accent: LIME,
});
const fixtureIssue = (): OgCard => ({
	key: "issue",
	path: "/news/fixture",
	kicker: "NEWS · ISSUE #1",
	titleLines: ["FIXTURE ISSUE", "SUBJECT"],
	sentence: "Fixture issue subject",
	description: "No sent issue in the local database.",
	stats: [
		{ label: "issue", value: "#1" },
		{ label: "items", value: "12" },
		{ label: "sent", value: "Sep 1, 2026" },
	],
	accent: LIME,
});
const fixtureTopic = (): OgCard => ({
	key: "topic",
	path: "/news/topics/fixture",
	kicker: "NEWS · TOPIC",
	titleLines: ["FIXTURE", "TOPIC"],
	sentence: "Fixture topic",
	description: "No topic in the local database.",
	stats: [{ label: "items", value: "8" }],
	accent: LIME,
});
