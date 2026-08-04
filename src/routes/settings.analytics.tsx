import { useConvexAuth } from "@convex-dev/react-query";
import {
	createFileRoute,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { AnalyticsPage } from "@/features/settings/AnalyticsPage";
import { seoMeta } from "@/lib/seo";

/**
 * `/settings/analytics` — the owner-private view numbers (#86, map #76).
 *
 * `/settings` is where account-scoped surfaces already live, so this is a
 * sibling of `/settings/machines` rather than a new `/dashboard`. A dashboard
 * would promise a home for numbers the map keeps private and numbers it
 * publishes, and those two must not share a page.
 *
 * The gate here is plain authentication and nothing more. `viewAnalytics.mine`
 * takes no target argument and answers for the signed-in creator alone, so the
 * privacy lives in the query — this redirect only saves a signed-out visitor a
 * blank page.
 */
export const Route = createFileRoute("/settings/analytics")({
	ssr: false,
	component: SettingsAnalyticsPage,
	head: () => ({
		meta: seoMeta({
			title: "Views - AI Stack",
			description: "How often your profile and your stacks were opened.",
			noindex: true,
		}),
	}),
});

function SettingsAnalyticsPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const { isAuthenticated, isLoading } = useConvexAuth();

	useEffect(() => {
		if (isLoading || isAuthenticated) return;
		navigate({ to: "/signin", search: { redirect: location.pathname } });
	}, [isLoading, isAuthenticated, navigate, location.pathname]);

	if (isLoading || !isAuthenticated) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="font-mono text-sm text-fg-muted">Loading...</div>
			</div>
		);
	}

	return <AnalyticsPage />;
}
