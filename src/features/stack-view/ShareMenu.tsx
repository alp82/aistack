import { Check, Copy, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SITE_URL } from "@/lib/seo";
import { useClipboard } from "@/lib/useClipboard";
import { cn } from "@/lib/utils";

type ShareMenuProps = {
	slug: string;
	className?: string;
};

function ShareMenuItems({ slug }: { slug: string }) {
	const pageClip = useClipboard();
	const ogClip = useClipboard();
	const firstButtonRef = useRef<HTMLButtonElement>(null);

	const pageUrl = `${SITE_URL}/stacks/${slug}`;
	const ogUrl = `${SITE_URL}/api/og/stack/${slug}`;

	// Focus the first button when the group mounts (called only when open=true).
	useEffect(() => {
		firstButtonRef.current?.focus();
	}, []);

	let liveText = "";
	if (pageClip.copied) liveText = "Page link copied";
	else if (ogClip.copied) liveText = "Image link copied";
	else if (pageClip.failed) liveText = "Page link copy failed";
	else if (ogClip.failed) liveText = "Preview image copy failed";

	return (
		<>
			{/* Persistent visually-hidden live region for screen readers */}
			<span className="sr-only" aria-live="polite" aria-atomic="true">
				{liveText}
			</span>

			<button
				ref={firstButtonRef}
				type="button"
				onClick={() => pageClip.copy(pageUrl)}
				className="flex w-full items-center gap-1.5 px-4 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-accent-lime/10 hover:text-accent-lime"
			>
				{pageClip.copied ? (
					<>
						<Check aria-hidden="true" className="size-3" />
						Copied!
					</>
				) : pageClip.failed ? (
					<>
						<Copy aria-hidden="true" className="size-3 text-destructive" />
						<span className="text-destructive">Copy failed</span>
					</>
				) : (
					<>
						<Copy aria-hidden="true" className="size-3" />
						Copy page link
					</>
				)}
			</button>
			<button
				type="button"
				onClick={() => ogClip.copy(ogUrl)}
				className="flex w-full items-center gap-1.5 px-4 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-accent-lime/10 hover:text-accent-lime"
			>
				{ogClip.copied ? (
					<>
						<Check aria-hidden="true" className="size-3" />
						Copied!
					</>
				) : ogClip.failed ? (
					<>
						<Copy aria-hidden="true" className="size-3 text-destructive" />
						<span className="text-destructive">Copy failed</span>
					</>
				) : (
					<>
						<Copy aria-hidden="true" className="size-3" />
						Copy preview image
					</>
				)}
			</button>
		</>
	);
}

export function ShareMenu({ slug, className }: ShareMenuProps) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!open) return;

		function handleMouseDown(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setOpen(false);
				triggerRef.current?.focus();
			}
		}

		document.addEventListener("mousedown", handleMouseDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handleMouseDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [open]);

	return (
		<div ref={containerRef} className={cn("relative", className)}>
			<button
				ref={triggerRef}
				type="button"
				aria-expanded={open}
				onClick={() => setOpen((v) => !v)}
				className="inline-flex items-center gap-1.5 border border-stroke-strong bg-bg-panel px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime"
			>
				<Share2 aria-hidden="true" className="size-3" />
				Share
			</button>
			{open && (
				<fieldset className="absolute right-0 top-full mt-1 z-20 m-0 p-0 bg-bg-panel shadow-lg min-w-[200px] border border-stroke-strong">
					<legend className="sr-only">Share options</legend>
					<ShareMenuItems slug={slug} />
				</fieldset>
			)}
		</div>
	);
}
