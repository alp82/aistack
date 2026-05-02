import { ArrowRight, Maximize2, Minimize2 } from "lucide-react";
import type { ReactNode } from "react";
import HoverCard from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

export interface EntityPillColors {
	border: string;
	bg: string;
	hoverBg: string;
	hoverText: string;
}

interface EntityPillProps {
	name: string;
	icon?: ReactNode;
	colors: EntityPillColors;
	onNameClick?: () => void;
	/** Arrow button — scrolls to the card (for references) */
	onLocate?: () => void;
	/** Expand button — expands reference to card (shown when no card exists) */
	onExpand?: () => void;
	/** Collapse button — collapses card to inline reference */
	onCollapse?: () => void;
	tooltipContent?: () => ReactNode;
	onNameHoverStart?: () => void;
	onNameHoverEnd?: () => void;
}

export function EntityPill({
	name,
	icon,
	colors,
	onNameClick,
	onLocate,
	onExpand,
	onCollapse,
	tooltipContent,
	onNameHoverStart,
	onNameHoverEnd,
}: EntityPillProps) {
	const nameArea = (
		<span
			onClick={onNameClick}
			onMouseEnter={onNameHoverStart}
			onMouseLeave={onNameHoverEnd}
			className={cn(
				"inline-flex h-6 items-center gap-1.5 px-2 transition-colors",
				onNameClick && "cursor-pointer",
				colors.hoverBg,
			)}
		>
			{icon}
			<span>{name}</span>
		</span>
	);

	const actionButtonClass = cn(
		"flex cursor-pointer items-center border-l px-1.5 text-fg-muted transition-colors",
		colors.border,
		colors.hoverBg,
		colors.hoverText,
	);

	return (
		<span
			contentEditable={false}
			className={cn(
				"inline-flex items-stretch border align-middle font-mono text-xs font-semibold uppercase text-fg-primary transition-all",
				colors.border,
				colors.bg,
			)}
		>
			{tooltipContent ? (
				<HoverCard
					mode="wrapper"
					position="above"
					width={300}
					height="auto"
					offset={8}
					maxRotation={3}
					maxOffset={5}
					renderContent={tooltipContent}
				>
					{nameArea}
				</HoverCard>
			) : (
				nameArea
			)}
			{onLocate && (
				<span
					role="button"
					onClick={(e) => {
						e.stopPropagation();
						onLocate();
					}}
					title="Scroll to card"
					className={actionButtonClass}
				>
					<ArrowRight className="size-2.5" />
				</span>
			)}
			{onExpand && (
				<span
					role="button"
					onClick={(e) => {
						e.stopPropagation();
						onExpand();
					}}
					title="Expand to card"
					className={actionButtonClass}
				>
					<Maximize2 className="size-2.5" />
				</span>
			)}
			{onCollapse && (
				<span
					role="button"
					onClick={(e) => {
						e.stopPropagation();
						onCollapse();
					}}
					title="Collapse to inline"
					className={actionButtonClass}
				>
					<Minimize2 className="size-2.5" />
				</span>
			)}
		</span>
	);
}

export const toolPillColors: EntityPillColors = {
	border: "border-amber-500/30",
	bg: "bg-amber-500/10",
	hoverBg: "hover:bg-amber-500/20",
	hoverText: "hover:text-amber-400",
};

export const modelPillColors: EntityPillColors = {
	border: "border-cyan-500/30",
	bg: "bg-cyan-500/10",
	hoverBg: "hover:bg-cyan-500/20",
	hoverText: "hover:text-cyan-400",
};

export const bundlePillColors: EntityPillColors = {
	border: "border-violet-500/30",
	bg: "bg-violet-500/10",
	hoverBg: "hover:bg-violet-500/20",
	hoverText: "hover:text-violet-400",
};
