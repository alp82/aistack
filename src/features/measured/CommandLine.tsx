import { Check, Copy } from "lucide-react";
import { useState } from "react";

/**
 * One copyable shell command, shared by the owner's never-measured box and the
 * /sync guide page (#59). The comment column names what the command does and
 * yields on small screens - the command itself never truncates its meaning.
 */
export function CommandLine({
	cmd,
	comment,
}: {
	cmd: string;
	comment?: string;
}) {
	const [copied, setCopied] = useState(false);
	return (
		<div className="flex items-center gap-3 px-4 py-2.5">
			<span className="select-none font-mono text-xs text-fg-muted">$</span>
			<code className="flex-1 truncate text-left font-mono text-sm text-fg-primary">
				{cmd}
			</code>
			{comment && (
				<span className="hidden font-mono text-xs text-fg-muted sm:block">
					{comment}
				</span>
			)}
			<button
				type="button"
				aria-label={`Copy ${cmd}`}
				className="cursor-pointer p-1 text-fg-muted transition-colors hover:text-accent-lime"
				onClick={() => {
					navigator.clipboard.writeText(cmd);
					setCopied(true);
					setTimeout(() => setCopied(false), 1500);
				}}
			>
				{copied ? <Check size={14} /> : <Copy size={14} />}
			</button>
		</div>
	);
}

/** The two-command block, boxed. */
export function CommandBlock({
	commands,
}: {
	commands: { cmd: string; comment?: string }[];
}) {
	return (
		<div className="divide-y divide-stroke-subtle border border-stroke-strong bg-bg-panel">
			{commands.map((c) => (
				<CommandLine key={c.cmd} cmd={c.cmd} comment={c.comment} />
			))}
		</div>
	);
}
