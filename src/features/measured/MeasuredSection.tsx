import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { cn, timeAgo } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AutoSyncBox } from "./AutoSyncBox";
import { CommandBlock } from "./CommandLine";
import {
	fmtTokens,
	KICKER,
	lastCheckLine,
	MEASURED_ANCHOR,
	type MeasuredSnapshot,
	MIX_KICKER,
	MONO_LABEL,
	NEVER_SYNCED_AUTO_NOTE,
	NEVER_SYNCED_BODY,
	NEVER_SYNCED_TITLE,
	notchNote,
	OWNER_NOT_MEASURED_BODY,
	OWNER_NOT_MEASURED_TITLE,
	PRIVACY_FOOTNOTE,
	SYNC_CMD,
	SYNC_CMD_COMMENT,
	TITLE,
	totalUSD,
} from "./copy";
import { isStale } from "./freshness";
import {
	type MeasuredHistoryPoint,
	modelTrails,
	tokenDelta,
	tokenTrail,
} from "./history";
import { MetricBlock } from "./MetricBlock";
import { ModelShareRows } from "./ModelShareRows";

/**
 * Journey section 01 - the public measured display, living (#81, map #76).
 *
 * #46 built the still version off #40's variant B; #58 moved it to the front of
 * the journey; #80 gave it its history as variant I. What ran now literally
 * comes first, and it moves.
 *
 * TWO QUERIES, AND ONE OF THEM IS OPTIONAL. The current reading renders the
 * whole section: headline, model rows, stats, caveats. The series only ADDS the
 * watermark, the delta, the readings line and the notch. A stack with one sync,
 * or a page whose series has not answered yet, is a complete page and not a
 * broken one - which matters because two to five readings is what stacks have.
 *
 * Public and unauthenticated. A null current reading renders an INVITATION
 * addressed to the reader, never a demerit on the author - every stack but a few
 * is in that state, and a page that scolded them would be scolding almost
 * everybody. The one exception is the owner looking at their own unsynced stack:
 * they get the command that closes the gap (#58).
 */
export function MeasuredSection({
	index,
	slug,
	stackId,
	isOwner,
}: {
	index: number;
	slug: string;
	stackId: Id<"stacks">;
	isOwner: boolean;
}) {
	const snapshot = useQuery(api.measured.getCurrentByStackSlug, { slug });
	const history = useQuery(api.measured.getHistoryByStackSlug, { slug });

	// Past 48 hours the switch is the page's remedy, so it stands BEFORE the
	// reading it keeps arriving. A stack that never synced is not late - it may
	// be hand-curated - so it never promotes anything (#107 decisions 1 and 3).
	const staleSince =
		snapshot && isStale(snapshot.receivedAt) ? snapshot.receivedAt : null;

	// WHICH SIDE OF THE READING THE BOX SITS ON IS THE SNAPSHOT'S ANSWER, so the
	// box waits for that answer the way the invitation below does. Drawing it
	// first and moving it when the query lands would jump the page under the
	// owner on every load. It still does not wait for a READING (#104): a null
	// snapshot is an answer, and the box is the fix for exactly that stack.
	const placed = snapshot !== undefined;

	return (
		<Section index={index} id={MEASURED_ANCHOR}>
			<SectionHeader
				index={String(index).padStart(2, "0")}
				kicker={KICKER}
				title={TITLE}
				meta={snapshot ? `checked ${timeAgo(snapshot.receivedAt)}` : undefined}
			/>
			{/* The owner box (#104). It sits inside the section it governs -
			    automation is what keeps this reading arriving - and it does NOT
			    wait for a reading, because it is the fix for a stack that has
			    none. Renders nothing for a visitor, query and all. */}
			{placed && staleSince !== null && (
				<AutoSyncBox
					stackId={stackId}
					isOwner={isOwner}
					staleSince={staleSince}
				/>
			)}
			{/* Undefined is "not answered yet", and it must not read as "never
			    measured" - the invitation waits until the query has spoken. */}
			{snapshot === undefined ? null : snapshot === null ? (
				isOwner ? (
					<OwnerNotMeasured />
				) : (
					<NeverMeasured />
				)
			) : (
				<Reading snapshot={snapshot} points={history?.points ?? []} />
			)}
			{placed && staleSince === null && (
				<AutoSyncBox stackId={stackId} isOwner={isOwner} />
			)}
		</Section>
	);
}

function Reading({
	snapshot,
	points,
}: {
	snapshot: MeasuredSnapshot;
	points: readonly MeasuredHistoryPoint[];
}) {
	// The COMBINED headline (#66 decision 2, #243): tokens, sessions and dollars
	// sum honestly across every source, a source being one harness on one
	// machine. Day-sets and project-sets can overlap between sources, so those
	// two are a max and the label has to say so.
	const cost = totalUSD(snapshot);
	const multiSource = snapshot.harnesses.length > 1;
	const trails = modelTrails(snapshot.models, points);
	const firstAt = points.length > 0 ? points[0].at : null;
	const sinceLast = lastCheckLine(tokenDelta(points), fmtTokens);

	return (
		<div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
			{/* The reading. The one place on the page a measured dollar appears. */}
			<div>
				<MetricBlock
					tokens={snapshot.activity.totalTokens}
					usd={cost}
					windowDays={snapshot.window.days}
					trail={tokenTrail(points)}
				/>

				{sinceLast && (
					<p className="mt-3 px-3">
						<span
							className={cn(
								MONO_LABEL,
								"inline-flex items-center border border-stroke-subtle px-1.5 py-0.5 text-[10px] tracking-wider text-fg-muted",
							)}
						>
							{sinceLast}
						</span>
					</p>
				)}
			</div>

			{/* The split, then the activity stats. */}
			<div>
				<div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
					<p className={cn(MONO_LABEL, "text-accent-lime")}>{MIX_KICKER}</p>
					{firstAt !== null && points.length > 1 && (
						<p className="font-mono text-[11px] text-fg-muted">
							{notchNote(firstAt)}
						</p>
					)}
				</div>

				<ModelShareRows trails={trails} firstAt={firstAt} />

				<div className="mt-8 grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle sm:grid-cols-4">
					<Stat
						label="sessions"
						value={snapshot.activity.sessions.toLocaleString("en-US")}
					/>
					<Stat
						label={multiSource ? "active days (max)" : "active days"}
						value={`${snapshot.activity.activeDays} of ${snapshot.window.days}`}
					/>
					<Stat
						label="cache hits"
						value={`${Math.round(snapshot.activity.cacheHitShare * 100)}%`}
					/>
					<Stat
						label="run by subagents"
						value={`${Math.round(snapshot.activity.subagentShare * 100)}%`}
					/>
				</div>
			</div>
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-bg-canvas px-4 py-4">
			<p className="font-mono text-xl font-black text-fg-primary">{value}</p>
			<p className={cn(MONO_LABEL, "mt-1 text-fg-muted")}>{label}</p>
		</div>
	);
}

/**
 * The visitor's invitation, addressed to the reader (#40): it says what stacks
 * can do and hands the reader the command for their own stack, and never
 * judges the author of this one.
 */
function NeverMeasured() {
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
function OwnerNotMeasured() {
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
			    decision 3). The switch below still renders - #104 made it
			    independent of a reading - it just cannot be the fix for this. */}
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
