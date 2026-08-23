import { type FunctionReference, getFunctionName } from "convex/server";
import { describe, expect, test, vi } from "vitest";
import { Route as NewsIndexRoute } from "../news.index";
import { Route as NewsTopicRoute } from "../news.topics.$slug";

describe("the news route loaders", () => {
	test("the news index server-loads both public projections", async () => {
		const names: string[] = [];
		const ensureQueryData = vi.fn(
			async (options: {
				queryKey: readonly [unknown, FunctionReference<"query">, unknown?];
			}) => {
				const name = getFunctionName(options.queryKey[1]);
				names.push(name);
				return name.endsWith("getIndex") ? { latest: [], topics: [] } : [];
			},
		);
		const loader = NewsIndexRoute.options.loader as unknown as (
			input: unknown,
		) => Promise<unknown>;

		const result = await loader({
			context: { queryClient: { ensureQueryData } },
		});

		expect(names).toEqual([
			"newsletter:listSentIssues",
			"knowledgeBase:getIndex",
		]);
		expect(result).toEqual({
			issues: [],
			knowledgeBase: { latest: [], topics: [] },
		});
	});

	test("a topic page server-loads the named public topic", async () => {
		let name = "";
		let args: unknown;
		const topic = {
			topic: { name: "Agents", slug: "agents" },
			itemCount: 0,
			thinReleases: [],
			entries: [],
		};
		const ensureQueryData = vi.fn(
			async (options: {
				queryKey: readonly [unknown, FunctionReference<"query">, unknown?];
			}) => {
				name = getFunctionName(options.queryKey[1]);
				args = options.queryKey[2];
				return topic;
			},
		);
		const loader = NewsTopicRoute.options.loader as unknown as (
			input: unknown,
		) => Promise<unknown>;

		const result = await loader({
			context: { queryClient: { ensureQueryData } },
			params: { slug: "agents" },
		});

		expect(name).toBe("knowledgeBase:getTopic");
		expect(args).toEqual({ slug: "agents" });
		expect(result).toEqual({ topic });
	});
});
