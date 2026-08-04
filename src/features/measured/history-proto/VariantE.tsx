/**
 * PROTOTYPE - Variant E: PER-MODEL TRAILS. Wayfinder ticket #80, second round.
 *
 * C-family. The owner's locked headline, and the mix chart deleted outright:
 * every model row carries its OWN share trail, inline, at 18px tall. The mix
 * over time costs zero extra vertical space, and it becomes per-model instead
 * of one blob - "Opus 4.8 has been sliding for five days" is a claim a reader
 * can attach to a name.
 *
 * The bet: a mix chart is only interesting one model at a time, so put it where
 * the model is.
 */
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { cn, timeAgo } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { DeltaChip, mixSeries, Sparkline } from "./charts";
import {
	fmtDay,
	fmtDelta,
	fmtTokens,
	harnessLabel,
	type ProtoPoint,
} from "./fixtures";
import { MetricBlock } from "./MetricBlock";
import type { TipKey } from "./TokenTips";

export const VARIANT_E_NAME = "Per-model trails: no mix chart at all";

export function VariantE({
	index,
	anchor,
	points,
	tip,
}: {
	index: number;
	anchor: string;
	points: ProtoPoint[];
	tip?: TipKey;
}) {
	const now = points[points.length - 1];
	const prev = points.length > 1 ? points[points.length - 2] : null;
	const series = mixSeries(points, 6);
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
					<MetricBlock point={now} tip={tip}>
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
									<span>{fmtDay(points[0].at)}</span>
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
					<div className="mb-4 flex items-baseline justify-between">
						<p className={cn(MONO_LABEL, "text-accent-lime")}>
							where the tokens went
						</p>
						{multi && (
							<p className={cn(MONO_LABEL, "text-fg-muted")}>
								share over {points.length} readings
							</p>
						)}
					</div>

					<div className="divide-y divide-stroke-subtle border-y border-stroke-subtle">
						{series.ids.map((id) => {
							const share = series.shareAt(now, id);
							const drift = series.driftOf(id);
							const trail = points.map((p) => series.shareAt(p, id));
							return (
								<div key={id} className="flex items-center gap-3 py-2.5">
									<span
										aria-hidden="true"
										className="size-2.5 shrink-0"
										style={{ background: series.colorOf(id) }}
									/>
									<span className="w-40 shrink-0 truncate font-mono text-xs text-fg-primary">
										{series.labelOf(id)}
									</span>

									{/* The share bar for now, and the trail behind it. */}
									<span className="relative h-5 flex-1 bg-bg-panel">
										<span
											className="absolute inset-y-0 left-0 opacity-30"
											style={{
												width: `${Math.max(1, share * 100)}%`,
												background: series.colorOf(id),
											}}
										/>
										{multi && (
											<Sparkline
												values={trail}
												width={200}
												height={20}
												color={series.colorOf(id)}
												className="absolute inset-0 h-full w-full"
											/>
										)}
									</span>

									<span className="w-12 shrink-0 text-right font-mono text-xs text-fg-primary">
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
											<span className="text-fg-muted">-</span>
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
