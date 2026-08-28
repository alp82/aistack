import {
	fmtTokens,
	lastCheckLine,
	type MeasuredSnapshot,
	MIX_KICKER,
	MONO_LABEL,
	notchNote,
	totalUSD,
} from "@/features/measured/copy";
import {
	type MeasuredHistoryPoint,
	modelTrails,
	tokenDelta,
	tokenTrail,
} from "@/features/measured/history";
import { MetricBlock } from "@/features/measured/MetricBlock";
import { ModelShareRows } from "@/features/measured/ModelShareRows";
import { cn } from "@/lib/utils";
import {
	APPROXIMATE,
	NO_DAYS_IN_RANGE,
	type RangeId,
	rangeDays,
	type UsageRead,
} from "./copy";
import { Delta } from "./Delta";
import { NotMeasuredSlot } from "./NotMeasured";
import { usageTrails } from "./trails";

const DAY_MS = 86_400_000;

/**
 * The first screen (spec, "The section"): the token headline on the left
 * (history watermark, cost line, previous-period chip), "where the tokens
 * went" on the right. Nothing data-driven joins it.
 */
export type TopSource =
	| { kind: "days"; usage: UsageRead }
	| {
			kind: "snapshot";
			snapshot: MeasuredSnapshot;
			points: readonly MeasuredHistoryPoint[];
	  };

export function TopBlock({
	source,
	range,
}: {
	source: TopSource;
	range: RangeId;
}) {
	return source.kind === "days" ? (
		<DaysTop usage={source.usage} range={range} />
	) : (
		<SnapshotTop
			snapshot={source.snapshot}
			points={source.points}
			range={range}
		/>
	);
}

function DaysTop({ usage, range }: { usage: UsageRead; range: RangeId }) {
	const current = usage.current;
	if (!current) {
		return (
			<div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
				<NotMeasuredSlot range={range} note={NO_DAYS_IN_RANGE(range)} />
			</div>
		);
	}
	const days = rangeDays(range);
	const currentAt = Date.parse(usage.from);
	const previousAt = currentAt - days * DAY_MS;
	const previous = usage.previous;
	const trails = usageTrails(
		current.models,
		previous?.models ?? null,
		currentAt,
		previousAt,
	);
	const usd =
		current.cost && current.cost.pricingTables.length > 0
			? current.cost.usd
			: null;
	return (
		<div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
			<div>
				<MetricBlock
					tokens={current.totalTokens}
					usd={usd}
					windowDays={days}
					trail={usage.series.map((point) => ({
						at: Date.parse(point.date),
						value: point.tokens,
					}))}
				/>
				{previous && (
					<p className="mt-2 px-3">
						<Delta
							comparison={{
								current: current.totalTokens,
								previous: previous.totalTokens,
							}}
							range={range}
						/>
					</p>
				)}
			</div>
			<div>
				<div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
					<p className={cn(MONO_LABEL, "text-accent-lime")}>{MIX_KICKER}</p>
					{previous && (
						<p className="font-mono text-[11px] text-fg-muted">
							{notchNote(previousAt)}
						</p>
					)}
				</div>
				<ModelShareRows
					trails={trails}
					firstAt={previous ? previousAt : null}
				/>
			</div>
		</div>
	);
}

/**
 * The legacy path (#306 rule 6): one 30-day snapshot and no per-day rows. 30d
 * prints the snapshot's exact figure marked approximate, with no previous
 * period; 7d and 24h read as not measured.
 */
function SnapshotTop({
	snapshot,
	points,
	range,
}: {
	snapshot: MeasuredSnapshot;
	points: readonly MeasuredHistoryPoint[];
	range: RangeId;
}) {
	const notMeasured = range !== "30d";
	const trails = modelTrails(snapshot.models, points);
	const firstAt = points.length > 0 ? points[0].at : null;
	const sinceLast = lastCheckLine(tokenDelta(points), fmtTokens);
	return (
		<div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
			<div>
				{notMeasured ? (
					<NotMeasuredSlot range={range} />
				) : (
					<>
						<MetricBlock
							tokens={snapshot.activity.totalTokens}
							usd={totalUSD(snapshot)}
							windowDays={snapshot.window.days}
							trail={tokenTrail(points)}
						/>
						<p className="mt-3 flex flex-wrap items-center gap-2 px-3">
							<span
								className={cn(
									MONO_LABEL,
									"inline-flex items-center border border-dashed border-stroke-strong px-1.5 py-0.5 text-[10px] tracking-wider text-fg-muted",
								)}
							>
								{APPROXIMATE}
							</span>
							{sinceLast && (
								<span
									className={cn(
										MONO_LABEL,
										"inline-flex items-center border border-stroke-subtle px-1.5 py-0.5 text-[10px] tracking-wider text-fg-muted",
									)}
								>
									{sinceLast}
								</span>
							)}
						</p>
					</>
				)}
			</div>
			<div className={cn(notMeasured && "opacity-40")}>
				<div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
					<p className={cn(MONO_LABEL, "text-accent-lime")}>{MIX_KICKER}</p>
					{firstAt !== null && points.length > 1 && (
						<p className="font-mono text-[11px] text-fg-muted">
							{notchNote(firstAt)}
						</p>
					)}
				</div>
				<ModelShareRows trails={trails} firstAt={firstAt} />
			</div>
		</div>
	);
}
