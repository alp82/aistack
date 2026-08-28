import { X } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { accentClassOf } from "@/lib/accentClassOf";

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
	// The dialog portals to body, outside the stack page's `.accent-<key>`
	// wrapper. A sentinel stays in the tree so the nearest accent class can be
	// read and carried into the portal (alp82/aistack#298).
	const sentinelRef = useRef<HTMLSpanElement>(null);
	const [accentClass, setAccentClass] = useState<string | undefined>();
	useLayoutEffect(() => {
		if (open) setAccentClass(accentClassOf(sentinelRef.current));
	}, [open]);

	const sentinel = <span ref={sentinelRef} hidden data-dialog-anchor="" />;
	if (!open) return sentinel;

	const defaultPadding = size === "lg" ? "p-8" : "p-6";
	const paddingClass = padding ?? defaultPadding;
	const scrollClass = scrollable ? "max-h-[90vh] overflow-y-auto" : "";

	// TODO(a11y): focus trap + focus return on close

	return (
		<>
			{sentinel}
			{createPortal(
				<div
					className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${accentClass ?? ""}`}
				>
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
									aria-label="Close"
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
								aria-label="Close"
								className="absolute right-4 top-4 flex size-8 shrink-0 items-center justify-center border border-stroke-subtle text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime cursor-pointer"
							>
								<X className="size-4" />
							</button>
						)}
						{children}
					</div>
				</div>,
				document.body,
			)}
		</>
	);
}
