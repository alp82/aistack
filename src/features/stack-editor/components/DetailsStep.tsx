import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { AvatarEditor } from "@/components/AvatarEditor";
import { Input } from "@/components/ui/input";
import { AccentPicker } from "@/features/stack-editor/components/AccentPicker";
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
	accentPreset: string;
	onAccentPresetChange: (value: string) => void;
	pendingAvatar: PendingAvatar;
	onAvatarChange: (pending: PendingAvatar, previewUrl?: string) => void;
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
	accentPreset,
	onAccentPresetChange,
	pendingAvatar,
	onAvatarChange,
	isTeam,
	onIsTeamChange,
	teamSize,
	onTeamSizeChange,
	guestSession,
}: DetailsStepProps) {
	const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
	const [imgError, setImgError] = useState(false);

	// Guest staging only: a dataUrl avatar renders inline; anything else falls
	// back to initials. The staged avatar lands on the creator profile at the
	// first authed save (it never becomes stack data).
	const displayAvatarUrl =
		pendingAvatar.kind === "dataUrl" ? pendingAvatar.url : "";

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

			{/* Avatar Editor Modal (guest staging path only) */}
			{guestSession && (
				<AvatarEditor
					isOpen={isAvatarEditorOpen}
					onClose={() => setIsAvatarEditorOpen(false)}
					currentAvatarUrl={displayAvatarUrl}
					pendingAvatarKind={pendingAvatar.kind}
					creatorName={creator.name}
					onAvatarChange={onAvatarChange}
					guestSession={guestSession}
				/>
			)}

			{/* Main layout */}
			<div
				className={cn(
					"flex flex-col gap-4 sm:gap-6",
					guestSession && "sm:grid sm:grid-cols-[auto_1fr]",
				)}
			>
				{/* Avatar - guest staging only; authed avatars live on the profile */}
				{guestSession && (
					<div className="sm:row-span-3">
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
				)}

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
					<div className="flex shrink-0 sm:w-[176px]">
						<button
							type="button"
							onClick={() => onIsTeamChange(false)}
							className={cn(
								"border-2 border-r-0 font-mono text-xs uppercase tracking-wider transition-all px-4 h-12 cursor-pointer flex-1",
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
									"w-12 h-8 text-center rounded-none text-xs font-bold transition-colors",
									isTeam
										? "bg-accent-lime-contrast text-accent-lime"
										: "bg-bg-panel-muted text-fg-muted",
								)}
							/>
						</button>
					</div>
				</div>

				{/* Row 2: accent picker, gap-aligned to Row 1 */}
				<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
					<AccentPicker
						value={accentPreset}
						onChange={onAccentPresetChange}
						className="w-full sm:w-[176px] shrink-0 sm:ml-auto"
					/>
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
