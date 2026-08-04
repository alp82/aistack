/**
 * PROTOTYPE - Variant C: NOW, WITH A TRAIL. Wayfinder ticket #80.
 *
 * Number-first, and the smallest possible displacement of what shipped in P0.2.
 * The current reading keeps the whole layout it has today; history arrives as
 * texture - a delta chip on the headline, a sparkline under it, a micro-trend
 * in each stat tile, a share arrow on each model row.
 *
 * The one full chart is the mix ribbon, because in the real five-day history
 * the mix is the only thing that visibly moves: Opus 4.8 fell 18% -> 13% while
 * Opus 5 rose 35% -> 40%, in the same days the spend line wobbled ±5% and said
 * nothing.
 */
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { cn, timeAgo } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { DeltaChip, MixRibbon, Sparkline } from "./charts";
import {
	fmtDelta,
	fmtStamp,
	fmtTokens,
	fmtUSD,
	harnessLabel,
	type ProtoPoint,
} from "./fixtures";

export const VARIANT_C_NAME = "Now, with a trail: history as texture";

export function VariantC({
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
	const priced = now.usd !== null;
	const cost = now.usd;

	const trend = points.map((p) => (priced ? (p.usd ?? 0) : p.tokens));
	const headlineDelta =
		prev && cost !== null && prev.usd !== null
			? cost - prev.usd
			: prev && !priced
				? now.tokens - prev.tokens
				: null;

	return (
		<Section index={index} id={anchor}>
			<SectionHeader
				index={String(index).padStart(2, "0")}
				kicker="// sync"
				title="Actual Usage"
				meta={`checked ${timeAgo(now.at)}`}
			/>

			<div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
				<div>
					<p className="font-mono text-5xl font-black leading-none text-fg-primary md:text-6xl">
						{cost !== null ? `≈${fmtUSD(cost)}` : fmtTokens(now.tokens)}
					</p>
					<p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
						{priced
							? `at API prices, over the last ${now.windowDays} days`
							: `tokens over the last ${now.windowDays} days`}
						{headlineDelta !== null && Math.round(headlineDelta) !== 0 && (
							<DeltaChip>
								{fmtDelta(headlineDelta, priced ? fmtUSD : fmtTokens)} since the
								last check
							</DeltaChip>
						)}
					</p>

					{points.length > 1 ? (
						<div className="mt-5 border border-stroke-subtle px-3 py-3">
							<Sparkline
								values={trend}
								width={280}
								height={44}
								className="w-full"
							/>
							<p
								className={cn(
									MONO_LABEL,
									"mt-2 flex justify-between text-fg-muted",
								)}
							>
								<span>{fmtStamp(points[0].at)}</span>
								<span>{points.length} readings</span>
								<span>now</span>
							</p>
						</div>
					) : (
						<p className={cn(MONO_LABEL, "mt-5 text-fg-muted")}>
							first reading - a second sync starts the trail
						</p>
					)}

					<p className="mt-6 max-w-sm text-sm leading-relaxed text-fg-muted">
						This is a rolling {now.windowDays}-day reading, not a running total.
						It moves every time it is checked, because the window moves with it.
					</p>

					<div className="mt-6 space-y-1">
						<p className={cn(MONO_LABEL, "text-fg-muted")}>
							{now.from} → {now.to}
						</p>
						{now.harnesses.map((h) => (
							<p key={h.name} className={cn(MONO_LABEL, "text-fg-muted")}>
								read from {harnessLabel(h.name)}
							</p>
						))}
					</div>
				</div>

				<div>
					<div className="space-y-3">
						{now.mix.map((m) => {
							const before = points[0].mix.find((x) => x.id === m.id);
							const d = before ? m.share - before.share : null;
							return (
								<div key={m.id} className="flex items-center gap-4">
									<span className="w-44 shrink-0 truncate font-mono text-xs text-fg-primary">
										{m.label}
									</span>
									<span className="h-2 flex-1 bg-bg-panel">
										<span
											className="block h-full bg-accent-lime"
											style={{ width: `${Math.max(1, m.share * 100)}%` }}
										/>
									</span>
									<span className="w-14 shrink-0 text-right font-mono text-xs text-fg-muted">
										{(m.share * 100).toFixed(1)}%
									</span>
									<span className="w-14 shrink-0 text-right font-mono text-[11px]">
										{d !== null && Math.abs(d) >= 0.005 ? (
											<span
												className={
													d > 0 ? "text-accent-lime" : "text-orange-400"
												}
											>
												{d > 0 ? "↑" : "↓"}
												{Math.abs(Math.round(d * 100))}pt
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
						<TrailStat
							label="sessions"
							value={now.sessions.toLocaleString("en-US")}
							values={points.map((p) => p.sessions)}
						/>
						<TrailStat
							label="active days"
							value={`${now.activeDays} of ${now.windowDays}`}
							values={points.map((p) => p.activeDays)}
						/>
						<TrailStat
							label="tokens"
							value={fmtTokens(now.tokens)}
							values={points.map((p) => p.tokens)}
						/>
						<TrailStat
							label="harnesses"
							value={String(now.harnesses.length)}
							values={points.map((p) => p.harnesses.length)}
						/>
					</div>
				</div>
			</div>

			{points.length > 1 && (
				<div className="mt-12 border-t border-stroke-subtle pt-8">
					<p className={cn(MONO_LABEL, "mb-4 text-accent-lime")}>
						how the mix moved
					</p>
					<MixRibbon points={points} height={120} />
				</div>
			)}
		</Section>
	);
}

function TrailStat({
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
