import { describe, expect, test } from "vitest";
import { countsTotal, finalize } from "../shared/aggregate.js";
import {
	createAggregate,
	ingestContribution,
	sidecarContributions,
	terminalContribution,
} from "./analyzer.js";

const usage = (over: Record<string, unknown> = {}) => ({
	sessionId: "session",
	turns: [
		{
			endedAt: "2026-09-08T00:00:00Z",
			primaryModelId: "grok-4",
			inputTokens: 100,
			outputTokens: 20,
			modelUsage: {
				"grok-4": { inputTokens: 100, outputTokens: 20 },
				alias: { inputTokens: 10, outputTokens: 2 },
			},
			...over,
		},
	],
});

describe("Grok Build accounting", () => {
	test("uses sidecar turns once and preserves per-model usage", () => {
		const aggregate = createAggregate();
		for (const row of sidecarContributions(usage(), "/project"))
			ingestContribution(aggregate, row);
		const models = Object.fromEntries(
			finalize(aggregate).models.map((m) => [m.modelKey, m.totalTokens]),
		);
		expect(models).toEqual({ alias: 12, "grok-4": 120 });
	});

	test("keeps usable per-model data when a redundant turn total is malformed", () => {
		const rows = sidecarContributions(
			usage({ inputTokens: "broken" }),
			"/project",
		);
		expect(
			rows
				.flatMap((r) => r.models)
				.reduce((n, m) => n + countsTotal(m.counts), 0),
		).toBe(132);
	});

	test("tolerates incomplete flags and unknown fields", () => {
		expect(
			sidecarContributions(
				{ ...usage({ usageIsIncomplete: true }), futureField: true },
				"/project",
			),
		).toHaveLength(1);
	});

	test("normalizes seconds and milliseconds in terminal fallback", () => {
		const row = terminalContribution(
			{
				timestamp: 1_767_306_617,
				params: {
					sessionId: "s",
					update: {
						sessionUpdate: "turn_completed",
						usage: {
							modelUsage: {
								"unknown-model": { inputTokens: 10, outputTokens: 2 },
							},
						},
					},
				},
			},
			"/project",
		);
		expect(row?.tsMs).toBe(1_767_306_617_000);
		expect(row?.models[0]?.counts.input).toBe(10);
	});
});
