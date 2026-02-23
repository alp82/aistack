import { ExternalLink, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import XLogoIcon from "@/components/icon/XLogoIcon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AvatarEditor } from "@/components/AvatarEditor";
import type { CreatorProfile } from "@/features/stack-editor/types";

type LinkType = "x" | "personal" | "project" | null;

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
	projectPageUrl: string;
	onProjectPageUrlChange: (value: string) => void;
	avatarUrl: string;
	onAvatarUrlChange: (value: string) => void;
	defaultAvatarUrl?: string;
	isTeam: boolean;
	onIsTeamChange: (value: boolean) => void;
	teamSize: number;
	onTeamSizeChange: (value: number) => void;
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
	projectPageUrl,
	onProjectPageUrlChange,
	avatarUrl,
	onAvatarUrlChange,
	defaultAvatarUrl,
	isTeam,
	onIsTeamChange,
	teamSize,
	onTeamSizeChange,
}: DetailsStepProps) {
	const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
	const [activeLinkInput, setActiveLinkInput] = useState<LinkType>(null);
	const linkRowRef = useRef<HTMLDivElement>(null);

	// Close link input when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (linkRowRef.current && !linkRowRef.current.contains(event.target as Node)) {
				setActiveLinkInput(null);
			}
		}

		if (activeLinkInput) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [activeLinkInput]);

	const toggleLinkInput = (type: LinkType) => {
		setActiveLinkInput(activeLinkInput === type ? null : type);
	};

	// Determine which avatar to display
	const displayAvatarUrl = avatarUrl || defaultAvatarUrl;
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
				currentAvatarUrl={avatarUrl}
				defaultAvatarUrl={defaultAvatarUrl}
				creatorName={creator.name}
				onAvatarChange={onAvatarUrlChange}
			/>

			{/* Main grid layout */}
			<div className="grid grid-cols-[auto_1fr] gap-6">
				{/* Avatar - spans 2 rows */}
				<div className="row-span-2">
					<button
						type="button"
						onClick={() => setIsAvatarEditorOpen(true)}
						className="group relative block"
					>
						{displayAvatarUrl ? (
							<img
								src={displayAvatarUrl}
								alt={creator.name}
								className="size-28 border-[3px] border-stroke-strong object-cover bg-bg-panel-muted"
							/>
						) : (
							<div className="flex size-28 items-center justify-center border-[3px] border-stroke-strong bg-bg-panel-muted font-mono text-4xl font-bold text-fg-primary">
								{initials}
							</div>
						)}
						{/* Avatar edit overlay */}
						<div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity border-[3px] border-accent-lime">
							<User className="size-6 text-white" />
						</div>
					</button>
					<p className="mt-2 font-mono text-[10px] text-fg-muted text-center">
						Click to edit
					</p>
				</div>

				{/* Row 1: Stack Name + Solo/Team */}
				<div className="flex items-center gap-4">
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
								"border-2 border-r-0 font-mono text-xs uppercase tracking-wider transition-all px-4 h-12 cursor-pointer",
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
								"border-2 font-mono text-xs uppercase tracking-wider transition-all px-3 h-12 flex items-center gap-2 cursor-pointer",
								isTeam
									? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
									: "border-stroke-subtle bg-transparent text-fg-muted hover:text-fg-primary",
							)}
						>
							<span>Team</span>
							<input
								type="number"
								min={2}
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
									"w-10 h-7 text-center rounded text-xs font-bold transition-colors",
									isTeam
										? "bg-accent-lime-contrast text-accent-lime"
										: "bg-bg-panel-muted text-fg-muted"
								)}
							/>
						</button>
					</div>
				</div>

				{/* Row 2: Social Links - 3 equal columns */}
				<div ref={linkRowRef} className="grid grid-cols-3 gap-0">
					{/* X Handle */}
					<div className="border-2 border-stroke-subtle border-r-0">
						{activeLinkInput === "x" ? (
							<div className="flex items-center h-12 px-3 bg-bg-panel">
								<XLogoIcon className="size-4 shrink-0" />
								<Input
									value={xHandle}
									onChange={(e) => onXHandleChange(e.target.value)}
									placeholder="username"
									prefix="@"
									autoFocus
									className="border-0 h-full bg-transparent focus:ring-0"
								/>
							</div>
						) : (
							<button
								type="button"
								onClick={() => toggleLinkInput("x")}
								className={cn(
									"flex items-center justify-center gap-2 w-full h-12 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer",
									xHandle
										? "text-fg-primary hover:bg-accent-lime/10"
										: "text-fg-muted hover:text-fg-primary hover:bg-bg-panel-muted"
								)}
							>
								<XLogoIcon className="size-4" />
								<span>{xHandle ? `@${xHandle}` : "X Profile"}</span>
							</button>
						)}
					</div>

					{/* Personal Page URL */}
					<div className="border-2 border-stroke-subtle border-r-0">
						{activeLinkInput === "personal" ? (
							<div className="flex items-center h-12 px-3 bg-bg-panel">
								<User className="size-4 shrink-0 text-fg-muted" />
								<Input
									value={personalPageUrl}
									onChange={(e) => onPersonalPageUrlChange(e.target.value)}
									placeholder="https://yoursite.com"
									autoFocus
									className="border-0 h-full bg-transparent focus:ring-0"
								/>
							</div>
						) : (
							<button
								type="button"
								onClick={() => toggleLinkInput("personal")}
								className={cn(
									"flex items-center justify-center gap-2 w-full h-12 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer",
									personalPageUrl
										? "text-fg-primary hover:bg-accent-lime/10"
										: "text-fg-muted hover:text-fg-primary hover:bg-bg-panel-muted"
								)}
							>
								<User className="size-4" />
								<span className="truncate max-w-[120px]">
									{personalPageUrl ? personalPageUrl.replace(/^https?:\/\//, "") : "Portfolio"}
								</span>
							</button>
						)}
					</div>

					{/* Project Page URL */}
					<div className="border-2 border-stroke-subtle">
						{activeLinkInput === "project" ? (
							<div className="flex items-center h-12 px-3 bg-bg-panel">
								<ExternalLink className="size-4 shrink-0 text-fg-muted" />
								<Input
									value={projectPageUrl}
									onChange={(e) => onProjectPageUrlChange(e.target.value)}
									placeholder="https://project.com"
									autoFocus
									className="border-0 h-full bg-transparent focus:ring-0"
								/>
							</div>
						) : (
							<button
								type="button"
								onClick={() => toggleLinkInput("project")}
								className={cn(
									"flex items-center justify-center gap-2 w-full h-12 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer",
									projectPageUrl
										? "text-fg-primary hover:bg-accent-lime/10"
										: "text-fg-muted hover:text-fg-primary hover:bg-bg-panel-muted"
								)}
							>
								<ExternalLink className="size-4" />
								<span className="truncate max-w-[120px]">
									{projectPageUrl ? projectPageUrl.replace(/^https?:\/\//, "") : "Project"}
								</span>
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Short Summary (textarea) */}
			<div className="space-y-1">
				<div className="flex items-center justify-between">
					<label htmlFor="one-liner" className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
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
