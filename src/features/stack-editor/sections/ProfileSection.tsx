import { Twitter } from "lucide-react";
import { SectionCard } from "@/components/system/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EditorSectionStatus } from "@/features/stack-editor/editor-status";
import { SectionStatusBadge } from "@/features/stack-editor/sections/SectionStatusBadge";
import type { CreatorProfile } from "@/features/stack-editor/types";

type ProfileSectionProps = {
	creator: CreatorProfile;
	oneLiner: string;
	onOneLinerChange: (value: string) => void;
	xHandle: string;
	onXHandleChange: (value: string) => void;
	isTeam: boolean;
	onIsTeamChange: (value: boolean) => void;
	teamSize: number;
	onTeamSizeChange: (value: number) => void;
	status: EditorSectionStatus;
	isActive: boolean;
};

export function ProfileSection({
	creator,
	oneLiner,
	onOneLinerChange,
	xHandle,
	onXHandleChange,
	isTeam,
	onIsTeamChange,
	teamSize,
	onTeamSizeChange,
	status,
	isActive,
}: ProfileSectionProps) {
	const teamSizeInvalid =
		isTeam && (!Number.isInteger(teamSize) || teamSize < 2);
	const oneLinerInvalid = !oneLiner.trim();
	const oneLinerErrorId =
		status.state === "error" && oneLinerInvalid
			? "profile-one-liner-error"
			: undefined;
	const teamSizeErrorId =
		status.state === "error" && teamSizeInvalid
			? "profile-team-size-error"
			: undefined;

	return (
		<SectionCard
			id="section-profile"
			title="Profile Details"
			actions={<SectionStatusBadge status={status} isActive={isActive} />}
			className="bg-slate-800/30 border-gray-700/50 p-6"
		>
			<div className="flex items-start gap-6 mb-6">
				<div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
					{creator.name.charAt(0)}
				</div>
				<div className="flex-1 space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<Label className="text-sm text-gray-400 mb-1">Display Name</Label>
							<div className="text-lg font-semibold text-white">
								{creator.name}
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								onClick={() => onIsTeamChange(false)}
								className={`rounded-lg ${
									!isTeam
										? "bg-cyan-600 text-white hover:bg-cyan-700"
										: "bg-slate-700 text-gray-400 hover:text-white hover:bg-slate-600"
								}`}
							>
								Solo
							</Button>
							<Button
								type="button"
								onClick={() => onIsTeamChange(true)}
								className={`rounded-lg ${
									isTeam
										? "bg-cyan-600 text-white hover:bg-cyan-700"
										: "bg-slate-700 text-gray-400 hover:text-white hover:bg-slate-600"
								}`}
							>
								Team
							</Button>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label className="text-sm text-gray-400 mb-2">Handle</Label>
							<div className="flex items-center gap-2">
								<div className="flex items-center gap-1 text-gray-500">
									<Twitter className="h-4 w-4" />
									<span>@</span>
								</div>
								<Input
									value={xHandle}
									onChange={(event) => onXHandleChange(event.target.value)}
									placeholder="alperortac"
									className="flex-1 bg-slate-700/50 border-gray-600 text-white"
								/>
							</div>
						</div>
						{isTeam && (
							<div>
								<Label className="text-sm text-gray-400 mb-2">Team Size</Label>
								<Input
									type="number"
									min={2}
									max={99}
									value={teamSize}
									onChange={(event) =>
										onTeamSizeChange(Number(event.target.value))
									}
									className="bg-slate-700/50 border-gray-600 text-white"
									aria-invalid={teamSizeInvalid || undefined}
									aria-describedby={teamSizeErrorId}
								/>
								{teamSizeErrorId && (
									<p id={teamSizeErrorId} className="text-xs text-red-300 mt-1">
										Team size must be at least 2
									</p>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
			<div>
				<Label className="text-sm text-gray-400 mb-2">Short Bio</Label>
				<Input
					value={oneLiner}
					onChange={(event) => onOneLinerChange(event.target.value)}
					placeholder="What is this stack about?"
					className="bg-slate-700/50 border-gray-600 text-white"
					maxLength={200}
					aria-invalid={oneLinerInvalid || undefined}
					aria-describedby={oneLinerErrorId}
				/>
				{oneLinerErrorId && (
					<p id={oneLinerErrorId} className="text-xs text-red-300 mt-1">
						One-liner summary is required
					</p>
				)}
				<p className="text-xs text-gray-500 mt-1">
					Visible on search results and stack header.
				</p>
			</div>
		</SectionCard>
	);
}

export type { ProfileSectionProps };
