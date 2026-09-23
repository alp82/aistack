import { useConvexAuth } from "@convex-dev/react-query";
import {
	createFileRoute,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { TokenEfficiencyPage } from "@/features/efficiency/TokenEfficiency";
import { seoMeta } from "@/lib/seo";

/**
 * `/settings/token-efficiency` - the owner-private token-efficiency findings.
 *
 * A sibling of Views and Machines. `workflow.getMyEfficiency` takes no target
 * and answers for the signed-in creator alone, so the privacy lives in the
 * query; this redirect only saves a signed-out visitor a blank page.
 */
export const Route = createFileRoute("/settings/token-efficiency")({
	ssr: false,
	component: SettingsTokenEfficiencyPage,
	head: () => ({
		meta: seoMeta({
			title: "Token efficiency - AI Stack",
			description:
				"Where your syncs say tokens go to waste, and what to change.",
			noindex: true,
		}),
	}),
});

function SettingsTokenEfficiencyPage() {
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

	return <TokenEfficiencyPage />;
}
