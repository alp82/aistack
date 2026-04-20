import { Check, Copy, Save } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface InstructionViewerFile {
	name: string;
	content: string;
	path?: string;
}

export interface InstructionViewerProps {
	file: InstructionViewerFile | null;
	editable: boolean;
	onContentChange?: (content: string) => void;
	onSave?: () => void | Promise<void>;
	saving?: boolean;
	saved?: boolean;
	dirty?: boolean;
	error?: string | null;
	className?: string;
}

export function InstructionViewer({
	file,
	editable,
	onContentChange,
	onSave,
	saving = false,
	saved = false,
	dirty = false,
	error = null,
	className,
}: InstructionViewerProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		if (!file) return;
		navigator.clipboard
			.writeText(file.content)
			.then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			})
			.catch(() => {
				// Do not show false "Copied" feedback on failure
			});
	};

	if (!file) {
		return (
			<div
				className={cn(
					"flex min-h-[20rem] items-center justify-center border border-stroke-subtle bg-bg-panel-muted/40 p-4",
					className,
				)}
			>
				<p className="font-mono text-sm text-fg-muted">
					Select a file to view its content
				</p>
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col border border-stroke-subtle", className)}>
			{/* Path + Filename row */}
			<div className="flex items-center gap-0 border-b border-stroke-subtle">
				{file.path && file.path !== file.name && file.path !== "" ? (
					<div className="shrink-0 border-r border-stroke-subtle px-4 py-2.5">
						<span className="font-mono text-xs text-fg-muted">{file.path}</span>
					</div>
				) : null}
				<div className="min-w-0 flex-1 px-4 py-2.5">
					<span className="font-mono text-sm font-bold text-fg-primary">
						{file.name}
					</span>
				</div>
			</div>

			{/* Content area with copy button */}
			<div className="relative">
				<button
					type="button"
					onClick={handleCopy}
					className="absolute right-7 top-4 z-10 inline-flex items-center gap-1.5 border-2 border-accent-lime/50 bg-bg-panel px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-lime transition-colors hover:border-accent-lime hover:bg-accent-lime/10 cursor-pointer"
				>
					{copied ? (
						<>
							<Check aria-hidden="true" className="size-3" />
							Copied
						</>
					) : (
						<>
							<Copy aria-hidden="true" className="size-3" />
							Copy
						</>
					)}
				</button>
				<textarea
					value={file.content}
					onChange={(e) => onContentChange?.(e.target.value)}
					onKeyDown={(e) => e.stopPropagation()}
					placeholder={editable ? "File content..." : ""}
					readOnly={!editable}
					aria-label={`Content of ${file.name}`}
					rows={Math.min(Math.max(file.content.split("\n").length + 1, 10), 30)}
					className="w-full resize-none overflow-y-scroll border-0 bg-bg-canvas p-4 font-mono text-xs leading-5 text-fg-primary placeholder:text-fg-muted/40 focus:outline-none focus:ring-0"
				/>
			</div>

			{/* Footer with save action when editable */}
			{editable && (
				<div className="flex items-center justify-end gap-2 border-t border-stroke-subtle px-4 py-3">
					{error && (
						<span className="mr-auto font-mono text-xs text-destructive">
							{error}
						</span>
					)}
					<div aria-live="polite" className="flex items-center gap-2">
						{saved && (
							<span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-accent-lime">
								<Check aria-hidden="true" className="size-3" />
								Saved
							</span>
						)}
						<button
							type="button"
							onClick={() => onSave?.()}
							disabled={saving || !dirty}
							aria-busy={saving}
							className="inline-flex items-center gap-1.5 border-2 border-accent-lime bg-accent-lime px-4 py-2 font-mono text-xs uppercase tracking-wider text-accent-lime-contrast transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
						>
							<Save aria-hidden="true" className="size-3" />
							{saving ? "Saving..." : "Save"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
