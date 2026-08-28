import { useQuery } from "convex/react";
import { ArrowDown } from "lucide-react";
import { RelativeTime } from "@/components/RelativeTime";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import {
	activeDaysLine,
	KICKER,
	leadModelLine,
	MEASURED_ANCHOR,
	MONO_LABEL,
	sessionsLine,
	TITLE,
} from "./copy";
import { isStale } from "./freshness";

/**
 * The hero's measured strip - the seam between what a stack claims and what ran.
 *
 * Wayfinder ticket #46 (map #29), building the H2 hero locked by #40. Two rules
 * shape it, and both are decisions:
 *
 *   1. DOLLAR-FREE. The authored price tile stays the only money in the hero.
 *      The measured dollar figure appears exactly once on the page, in section
 *      02, beside the sentence that names the window as the thing that moves.
 *   2. NOTHING WITHOUT A READING. A hero stamp reading "not measured" would
 *      make not installing a CLI a public demerit on every stack but one.
 *   3. THE DOT TURNS AT 48 HOURS, with the stamp in section 02 (#107 decision
 *      2). It used to read the snapshot's own `isFresh`, which is the 7-day
 *      window the leaderboard ranks on - a second age for one sync, on the line
 *      the reader meets first.
 *
 * It carries only measured facts. The authored tool and model counts are
 * deliberately absent: inside a band labelled "from this machine" they would
 * read as things the machine reported, which they are not.
 */
export function HeroMeasuredStrip({ slug }: { slug: string }) {
	// The strip's figures are the 30-day usage fold, the same numbers section
	// 01 opens with (#307). A stack that never published days keeps its legacy
	// figure (ADR-0011). Nothing else dates or feeds the strip.
	const usage = useQuery(api.measured.getUsageByStackSlug, { slug });
	if (!usage || usage.receivedAt === null) return null;
	const days = usage.hasDays && usage.current ? usage.current : null;
	const legacy = usage.legacy;
	if (!days && !legacy) return null;

	const sessions = sessionsLine(days ? days.sessions : (legacy?.sessions ?? 0));
	const activeDays = days
		? activeDaysLine(days.activeDays, 30)
		: activeDaysLine(legacy?.activeDays ?? 0, legacy?.windowDays ?? 30);
	const lead = days ? leadModelLine(days) : null;
	const receivedAt = usage.receivedAt;

	return (
		<a
			href={`#${MEASURED_ANCHOR}`}
			className="mt-8 flex w-full flex-wrap items-center gap-x-4 gap-y-2 border-y border-accent-lime/40 bg-accent-lime/5 px-5 py-3 text-left transition-colors hover:bg-accent-lime/10"
		>
			<span
				className={cn(
					MONO_LABEL,
					"inline-flex items-center gap-2 text-accent-lime",
				)}
			>
				<span
					aria-hidden="true"
					className={cn(
						"inline-block size-1.5 shrink-0",
						isStale(receivedAt) ? "bg-orange-400" : "bg-accent-lime",
					)}
				/>
				{KICKER}
			</span>
			<span className="font-mono text-sm text-fg-primary">{sessions}</span>
			<Dot />
			<span className="font-mono text-sm text-fg-primary">{activeDays}</span>
			{lead && (
				<>
					<Dot />
					<span className="font-mono text-sm text-fg-primary">{lead}</span>
				</>
			)}
			<span className={cn(MONO_LABEL, "ml-auto text-fg-muted")}>
				checked <RelativeTime at={receivedAt} />
			</span>
			<span className={cn(MONO_LABEL, "text-accent-lime")}>
				{TITLE}
				<ArrowDown className="ml-1 inline size-3" />
			</span>
		</a>
	);
}

function Dot() {
	return (
		<span aria-hidden="true" className="text-stroke-strong">
			·
		</span>
	);
}
