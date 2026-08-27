import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { RelativeTime } from "@/components/RelativeTime";
import { BrutalistSelect } from "@/components/ui/brutalist-select";
import { BrutalistToggle } from "@/components/ui/brutalist-toggle";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
	AUTO_ON_CMD,
	autoSyncExplainer,
	autoSyncState,
	frequencyChoices,
	frequencyLabel,
	NEVER_FIRED_FIX,
	NEVER_FIRED_LINE,
	OFF_LINE,
	OFF_REVOKE_NOTE,
	ON_NOTE,
	runningLine,
	SWITCH_TITLE,
	stalePromptLine,
} from "./autoSync";
import { CommandBlock } from "./CommandLine";
import { MONO_LABEL, SYNC_CMD } from "./copy";
import { syncAgo } from "./freshness";

/**
 * The auto-sync switch in the owner box (#104, map #76, from #100 decision 5).
 *
 * The permission used to live on the machine that turned it on, so "stop
 * publishing on a timer" was a sentence only that machine could say. #102 moved
 * it onto the stack. This box is where the owner says it, from any browser.
 *
 * OWNER-ONLY, AND SKIPPED FOR EVERYONE ELSE. `autoSync.get` refuses a
 * non-owner, so asking it from a public page would be a thrown query on every
 * visitor's render. The gate is the argument, not a hidden element: a visitor's
 * HTML carries no box and no schedule.
 *
 * OFF IS A COMPLETE REVOKE, and the box says what a revoke leaves behind. Hooks
 * are dumb local triggers. They keep firing on machines this browser has never
 * seen, and #102 refuses what they send, so the honest sentence is "they
 * publish nothing" and not "remove them".
 *
 * IT IS ALSO THE PAGE'S ONE REMEDY (#108, from #107 decision 1). Past 48 hours
 * the section promotes this box above the reading and passes `staleSince`, and
 * the box leads with the prompt instead of its resting sentence. Nothing else
 * on the page asks the owner for anything, which is what keeps the switch and a
 * callout from reading as two features.
 */
export function AutoSyncBox({
	stackId,
	isOwner,
	staleSince = null,
}: {
	stackId: Id<"stacks">;
	isOwner: boolean;
	/** The last sync, when it is past 48 hours old. Null is the resting box. */
	staleSince?: number | null;
}) {
	const flag = useQuery(api.autoSync.get, isOwner ? { stackId } : "skip");
	const set = useMutation(api.autoSync.set);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Undefined is "not answered yet". Drawing off before the server has spoken
	// tells the owner their automation is revoked while it is still running.
	if (!isOwner || flag === undefined) return null;

	const state = autoSyncState(flag);
	const on = state.kind !== "off";
	// An off stack still remembers its interval, and the switch sends what it is
	// showing - turning automation back on must not move a machine that chose six
	// hours onto the default.
	const hours = flag.autoSync?.frequencyHours ?? 24;

	async function write(enabled: boolean, frequencyHours: number) {
		setSaving(true);
		setError(null);
		try {
			await set({ stackId, enabled, frequencyHours });
		} catch (e) {
			setError(e instanceof Error ? e.message : "Could not save that.");
		} finally {
			setSaving(false);
		}
	}

	// Leading only means the box speaks first. It never changes what the switch
	// does, and an owner whose automation is already on gets no second ask -
	// their box states its last automatic sync and stops (#107 decision 4).
	const lead = staleSince !== null;

	return (
		<div
			className={cn(
				"border bg-bg-panel px-6 py-6 md:px-8",
				lead ? "mb-10 border-accent-lime" : "mt-10 border-stroke-strong",
			)}
		>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<p
						className={cn(
							MONO_LABEL,
							lead ? "text-accent-lime" : "text-fg-muted",
						)}
					>
						{SWITCH_TITLE}
					</p>
					<p className="mt-2 text-sm text-fg-primary">
						{state.kind === "off" ? (
							lead ? (
								stalePromptLine(syncAgo(staleSince))
							) : (
								OFF_LINE
							)
						) : state.kind === "running" ? (
							<>
								{runningLine(state.frequencyHours)}{" "}
								<span className="text-fg-muted">
									Last automatic sync <RelativeTime at={state.at} />.
								</span>
							</>
						) : (
							<>
								{runningLine(state.frequencyHours)}{" "}
								<span className="text-fg-muted">{NEVER_FIRED_LINE}</span>
							</>
						)}
					</p>
				</div>
				<div className="flex items-center gap-3">
					{on && (
						<BrutalistSelect
							size="sm"
							className="w-40"
							value={String(hours)}
							options={frequencyChoices(hours).map((h) => ({
								value: String(h),
								label: frequencyLabel(h),
							}))}
							onChange={(v) => write(true, Number(v))}
						/>
					)}
					<BrutalistToggle
						size="sm"
						value={on ? "on" : "off"}
						options={[
							{ value: "off", label: "off" },
							{ value: "on", label: "on" },
						]}
						onChange={(v) => write(v === "on", hours)}
					/>
				</div>
			</div>

			{/* Off and resting says what a revoke leaves behind. Off and leading
			    says what turning it on would do, and hands over the command that
			    writes the same flag as the toggle. */}
			{state.kind === "off" && (
				<>
					<p className="mt-3 max-w-prose text-xs leading-relaxed text-fg-muted">
						{lead ? autoSyncExplainer(hours) : OFF_REVOKE_NOTE}
					</p>
					{lead && (
						<div className="mt-4 max-w-xl">
							<CommandBlock
								commands={[
									{ cmd: AUTO_ON_CMD, comment: "same switch, from the CLI" },
								]}
							/>
						</div>
					)}
				</>
			)}

			{state.kind === "never-fired" && (
				<div className="mt-4 max-w-xl">
					<p className="mb-3 max-w-prose text-xs leading-relaxed text-fg-muted">
						{NEVER_FIRED_FIX}
					</p>
					<CommandBlock commands={[{ cmd: SYNC_CMD, comment: "once" }]} />
				</div>
			)}

			{state.kind === "running" && (
				<p className="mt-3 max-w-prose text-xs leading-relaxed text-fg-muted">
					{ON_NOTE}
				</p>
			)}

			{saving && (
				<p className={cn(MONO_LABEL, "mt-3 text-fg-muted")}>saving…</p>
			)}
			{error && (
				<p className="mt-3 text-xs text-destructive" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
