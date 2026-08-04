/**
 * PROTOTYPE — Variant D: THEN / NOW. Wayfinder ticket #80, second round.
 *
 * C-family. The owner's locked headline (tokens leading, spend under it, one
 * hover area over both) plus the smallest possible answer to the mix question:
 * the ribbon over time collapses to TWO stacked bars, "then" and "now", one
 * above the other. Two rows of 10px instead of a 120px chart.
 *
 * The bet: with little movement, a before/after pair states the same fact more
 * honestly than a ribbon. A ribbon with no slope reads as a chart that failed.
 * Two bars that look alike simply say "the mix held".
 */
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { cn, timeAgo } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { DeltaChip, MixBar, mixSeries, Sparkline } from "./charts";
import {
	fmtDay,
	fmtDelta,
	fmtTokens,
	harnessLabel,
	type ProtoPoint,
} from "./fixtures";
import { MetricBlock } from "./MetricBlock";

export const VARIANT_D_NAME = "Then / now — mix as two bars";

export function VariantD({
	index,
	anchor,
	points,
}: {
	index: number;
	anchor: string;
	points: ProtoPoint[];
}) {
	const now = points[points.length - 1];
	const first = points[0];
	const prev = points.length > 1 ? points[points.length - 2] : null;
	const series = mixSeries(points);
	const multi = points.length > 1;

	return (
		<Section index={index} id={anchor}>
			<SectionHeader
				index={String(index).padStart(2, "0")}
				kicker="// sync"
				title="Actual Usage"
				meta={`checked ${timeAgo(now.at)}`}
			/>

			<div className="grid gap-10 md:grid-cols-[minmax(0,24rem)_1fr]">
				<div>
					<MetricBlock point={now}>
						{multi && (
							<div className="mt-5 border-t border-stroke-subtle pt-3">
								<Sparkline
									values={points.map((p) => p.tokens)}
									width={300}
									height={40}
									className="w-full"
								/>
								<p
									className={cn(
										MONO_LABEL,
										"mt-2 flex justify-between text-fg-muted",
									)}
								>
									<span>{fmtDay(first.at)}</span>
									<span>{points.length} readings</span>
									<span>now</span>
								</p>
							</div>
						)}
					</MetricBlock>

					{prev && (
						<p className="mt-3 px-3">
							<DeltaChip>
								{fmtDelta(now.tokens - prev.tokens, fmtTokens)} since the last
								check
							</DeltaChip>
						</p>
					)}

					<p className="mt-6 max-w-sm px-3 text-sm leading-relaxed text-fg-muted">
						This is a rolling {now.windowDays}-day reading, not a running total.
						It moves every time it is checked, because the window moves with it.
					</p>

					<div className="mt-6 space-y-1 px-3">
						<p className={cn(MONO_LABEL, "text-fg-muted")}>
							{now.from} → {now.to}
						</p>
						{now.harnesses.map((h) => (
							<p key={h.name} className={cn(MONO_LABEL, "text-fg-muted")}>
								read from {harnessLabel(h.name)} · {fmtTokens(h.tokens)}
							</p>
						))}
					</div>
				</div>

				<div>
					{/* The whole mix-over-time story, in two rows. */}
					{multi ? (
						<div className="mb-8">
							<p className={cn(MONO_LABEL, "mb-3 text-accent-lime")}>
								where the tokens went
							</p>
							<div className="space-y-1.5">
								<Row label={fmtDay(first.at)} faded>
									<MixBar point={first} series={series} height={6} />
								</Row>
								<Row label="now">
									<MixBar point={now} series={series} height={14} />
								</Row>
							</div>
						</div>
					) : (
						<div className="mb-8">
							<p className={cn(MONO_LABEL, "mb-3 text-accent-lime")}>
								where the tokens went
							</p>
							<MixBar point={now} series={series} height={14} />
						</div>
					)}

					<div className="space-y-2.5">
						{series.ids.map((id) => {
							const share = series.shareAt(now, id);
							const drift = series.driftOf(id);
							return (
								<div key={id} className="flex items-center gap-3">
									<span
										aria-hidden="true"
										className="size-2.5 shrink-0"
										style={{ background: series.colorOf(id) }}
									/>
									<span className="flex-1 truncate font-mono text-xs text-fg-primary">
										{series.labelOf(id)}
									</span>
									<span className="w-12 shrink-0 text-right font-mono text-xs text-fg-muted">
										{(share * 100).toFixed(1)}%
									</span>
									<span className="w-14 shrink-0 text-right font-mono text-[11px]">
										{multi && Math.abs(drift) >= 0.5 ? (
											<span
												className={
													drift > 0 ? "text-accent-lime" : "text-orange-400"
												}
											>
												{drift > 0 ? "↑" : "↓"}
												{Math.abs(Math.round(drift))}pt
											</span>
										) : (
											<span className="text-fg-muted">—</span>
										)}
									</span>
								</div>
							);
						})}
					</div>

					<div className="mt-8 grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle sm:grid-cols-4">
						<Stat
							label="sessions"
							value={now.sessions.toLocaleString("en-US")}
							values={points.map((p) => p.sessions)}
						/>
						<Stat
							label="active days"
							value={`${now.activeDays} of ${now.windowDays}`}
							values={points.map((p) => p.activeDays)}
						/>
						<Stat
							label="harnesses"
							value={String(now.harnesses.length)}
							values={points.map((p) => p.harnesses.length)}
						/>
						<Stat
							label="readings"
							value={String(points.length)}
							values={points.map((_, i) => i + 1)}
						/>
					</div>
				</div>
			</div>
		</Section>
	);
}

function Row({
	label,
	faded,
	children,
}: {
	label: string;
	faded?: boolean;
	children: React.ReactNode;
}) {
	return (
		<div className={cn("flex items-center gap-3", faded && "opacity-55")}>
			<span
				className={cn(
					MONO_LABEL,
					"w-16 shrink-0 text-right text-[10px] text-fg-muted",
				)}
			>
				{label}
			</span>
			<span className="flex-1">{children}</span>
		</div>
	);
}

function Stat({
	label,
	value,
	values,
}: {
	label: string;
	value: string;
	values: number[];
}) {
	return (
		<div className="bg-bg-canvas px-4 py-4">
			<p className="font-mono text-xl font-black text-fg-primary">{value}</p>
			<div className="mt-2 h-5">
				{values.length > 1 && (
					<Sparkline
						values={values}
						width={80}
						height={18}
						color="var(--fg-muted)"
					/>
				)}
			</div>
			<p className={cn(MONO_LABEL, "mt-1 text-fg-muted")}>{label}</p>
		</div>
	);
}
