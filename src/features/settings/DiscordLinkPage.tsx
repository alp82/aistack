import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "../../../convex/_generated/api";

interface DiscordLinkPageProps {
	token?: string;
}

export function DiscordLinkPage({ token }: DiscordLinkPageProps) {
	const account = useQuery(api.discordLink.getMine, {});
	const updateAccount = useMutation(api.discordLink.updateMine);
	const [linkStatus, setLinkStatus] = useState<
		"idle" | "linking" | "linked" | "invalid" | "expired"
	>("idle");
	const [removeOpen, setRemoveOpen] = useState(false);
	const [removing, setRemoving] = useState(false);
	const [removed, setRemoved] = useState(false);
	const [removeError, setRemoveError] = useState<string | null>(null);
	const attemptedToken = useRef<string | null>(null);
	const canLink = account !== undefined && account !== null;

	useEffect(() => {
		if (!token || !canLink || attemptedToken.current === token) return;
		attemptedToken.current = token;
		setLinkStatus("linking");
		updateAccount({ operation: "link", token })
			.then((result) => {
				if (attemptedToken.current !== token) return;
				if (result.status === "linked") setLinkStatus("linked");
				else if (result.status === "expired") setLinkStatus("expired");
				else setLinkStatus("invalid");
			})
			.catch(() => {
				if (attemptedToken.current === token) setLinkStatus("invalid");
			});
	}, [canLink, token, updateAccount]);

	const linked =
		!removed && (linkStatus === "linked" || account?.linked === true);

	const handleRemove = async () => {
		setRemoving(true);
		setRemoveError(null);
		try {
			const result = await updateAccount({ operation: "remove" });
			if (result.status !== "removed") {
				throw new Error("Could not remove the link");
			}
			setRemoved(true);
			setRemoveOpen(false);
		} catch (error) {
			setRemoveError(
				error instanceof Error ? error.message : "Could not remove the link",
			);
		} finally {
			setRemoving(false);
		}
	};

	return (
		<div className="mx-auto max-w-2xl px-6 py-12">
			<h1 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
				Discord account
			</h1>
			<p className="mt-3 max-w-prose text-sm leading-relaxed text-fg-secondary">
				Link Discord to use your own stack with commands that omit the stack
				argument.
			</p>

			{account === undefined ? (
				<p className="mt-8 font-mono text-sm text-fg-muted">Loading...</p>
			) : null}

			{account === null ? (
				<div className="mt-8 border-2 border-stroke-strong bg-bg-panel p-6">
					<p className="font-mono text-sm text-fg-primary">
						Create a stack before linking Discord.
					</p>
					<p className="mt-2 text-sm text-fg-secondary">
						A creator profile gives Discord commands an account and a stack to
						find.
					</p>
				</div>
			) : null}

			{token && linkStatus === "linking" ? (
				<p className="mt-8 font-mono text-sm text-fg-muted">
					Linking Discord account...
				</p>
			) : null}

			{linked ? (
				<div className="mt-8 border-2 border-stroke-strong bg-bg-panel p-6">
					<p className="font-mono text-sm text-fg-primary">
						Discord account linked.
					</p>
					<p className="mt-2 text-sm text-fg-secondary">
						Commands without a stack argument can now use your account.
					</p>
					<Button
						type="button"
						variant="outline"
						onClick={() => setRemoveOpen(true)}
						className="mt-5 font-mono text-xs font-bold uppercase tracking-wider"
					>
						Remove
					</Button>
				</div>
			) : null}

			{removeError ? (
				<p className="mt-6 border-2 border-destructive bg-destructive/10 p-3 font-mono text-xs text-fg-primary">
					{removeError}
				</p>
			) : null}

			{linkStatus === "invalid" ? (
				<div className="mt-8 border-2 border-destructive bg-destructive/10 p-6">
					<p className="font-mono text-sm text-fg-primary">
						That Discord link is not valid.
					</p>
					<p className="mt-2 text-sm text-fg-secondary">
						The link may have been used already. Run{" "}
						<code className="font-mono">/link</code> again in Discord to get a
						new link.
					</p>
				</div>
			) : null}

			{linkStatus === "expired" ? (
				<div className="mt-8 border-2 border-destructive bg-destructive/10 p-6">
					<p className="font-mono text-sm text-fg-primary">
						That Discord link expired.
					</p>
					<p className="mt-2 text-sm text-fg-secondary">
						Links last 10 minutes. Run <code className="font-mono">/link</code>{" "}
						again in Discord to get a new link.
					</p>
				</div>
			) : null}

			{account && !linked && !token ? (
				<div className="mt-8 border-2 border-stroke-strong bg-bg-panel p-6">
					<p className="font-mono text-sm text-fg-primary">
						No Discord account linked.
					</p>
					<p className="mt-2 text-sm text-fg-secondary">
						Run <code className="font-mono">/link</code> in Discord, then open
						the private link that the command returns.
					</p>
				</div>
			) : null}

			<ConfirmDialog
				open={removeOpen}
				onClose={() => setRemoveOpen(false)}
				onConfirm={handleRemove}
				variant="danger"
				loading={removing}
				confirmLabel="Remove"
				title="Remove the Discord link?"
				description="Discord commands without a stack argument stop finding your account. You can link the account again with /link."
			/>
		</div>
	);
}
