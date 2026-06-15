import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { AvatarEditor } from "@/components/AvatarEditor";
import XLogoIcon from "@/components/icon/XLogoIcon";
import { Input } from "@/components/ui/input";
import type {
	CreatorProfile,
	PendingAvatar,
} from "@/features/stack-editor/types";
import { cn } from "@/lib/utils";

type DetailsStepProps = {
	creator: CreatorProfile;
	name: string;
	onNameChange: (value: string) => void;
	oneLiner: string;
	onOneLinerChange: (value: string) => void;
	xHandle: string;
	onXHandleChange: (value: string) => void;
	personalPageUrl: string;
	onPersonalPageUrlChange: (value: string) => void;
	pendingAvatar: PendingAvatar;
	onAvatarChange: (pending: PendingAvatar, previewUrl?: string) => void;
	avatarPreviewUrl?: string;
	defaultAvatarUrl?: string;
	isTeam: boolean;
	onIsTeamChange: (value: boolean) => void;
	teamSize: number;
	onTeamSizeChange: (value: number) => void;
	guestSession?: boolean;
};

function DetailsStep({
	creator,
	name,
	onNameChange,
	oneLiner,
	onOneLinerChange,
	xHandle,
	onXHandleChange,
	personalPageUrl,
	onPersonalPageUrlChange,
	pendingAvatar,
	onAvatarChange,
	avatarPreviewUrl,
	defaultAvatarUrl,
	isTeam,
	onIsTeamChange,
	teamSize,
	onTeamSizeChange,
	guestSession,
}: DetailsStepProps) {
	const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
	const [imgError, setImgError] = useState(false);
	// A storageId uploaded in this session resolves to a live preview URL the
	// AvatarEditor hands up (never persisted — the stored avatar is the id).
	const [sessionPreviewUrl, setSessionPreviewUrl] = useState<
		string | undefined
	>(undefined);

	// dataUrl → render the inline data URL; storageId → render its resolved
	// preview (this session's upload, else the read-time URL); none → initials.
	const displayAvatarUrl =
		pendingAvatar.kind === "dataUrl"
			? pendingAvatar.url
			: pendingAvatar.kind === "storageId"
				? (sessionPreviewUrl ?? avatarPreviewUrl ?? "")
				: "";

	const handleAvatarChange = (pending: PendingAvatar, previewUrl?: string) => {
		setSessionPreviewUrl(previewUrl);
		onAvatarChange(pending, previewUrl);
	};

	// Reset error when URL changes
	useEffect(() => {
		setImgError(false);
	}, [displayAvatarUrl]);
	const initials = creator.name.charAt(0).toUpperCase();

	return (
		<div className="space-y-8">
			<div>
				<p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
					// STEP 01: ABOUT
				</p>
			</div>

			{/* Avatar Editor Modal */}
			<AvatarEditor
				isOpen={isAvatarEditorOpen}
				onClose={() => setIsAvatarEditorOpen(false)}
				currentAvatarUrl={displayAvatarUrl}
				defaultAvatarUrl={defaultAvatarUrl}
				pendingAvatarKind={pendingAvatar.kind}
				creatorName={creator.name}
				onAvatarChange={handleAvatarChange}
				guestSession={guestSession}
			/>

			{/* Main layout */}
			<div className="flex flex-col sm:grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-6">
				{/* Avatar */}
				<div className="sm:row-span-2">
					<button
						type="button"
						onClick={() => setIsAvatarEditorOpen(true)}
						className="group relative block cursor-pointer"
						title="Click to edit avatar"
					>
						{displayAvatarUrl && !imgError ? (
							<img
								src={displayAvatarUrl}
								alt={creator.name}
								className="size-20 sm:size-30 border-[3px] border-stroke-strong object-cover bg-bg-panel-muted"
								onError={() => setImgError(true)}
							/>
						) : (
							<div className="flex size-20 sm:size-30 items-center justify-center border-[3px] border-stroke-strong bg-bg-panel-muted font-mono text-2xl sm:text-3xl font-bold text-fg-primary">
								{initials}
							</div>
						)}
						{/* Avatar edit overlay */}
						<div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity border-[3px] border-accent-lime">
							<User className="size-6 text-white" />
						</div>
					</button>
				</div>

				{/* Row 1: Stack Name + Solo/Team */}
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
					<Input
						id="stack-name"
						value={name}
						onChange={(e) => onNameChange(e.target.value)}
						placeholder="My AI Stack"
						className="text-lg font-semibold h-12 flex-1"
					/>
					{/* Solo/Team toggle */}
					<div className="flex shrink-0">
						<button
							type="button"
							onClick={() => onIsTeamChange(false)}
							className={cn(
								"border-2 border-r-0 font-mono text-xs uppercase tracking-wider transition-all px-4 h-12 cursor-pointer flex-1 sm:flex-initial",
								!isTeam
									? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
									: "border-stroke-subtle bg-transparent text-fg-muted hover:text-fg-primary",
							)}
						>
							Solo
						</button>
						<button
							type="button"
							onClick={() => onIsTeamChange(true)}
							className={cn(
								"border-2 font-mono text-xs uppercase tracking-wider transition-all px-3 h-12 flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial",
								isTeam
									? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
									: "border-stroke-subtle bg-transparent text-fg-muted hover:text-fg-primary",
							)}
						>
							<span>Team</span>
							<input
								type="number"
								min={2}
								max={99}
								value={teamSize}
								onChange={(e) => {
									e.stopPropagation();
									onTeamSizeChange(Number(e.target.value));
								}}
								onClick={(e) => {
									e.stopPropagation();
									if (!isTeam) onIsTeamChange(true);
								}}
								className={cn(
									"w-12 h-8 text-center rounded text-xs font-bold transition-colors",
									isTeam
										? "bg-accent-lime-contrast text-accent-lime"
										: "bg-bg-panel-muted text-fg-muted",
								)}
							/>
						</button>
					</div>
				</div>

				{/* Row 2: Social Links - stacked on mobile, row on desktop */}
				<div className="flex flex-col sm:flex-row">
					{/* X Handle */}
					<div className="flex flex-1 items-center border-2 border-stroke-subtle sm:-mr-[2px] -mb-[2px] sm:mb-0 bg-bg-panel-muted px-3 h-12 focus-within:border-accent-lime focus-within:z-10">
						<XLogoIcon className="size-4 shrink-0 text-fg-muted" />
						<span className="ml-2 font-mono text-xs text-fg-muted">@</span>
						<input
							type="text"
							value={xHandle}
							onChange={(e) => onXHandleChange(e.target.value)}
							placeholder="username"
							className="flex-1 bg-transparent border-0 px-1 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:outline-none focus:ring-0"
						/>
					</div>

					{/* Personal Page URL */}
					<div className="flex flex-1 items-center border-2 border-stroke-subtle bg-bg-panel-muted px-3 h-12 focus-within:border-accent-lime focus-within:z-10">
						<User className="size-4 shrink-0 text-fg-muted" />
						<input
							type="text"
							value={personalPageUrl}
							onChange={(e) => onPersonalPageUrlChange(e.target.value)}
							onBlur={(e) => {
								// The server requires an https URL — normalize a bare
								// domain ("example.com") to https so the save doesn't fail
								// at the mutation boundary for the common input.
								const v = e.target.value.trim();
								if (v && !/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) {
									onPersonalPageUrlChange(`https://${v}`);
								}
							}}
							placeholder="https://yourportfolio.com"
							className="flex-1 bg-transparent border-0 px-2 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:outline-none focus:ring-0"
						/>
					</div>
				</div>
			</div>

			{/* Short Summary (textarea) */}
			<div className="space-y-1">
				<div className="flex items-center justify-between">
					<label
						htmlFor="one-liner"
						className="font-mono text-[10px] uppercase tracking-widest text-fg-muted"
					>
						Short Summary
					</label>
					<span className="font-mono text-[10px] text-fg-muted">
						{oneLiner.length}/200
					</span>
				</div>
				<textarea
					id="one-liner"
					value={oneLiner}
					onChange={(e) => onOneLinerChange(e.target.value)}
					placeholder="What is this stack about? Describe your workflow and key tools..."
					maxLength={200}
					rows={2}
					className="w-full px-3 py-2 text-base border-2 border-stroke-subtle bg-bg-panel-muted text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none resize-none"
				/>
			</div>
		</div>
	);
}

export { DetailsStep };
export type { DetailsStepProps };
