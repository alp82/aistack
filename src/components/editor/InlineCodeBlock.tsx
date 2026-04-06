import { Check, Copy, X } from "lucide-react";
import { useState } from "react";

interface InlineCodeBlockProps {
	content: string;
	filename: string;
	onClose: () => void;
}

export function InlineCodeBlock({
	content,
	filename,
	onClose,
}: InlineCodeBlockProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="border border-stroke-subtle bg-bg-panel">
			<div className="flex items-center justify-between px-2 py-1">
				<span className="font-mono text-[10px] text-fg-muted">{filename}</span>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={handleCopy}
						className="flex items-center gap-1 px-1.5 py-0.5 font-mono text-[10px] text-fg-muted transition-colors hover:text-accent-lime cursor-pointer"
					>
						{copied ? (
							<Check className="size-3" />
						) : (
							<Copy className="size-3" />
						)}
					</button>
					<button
						type="button"
						onClick={onClose}
						className="flex items-center justify-center px-1 py-0.5 text-fg-muted transition-colors hover:text-accent-lime cursor-pointer"
					>
						<X className="size-3" />
					</button>
				</div>
			</div>
			<pre className="max-h-[300px] overflow-y-auto px-2 pb-2 font-mono text-xs leading-5 text-fg-primary">
				{content}
			</pre>
		</div>
	);
}
