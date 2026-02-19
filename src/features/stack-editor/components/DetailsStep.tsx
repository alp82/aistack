import { Twitter } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CreatorProfile } from "@/features/stack-editor/types";

type DetailsStepProps = {
	creator: CreatorProfile;
	oneLiner: string;
	onOneLinerChange: (value: string) => void;
	xHandle: string;
	onXHandleChange: (value: string) => void;
	isTeam: boolean;
	onIsTeamChange: (value: boolean) => void;
	teamSize: number;
	onTeamSizeChange: (value: number) => void;
};

function DetailsStep({
	creator,
	oneLiner,
	onOneLinerChange,
	xHandle,
	onXHandleChange,
	isTeam,
	onIsTeamChange,
	teamSize,
	onTeamSizeChange,
}: DetailsStepProps) {
	return (
		<div className="space-y-8">
			<div className="border-b border-stroke-subtle pb-6">
				<p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
					// Step 01
				</p>
				<h2 className="text-2xl font-black uppercase tracking-tight text-fg-primary">
					Stack Details
				</h2>
				<p className="mt-2 text-sm text-fg-muted">
					Tell us about yourself and your stack.
				</p>
			</div>

			<div className="flex items-start gap-6">
				<div className="flex size-16 shrink-0 items-center justify-center border-2 border-stroke-subtle bg-bg-panel-muted font-mono text-xl font-bold text-fg-primary">
					{creator.name.charAt(0).toUpperCase()}
				</div>
				<div className="flex-1 space-y-1">
					<p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
						Display Name
					</p>
					<p className="text-lg font-semibold text-fg-primary">{creator.name}</p>
				</div>
			</div>

			<div className="space-y-6">
				<FormField
					label="Stack Type"
					description="Are you building solo or with a team?"
				>
					<div className="flex gap-2">
						<Button
							type="button"
							onClick={() => onIsTeamChange(false)}
							className={cn(
								"flex-1 border-2 font-mono text-xs uppercase tracking-wider transition-all",
								!isTeam
									? "border-accent-lime bg-accent-lime text-accent-lime-contrast hover:bg-accent-lime-strong"
									: "border-stroke-subtle bg-transparent text-fg-muted hover:border-fg-muted hover:text-fg-primary",
							)}
						>
							Solo
						</Button>
						<Button
							type="button"
							onClick={() => onIsTeamChange(true)}
							className={cn(
								"flex-1 border-2 font-mono text-xs uppercase tracking-wider transition-all",
								isTeam
									? "border-accent-lime bg-accent-lime text-accent-lime-contrast hover:bg-accent-lime-strong"
									: "border-stroke-subtle bg-transparent text-fg-muted hover:border-fg-muted hover:text-fg-primary",
							)}
						>
							Team
						</Button>
					</div>
				</FormField>

				{isTeam && (
					<FormField
						label="Team Size"
						htmlFor="team-size"
						description="How many people are on your team?"
					>
						<Input
							id="team-size"
							type="number"
							min={2}
							value={teamSize}
							onChange={(e) => onTeamSizeChange(Number(e.target.value))}
						/>
					</FormField>
				)}

				<FormField
					label="X Handle"
					htmlFor="x-handle"
					description="Your X (Twitter) username for attribution."
				>
					<div className="flex items-center gap-2">
						<div className="flex size-10 items-center justify-center border-2 border-stroke-subtle bg-bg-panel-muted text-fg-muted">
							<Twitter className="size-4" />
						</div>
						<div className="relative flex-1">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted">@</span>
							<Input
								id="x-handle"
								value={xHandle}
								onChange={(e) => onXHandleChange(e.target.value)}
								placeholder="username"
								className="pl-7"
							/>
						</div>
					</div>
				</FormField>

				<FormField
					label="Short Bio"
					htmlFor="one-liner"
					required
					description="A one-liner about your stack (max 200 chars)."
				>
					<Input
						id="one-liner"
						value={oneLiner}
						onChange={(e) => onOneLinerChange(e.target.value)}
						placeholder="What is this stack about?"
						maxLength={200}
					/>
					<div className="text-right font-mono text-[10px] text-fg-muted">
						{oneLiner.length}/200
					</div>
				</FormField>
			</div>
		</div>
	);
}

export { DetailsStep };
export type { DetailsStepProps };
