import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { BadgeCheck, Globe, Pencil, Plus, User, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { AvatarEditor } from "@/components/AvatarEditor";
import type { PendingAvatar } from "@/features/stack-editor/types";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type ProfileData = {
	name: string;
	handle: string;
	bio?: string;
	xHandle?: string;
	personalPages: Array<{ name: string; url: string }>;
	avatarUrl?: string;
	verified: boolean;
	joinedAt: number;
};

type ProfileIdentityProps = {
	profile: ProfileData;
	isOwner: boolean;
};

function formatJoined(joinedAt: number): string {
	return new Date(joinedAt).toLocaleDateString("en-US", {
		month: "short",
		year: "numeric",
	});
}

function ProfileAvatar({
	name,
	avatarUrl,
	className,
}: {
	name: string;
	avatarUrl?: string;
	className?: string;
}) {
	const [imgError, setImgError] = useState(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: avatarUrl isn't read in the body, it's the reset trigger - clear a stale load-error when the source URL changes
	useEffect(() => {
		setImgError(false);
	}, [avatarUrl]);

	if (avatarUrl && !imgError) {
		return (
			<img
				src={avatarUrl}
				alt={name}
				className={cn(
					"border-[3px] border-stroke-strong object-cover bg-bg-panel-muted",
					className,
				)}
				onError={() => setImgError(true)}
			/>
		);
	}
	return (
		<div
			className={cn(
				"flex items-center justify-center border-[3px] border-stroke-strong bg-bg-panel-muted font-mono font-bold text-fg-primary text-4xl",
				className,
			)}
		>
			{name.charAt(0).toUpperCase()}
		</div>
	);
}

/**
 * Identity sidebar of the profile dossier (Mirror paradigm): view mode by
 * default; the owner can toggle an inline editor. The editor lives in a child
 * component so its Convex/router hooks only mount when editing starts.
 */
function ProfileIdentity({ profile, isOwner }: ProfileIdentityProps) {
	const [isEditing, setIsEditing] = useState(false);

	if (isEditing) {
		return (
			<aside className="md:sticky md:top-24 md:self-start">
				<ProfileIdentityEditor
					profile={profile}
					onClose={() => setIsEditing(false)}
				/>
			</aside>
		);
	}

	return (
		<aside className="md:sticky md:top-24 md:self-start">
			<ProfileAvatar
				name={profile.name}
				avatarUrl={profile.avatarUrl}
				className="size-32"
			/>
			<h1 className="mt-5 text-3xl font-black uppercase leading-none tracking-tight">
				{profile.name}
			</h1>
			<p className="mt-1 font-mono text-sm text-accent-lime">
				@{profile.handle}
				{profile.verified && (
					<BadgeCheck
						aria-label="Verified"
						className="ml-1.5 inline size-3.5 align-[-2px]"
					/>
				)}
			</p>
			{profile.bio && (
				<p className="mt-4 text-sm leading-relaxed text-fg-secondary">
					{profile.bio}
				</p>
			)}
			<dl className="mt-5 space-y-2 border-t border-stroke-strong pt-4 font-mono text-xs">
				{profile.xHandle && (
					<div className="flex items-center gap-2 text-fg-secondary">
						<dt className="text-fg-muted">X</dt>
						<dd>
							<a
								href={`https://x.com/${profile.xHandle}`}
								target="_blank"
								rel="noopener noreferrer"
								className="transition-colors hover:text-accent-lime"
							>
								@{profile.xHandle}
							</a>
						</dd>
					</div>
				)}
				{profile.personalPages.map((page) => (
					<div
						key={page.url}
						className="flex items-center gap-2 text-fg-secondary"
					>
						<dt>
							<Globe aria-hidden="true" className="size-3 text-fg-muted" />
						</dt>
						<dd>
							<a
								href={page.url}
								target="_blank"
								rel="noopener noreferrer"
								className="transition-colors hover:text-accent-lime"
							>
								{page.name}
							</a>
						</dd>
					</div>
				))}
				<div className="flex items-center gap-2 text-fg-muted">
					<dt>joined</dt>
					<dd>{formatJoined(profile.joinedAt)}</dd>
				</div>
			</dl>
			{isOwner && (
				<button
					type="button"
					onClick={() => setIsEditing(true)}
					className="mt-5 inline-flex items-center gap-1.5 border border-stroke-strong px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime cursor-pointer"
				>
					<Pencil aria-hidden="true" className="size-3" />
					Edit profile
				</button>
			)}
		</aside>
	);
}

// ---------------------------------------------------------------------------
// Owner editor (mounted only when editing - keeps Convex/router hooks out of
// the always-rendered view path)
// ---------------------------------------------------------------------------

type AvatarSelection =
	| { kind: "unchanged" }
	| { kind: "set"; id: Id<"_storage">; previewUrl?: string }
	| { kind: "cleared" };

function normalizeUrl(raw: string): string {
	const value = raw.trim();
	if (value && !/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
		return `https://${value}`;
	}
	return value;
}

const editorInputClass =
	"w-full border-2 border-stroke-subtle bg-bg-panel-muted px-3 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none";

function ProfileIdentityEditor({
	profile,
	onClose,
}: {
	profile: ProfileData;
	onClose: () => void;
}) {
	const navigate = useNavigate();
	const updateProfile = useMutation(api.creators.updateProfile);
	const fieldId = useId();

	const [name, setName] = useState(profile.name);
	const [handle, setHandle] = useState(profile.handle);
	const [bio, setBio] = useState(profile.bio ?? "");
	const [xHandle, setXHandle] = useState(profile.xHandle ?? "");
	const [pages, setPages] = useState(profile.personalPages);
	const [avatar, setAvatar] = useState<AvatarSelection>({ kind: "unchanged" });
	const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	// Debounced live handle-availability feedback.
	const [debouncedHandle, setDebouncedHandle] = useState(handle);
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedHandle(handle), 300);
		return () => clearTimeout(timer);
	}, [handle]);
	const handleCheck = useQuery(
		api.creators.checkHandle,
		debouncedHandle && debouncedHandle !== profile.handle
			? { handle: debouncedHandle }
			: "skip",
	);

	const displayAvatarUrl =
		avatar.kind === "set"
			? (avatar.previewUrl ?? "")
			: avatar.kind === "cleared"
				? ""
				: (profile.avatarUrl ?? "");

	const handleAvatarChange = (pending: PendingAvatar, previewUrl?: string) => {
		if (pending.kind === "storageId") {
			setAvatar({ kind: "set", id: pending.id, previewUrl });
		} else if (pending.kind === "none") {
			setAvatar({ kind: "cleared" });
		}
		// dataUrl never happens here - this editor is authed-only.
	};

	const updatePage = (
		index: number,
		patch: Partial<{ name: string; url: string }>,
	) => {
		setPages((prev) =>
			prev.map((page, i) => (i === index ? { ...page, ...patch } : page)),
		);
	};

	const handleSave = async () => {
		setError("");
		setSaving(true);
		try {
			const cleanedPages = pages
				.filter((page) => page.url.trim() !== "")
				.map((page) => {
					const url = normalizeUrl(page.url);
					return {
						name: page.name.trim() || url.replace(/^https?:\/\//, ""),
						url,
					};
				});
			await updateProfile({
				name: name.trim(),
				handle: handle.trim(),
				bio,
				xHandle: xHandle.replace(/^@/, ""),
				personalPages: cleanedPages,
				...(avatar.kind === "set"
					? { avatarStorageId: avatar.id }
					: avatar.kind === "cleared"
						? { avatarStorageId: null }
						: {}),
			});
			if (handle.trim() !== profile.handle) {
				// The old handle 404s after a rename - move to the new URL.
				navigate({
					to: "/$creator",
					params: { creator: `@${handle.trim()}` },
				});
			}
			onClose();
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Failed to save profile",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-4">
			<AvatarEditor
				isOpen={isAvatarEditorOpen}
				onClose={() => setIsAvatarEditorOpen(false)}
				currentAvatarUrl={displayAvatarUrl}
				pendingAvatarKind={avatar.kind === "cleared" ? "none" : "storageId"}
				creatorName={name || profile.name}
				onAvatarChange={handleAvatarChange}
			/>

			<button
				type="button"
				onClick={() => setIsAvatarEditorOpen(true)}
				className="group relative block cursor-pointer"
				title="Click to edit avatar"
				aria-label="Edit avatar"
			>
				<ProfileAvatar
					name={name || profile.name}
					avatarUrl={displayAvatarUrl || undefined}
					className="size-32"
				/>
				<div className="absolute inset-0 flex items-center justify-center border-[3px] border-accent-lime bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
					<User aria-hidden="true" className="size-6 text-white" />
				</div>
			</button>

			<div className="space-y-1">
				<label
					htmlFor={`${fieldId}-name`}
					className="font-mono text-[10px] uppercase tracking-widest text-fg-muted"
				>
					Name
				</label>
				<input
					id={`${fieldId}-name`}
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					className={editorInputClass}
				/>
			</div>

			<div className="space-y-1">
				<label
					htmlFor={`${fieldId}-handle`}
					className="font-mono text-[10px] uppercase tracking-widest text-fg-muted"
				>
					Handle
				</label>
				<div className="flex items-center border-2 border-stroke-subtle bg-bg-panel-muted px-3 focus-within:border-accent-lime">
					<span className="font-mono text-sm text-fg-muted">@</span>
					<input
						id={`${fieldId}-handle`}
						type="text"
						value={handle}
						onChange={(e) => setHandle(e.target.value.toLowerCase())}
						className="flex-1 border-0 bg-transparent px-1 py-2 font-mono text-sm text-fg-primary focus:outline-none"
					/>
				</div>
				{handle !== profile.handle && handleCheck !== undefined && (
					<output
						aria-live="polite"
						className={cn(
							"block font-mono text-[10px]",
							handleCheck.available ? "text-accent-lime" : "text-destructive",
						)}
					>
						{handleCheck.available
							? "Handle is available"
							: (handleCheck.reason ?? "Handle is not available")}
					</output>
				)}
			</div>

			<div className="space-y-1">
				<label
					htmlFor={`${fieldId}-bio`}
					className="font-mono text-[10px] uppercase tracking-widest text-fg-muted"
				>
					Bio
				</label>
				<textarea
					id={`${fieldId}-bio`}
					value={bio}
					onChange={(e) => setBio(e.target.value)}
					rows={3}
					maxLength={280}
					className={cn(editorInputClass, "resize-none")}
				/>
			</div>

			<div className="space-y-1">
				<label
					htmlFor={`${fieldId}-x-handle`}
					className="font-mono text-[10px] uppercase tracking-widest text-fg-muted"
				>
					X handle
				</label>
				<div className="flex items-center border-2 border-stroke-subtle bg-bg-panel-muted px-3 focus-within:border-accent-lime">
					<span className="font-mono text-sm text-fg-muted">@</span>
					<input
						id={`${fieldId}-x-handle`}
						type="text"
						value={xHandle}
						onChange={(e) => setXHandle(e.target.value)}
						placeholder="username"
						className="flex-1 border-0 bg-transparent px-1 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:outline-none"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<span className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
					Links (https only)
				</span>
				{pages.map((page, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: rows are positional edit slots with no stable identity
						key={index}
						className="flex items-center gap-2"
					>
						<input
							type="text"
							value={page.name}
							onChange={(e) => updatePage(index, { name: e.target.value })}
							placeholder="Label"
							aria-label={`Link ${index + 1} label`}
							className={cn(editorInputClass, "w-24 flex-none")}
						/>
						<input
							type="text"
							value={page.url}
							onChange={(e) => updatePage(index, { url: e.target.value })}
							onBlur={(e) =>
								updatePage(index, { url: normalizeUrl(e.target.value) })
							}
							placeholder="https://yoursite.com"
							aria-label={`Link ${index + 1} URL`}
							className={cn(editorInputClass, "flex-1")}
						/>
						<button
							type="button"
							onClick={() =>
								setPages((prev) => prev.filter((_, i) => i !== index))
							}
							aria-label={`Remove link ${index + 1}`}
							className="text-fg-muted transition-colors hover:text-destructive cursor-pointer"
						>
							<X aria-hidden="true" className="size-4" />
						</button>
					</div>
				))}
				<button
					type="button"
					onClick={() => setPages((prev) => [...prev, { name: "", url: "" }])}
					className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-fg-muted transition-colors hover:text-accent-lime cursor-pointer"
				>
					<Plus aria-hidden="true" className="size-3" />
					Add link
				</button>
			</div>

			{error && (
				<p
					role="alert"
					className="border-2 border-destructive/30 bg-destructive/10 p-2 font-mono text-xs text-destructive"
				>
					{error}
				</p>
			)}

			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={handleSave}
					disabled={saving}
					className="inline-flex items-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong disabled:opacity-50 cursor-pointer"
				>
					{saving ? "Saving..." : "Save"}
				</button>
				<button
					type="button"
					onClick={onClose}
					disabled={saving}
					className="inline-flex items-center gap-2 border-2 border-stroke-strong px-4 py-2 font-mono text-xs uppercase tracking-wider text-fg-muted transition-colors hover:border-fg-muted hover:text-fg-primary disabled:opacity-50 cursor-pointer"
				>
					Cancel
				</button>
			</div>
		</div>
	);
}

export { ProfileIdentity };
export type { ProfileData, ProfileIdentityProps };
