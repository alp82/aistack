import { Check, Copy, Save } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";

export interface ResourceViewerFile {
	name: string;
	content: string;
	path?: string;
}

export interface ResourceViewerProps {
	file: ResourceViewerFile | null;
	editable: boolean;
	onContentChange?: (content: string) => void;
	onSave?: () => void | Promise<void>;
	saving?: boolean;
	saved?: boolean;
	dirty?: boolean;
	error?: string | null;
	className?: string;
	/** Render style: inline (default) places the viewer in flow; dialog wraps it in a modal. */
	mode?: "inline" | "dialog";
	/** Required when mode === "dialog". */
	open?: boolean;
	/** Required when mode === "dialog". */
	onClose?: () => void;
	/**
	 * When true, render the path/filename header row as editable inputs and
	 * forward changes through `onNameChange` / `onPathChange`. When false
	 * (default), the header renders as read-only display spans.
	 */
	editableHeader?: boolean;
	onNameChange?: (name: string) => void;
	onPathChange?: (path: string) => void;
}

function noop() {}

export function ResourceViewer({
	file,
	editable,
	onContentChange,
	onSave,
	saving = false,
	saved = false,
	dirty = false,
	error = null,
	className,
	mode = "inline",
	open,
	onClose,
	editableHeader = false,
	onNameChange,
	onPathChange,
}: ResourceViewerProps) {
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

	const empty = (
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

	const body = file ? (
		<div className={cn("flex flex-col border border-stroke-subtle", className)}>
			{/* Path + Filename row */}
			<div className="flex items-center gap-0 border-b border-stroke-subtle">
				{editableHeader ? (
					<>
						<div className="shrink-0 border-r border-stroke-subtle px-4 py-2.5">
							<input
								type="text"
								value={file.path ?? ""}
								onChange={(e) => onPathChange?.(e.target.value)}
								onKeyDown={(e) => {
									e.stopPropagation();
									if (e.key === "Enter") e.currentTarget.blur();
								}}
								placeholder="path/"
								className="w-32 border-0 bg-transparent font-mono text-xs text-fg-muted placeholder:text-fg-muted/30 focus:outline-none focus:ring-0"
							/>
						</div>
						<div className="min-w-0 flex-1 px-4 py-2.5">
							<input
								type="text"
								value={file.name}
								onChange={(e) => onNameChange?.(e.target.value)}
								onKeyDown={(e) => {
									e.stopPropagation();
									if (e.key === "Enter") e.currentTarget.blur();
								}}
								placeholder="filename.md"
								className="w-full border-0 bg-transparent font-mono text-sm font-bold text-fg-primary placeholder:text-fg-muted/40 focus:outline-none focus:ring-0"
							/>
						</div>
					</>
				) : (
					<>
						{file.path && file.path !== file.name && file.path !== "" ? (
							<div className="shrink-0 border-r border-stroke-subtle px-4 py-2.5">
								<span className="font-mono text-xs text-fg-muted">
									{file.path}
								</span>
							</div>
						) : null}
						<div className="min-w-0 flex-1 px-4 py-2.5">
							<span className="font-mono text-sm font-bold text-fg-primary">
								{file.name}
							</span>
						</div>
					</>
				)}
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

			{/* Footer with save action when editable AND a save handler is wired up.
			    Callers that manage save UX externally (e.g., ResourcePanel) can omit
			    onSave to suppress the footer entirely. */}
			{editable && onSave && (
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
	) : (
		empty
	);

	if (mode === "dialog") {
		return (
			<Dialog
				open={open ?? false}
				onClose={onClose ?? noop}
				title={file?.name ?? "File"}
				size="lg"
				padding="p-0"
				scrollable
			>
				{body}
			</Dialog>
		);
	}

	return body;
}
