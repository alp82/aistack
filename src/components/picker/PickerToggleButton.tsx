import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PickerToggleButtonProps = {
	isOpen: boolean;
	onToggle: () => void;
	label: string;
	closeLabel?: string;
};

export function PickerToggleButton({
	isOpen,
	onToggle,
	label,
	closeLabel = "Close",
}: PickerToggleButtonProps) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className={cn(
				"flex w-full items-center justify-center gap-2 border-2 border-dashed p-3 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer",
				isOpen
					? "border-accent-lime bg-accent-lime/5 text-accent-lime"
					: "border-stroke-subtle text-fg-muted hover:border-fg-muted hover:text-fg-primary"
			)}
		>
			{isOpen ? (
				<>
					<X className="size-4" />
					{closeLabel}
				</>
			) : (
				<>
					<Plus className="size-4" />
					{label}
				</>
			)}
		</button>
	);
}
