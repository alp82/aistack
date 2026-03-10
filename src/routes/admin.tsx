import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ClipboardCheck, Mail } from "lucide-react";
import { useState } from "react";
import { AdminReviewTab } from "@/components/admin/AdminReviewTab";
import { AdminEmailTab } from "@/components/admin/AdminEmailTab";

export const Route = createFileRoute("/admin")({
	ssr: false,
	component: AdminPage,
	head: () => ({
		meta: [
			{
				title: "Admin - AI Stack",
			},
		],
	}),
});

type AdminTab = "review" | "email";

function AdminPage() {
	const isAdmin = useQuery(api.admin.checkIsAdmin);
	const [activeTab, setActiveTab] = useState<AdminTab>("review");

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
							onClick={() => setActiveTab("review")}
							className={`inline-flex items-center gap-2 border-b-2 px-6 py-4 font-mono text-sm font-semibold uppercase tracking-wide transition-colors -mb-[2px] ${
								activeTab === "review"
									? "border-accent-lime text-accent-lime"
									: "border-transparent text-fg-muted hover:text-fg-primary"
							}`}
						>
							<ClipboardCheck className="size-4" />
							Review
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("email")}
							className={`inline-flex items-center gap-2 border-b-2 px-6 py-4 font-mono text-sm font-semibold uppercase tracking-wide transition-colors -mb-[2px] ${
								activeTab === "email"
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
			{activeTab === "review" ? <AdminReviewTab /> : <AdminEmailTab />}
		</div>
	);
}
