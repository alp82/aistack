import { z } from "zod";

const text = z.string().max(2048);
const n = z.number().finite().nonnegative().max(1e18);
const share = n.max(1);
const list = <T extends z.ZodType>(item: T) => z.array(item).max(250);
const date = z.iso.date();
const tokens = z.strictObject({
	input: n,
	output: n,
	cacheWrite: n,
	cacheRead: n,
	cacheWriteTtl: z
		.strictObject({ fiveMinute: n, oneHour: n, unsplit: n })
		.optional(),
});
const usage = z.strictObject({
	dates: z.array(date).max(180),
	activeDays: n,
	sessions: n,
	projects: n,
	totalTokens: n,
	cacheHitShare: share,
	subagentShare: share,
	models: list(
		z.strictObject({
			id: text,
			catalogSlug: text.nullable(),
			catalogName: text.nullable(),
			tokens,
			totalTokens: n,
			tokenShare: share,
			usd: n.nullable(),
			estimated: z.boolean(),
			pricingTables: list(text),
		}),
	),
	harnesses: list(
		z.strictObject({
			harness: text,
			sessions: n,
			totalTokens: n,
			tokenShare: share,
		}),
	),
	cost: z
		.strictObject({
			usd: n,
			estimated: z.boolean(),
			pricedShare: share,
			pricingTables: list(text),
		})
		.nullable(),
	excludedTokens: z.strictObject({ unpriced: n, synthetic: n }),
});
const context = z.strictObject({
	harness: text,
	window: n.positive().nullable(),
	calls: n,
	medianCall: n,
	p90Call: n,
	harnessTokens: n,
	instructionsTokens: n,
	usualChat: n,
	longChat: n,
	compactions: n,
	breakdownAvailable: z.boolean().optional(),
	retainedCallsOnly: z.boolean().optional(),
});
const period = z.strictObject({
	usage: usage.nullable(),
	context: list(context),
	modelIds: list(text),
	hasMoreModels: z.boolean(),
});
const subscription = z.strictObject({
	id: text,
	name: text,
	iconUrl: text.nullable(),
	monthlyUSD: n,
	state: z.enum([
		"paid",
		"included",
		"sponsored",
		"usage-based",
		"free",
		"one-time",
	]),
});
export const renderAnswerSchema = z.strictObject({
	identity: z.strictObject({
		creatorId: text,
		stackId: text,
		handle: text,
		name: text,
		avatarUrl: text.nullable(),
		profileUrl: text,
		stackName: text,
		stackUrl: text,
	}),
	range: z.strictObject({
		endDate: date,
		days: z.number().int().min(1).max(180),
		current: z.strictObject({ from: date, to: date }),
		previous: z.strictObject({ from: date, to: date }),
	}),
	current: period,
	previous: period,
	subscriptions: z.strictObject({
		monthlyUSD: n,
		rows: list(subscription),
		preview: z.array(subscription).max(5),
		hasMore: z.boolean(),
	}),
	icons: list(
		z.strictObject({
			kind: z.enum(["model", "harness"]),
			id: text,
			name: text,
			iconUrl: text.nullable(),
		}),
	),
	selectedContextHarness: text.nullable(),
	selectedTokenHarness: text.nullable(),
	publishCost: z.boolean(),
	publishWorkflow: z.boolean(),
});
export const renderRequestSchema = z
	.strictObject({
		version: z.literal(1),
		command: z.enum(["tokens", "harness", "cost", "context", "compare"]),
		full: z.boolean(),
		subject: renderAnswerSchema,
		comparison: renderAnswerSchema.nullable(),
	})
	.refine(
		({ subject: a, comparison: b }) =>
			!b || JSON.stringify(a.range) === JSON.stringify(b.range),
		"Comparison dates must match",
	);
export type RenderAnswer = z.infer<typeof renderAnswerSchema>;
export type RenderRequest = z.infer<typeof renderRequestSchema>;
