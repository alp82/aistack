/**
 * PROTOTYPE — Variant F: EARN THE SPACE. Wayfinder ticket #80, second round.
 *
 * C-family, and the most aggressive answer to "the mix uses too much space,
 * especially with very little movement":
 *
 *   - The token trail moves BEHIND the numbers as a watermark, so history costs
 *     zero vertical space.
 *   - The mix is one sentence plus one 12px bar. The ribbon over time appears
 *     ONLY when some model moved at least MIN_DRIFT points. When nothing moved,
 *     the page says so in words and draws nothing.
 *
 * A chart that has to be captioned "not much happened" should not have been
 * drawn. Space is spent in proportion to what there is to say.
 */
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { cn, timeAgo } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { DeltaChip, MixBar, MixRibbon, mixSeries, Sparkline } from "./charts";
import {
	fmtDay,
	fmtDelta,
	fmtTokens,
	harnessLabel,
	type ProtoPoint,
} from "./fixtures";
import { MetricBlock } from "./MetricBlock";

export const VARIANT_F_NAME = "Earn the space — mix only when it moved";

/** Share points a model must move before the ribbon is worth its height. */
const MIN_DRIFT = 3;

export function VariantF({
	index,
	anchor,
	points,
}: {
	index: number;
	anchor: string;
	points: ProtoPoint[];
}) {
	const now = points[points.length - 1];
	const prev = points.length > 1 ? points[points.length - 2] : null;
	const series = mixSeries(points);
	const multi = points.length > 1;
	const ribbonEarned = multi && series.maxDrift >= MIN_DRIFT;

	const movers = series.ids
		.map((id) => ({ id, drift: series.driftOf(id) }))
		.filter((m) => Math.abs(m.drift) >= 1)
		.sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
		.slice(0, 3);

	return (
		<Section index={index} id={anchor}>
			<SectionHeader
				index={String(index).padStart(2, "0")}
				kicker="// sync"
				title="Actual Usage"
				meta={`checked ${timeAgo(now.at)}`}
			/>

			{/* One wide band: the numbers left, the facts right. No tall column. */}
			<div className="grid items-end gap-8 border-b border-stroke-subtle pb-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
				<MetricBlock
					point={now}
					backdrop={
						multi ? (
							<Sparkline
								values={points.map((p) => p.tokens)}
								width={420}
								height={150}
								className="absolute inset-0 h-full w-full opacity-[0.18]"
							/>
						) : null
					}
				/>

				<div>
					<div className="grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle sm:grid-cols-4">
						<Stat
							label="sessions"
							value={now.sessions.toLocaleString("en-US")}
						/>
						<Stat
							label="active days"
							value={`${now.activeDays} of ${now.windowDays}`}
						/>
						<Stat label="harnesses" value={String(now.harnesses.length)} />
						<Stat label="readings" value={String(points.length)} />
					</div>

					<div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
						{prev && (
							<DeltaChip>
								{fmtDelta(now.tokens - prev.tokens, fmtTokens)} since the last
								check
							</DeltaChip>
						)}
						<p className={cn(MONO_LABEL, "text-fg-muted")}>
							{now.from} → {now.to}
						</p>
						{now.harnesses.map((h) => (
							<p key={h.name} className={cn(MONO_LABEL, "text-fg-muted")}>
								{harnessLabel(h.name)} · {fmtTokens(h.tokens)}
							</p>
						))}
					</div>

					<p className="mt-4 max-w-2xl text-sm leading-relaxed text-fg-muted">
						This is a rolling {now.windowDays}-day reading, not a running total.
						It moves every time it is checked, because the window moves with it.
					</p>
				</div>
			</div>

			{/* The mix. One bar always; the ribbon only when it earned the height. */}
			<div className="mt-8">
				<div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
					<p className={cn(MONO_LABEL, "text-accent-lime")}>
						where the tokens went
					</p>
					{multi && (
						<p className="font-mono text-[11px] text-fg-muted">
							{movers.length === 0 ? (
								<>the mix held steady across {points.length} readings</>
							) : (
								<>
									since {fmtDay(points[0].at)}:{" "}
									{movers.map((m, i) => (
										<span key={m.id}>
											{i > 0 && " · "}
											<span className="text-fg-primary">
												{series.labelOf(m.id)}
											</span>{" "}
											<span
												className={
													m.drift > 0 ? "text-accent-lime" : "text-orange-400"
												}
											>
												{m.drift > 0 ? "↑" : "↓"}
												{Math.abs(Math.round(m.drift))}pt
											</span>
										</span>
									))}
								</>
							)}
						</p>
					)}
				</div>

				<MixBar point={now} series={series} height={12} />

				<ul className="mt-3 flex list-none flex-wrap gap-x-6 gap-y-1 p-0">
					{series.ids.map((id) => (
						<li
							key={id}
							className="flex items-center gap-2 font-mono text-[11px] text-fg-muted"
						>
							<span
								aria-hidden="true"
								className="size-2.5 shrink-0"
								style={{ background: series.colorOf(id) }}
							/>
							<span className="text-fg-primary">{series.labelOf(id)}</span>
							<span>{(series.shareAt(now, id) * 100).toFixed(1)}%</span>
						</li>
					))}
				</ul>

				{ribbonEarned && (
					<div className="mt-6">
						<p className={cn(MONO_LABEL, "mb-2 text-fg-muted")}>
							the mix moved {Math.round(series.maxDrift)} points — shown over
							time
						</p>
						<MixRibbon points={points} height={90} legend={false} />
					</div>
				)}
			</div>
		</Section>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-bg-canvas px-4 py-3">
			<p className="font-mono text-lg font-black text-fg-primary">{value}</p>
			<p className={cn(MONO_LABEL, "mt-1 text-fg-muted")}>{label}</p>
		</div>
	);
}
