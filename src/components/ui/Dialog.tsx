import { createPortal } from "react-dom";
import { useId } from "react";
import { X } from "lucide-react";

interface DialogProps {
	open: boolean;
	onClose: () => void;
	children: React.ReactNode;
	title?: string;
	titleIcon?: React.ReactNode;
	/** sm = 28rem, md = 32rem, lg = 56rem (default for forms) */
	size?: "sm" | "md" | "lg";
	/** Custom padding - defaults to p-6 for sm/md, p-8 for lg */
	padding?: string;
	/** Allow scrolling for tall content */
	scrollable?: boolean;
}

const sizeClasses = {
	sm: "max-w-[28rem] min-w-[24rem]",
	md: "max-w-[32rem] min-w-[28rem]",
	lg: "max-w-4xl min-w-[40rem]",
};

export function Dialog({
	open,
	onClose,
	children,
	title,
	titleIcon,
	size = "md",
	padding,
	scrollable = false,
}: DialogProps) {
	const titleId = useId();

	if (!open) return null;

	const defaultPadding = size === "lg" ? "p-8" : "p-6";
	const paddingClass = padding ?? defaultPadding;
	const scrollClass = scrollable ? "max-h-[90vh] overflow-y-auto" : "";

	// TODO(a11y): focus trap + focus return on close

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-bg-canvas/80 backdrop-blur-md"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={title ? titleId : undefined}
				className={`relative w-full ${sizeClasses[size]} ${scrollClass} border-2 border-stroke-strong bg-bg-panel ${paddingClass} shadow-[6px_6px_0_var(--stroke-strong)]`}
			>
				{title && (
					<div
						className={`mb-4 flex items-center justify-between ${paddingClass === "p-0" ? "px-6 pt-5" : ""}`}
					>
						<div className="flex items-center gap-3">
							{titleIcon}
							<h3
								id={titleId}
								className="font-mono text-lg font-bold text-fg-primary"
							>
								{title}
							</h3>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="flex size-8 shrink-0 items-center justify-center border border-stroke-subtle text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime cursor-pointer"
						>
							<X className="size-4" />
						</button>
					</div>
				)}
				{!title && (
					<button
						type="button"
						onClick={onClose}
						className="absolute right-4 top-4 flex size-8 shrink-0 items-center justify-center border border-stroke-subtle text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime cursor-pointer"
					>
						<X className="size-4" />
					</button>
				)}
				{children}
			</div>
		</div>,
		document.body,
	);
}
