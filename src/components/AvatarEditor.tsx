import { useMutation } from "convex/react";
import { Upload, User, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { PendingAvatar } from "@/features/stack-editor/types";
import { convertToCompactDataUrl } from "@/lib/imageProcessing";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type AvatarEditorProps = {
	isOpen: boolean;
	onClose: () => void;
	currentAvatarUrl: string;
	defaultAvatarUrl?: string;
	pendingAvatarKind: PendingAvatar["kind"];
	creatorName: string;
	onAvatarChange: (pending: PendingAvatar, previewUrl?: string) => void;
	guestSession?: boolean;
};

export function AvatarEditor({
	isOpen,
	onClose,
	currentAvatarUrl,
	defaultAvatarUrl,
	pendingAvatarKind,
	creatorName,
	onAvatarChange,
	guestSession = false,
}: AvatarEditorProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState("");
	const [dragActive, setDragActive] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const getFileUrl = useMutation(api.files.getUrl);

	const displayUrl = currentAvatarUrl;
	const initials = creatorName.charAt(0).toUpperCase();

	const handleFileUpload = useCallback(
		async (file: File) => {
			if (!file.type.startsWith("image/")) {
				setError("Please upload an image file");
				return;
			}

			if (file.size > 5 * 1024 * 1024) {
				setError("Image must be less than 5MB");
				return;
			}

			if (guestSession) {
				setIsUploading(true);
				setError("");
				try {
					const url = await convertToCompactDataUrl(file);
					onAvatarChange({ kind: "dataUrl", url });
					onClose();
				} catch (err) {
					setError("Couldn't process the image. Try another file.");
					console.error(err);
				} finally {
					setIsUploading(false);
				}
				return;
			}

			setIsUploading(true);
			setError("");

			try {
				const uploadUrl = await generateUploadUrl();
				const response = await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": file.type },
					body: file,
				});

				if (!response.ok) {
					throw new Error("Upload failed");
				}

				const { storageId } = await response.json();
				// getFileUrl produces a live preview URL handed up for display only -
				// the stored avatar is the storage id, never this URL.
				const previewUrl = await getFileUrl({ storageId });

				onAvatarChange(
					{ kind: "storageId", id: storageId as Id<"_storage"> },
					previewUrl ?? undefined,
				);
				onClose();
			} catch (err) {
				setError("Failed to upload image");
				console.error(err);
			} finally {
				setIsUploading(false);
			}
		},
		[generateUploadUrl, getFileUrl, onAvatarChange, onClose, guestSession],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setDragActive(false);

			const file = e.dataTransfer.files[0];
			if (file) {
				handleFileUpload(file);
			}
		},
		[handleFileUpload],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragActive(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragActive(false);
	}, []);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				handleFileUpload(file);
			}
		},
		[handleFileUpload],
	);

	const handleRemoveAvatar = useCallback(() => {
		onAvatarChange({ kind: "none" });
		onClose();
	}, [onAvatarChange, onClose]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
			<div className="w-[400px] min-w-[360px] border-[3px] border-stroke-strong bg-bg-canvas p-6 shadow-[8px_8px_0_var(--stroke-strong)]">
				{/* Header */}
				<div className="mb-6 flex items-center justify-between">
					<h2 className="font-mono text-lg font-bold uppercase tracking-wider text-fg-primary">
						Edit Avatar
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-fg-muted hover:text-fg-primary transition-colors"
					>
						<X className="size-5" />
					</button>
				</div>

				{/* Current Avatar Preview */}
				<div className="mb-6 flex justify-center">
					{displayUrl ? (
						<img
							src={displayUrl}
							alt={creatorName}
							className="size-32 border-[3px] border-stroke-strong object-cover"
						/>
					) : (
						<div className="flex size-32 items-center justify-center border-[3px] border-stroke-strong bg-bg-panel-muted font-mono text-5xl font-bold text-fg-primary">
							{initials}
						</div>
					)}
				</div>

				{/* Use Profile Picture - clears the stack avatar so the read path
				    falls back to the creator's profile photo. Gate on pendingAvatarKind
				    (not URL equality) because currentAvatarUrl is a resolved storage/
				    preview URL while defaultAvatarUrl is the OAuth URL - different
				    URL spaces make equality meaningless. Show the button whenever there
				    IS a default to fall back to AND the pending selection isn't already
				    "use profile" (kind==='none' means fall back to creator avatar). */}
				{defaultAvatarUrl && pendingAvatarKind !== "none" && (
					<button
						type="button"
						onClick={() => {
							onAvatarChange({ kind: "none" });
							onClose();
						}}
						className="mb-4 flex w-full items-center justify-center gap-2 border-2 border-stroke-subtle px-4 py-2 font-mono text-xs uppercase tracking-wider text-fg-muted hover:border-accent-lime hover:text-accent-lime transition-colors cursor-pointer"
					>
						<User className="size-4" />
						Use Profile Picture
					</button>
				)}

				{/* Upload Dropzone */}
				<div
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onClick={() => fileInputRef.current?.click()}
					className={cn(
						"mb-4 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed p-6 transition-colors",
						dragActive
							? "border-accent-lime bg-accent-lime/10"
							: "border-stroke-subtle hover:border-accent-lime hover:bg-accent-lime/5",
					)}
				>
					<Upload
						className={cn(
							"mb-2 size-8",
							dragActive ? "text-accent-lime" : "text-fg-muted",
						)}
					/>
					<p className="font-mono text-sm text-fg-muted">
						{isUploading
							? "Uploading..."
							: "Drop image here or click to upload"}
					</p>
					<p className="mt-1 font-mono text-[10px] text-fg-muted">
						Max 5MB, JPG/PNG/GIF
					</p>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleFileSelect}
						className="hidden"
					/>
				</div>

				{/* Error */}
				{error && (
					<p className="mb-4 font-mono text-sm text-destructive">{error}</p>
				)}

				{/* Actions */}
				<div className="flex justify-between">
					{currentAvatarUrl && (
						<button
							type="button"
							onClick={handleRemoveAvatar}
							className="font-mono text-xs text-destructive hover:text-destructive/80 transition-colors"
						>
							Remove Avatar
						</button>
					)}
					<button
						type="button"
						onClick={onClose}
						className="ml-auto font-mono text-xs text-fg-muted hover:text-fg-primary transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
