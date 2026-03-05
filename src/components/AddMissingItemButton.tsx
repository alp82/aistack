import { Plus } from "lucide-react";

interface AddMissingItemButtonProps {
	label: string;
	guestLabel?: string;
	guestSession?: boolean;
	onSignInRequired?: () => void;
	onAdd: () => void;
}

export function AddMissingItemButton({
	label,
	guestLabel,
	guestSession = false,
	onSignInRequired,
	onAdd,
}: AddMissingItemButtonProps) {
	const isGuest = guestSession && guestLabel;

	return (
		<button
			type="button"
			onClick={() => {
				if (isGuest && onSignInRequired) {
					onSignInRequired();
				} else {
					onAdd();
				}
			}}
			className="group flex w-full items-center gap-3 border border-dashed border-stroke-subtle bg-fg-muted/5 px-3 py-2.5 text-left transition-all hover:border-accent-lime hover:bg-accent-lime/5 cursor-pointer"
		>
			<span className="flex size-6 shrink-0 items-center justify-center border border-stroke-subtle text-fg-muted transition-colors group-hover:border-accent-lime group-hover:text-accent-lime">
				<Plus className="size-3" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-muted transition-colors group-hover:text-accent-lime">
					{isGuest ? guestLabel : label}
				</span>
				{!isGuest && (
					<span className="block font-mono text-[9px] text-fg-muted/60">
						Submit a new entry to the database
					</span>
				)}
			</span>
		</button>
	);
}
