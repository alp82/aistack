import { ArrowLeft, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ConfirmDeleteRow } from "../ConfirmDeleteRow";

type PickerEntryCardProps = {
	name: string;
	subtitle?: string;
	icon: ReactNode;
	onClick?: () => void;
	onInsertClick?: () => void;
	onRemove: () => void;
	onEditClick?: () => void;
	isExpanded?: boolean;
	isHighlighted?: boolean;
	actions?: ReactNode;
	expandedContent?: ReactNode;
	cardRef?: React.RefObject<HTMLDivElement | null>;
};

export function PickerEntryCard({
	name,
	subtitle,
	icon,
	onClick,
	onInsertClick,
	onRemove,
	onEditClick,
	isExpanded = false,
	isHighlighted = false,
	actions,
	expandedContent,
	cardRef,
}: PickerEntryCardProps) {
	const [showConfirmDelete, setShowConfirmDelete] = useState(false);

	const handleConfirmDelete = () => {
		setShowConfirmDelete(false);
		onRemove();
	};

	return (
		<div
			ref={cardRef}
			className={cn(
				"border bg-bg-panel transition-all",
				isHighlighted
					? "border-accent-lime ring-2 ring-accent-lime/30"
					: "border-stroke-subtle",
			)}
		>
			{/* Main Row */}
			<div className="flex items-center gap-0">
				{/* Insert into editor button */}
				{onInsertClick && (
					<button
						type="button"
						onClick={onInsertClick}
						className="group/insert flex items-center justify-center self-stretch w-8 shrink-0 border-r border-stroke-subtle text-fg-muted transition-colors hover:bg-accent-lime/10 hover:text-accent-lime cursor-copy"
						title="Insert in editor"
					>
						<ArrowLeft className="size-3.5 transition-transform group-hover/insert:-translate-x-0.5" />
					</button>
				)}

				{/* Clickable Icon + Name area — toggles edit */}
				<button
					type="button"
					onClick={onEditClick ?? onClick}
					className="group flex min-w-0 flex-1 items-center gap-3 rounded-sm p-3 text-left transition-all hover:bg-bg-panel-muted"
				>
					{/* Icon */}
					{icon}

					{/* Name & Subtitle */}
					<div className="min-w-0 flex-1">
						<p className="truncate font-mono text-xs font-semibold uppercase text-fg-primary group-hover:text-accent-lime transition-colors">
							{name}
						</p>
						{subtitle && (
							<span className="font-mono text-[10px] text-fg-muted">
								{subtitle}
							</span>
						)}
					</div>
				</button>

				{/* Custom actions slot */}
				{actions}

				{/* Remove */}
				<button
					type="button"
					onClick={() => setShowConfirmDelete(true)}
					className="flex size-7 items-center justify-center border border-stroke-subtle text-fg-muted transition-colors hover:border-destructive hover:text-destructive mr-3"
				>
					<Trash2 className="size-3.5" />
				</button>
			</div>

			{showConfirmDelete && (
				<ConfirmDeleteRow
					name={name}
					onConfirm={handleConfirmDelete}
					onCancel={() => setShowConfirmDelete(false)}
				/>
			)}

			{/* Expanded Content */}
			{isExpanded && expandedContent && (
				<div className="space-y-3 border-t-2 border-stroke-subtle bg-bg-panel-muted p-3">
					{expandedContent}
				</div>
			)}
		</div>
	);
}
