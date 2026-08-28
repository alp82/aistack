import { useConvexAuth } from "@convex-dev/react-query";
import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { DiscordLinkPage } from "@/features/settings/DiscordLinkPage";
import { seoMeta } from "@/lib/seo";

type DiscordLinkSearch = {
	token?: string;
};

export const Route = createFileRoute("/link/discord")({
	ssr: false,
	component: DiscordLinkRoute,
	validateSearch: (search: Record<string, unknown>): DiscordLinkSearch => ({
		token: typeof search.token === "string" ? search.token : undefined,
	}),
	head: () => ({
		meta: seoMeta({
			title: "Discord account - AI Stack",
			description: "Link or remove your Discord account.",
			noindex: true,
		}),
	}),
});

function DiscordLinkRoute() {
	const navigate = useNavigate();
	const { token } = useSearch({ from: "/link/discord" });
	const { isAuthenticated, isLoading } = useConvexAuth();

	useEffect(() => {
		if (isLoading || isAuthenticated) return;
		const redirect = token
			? `/link/discord?token=${encodeURIComponent(token)}`
			: "/link/discord";
		navigate({ to: "/signin", search: { redirect } });
	}, [isLoading, isAuthenticated, navigate, token]);

	if (isLoading || !isAuthenticated) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="font-mono text-sm text-fg-muted">Loading...</div>
			</div>
		);
	}

	return <DiscordLinkPage token={token} />;
}
