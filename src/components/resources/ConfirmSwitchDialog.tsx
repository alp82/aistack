import { Dialog } from "@/components/ui/Dialog";

export interface ConfirmSwitchDialogProps {
	open: boolean;
	onClose: () => void;
	onSave: () => Promise<void> | void;
	onDiscard: () => void;
	saving?: boolean;
	fileName: string;
	message?: string;
}

export function ConfirmSwitchDialog({
	open,
	onClose,
	onSave,
	onDiscard,
	saving = false,
	fileName,
	message,
}: ConfirmSwitchDialogProps) {
	return (
		<Dialog open={open} onClose={onClose} title="// UNSAVED CHANGES" size="sm">
			<div className="space-y-4">
				<p className="font-mono text-xs text-fg-secondary">
					{message ??
						`You have unsaved changes in ${fileName}. What would you like to do?`}
				</p>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
					<button
						type="button"
						onClick={onClose}
						className="px-3 py-2 font-mono text-xs uppercase tracking-wider text-fg-muted transition-colors hover:text-fg-primary cursor-pointer"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onDiscard}
						className="border-2 border-destructive/60 px-4 py-2 font-mono text-xs uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
					>
						Discard
					</button>
					<button
						type="button"
						onClick={() => onSave()}
						disabled={saving}
						aria-busy={saving}
						className="border-2 border-accent-lime bg-accent-lime px-4 py-2 font-mono text-xs uppercase tracking-wider text-accent-lime-contrast transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
					>
						{saving ? "Saving..." : "Save"}
					</button>
				</div>
			</div>
		</Dialog>
	);
}
