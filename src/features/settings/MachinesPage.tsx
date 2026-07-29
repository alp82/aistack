import { useMutation, useQuery } from "convex/react";
import { Laptop, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
	CLI_SCOPE_LABELS,
	type CliTokenScope,
} from "../../../convex/lib/cliScopes";

/**
 * Linked machines — the revoke surface (#49).
 *
 * ACCOUNT-scoped, not stack-scoped, and that is the reason it is its own page
 * rather than a section on `/stacks/{slug}/changes`. `approveSession` allows a
 * machine to link without picking a stack, so a per-stack list would leave those
 * tokens with no page to appear on and therefore no way to revoke them — a
 * revoke surface with a class of unrevokeable credentials is not one.
 *
 * Revoking DELETES the row. There is no revoked state to render, because a
 * revoked-but-present row can be resurrected by a bug and nothing here reads an
 * audit trail.
 */

const DAY = 24 * 60 * 60 * 1000;

/**
 * Plain-language recency, in the vocabulary #39 locked for the reconcile page.
 * Nothing here reads like a log line.
 */
export function relativeDay(ts: number, now: number): string {
	const days = Math.floor((now - ts) / DAY);
	if (days <= 0) return "today";
	if (days === 1) return "yesterday";
	if (days < 30) return `${days} days ago`;
	if (days < 60) return "last month";
	return `${Math.floor(days / 30)} months ago`;
}

/**
 * The expiry line.
 *
 * The 90-day TTL SLIDES — every successful request pushes it out — so for a
 * machine in regular use this date never arrives. Saying "expires in 90 days"
 * would therefore be a promise the system does not keep, which is exactly why
 * revoke exists. The copy says what is true instead.
 */
export function expiryLabel(expiresAt: number, now: number): string {
	if (expiresAt <= now) return "Expired";
	const days = Math.ceil((expiresAt - now) / DAY);
	return `Stops working ${days} days after its last use`;
}

/**
 * What this machine may do, in plain words (#52).
 *
 * Every token is minted with both scopes today, so this line reads the same on
 * every row — and it is still worth printing, because the page tells the user
 * what a machine can reach and "everything the CLI does" is the honest answer
 * rather than an absent one.
 */
export function scopeLine(scopes: CliTokenScope[]): string {
	const labels = scopes.map((s) => CLI_SCOPE_LABELS[s]).filter(Boolean);
	if (labels.length === 0) return "Cannot do anything — revoke it";
	if (labels.length === 1) return `Can ${labels[0]}`;
	return `Can ${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
}

interface MachineRow {
	_id: Id<"cliTokens">;
	name?: string;
	createdAt: number;
	lastUsedAt: number;
	expiresAt: number;
	stack: { name: string; slug: string } | null;
	scopes: CliTokenScope[];
}

export function MachinesPage() {
	const machines = useQuery(api.cliTokens.listByUser);
	const revoke = useMutation(api.cliTokens.revokeToken);
	const [pending, setPending] = useState<MachineRow | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const now = Date.now();

	const handleRevoke = async () => {
		if (!pending) return;
		setBusy(true);
		setError(null);
		try {
			await revoke({ id: pending._id });
			setPending(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not revoke");
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="mx-auto max-w-3xl px-6 py-12">
			<h1 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
				Linked machines
			</h1>
			<p className="mt-3 max-w-prose text-sm leading-relaxed text-fg-secondary">
				Every machine where you ran{" "}
				<code className="font-mono">aistack login</code>. Each one can read your
				stack and publish what it measured. Revoke one and it stops working
				straight away.
			</p>

			{error && (
				<p className="mt-6 border-2 border-destructive bg-destructive/10 p-3 font-mono text-xs text-fg-primary">
					{error}
				</p>
			)}

			{machines === undefined && (
				<p className="mt-8 font-mono text-sm text-fg-muted">Loading...</p>
			)}

			{machines?.length === 0 && (
				<div className="mt-8 border-2 border-stroke-strong bg-bg-panel p-6">
					<p className="font-mono text-sm text-fg-primary">
						No machines linked.
					</p>
					<p className="mt-2 text-sm text-fg-secondary">
						Run <code className="font-mono">npx @use-aistack/cli login</code> on
						a machine to link it.
					</p>
				</div>
			)}

			{machines && machines.length > 0 && (
				<ul className="mt-8 space-y-3">
					{machines.map((m) => (
						<li
							key={m._id}
							className="flex items-start gap-4 border-2 border-stroke-strong bg-bg-panel p-4"
						>
							<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-stroke-strong bg-bg-canvas">
								<Laptop className="size-4 text-fg-muted" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate font-mono text-sm font-bold text-fg-primary">
									{m.name ?? "Unnamed machine"}
								</p>
								<p className="mt-1 font-mono text-xs text-fg-muted">
									Linked {relativeDay(m.createdAt, now)} · last used{" "}
									{relativeDay(m.lastUsedAt, now)}
								</p>
								<p className="mt-1 font-mono text-xs text-fg-muted">
									{m.stack
										? `Publishes to ${m.stack.name}`
										: "Not linked to a stack — it cannot publish"}
								</p>
								<p className="mt-1 font-mono text-xs text-fg-muted">
									{scopeLine(m.scopes)}
								</p>
								<p className="mt-1 font-mono text-xs text-fg-muted">
									{expiryLabel(m.expiresAt, now)}
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								onClick={() => setPending(m)}
								className="shrink-0 font-mono text-xs font-bold uppercase tracking-wider"
							>
								<Trash2 className="size-3.5" />
								Revoke
							</Button>
						</li>
					))}
				</ul>
			)}

			<ConfirmDialog
				open={pending !== null}
				onClose={() => setPending(null)}
				onConfirm={handleRevoke}
				variant="danger"
				loading={busy}
				confirmLabel="Revoke"
				title={`Revoke ${pending?.name ?? "this machine"}?`}
				description={
					"That machine stops working immediately. Nothing it already published is removed. To link it again, run `aistack login` on it."
				}
			/>
		</div>
	);
}
