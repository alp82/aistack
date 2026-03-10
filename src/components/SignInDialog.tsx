import { Link, useLocation } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Dialog } from "./ui/Dialog";

interface SignInDialogProps {
	isOpen: boolean;
	onClose: () => void;
	message?: string;
	redirectTo?: string;
}

export function SignInDialog({
	isOpen,
	onClose,
	message,
	redirectTo,
}: SignInDialogProps) {
	const location = useLocation();
	const redirect = redirectTo ?? location.pathname;

	return (
		<Dialog
			open={isOpen}
			onClose={onClose}
			size="sm"
			title="Sign In Required"
			titleIcon={<Lock className="size-5 text-accent-lime" />}
		>
			<p className="font-mono text-sm text-fg-secondary mb-6">
				{message ||
					"Please sign in to publish your stack and save it to the server."}
			</p>

			<div className="flex flex-col gap-3">
				<Link to="/signin" search={{ redirect }} className="w-full">
					<button
						type="button"
						className="w-full border-2 border-accent-lime bg-accent-lime px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong"
					>
						Sign In
					</button>
				</Link>
				<button
					type="button"
					onClick={onClose}
					className="w-full border-2 border-stroke-subtle px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-fg-muted transition-colors hover:border-fg-muted hover:text-fg-primary"
				>
					Continue Editing
				</button>
			</div>
		</Dialog>
	);
}
