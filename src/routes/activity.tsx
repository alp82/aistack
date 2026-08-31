import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useMemo, useRef, useState } from "react";
import { ActivityPage } from "@/features/activity/ActivityPage";
import type { FeedFilter } from "@/features/activity/feed";
import { seoMeta } from "@/lib/seo";
import { api } from "../../convex/_generated/api";

/**
 * `/activity` - the whole stream behind the landing band's "all activity"
 * button (#96), sibling of `/leaderboard`.
 *
 * The loader returns both reads, so the first HTML carries the band and the
 * first page of rows. The component upgrades to the live subscription once
 * mounted: new events arrive without a reload, and nothing reorders under the
 * reader.
 */

export const Route = createFileRoute("/activity")({
	component: Activity,
	loader: async ({ context }) => {
		const [band, stream] = await Promise.all([
			context.queryClient.ensureQueryData(
				convexQuery(api.activityFeed.band, {}),
			),
			context.queryClient.ensureQueryData(
				convexQuery(api.activityFeed.stream, {}),
			),
		]);
		return { band, stream };
	},
	head: () => ({
		meta: seoMeta({
			title: "Activity - Syncs, New Stacks and Changes as They Land",
			description:
				"Every sync, new stack and composition change across public AI stacks, newest first, with the measured tokens, sessions and projects of the last 24 hours.",
			url: "/activity",
			keywords:
				"AI stack activity, developer tool changes, measured usage, Claude Code, Codex",
		}),
	}),
});

function Activity() {
	const { band: loadedBand, stream: loadedStream } = Route.useLoaderData();
	const [filter, setFilter] = useState<FeedFilter>("all");
	const [limit, setLimit] = useState<number | undefined>(undefined);

	const band = useQuery(api.activityFeed.band, {}) ?? loadedBand;
	const live = useQuery(api.activityFeed.stream, {
		...(limit === undefined ? {} : { limit }),
		...(filter === "all" ? {} : { type: filter }),
	});
	// Hold the last answer while a chip or an "older" press is in flight, so the
	// stream does not blink through an empty list on the way to its next state.
	const held = useRef(loadedStream);
	if (live !== undefined) held.current = live;
	const stream = live ?? held.current;

	// One clock per mount: the day kickers must not disagree between rows.
	const nowMs = useMemo(() => Date.now(), []);

	return (
		<ActivityPage
			band={band}
			stream={stream}
			filter={filter}
			nowMs={nowMs}
			onFilter={(next) => {
				setFilter(next);
				setLimit(undefined);
			}}
			onOlder={() =>
				setLimit((current) => (current ?? stream.pageSize) + stream.pageSize)
			}
		/>
	);
}
