import { type FunctionReference, getFunctionName } from "convex/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

// The visibility flag is read inside each loader, so a getter here lets one
// file drive both states. See `src/lib/newsVisibility.ts`.
const visibility = vi.hoisted(() => ({ isPublic: true }));
vi.mock("@/lib/newsVisibility", () => ({
	get NEWS_IS_PUBLIC() {
		return visibility.isPublic;
	},
}));

const { Route: NewsIndexRoute } = await import("../news.index");
const { Route: NewsTopicRoute } = await import("../news.topics.$slug");
const { Route: NewsIssueRoute } = await import("../news.$slug");
const { Route: SubscribeRoute } = await import("../subscribe");

type Loader = (input: unknown) => Promise<unknown>;

const loaderOf = (route: { options: { loader?: unknown } }): Loader =>
	route.options.loader as unknown as Loader;

beforeEach(() => {
	visibility.isPublic = true;
});

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

		const result = await loaderOf(NewsIndexRoute)({
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

		const result = await loaderOf(NewsTopicRoute)({
			context: { queryClient: { ensureQueryData } },
			params: { slug: "agents" },
		});

		expect(name).toBe("knowledgeBase:getTopic");
		expect(args).toEqual({ slug: "agents" });
		expect(result).toEqual({ topic });
	});
});

/**
 * The surfaces are closed until the first send (#207, map #198).
 *
 * The gate has to sit in the LOADER, not the component: a component-level
 * redirect still server-renders the page into the first HTML, which anyone can
 * read. So each test asserts BOTH that the loader 404s and that it never
 * reached the query client.
 */
describe("the news surfaces while NEWS_IS_PUBLIC is false", () => {
	const closedRoutes: Array<
		[string, { options: { loader?: unknown } }, unknown]
	> = [
		["/news", NewsIndexRoute, {}],
		["/news/topics/$slug", NewsTopicRoute, { params: { slug: "agents" } }],
		["/news/$slug", NewsIssueRoute, { params: { slug: "issue-1" } }],
		["/subscribe", SubscribeRoute, {}],
	];

	test.each(closedRoutes)(
		"%s answers 404 and reads nothing",
		async (_path, route, extra) => {
			visibility.isPublic = false;
			const ensureQueryData = vi.fn(async () => ({}));

			await expect(
				loaderOf(route)({
					context: { queryClient: { ensureQueryData } },
					...(extra as object),
				}),
			).rejects.toMatchObject({ isNotFound: true });

			expect(ensureQueryData).not.toHaveBeenCalled();
		},
	);
});
