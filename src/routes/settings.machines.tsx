import { useConvexAuth } from "@convex-dev/react-query";
import {
	createFileRoute,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { MachinesPage } from "@/features/settings/MachinesPage";
import { seoMeta } from "@/lib/seo";

/**
 * `/settings/machines` — the revoke surface for CLI tokens (#49).
 *
 * The gate is plain authentication rather than an owner check on some other
 * document: `cliTokens.listByUser` is keyed on the signed-in identity, so the
 * query answers for exactly the caller and cannot be pointed at anyone else.
 */
export const Route = createFileRoute("/settings/machines")({
	ssr: false,
	component: SettingsMachinesPage,
	head: () => ({
		meta: seoMeta({
			title: "Linked machines - AI Stack",
			description: "Machines that can publish to your stacks.",
			noindex: true,
		}),
	}),
});

function SettingsMachinesPage() {
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

	return <MachinesPage />;
}
