import { FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashedAddButtonProps {
	onClick: () => void;
	label: string;
	icon?: React.ReactNode;
	/** "sm" for inline (card file rows), "md" for full-width (sidebar) */
	size?: "sm" | "md";
	pulse?: boolean;
}

export function DashedAddButton({
	onClick,
	label,
	icon,
	size = "sm",
	pulse = false,
}: DashedAddButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"border-2 border-dashed font-mono uppercase tracking-wider transition-all hover:border-accent-lime hover:text-accent-lime",
				size === "sm"
					? "inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs text-fg-muted border-stroke-subtle"
					: "flex w-full cursor-pointer items-center justify-center gap-2 py-3 text-xs text-fg-muted border-stroke-subtle bg-bg-panel",
				pulse &&
					"animate-pulse border-destructive/60 text-destructive/80 hover:border-destructive hover:text-destructive",
			)}
		>
			<Plus
				className={size === "sm" ? "size-3 shrink-0" : "size-3.5 shrink-0"}
			/>
			{icon}
			{label}
		</button>
	);
}

/** Convenience wrapper for "+ add file" */
export function AddFileButton({
	onClick,
	pulse = false,
	size = "sm",
}: {
	onClick: () => void;
	pulse?: boolean;
	size?: "sm" | "md";
}) {
	return (
		<DashedAddButton
			onClick={onClick}
			label="add file"
			icon={
				<FileText
					className={size === "sm" ? "size-3 shrink-0" : "size-3.5 shrink-0"}
				/>
			}
			size={size}
			pulse={pulse}
		/>
	);
}
