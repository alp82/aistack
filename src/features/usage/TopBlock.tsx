import {
	type LegacyFigure,
	MIX_KICKER,
	MONO_LABEL,
	NOT_MEASURED_MIX,
	notchNote,
} from "@/features/measured/copy";
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
	| { kind: "legacy"; legacy: LegacyFigure };

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
		<LegacyTop legacy={source.legacy} range={range} />
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
	const cacheReadTokens = current.models.reduce(
		(total, model) => total + model.tokens.cacheRead,
		0,
	);
	const freshTokens = current.totalTokens - cacheReadTokens;
	return (
		<div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
			<div>
				<MetricBlock
					tokens={current.totalTokens}
					freshTokens={freshTokens}
					cacheReadTokens={cacheReadTokens}
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
 * The legacy path (#306 rule 6, ADR-0011): a stack whose last reading predates
 * per-day rows keeps only its 30-day totals. 30d prints that exact figure
 * marked approximate, with no trail, no previous period and no model mix; 7d
 * and 24h read as not measured.
 */
function LegacyTop({
	legacy,
	range,
}: {
	legacy: LegacyFigure;
	range: RangeId;
}) {
	const notMeasured = range !== "30d";
	return (
		<div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
			<div>
				{notMeasured ? (
					<NotMeasuredSlot range={range} />
				) : (
					<>
						<MetricBlock
							tokens={legacy.tokens}
							usd={legacy.usd}
							windowDays={legacy.windowDays}
							trail={[]}
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
						</p>
					</>
				)}
			</div>
			<div className="opacity-40">
				<p className={cn(MONO_LABEL, "mb-4 text-accent-lime")}>{MIX_KICKER}</p>
				<p className="font-mono text-sm text-fg-muted">{NOT_MEASURED_MIX}</p>
			</div>
		</div>
	);
}
