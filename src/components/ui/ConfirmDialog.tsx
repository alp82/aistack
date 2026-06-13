import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { Dialog } from "./Dialog";

interface ConfirmDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	loading?: boolean;
	variant?: "danger" | "default";
}

export function ConfirmDialog({
	open,
	onClose,
	onConfirm,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	loading = false,
	variant = "default",
}: ConfirmDialogProps) {
	return (
		<Dialog open={open} onClose={onClose} size="sm">
			<div className="flex items-start gap-4">
				{variant === "danger" && (
					<div className="flex size-10 shrink-0 items-center justify-center border border-destructive/30 bg-destructive/10">
						<AlertTriangle className="size-5 text-destructive" />
					</div>
				)}
				<div className="min-w-0 flex-1">
					<h3 className="font-mono text-base font-bold text-fg-primary">
						{title}
					</h3>
					<p className="mt-2 text-sm text-fg-secondary">{description}</p>
				</div>
			</div>
			<div className="mt-6 flex gap-3 justify-end">
				<Button
					type="button"
					variant="outline"
					onClick={onClose}
					disabled={loading}
					className="font-mono text-xs font-bold uppercase tracking-wider"
				>
					{cancelLabel}
				</Button>
				<Button
					type="button"
					variant={variant === "danger" ? "destructive" : "default"}
					onClick={onConfirm}
					disabled={loading}
					className="font-mono text-xs font-bold uppercase tracking-wider"
				>
					{loading ? "..." : confirmLabel}
				</Button>
			</div>
		</Dialog>
	);
}
