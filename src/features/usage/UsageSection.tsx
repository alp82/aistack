import { useQuery } from "convex/react";
import { RelativeTime } from "@/components/RelativeTime";
import { KICKER, MEASURED_ANCHOR, TITLE } from "@/features/measured/copy";
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { api } from "../../../convex/_generated/api";
import { NO_DAYS_IN_RANGE, type RangeId, type UsageRead } from "./copy";
import { LegacyStats } from "./LegacyStats";
import { NeverMeasured, OwnerNotMeasured } from "./NotMeasured";
import { StatsBlocks } from "./StatsBlocks";
import type { StatsRead } from "./stats";

/** Fixed 30-day Stats. Session evidence combines machines; the server selects Git. */
export function UsageSection({
	index,
	slug,
	isOwner,
	initialUsage,
	initialStats,
}: {
	index: number;
	slug: string;
	isOwner: boolean;
	stackToolSlugs: string[];
	range: RangeId;
	initialUsage?: UsageRead | null;
	initialStats?: StatsRead | null;
}) {
	const liveUsage = useQuery(api.measured.getUsageByStackSlug, {
		slug,
		range: "30d",
	});
	const liveStats = useQuery(api.workflow.getStatsByStackSlug, { slug });
	const usage = liveUsage === undefined ? initialUsage : liveUsage;
	const stats = liveStats === undefined ? initialStats : liveStats;
	const answered = usage !== undefined && stats !== undefined;
	const hasUsage = Boolean(usage?.hasDays || usage?.legacy);
	return (
		<Section
			index={index}
			id={MEASURED_ANCHOR}
			header={
				<SectionHeader
					index={String(index).padStart(2, "0")}
					kicker={KICKER}
					title={TITLE}
					metaAlwaysVisible
					meta={
						usage?.receivedAt ? (
							<span className="font-mono text-[11px] text-fg-muted">
								checked <RelativeTime at={usage.receivedAt} />
							</span>
						) : undefined
					}
				/>
			}
		>
			{!answered ? null : !hasUsage && !stats ? (
				isOwner ? (
					<OwnerNotMeasured />
				) : (
					<NeverMeasured />
				)
			) : (
				<>
					{usage?.legacy && !usage.hasDays && (
						<div className="mb-8">
							<LegacyStats legacy={usage.legacy} />
						</div>
					)}
					{usage?.hasDays && !usage.current && !stats && (
						<p className="font-mono text-sm text-fg-muted">
							{NO_DAYS_IN_RANGE("30d")}
						</p>
					)}
					<StatsBlocks key={slug} usage={usage ?? null} stats={stats ?? null} />
				</>
			)}
		</Section>
	);
}
