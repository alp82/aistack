import { cn } from "@/lib/utils";

export function EditorModeToggle({
	previewMode,
	onToggle,
}: {
	previewMode: boolean;
	onToggle: (preview: boolean) => void;
}) {
	return (
		<div className="flex">
			<button
				type="button"
				onClick={() => onToggle(false)}
				className={cn(
					"px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
					!previewMode
						? "border-b-2 border-accent-lime text-accent-lime bg-bg-panel"
						: "text-fg-muted hover:text-fg-primary hover:bg-bg-panel-muted",
				)}
			>
				Edit
			</button>
			<button
				type="button"
				onClick={() => onToggle(true)}
				className={cn(
					"px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
					previewMode
						? "border-b-2 border-accent-lime text-accent-lime bg-bg-panel"
						: "text-fg-muted hover:text-fg-primary hover:bg-bg-panel-muted",
				)}
			>
				Preview
			</button>
		</div>
	);
}
