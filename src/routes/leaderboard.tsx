import { convexQuery } from "@convex-dev/react-query";
import {
	createFileRoute,
	stripSearchParams,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useMemo } from "react";
import {
	leaderboardJsonLd,
	serializeJsonLd,
} from "@/features/leaderboard/jsonLd";
import { LeaderboardPage } from "@/features/leaderboard/LeaderboardPage";
import { coercePage } from "@/lib/searchParams";
import { seoMeta } from "@/lib/seo";
import { api } from "../../convex/_generated/api";

const DEFAULTS = { page: 1 };

export const Route = createFileRoute("/leaderboard")({
	component: Leaderboard,
	// Every key optional, or `search` becomes required on every Link in the app.
	validateSearch: (search: Record<string, unknown>): { page?: number } => ({
		page: coercePage(search.page),
	}),
	search: { middlewares: [stripSearchParams(DEFAULTS)] },
	loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.leaderboard.get, { page: deps.page }),
		);
	},
	head: () => ({
		meta: seoMeta({
			title: "AI Coding Leaderboard - Measured Stacks Ranked by Token Volume",
			description:
				"Published AI coding stacks ranked by measured token volume over the last 30 days — counted on each builder's own machine, with model shares, harnesses and lower-bound API-equivalent spend.",
			url: "/leaderboard",
			keywords:
				"AI leaderboard, AI coding stats, token usage, AI spend, Claude Code, Codex, measured stacks",
		}),
	}),
});

function Leaderboard() {
	const navigate = useNavigate({ from: "/leaderboard" });
	const { page: rawPage } = useSearch({ from: "/leaderboard" });
	const page = rawPage ?? DEFAULTS.page;
	const board = useQuery(api.leaderboard.get, { page });
	// One clock per mount: "synced Nd ago" must not drift between rows.
	const nowMs = useMemo(() => Date.now(), []);

	if (!board) return <div className="min-h-screen bg-bg-canvas" />;

	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: serialized with `<` escaped, so a hostile stack name stays data
				dangerouslySetInnerHTML={{
					__html: serializeJsonLd(leaderboardJsonLd(board)),
				}}
			/>
			<LeaderboardPage
				board={board}
				nowMs={nowMs}
				onPage={(p) =>
					navigate({
						to: "/leaderboard",
						search: { page: p },
					})
				}
			/>
		</>
	);
}
