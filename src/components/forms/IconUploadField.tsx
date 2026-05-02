import { useMutation, useQuery } from "convex/react";
import { Image as ImageIcon, Link2, Trash2, Upload } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertToWebP } from "@/lib/imageProcessing";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set([
	"image/png",
	"image/jpeg",
	"image/jpg",
	"image/webp",
	"image/gif",
	"image/svg+xml",
]);

const REJECTED_EXTENSIONS = [".heic", ".heif", ".avif"];

export type IconValue = {
	iconStorageId?: Id<"_storage">;
	iconUrl?: string;
} | null;

interface IconUploadFieldProps {
	value: IconValue;
	onChange: (next: IconValue) => void;
	error?: boolean;
	required?: boolean;
	label?: string;
}

export function IconUploadField({
	value,
	onChange,
	error,
	required,
	label = "Icon",
}: IconUploadFieldProps) {
	const generateUploadUrl = useMutation(api.files.generateUploadUrl);

	// Live, reactive preview URL for any uploaded storage blob
	const previewUrl = useQuery(
		api.iconStorage.getUrl,
		value?.iconStorageId ? { storageId: value.iconStorageId } : "skip",
	);

	// Two separate busy flags so file/drag and URL-paste don't show the same
	// "Working..." text or block each other's controls (F-L).
	const [uploadBusy, setUploadBusy] = useState(false);
	const [urlBusy, setUrlBusy] = useState(false);
	const [localError, setLocalError] = useState<string>("");
	const [urlInput, setUrlInput] = useState("");
	const [dragActive, setDragActive] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const errorId = useId();
	const liveRegionId = useId();
	const urlInputId = useId();

	const anyBusy = uploadBusy || urlBusy;

	const displayUrl = value?.iconStorageId
		? (previewUrl ?? null)
		: (value?.iconUrl ?? null);

	const handleFile = useCallback(
		async (file: File) => {
			setLocalError("");

			if (file.size > MAX_FILE_BYTES) {
				setLocalError(
					`File too large — ${(file.size / 1024 / 1024).toFixed(1)} MB exceeds 5 MB limit`,
				);
				return;
			}

			const lowerName = file.name.toLowerCase();
			if (REJECTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
				setLocalError(
					"HEIC/HEIF/AVIF aren't supported — convert to PNG/JPEG/WebP first",
				);
				return;
			}
			if (file.type && !ALLOWED_MIME.has(file.type)) {
				setLocalError(`Unsupported file type "${file.type}"`);
				return;
			}

			setUploadBusy(true);
			try {
				const webpBlob = await convertToWebP(file, 512, 0.85);
				const uploadUrl = await generateUploadUrl();
				const resp = await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": "image/webp" },
					body: webpBlob,
				});
				if (!resp.ok) {
					throw new Error(`Upload failed: ${resp.status} ${resp.statusText}`);
				}
				const { storageId } = (await resp.json()) as { storageId: string };
				onChange({
					iconStorageId: storageId as Id<"_storage">,
					iconUrl: undefined,
				});
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				setLocalError(message);
			} finally {
				setUploadBusy(false);
			}
		},
		[generateUploadUrl, onChange],
	);

	const handleUrlSubmit = useCallback(async () => {
		setLocalError("");
		const url = urlInput.trim();
		if (!url) return;

		setUrlBusy(true);
		try {
			const resp = await fetch("/api/icons/from-url", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url }),
			});
			if (!resp.ok) {
				let serverMessage = `${resp.status} ${resp.statusText}`;
				try {
					const errBody = (await resp.json()) as { error?: string };
					if (errBody.error) serverMessage = errBody.error;
				} catch {
					// non-json error body
				}
				throw new Error(serverMessage);
			}
			const { storageId } = (await resp.json()) as { storageId: string };
			onChange({
				iconStorageId: storageId as Id<"_storage">,
				iconUrl: url,
			});
			setUrlInput("");
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			setLocalError(message);
		} finally {
			setUrlBusy(false);
		}
	}, [onChange, urlInput]);

	// Just clears local field state. The previously-referenced blob (if any)
	// becomes orphaned; Convex `gcOrphans` cron sweeps unreferenced blobs after
	// 24h, so cancelled-modal scenarios don't leave dangling DB references.
	const handleRemove = useCallback(() => {
		setLocalError("");
		onChange(null);
	}, [onChange]);

	return (
		<div className="space-y-2">
			<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
				{label}
				{required ? " *" : ""}
			</Label>

			<div className="flex items-stretch gap-3">
				{/* Preview thumbnail */}
				<div
					className={`flex size-20 shrink-0 items-center justify-center border bg-bg-panel-muted ${error ? "border-destructive" : "border-stroke-subtle"}`}
				>
					{displayUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={displayUrl}
							alt="Icon preview"
							className="max-h-full max-w-full object-contain p-1"
						/>
					) : (
						<ImageIcon className="size-7 text-fg-muted" />
					)}
				</div>

				{/* Drop zone + actions */}
				<div className="flex flex-1 flex-col gap-2">
					<button
						type="button"
						disabled={anyBusy}
						aria-busy={uploadBusy}
						aria-describedby={errorId}
						aria-invalid={error || undefined}
						onClick={() => fileInputRef.current?.click()}
						onDragOver={(e) => {
							e.preventDefault();
							setDragActive(true);
						}}
						onDragLeave={() => setDragActive(false)}
						onDrop={(e) => {
							e.preventDefault();
							setDragActive(false);
							const file = e.dataTransfer.files[0];
							if (file) handleFile(file);
						}}
						className={`flex h-10 items-center justify-center gap-2 border bg-bg-panel-muted px-3 font-mono text-xs uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
							dragActive
								? "border-accent-lime text-accent-lime"
								: "border-stroke-subtle text-fg-secondary hover:border-accent-lime hover:text-accent-lime"
						}`}
					>
						<Upload className="size-3.5" />
						{uploadBusy ? "Uploading…" : "Upload or drop image"}
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
						className="hidden"
						aria-hidden="true"
						tabIndex={-1}
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) handleFile(file);
							e.target.value = "";
						}}
					/>

					<div className="flex items-stretch gap-2">
						<div
							className="flex flex-1 items-center gap-2 border border-stroke-subtle bg-bg-panel-muted px-3"
							aria-busy={urlBusy}
						>
							<Link2 className="size-3.5 text-fg-muted" />
							<Input
								id={urlInputId}
								value={urlInput}
								onChange={(e) => setUrlInput(e.target.value)}
								placeholder="Paste image URL"
								disabled={anyBusy}
								aria-describedby={errorId}
								aria-invalid={error || undefined}
								className="h-9 border-none bg-transparent px-0 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus-visible:ring-0"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleUrlSubmit();
									}
								}}
							/>
						</div>
						<button
							type="button"
							disabled={anyBusy || !urlInput.trim()}
							aria-busy={urlBusy}
							onClick={handleUrlSubmit}
							className="border-2 border-accent-lime bg-accent-lime px-3 font-mono text-xs uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong disabled:cursor-not-allowed disabled:opacity-50"
						>
							{urlBusy ? "Fetching…" : "Fetch"}
						</button>
					</div>
				</div>

				{value?.iconStorageId || value?.iconUrl ? (
					<button
						type="button"
						disabled={anyBusy}
						onClick={handleRemove}
						aria-label="Remove icon"
						className="flex size-10 shrink-0 items-center justify-center self-start border border-stroke-subtle text-fg-muted transition-colors hover:border-destructive hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Trash2 className="size-4" />
					</button>
				) : null}
			</div>

			{/* Persistent live region announces upload errors to screen readers (F-M) */}
			<div
				id={liveRegionId}
				aria-live="polite"
				role="status"
				className="sr-only"
			>
				{localError ? `Error: ${localError}` : ""}
			</div>
			<p
				id={errorId}
				className={`font-mono text-xs text-destructive ${localError ? "" : "sr-only"}`}
			>
				{localError || ""}
			</p>
		</div>
	);
}
