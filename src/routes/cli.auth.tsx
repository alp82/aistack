import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useConvexAuth, useMutation } from "convex/react";
import { CheckCircle, Terminal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { seoMeta } from "@/lib/seo";
import { api } from "../../convex/_generated/api";

type CliAuthSearch = {
	code?: string;
};

export const Route = createFileRoute("/cli/auth")({
	component: CliAuthPage,
	validateSearch: (search: Record<string, unknown>): CliAuthSearch => ({
		code: typeof search.code === "string" ? search.code : undefined,
	}),
	head: () => ({
		meta: seoMeta({
			title: "CLI Authentication - AI Stack",
			description: "Authorize the AI Stack CLI to access your account.",
			noindex: true,
		}),
	}),
});

function CliAuthPage() {
	const navigate = useNavigate();
	const { code } = useSearch({ from: "/cli/auth" });
	const { isAuthenticated, isLoading } = useConvexAuth();
	const approveSession = useMutation(api.cliSessions.approveSession);
	const [status, setStatus] = useState<
		"idle" | "approving" | "approved" | "denied" | "error"
	>("idle");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			navigate({
				to: "/signin",
				search: { redirect: `/cli/auth?code=${code}` },
			});
		}
	}, [isAuthenticated, isLoading, code, navigate]);

	const handleApprove = async () => {
		if (!code) return;
		setStatus("approving");
		try {
			await approveSession({ userCode: code });
			setStatus("approved");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to approve");
			setStatus("error");
		}
	};

	const handleDeny = () => {
		setStatus("denied");
	};

	if (!code) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="text-center">
					<h1 className="mb-4 text-2xl font-bold text-fg-primary">
						Missing authorization code
					</h1>
					<p className="font-mono text-sm text-fg-muted">
						This page should be opened from the CLI.
					</p>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="font-mono text-sm text-fg-muted">Loading...</div>
			</div>
		);
	}

	return (
		<Dialog
			open
			onClose={() => navigate({ to: "/" })}
			title="CLI Authorization"
			titleIcon={
				<div className="flex size-8 items-center justify-center border border-accent-lime bg-accent-lime/10">
					<Terminal className="size-4 text-accent-lime" />
				</div>
			}
			size="sm"
		>
			{status === "idle" && (
				<>
					<p className="mb-4 text-sm text-fg-secondary">
						The AI Stack CLI is requesting access to your account. Verify this
						code matches what you see in your terminal:
					</p>

					<div className="mb-6 border-2 border-accent-lime bg-accent-lime/5 p-4 text-center">
						<span className="font-mono text-3xl font-black tracking-[0.3em] text-accent-lime">
							{code}
						</span>
					</div>

					<div className="flex gap-3">
						<Button
							type="button"
							onClick={handleApprove}
							className="flex-1 bg-accent-lime font-mono text-xs font-bold uppercase tracking-wider text-black hover:bg-accent-lime-strong"
						>
							Approve
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={handleDeny}
							className="flex-1 font-mono text-xs font-bold uppercase tracking-wider"
						>
							Deny
						</Button>
					</div>
				</>
			)}

			{status === "approving" && (
				<div className="py-4 text-center">
					<p className="font-mono text-sm text-fg-muted">Approving...</p>
				</div>
			)}

			{status === "approved" && (
				<div className="py-4 text-center">
					<CheckCircle className="mx-auto mb-3 size-12 text-accent-lime" />
					<p className="mb-2 font-mono text-lg font-bold text-fg-primary">
						Authorized
					</p>
					<p className="text-sm text-fg-secondary">
						You can close this tab and return to your terminal.
					</p>
				</div>
			)}

			{status === "denied" && (
				<div className="py-4 text-center">
					<X className="mx-auto mb-3 size-12 text-fg-muted" />
					<p className="mb-2 font-mono text-lg font-bold text-fg-primary">
						Denied
					</p>
					<p className="text-sm text-fg-secondary">
						Authorization was denied. The CLI session will expire.
					</p>
				</div>
			)}

			{status === "error" && (
				<div className="py-4 text-center">
					<X className="mx-auto mb-3 size-12 text-destructive" />
					<p className="mb-2 font-mono text-lg font-bold text-fg-primary">
						Error
					</p>
					<p className="text-sm text-fg-secondary">
						{error || "Something went wrong."}
					</p>
				</div>
			)}
		</Dialog>
	);
}
