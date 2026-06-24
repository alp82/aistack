import {
	createFileRoute,
	Navigate,
	stripSearchParams,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ClipboardCheck, Flag, Mail } from "lucide-react";
import { useMemo } from "react";
import {
	AdminEmailTab,
	type EmailSubTab,
} from "@/components/admin/AdminEmailTab";
import { AdminQualityTab } from "@/components/admin/AdminQualityTab";
import { AdminReviewTab } from "@/components/admin/AdminReviewTab";
import { coerceEnum } from "@/lib/searchParams";
import { seoMeta } from "@/lib/seo";
import { api } from "../../convex/_generated/api";

type AdminTab = "review" | "quality" | "email";

export const ADMIN_SEARCH_DEFAULTS = {
	tab: "review" as AdminTab,
	view: "templates" as EmailSubTab,
};

export const Route = createFileRoute("/admin")({
	ssr: false,
	component: AdminPage,
	validateSearch: (
		search: Record<string, unknown>,
	): { tab?: AdminTab; view?: EmailSubTab } => ({
		tab: coerceEnum(
			search.tab,
			["review", "quality", "email"] as const,
			"review",
		),
		view: coerceEnum(
			search.view,
			["templates", "broadcasts"] as const,
			"templates",
		),
	}),
	search: { middlewares: [stripSearchParams(ADMIN_SEARCH_DEFAULTS)] },
	head: () => ({
		meta: seoMeta({
			title: "Admin - AI Stack",
			description: "AI Stack admin dashboard.",
			noindex: true,
		}),
	}),
});

function AdminPage() {
	const isAdmin = useQuery(api.admin.checkIsAdmin);
	const reviewCount = useQuery(api.admin.getReviewTabCount);
	const qualityCount = useQuery(api.admin.getQualityTabCount);
	const navigate = useNavigate({ from: "/admin" });
	const { tab: rawTab, view: rawView } = useSearch({ from: "/admin" });
	const tab = rawTab ?? ADMIN_SEARCH_DEFAULTS.tab;
	const view = rawView ?? ADMIN_SEARCH_DEFAULTS.view;
	const setSearch = useMemo(
		() => (patch: Partial<typeof ADMIN_SEARCH_DEFAULTS>) =>
			navigate({
				search: (prev) => ({ ...prev, ...patch }),
				replace: true,
			}),
		[navigate],
	);

	if (isAdmin === undefined) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="font-mono text-sm text-fg-muted">Loading...</div>
			</div>
		);
	}

	if (!isAdmin) {
		return <Navigate to="/" />;
	}

	return (
		<div className="min-h-screen bg-bg-canvas">
			{/* Tab Navigation */}
			<div className="border-b-2 border-stroke-strong bg-bg-panel">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() =>
								setSearch({ tab: "review", view: ADMIN_SEARCH_DEFAULTS.view })
							}
							className={`inline-flex items-center gap-2 border-b-2 px-6 py-4 font-mono text-sm font-semibold uppercase tracking-wide transition-colors -mb-[2px] ${
								tab === "review"
									? "border-accent-lime text-accent-lime"
									: "border-transparent text-fg-muted hover:text-fg-primary"
							}`}
						>
							<ClipboardCheck className="size-4" />
							Review
							{reviewCount ? (
								<span className="inline-flex h-5 min-w-5 items-center justify-center bg-accent-lime px-1 font-mono text-xs font-bold text-bg-canvas">
									{reviewCount}
								</span>
							) : null}
						</button>
						<button
							type="button"
							onClick={() =>
								setSearch({ tab: "quality", view: ADMIN_SEARCH_DEFAULTS.view })
							}
							className={`inline-flex items-center gap-2 border-b-2 px-6 py-4 font-mono text-sm font-semibold uppercase tracking-wide transition-colors -mb-[2px] ${
								tab === "quality"
									? "border-accent-lime text-accent-lime"
									: "border-transparent text-fg-muted hover:text-fg-primary"
							}`}
						>
							<Flag className="size-4" />
							Quality
							{qualityCount ? (
								<span className="inline-flex h-5 min-w-5 items-center justify-center bg-accent-lime px-1 font-mono text-xs font-bold text-bg-canvas">
									{qualityCount}
								</span>
							) : null}
						</button>
						<button
							type="button"
							onClick={() => setSearch({ tab: "email" })}
							className={`inline-flex items-center gap-2 border-b-2 px-6 py-4 font-mono text-sm font-semibold uppercase tracking-wide transition-colors -mb-[2px] ${
								tab === "email"
									? "border-accent-lime text-accent-lime"
									: "border-transparent text-fg-muted hover:text-fg-primary"
							}`}
						>
							<Mail className="size-4" />
							Email
						</button>
					</div>
				</div>
			</div>

			{/* Tab Content */}
			{tab === "review" && <AdminReviewTab />}
			{tab === "quality" && <AdminQualityTab />}
			{tab === "email" && (
				<AdminEmailTab
					view={view}
					onViewChange={(v) => setSearch({ view: v })}
				/>
			)}
		</div>
	);
}
