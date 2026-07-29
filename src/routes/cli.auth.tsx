import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { CheckCircle, Terminal, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/Dialog";
import { seoMeta } from "@/lib/seo";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

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
	const myStacks = useQuery(api.stacks.listMine, isAuthenticated ? {} : "skip");
	const [status, setStatus] = useState<
		"idle" | "approving" | "approved" | "denied" | "error"
	>("idle");
	const [error, setError] = useState<string | null>(null);
	const [selectedStackId, setSelectedStackId] = useState<string | null>(null);

	/**
	 * What to call this machine on `/settings/machines` (#49).
	 *
	 * The CLI proposes its hostname; this field is where the user sees that
	 * string and gets the final say. `null` means "not prefilled yet" and is
	 * distinct from `""`, which means the user deliberately cleared it — without
	 * that distinction the prefill effect would keep refilling a field the user
	 * just emptied.
	 */
	const pending = useQuery(
		api.cliSessions.getPendingMachineName,
		isAuthenticated && code ? { userCode: code } : "skip",
	);
	const [machineName, setMachineName] = useState<string | null>(null);
	const machineNameId = useId();
	const proposedName = pending?.machineName;
	useEffect(() => {
		if (proposedName && machineName === null) setMachineName(proposedName);
	}, [proposedName, machineName]);

	/**
	 * The measured layer's destination is bound to the token at link time (#33
	 * decision 7), so this is the one moment the user is asked. Auto-selected
	 * when there is exactly one stack — the common case, and a one-option
	 * dropdown is a question with no information in it.
	 */
	const stacks = myStacks ?? [];
	const soleStackId = useMemo(
		() => (stacks.length === 1 ? stacks[0]._id : null),
		[stacks],
	);
	useEffect(() => {
		if (soleStackId && selectedStackId === null)
			setSelectedStackId(soleStackId);
	}, [soleStackId, selectedStackId]);

	const stacksLoading = isAuthenticated && myStacks === undefined;
	const hasStacks = stacks.length > 0;
	// A profile with no stack can still authorize the CLI for its other commands;
	// the token simply carries no sync target until it is re-linked.
	const canApprove = !stacksLoading && (!hasStacks || selectedStackId !== null);

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
			const trimmed = (machineName ?? "").trim();
			await approveSession({
				userCode: code,
				stackId: (selectedStackId as Id<"stacks"> | null) ?? undefined,
				machineName: trimmed.length > 0 ? trimmed : undefined,
			});
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

					<div className="mb-6">
						<label
							htmlFor={machineNameId}
							className="mb-2 block font-mono text-[0.7rem] font-bold uppercase tracking-wider text-fg-muted"
						>
							Name this machine
						</label>
						<input
							id={machineNameId}
							type="text"
							maxLength={64}
							value={machineName ?? ""}
							onChange={(e) => setMachineName(e.target.value)}
							placeholder="work laptop"
							className="w-full border border-border-subtle bg-bg-subtle p-3 font-mono text-sm text-fg-primary placeholder:text-fg-muted"
						/>
						<p className="mt-2 font-mono text-[0.7rem] leading-relaxed text-fg-muted">
							Only you ever see this. It is how you tell your machines apart
							when you revoke one.
						</p>
					</div>

					{stacksLoading && (
						<p className="mb-6 font-mono text-xs text-fg-muted">
							Loading your stacks…
						</p>
					)}

					{!stacksLoading && hasStacks && (
						<div className="mb-6">
							<label
								htmlFor="sync-stack"
								className="mb-2 block font-mono text-[0.7rem] font-bold uppercase tracking-wider text-fg-muted"
							>
								Sync usage data to
							</label>
							{stacks.length === 1 ? (
								<div className="border border-border-subtle bg-bg-subtle p-3">
									<span className="font-mono text-sm text-fg-primary">
										{stacks[0].name}
									</span>
								</div>
							) : (
								<select
									id="sync-stack"
									value={selectedStackId ?? ""}
									onChange={(e) => setSelectedStackId(e.target.value || null)}
									className="w-full border border-border-subtle bg-bg-subtle p-3 font-mono text-sm text-fg-primary"
								>
									<option value="">Select a stack…</option>
									{stacks.map((s) => (
										<option key={s._id} value={s._id}>
											{s.name}
											{s.published ? "" : " (draft)"}
										</option>
									))}
								</select>
							)}
							<p className="mt-2 font-mono text-[0.7rem] leading-relaxed text-fg-muted">
								This machine will only ever sync to the stack you pick here.
								Re-run login to change it.
							</p>
						</div>
					)}

					{!stacksLoading && !hasStacks && (
						<p className="mb-6 font-mono text-[0.7rem] leading-relaxed text-fg-muted">
							You have no stacks yet, so this machine will authorize without a
							sync target. Create a stack and run login again to enable usage
							sync.
						</p>
					)}

					<div className="flex gap-3">
						<Button
							type="button"
							onClick={handleApprove}
							disabled={!canApprove}
							className="flex-1 bg-accent-lime font-mono text-xs font-bold uppercase tracking-wider text-black hover:bg-accent-lime-strong disabled:opacity-50"
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
