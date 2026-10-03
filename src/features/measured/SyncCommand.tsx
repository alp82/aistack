import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { MONO_LABEL, SYNC_CMD, SYNC_COPIED, SYNC_HOW } from "./copy";

/**
 * The sync command as a call to action: a lime label joined to the command,
 * and the whole thing copies. It sits on the pages that show measured numbers
 * (the token counter block, the leaderboard, the stack page), so the reader
 * meets the command next to what it produces.
 *
 * `lg` is a block's main action, `md` sits beside content, and `stacked` fits
 * a narrow column. The label keeps its width while it reads "Copied", so
 * nothing around it moves.
 */
export function SyncCommand({
	label,
	size = "md",
	stacked,
	className,
}: {
	label: string;
	size?: "md" | "lg";
	stacked?: boolean;
	className?: string;
}) {
	const [copied, setCopied] = useState(false);
	const lg = size === "lg";
	const pad = lg ? "px-5 py-3" : "px-3 py-2";
	return (
		<button
			type="button"
			aria-label={`${label}: copy ${SYNC_CMD}`}
			onClick={() => {
				navigator.clipboard.writeText(SYNC_CMD);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}}
			className={cn(
				"group inline-flex max-w-full cursor-pointer flex-col border-2 border-accent-lime text-left transition-shadow hover:shadow-[4px_4px_0_var(--accent-lime)]",
				!stacked && "sm:flex-row",
				className,
			)}
		>
			<span
				className={cn(
					"relative flex items-center whitespace-nowrap bg-accent-lime font-mono font-bold uppercase tracking-[0.15em] text-accent-lime-contrast",
					pad,
					lg ? "text-sm" : "text-xs",
				)}
			>
				<span className={cn(copied && "invisible")}>{label}</span>
				{copied && (
					<output
						className={cn(
							"absolute inset-0 flex items-center justify-center",
							pad,
						)}
					>
						{SYNC_COPIED}
					</output>
				)}
			</span>
			<span
				className={cn(
					"flex min-w-0 flex-1 items-center gap-3 bg-bg-canvas font-mono text-fg-primary",
					pad,
					lg ? "text-base" : "text-sm",
				)}
			>
				<span className="select-none text-accent-lime">$</span>
				<code className="truncate">{SYNC_CMD}</code>
				<span className="ml-auto pl-2 text-fg-muted transition-colors group-hover:text-accent-lime">
					{copied ? (
						<Check size={lg ? 16 : 14} />
					) : (
						<Copy size={lg ? 16 : 14} />
					)}
				</span>
			</span>
		</button>
	);
}

/** The quiet link to the /sync guide that travels with the command. */
export function SyncHowLink() {
	return (
		<Link
			to="/sync"
			className={cn(
				MONO_LABEL,
				"inline-flex items-center gap-1.5 whitespace-nowrap text-fg-muted transition-colors hover:text-accent-lime",
			)}
		>
			{SYNC_HOW} <ArrowRight size={12} />
		</Link>
	);
}
