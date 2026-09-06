import {
	type LegacyFigure,
	MIX_KICKER,
	MONO_LABEL,
	NOT_MEASURED_MIX,
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
import { NotMeasuredSlot } from "./NotMeasured";
import { usageTrails } from "./trails";

const DAY_MS = 86_400_000;

/**
 * The top block, in the prototype's "stack" layout (#356, v37 round 8): the
 * headline strip (tokens, in, out and cached, cost with its hover card, the
 * previous-period chip lives in the hero tile) over the full-width model breakdown with its notches.
 * Nothing data-driven joins it.
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
	// Days exist, but none in this range: the slot says so, and the model
	// breakdown has nothing to draw, so it stays away.
	if (!current) {
		return <NotMeasuredSlot range={range} note={NO_DAYS_IN_RANGE(range)} />;
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
	const cost =
		current.cost && current.cost.pricingTables.length > 0 ? current.cost : null;
	// Three parts of the total: what the model read fresh (input and cache
	// writes), what it wrote, and what it read back from cache.
	type Tokens = (typeof current.models)[number]["tokens"];
	const sum = (pick: (t: Tokens) => number) =>
		current.models.reduce((total, model) => total + pick(model.tokens), 0);
	const cacheReadTokens = sum((t) => t.cacheRead);
	const inputTokens = sum((t) => t.input + t.cacheWrite);
	const outputTokens = sum((t) => t.output);
	return (
		<div>
			<MetricBlock
				tokens={current.totalTokens}
				inputTokens={inputTokens}
				outputTokens={outputTokens}
				cacheReadTokens={cacheReadTokens}
				usd={cost ? cost.usd : null}
				pricedShare={cost ? cost.pricedShare : null}
				pricingTables={cost ? cost.pricingTables : []}
				windowDays={days}
				trail={usage.series.map((point) => ({
					at: Date.parse(point.date),
					value: point.tokens,
				}))}
			/>
			<div className="mt-7">
				<p className={cn(MONO_LABEL, "mb-4 text-accent-lime")}>{MIX_KICKER}</p>
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
 * and 24h read as not measured. The breakdown slot stays, dimmed, so the
 * block keeps its shape and says what it is waiting for.
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
			<div className="mt-7 opacity-40">
				<p className={cn(MONO_LABEL, "mb-4 text-accent-lime")}>{MIX_KICKER}</p>
				<p className="font-mono text-sm text-fg-muted">{NOT_MEASURED_MIX}</p>
			</div>
		</div>
	);
}
