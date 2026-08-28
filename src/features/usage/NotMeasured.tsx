import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CommandBlock } from "@/features/measured/CommandLine";
import {
	MONO_LABEL,
	NEVER_SYNCED_AUTO_NOTE,
	NEVER_SYNCED_BODY,
	NEVER_SYNCED_TITLE,
	OWNER_NOT_MEASURED_BODY,
	OWNER_NOT_MEASURED_TITLE,
	PRIVACY_FOOTNOTE,
	SYNC_CMD,
	SYNC_CMD_COMMENT,
} from "@/features/measured/copy";
import { cn } from "@/lib/utils";
import { NOT_MEASURED, NOT_MEASURED_NOTE, type RangeId } from "./copy";

/**
 * The visitor's invitation, addressed to the reader (#40): it says what stacks
 * can do and hands the reader the command for their own stack, and never
 * judges the author of this one.
 */
export function NeverMeasured() {
	return (
		<div className="border border-dashed border-stroke-strong px-6 py-10 text-center">
			<p className="text-lg text-fg-primary">{NEVER_SYNCED_TITLE}</p>
			<p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
				{NEVER_SYNCED_BODY}
			</p>
			<p className={cn(MONO_LABEL, "mt-6 text-fg-muted")}>
				have a stack of your own?{" "}
				<code className="text-fg-primary">{SYNC_CMD}</code>
			</p>
			<Link
				to="/sync"
				className="mt-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent-lime hover:underline"
			>
				how measuring works <ArrowRight size={12} />
			</Link>
		</div>
	);
}

/** The owner's teaching box (#58): the one command, on the page with the gap. */
export function OwnerNotMeasured() {
	return (
		<div className="border border-stroke-strong px-6 py-10 md:px-10">
			<p className="text-lg text-fg-primary">{OWNER_NOT_MEASURED_TITLE}</p>
			<p className="mt-2 max-w-xl text-sm text-fg-muted">
				{OWNER_NOT_MEASURED_BODY}
			</p>
			<div className="mt-6 max-w-xl">
				<CommandBlock
					commands={[{ cmd: SYNC_CMD, comment: SYNC_CMD_COMMENT }]}
				/>
			</div>
			<p className={cn(MONO_LABEL, "mt-4 text-fg-muted")}>{PRIVACY_FOOTNOTE}</p>
			{/* Automation gets one line here and no switch of its own, because
			    `enableAutoSync` refuses a machine that is not linked yet (#107
			    decision 3). The switch below still renders (#104 made it
			    independent of a reading); it just cannot be the fix for this. */}
			<p className="mt-4 max-w-xl text-sm text-fg-muted">
				{NEVER_SYNCED_AUTO_NOTE}
			</p>
			<Link
				to="/sync"
				className="mt-6 inline-flex items-center gap-2 bg-accent-lime px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-accent-lime-contrast transition-opacity hover:opacity-90"
			>
				how syncing works <ArrowRight size={14} />
			</Link>
		</div>
	);
}

/**
 * The headline slot when the range has no per-day rows and only a 30-day
 * snapshot exists (#306 rule 6): 7d and 24h read as not measured.
 */
export function NotMeasuredSlot({
	range,
	note,
}: {
	range: RangeId;
	note?: string;
}) {
	return (
		<div className="border border-dashed border-stroke-strong px-4 py-6">
			<p className="font-mono text-3xl font-black text-fg-muted">
				{NOT_MEASURED}
			</p>
			<p className="mt-1 text-sm text-fg-muted">
				{note ?? NOT_MEASURED_NOTE(range)}
			</p>
		</div>
	);
}
