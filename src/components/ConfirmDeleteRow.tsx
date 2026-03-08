interface ConfirmDeleteRowProps {
	name: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDeleteRow({
	name,
	onConfirm,
	onCancel,
}: ConfirmDeleteRowProps) {
	return (
		<div className="border-t border-stroke-subtle bg-destructive/10 p-3">
			<p className="mb-2 font-mono text-xs text-fg-primary">Remove {name}?</p>
			<div className="flex gap-2">
				<button
					type="button"
					onClick={onConfirm}
					className="flex-1 border border-destructive bg-destructive/20 px-2 py-1 font-mono text-[10px] uppercase text-destructive hover:bg-destructive/30"
				>
					Remove
				</button>
				<button
					type="button"
					onClick={onCancel}
					className="flex-1 border border-stroke-subtle px-2 py-1 font-mono text-[10px] uppercase text-fg-muted hover:text-fg-primary"
				>
					Cancel
				</button>
			</div>
		</div>
	);
}
