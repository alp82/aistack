/** Regenerate the homepage examples with the production renderer. No live data. */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { renderStatsPng } from "../src/features/discord/server/render";
import {
	type RenderAnswer,
	renderRequestSchema,
} from "../src/features/discord/server/renderContract";

// Usage, model shares and paid subscriptions preserve the owner-approved
// homepage prototype fixtures. Codex is included as the fifth preview entry.
// These amounts are illustrative, not current vendor prices or real accounts.
const models = [
	["GPT-5.6 Sol", 45],
	["Claude Opus 5", 25],
	["Claude Fable 5.1", 12],
	["Claude Fable 5", 8],
	["GPT-6 Astra", 5],
	["GPT-5.4", 3],
	["Claude Sonnet 5", 2],
] as const;
const source = "synthetic-example-prices";
const icons = new Map<string, string>();
for (const brand of ["chatgpt", "claude", "cursor", "perplexity", "codex"]) {
	const bytes = await readFile(
		new URL(`../public/email/${brand}-logo.png`, import.meta.url),
	);
	icons.set(brand, `data:image/png;base64,${bytes.toString("base64")}`);
}
function answer(
	handle: string,
	totalTokens: number,
	usd: number,
	harnessShare: number,
	median: number,
): RenderAnswer {
	const modelShares =
		handle === "alice"
			? [30, 40, 20, 10, 0, 0, 0]
			: models.map(([, share]) => share);
	const selectedModels = models
		.map(([name], index) => [name, modelShares[index]] as const)
		.filter(([, share]) => share > 0);
	const rows: RenderAnswer["subscriptions"]["rows"] = [
		{
			id: "claude",
			name: "Claude Code",
			iconUrl: "claude",
			monthlyUSD: 120,
			state: "paid",
		},
		{
			id: "cursor",
			name: "Cursor",
			iconUrl: "cursor",
			monthlyUSD: 20,
			state: "paid",
		},
		{
			id: "chatgpt",
			name: "ChatGPT",
			iconUrl: "chatgpt",
			monthlyUSD: 10,
			state: "paid",
		},
		{
			id: "perplexity",
			name: "Perplexity",
			iconUrl: "perplexity",
			monthlyUSD: 5,
			state: "paid",
		},
		{
			id: "codex",
			name: "Codex",
			iconUrl: "codex",
			monthlyUSD: 0,
			state: "included",
		},
	];
	const usage: NonNullable<RenderAnswer["current"]["usage"]> = {
		dates: [
			"2026-09-06",
			"2026-09-07",
			"2026-09-08",
			"2026-09-09",
			"2026-09-10",
			"2026-09-11",
			"2026-09-12",
		],
		activeDays: 7,
		sessions: 42,
		projects: 4,
		totalTokens,
		cacheHitShare: 0.62,
		subagentShare: 0.18,
		models: selectedModels.map(([name, share]) => ({
			id: name,
			catalogSlug: null,
			catalogName: name,
			tokens: {
				input: (totalTokens * share) / 100,
				output: 0,
				cacheWrite: 0,
				cacheRead: 0,
			},
			totalTokens: (totalTokens * share) / 100,
			tokenShare: share / 100,
			usd: (usd * share) / 100,
			estimated: true,
			pricingTables: [source],
		})),
		harnesses: [
			{
				harness: "claude-code",
				sessions: 30,
				totalTokens: totalTokens * harnessShare,
				tokenShare: harnessShare,
			},
			{
				harness: "codex",
				sessions: 12,
				totalTokens: totalTokens * (1 - harnessShare),
				tokenShare: 1 - harnessShare,
			},
		],
		cost: { usd, estimated: true, pricedShare: 1, pricingTables: [source] },
		excludedTokens: { unpriced: 0, synthetic: 0 },
	};
	return {
		identity: {
			creatorId: handle,
			stackId: handle,
			handle: `${handle}-example`,
			name: `${handle} (example)`,
			avatarUrl: null,
			profileUrl: "https://aistack.to",
			stackName: "Synthetic example stack",
			stackUrl: "https://aistack.to",
		},
		range: {
			endDate: "2026-09-12",
			days: 7,
			current: { from: "2026-09-06", to: "2026-09-12" },
			previous: { from: "2026-08-30", to: "2026-09-05" },
		},
		current: {
			usage,
			modelIds: selectedModels
				.filter(([, share]) => share >= 5)
				.map(([name]) => name),
			hasMoreModels: selectedModels.some(([, share]) => share < 5),
			context: [
				{
					harness: "claude-code",
					window: 200000,
					calls: 1000,
					medianCall: median,
					p90Call: 120000,
					harnessTokens: 12000,
					instructionsTokens: 8000,
					usualChat: median - 20000,
					longChat: 100000,
					compactions: 4,
				},
			],
		},
		previous: { usage: null, context: [], modelIds: [], hasMoreModels: false },
		subscriptions: { monthlyUSD: 155, rows, preview: rows, hasMore: false },
		icons: [
			...models.map(([name]) => ({
				kind: "model" as const,
				id: name,
				name,
				iconUrl: name.startsWith("GPT") ? "chatgpt" : "claude",
			})),
			{
				kind: "harness",
				id: "claude-code",
				name: "Claude Code",
				iconUrl: "claude",
			},
			{ kind: "harness", id: "codex", name: "Codex", iconUrl: "codex" },
		],
		selectedContextHarness: "claude-code",
		selectedTokenHarness: "claude-code",
		publishCost: true,
		publishWorkflow: true,
	};
}
const subject = answer("you", 12_400_000, 42, 0.7, 64000);
const comparison = answer("alice", 9_100_000, 34, 0.55, 48000);
// The comparison fixtures only need tokens, usage cost and model mix.
const output = new URL(
	"../src/features/landing/sections/discord-guide-images/",
	import.meta.url,
);
await mkdir(output, { recursive: true });
for (const command of [
	"tokens",
	"cost",
	"context",
	"harness",
	"compare",
] as const) {
	const request = renderRequestSchema.parse({
		version: 1,
		command,
		full: false,
		subject,
		comparison: command === "compare" ? comparison : null,
	});
	await writeFile(
		new URL(`${command}.png`, output),
		await renderStatsPng(request, icons),
	);
}
