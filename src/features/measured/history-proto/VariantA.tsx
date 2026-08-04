/**
 * PROTOTYPE - Variant A: THE RATE. Wayfinder ticket #80.
 *
 * Chart-first. The series is promoted to the primary object on the section and
 * the current reading demoted to a caption, on the bet that a stack page which
 * "moves" has to lead with movement.
 *
 * The honest framing this variant is testing: the plotted figure is a trailing
 * 30-day RATE, so the chart is titled as a rate and the axis band is stated in
 * words under it. A falling point is the window sliding, not a slowdown.
 */
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { cn } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { DeltaChip, MixRibbon, RateChart } from "./charts";
import {
	fmtDelta,
	fmtStamp,
	fmtTokens,
	fmtUSD,
	harnessLabel,
	type ProtoPoint,
} from "./fixtures";

export const VARIANT_A_NAME = "The rate: chart leads";

export function VariantA({
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
	const priced = now.usd !== null;
	const single = points.length === 1;

	const value = (p: ProtoPoint) => (priced ? p.usd : p.tokens);
	const format = (v: number) => (priced ? fmtUSD(v) : fmtTokens(v));
	const headline = value(now) ?? 0;
	const delta = headline - (value(first) ?? 0);

	return (
		<Section index={index} id={anchor}>
			<SectionHeader
				index={String(index).padStart(2, "0")}
				kicker="// sync"
				title="Actual Usage"
				meta={`${points.length} ${points.length === 1 ? "reading" : "readings"}`}
			/>

			{/* The caption, not the headline. The chart below is the headline. */}
			<div className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
				<div>
					<p className={cn(MONO_LABEL, "text-fg-muted")}>
						{priced ? "at api prices" : "tokens"} · trailing {now.windowDays}{" "}
						days
					</p>
					<p className="mt-1 flex items-baseline gap-3">
						<span className="font-mono text-4xl font-black leading-none text-fg-primary">
							{priced ? `≈${fmtUSD(headline)}` : fmtTokens(headline)}
						</span>
						{!single && (
							<DeltaChip tone="neutral">
								{fmtDelta(delta, format)} since {fmtStamp(first.at)}
							</DeltaChip>
						)}
					</p>
				</div>
				<p className="max-w-md text-sm leading-relaxed text-fg-muted">
					Each point is a whole {now.windowDays}-day window, read at that
					moment. The line moves when the window moves, so a lower point means
					older days fell off the back - not that the machine slowed down.
				</p>
			</div>

			<RateChart
				points={points}
				value={value}
				format={format}
				label={
					priced
						? "spend at API prices, trailing 30 days"
						: "tokens, trailing 30 days"
				}
				height={220}
			/>

			<div className="mt-12 grid gap-10 lg:grid-cols-[1fr_minmax(0,26rem)]">
				<div>
					<p className={cn(MONO_LABEL, "mb-4 text-accent-lime")}>
						where the tokens went
					</p>
					<MixRibbon points={points} />
				</div>

				<div>
					<p className={cn(MONO_LABEL, "mb-4 text-accent-lime")}>
						this reading
					</p>
					<dl className="grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle">
						<Cell
							label="sessions"
							value={now.sessions.toLocaleString("en-US")}
							delta={single ? null : now.sessions - first.sessions}
							format={(v) => String(v)}
						/>
						<Cell
							label="active days"
							value={`${now.activeDays} of ${now.windowDays}`}
							delta={single ? null : now.activeDays - first.activeDays}
							format={(v) => String(v)}
						/>
						<Cell
							label="tokens"
							value={fmtTokens(now.tokens)}
							delta={single ? null : now.tokens - first.tokens}
							format={fmtTokens}
						/>
						<Cell
							label="harnesses"
							value={String(now.harnesses.length)}
							delta={null}
							format={(v) => String(v)}
						/>
					</dl>

					<div className="mt-5 space-y-1">
						<p className={cn(MONO_LABEL, "text-fg-muted")}>
							{now.from} → {now.to}
						</p>
						{now.harnesses.map((h) => (
							<p key={h.name} className={cn(MONO_LABEL, "text-fg-muted")}>
								{harnessLabel(h.name)} · {fmtTokens(h.tokens)}
								{h.usd !== null && ` · ${fmtUSD(h.usd)}`}
							</p>
						))}
					</div>
				</div>
			</div>
		</Section>
	);
}

function Cell({
	label,
	value,
	delta,
	format,
}: {
	label: string;
	value: string;
	delta: number | null;
	format: (v: number) => string;
}) {
	return (
		<div className="bg-bg-canvas px-4 py-4">
			<dd className="font-mono text-xl font-black text-fg-primary">{value}</dd>
			<dt
				className={cn(MONO_LABEL, "mt-1 flex items-center gap-2 text-fg-muted")}
			>
				{label}
				{delta !== null && delta !== 0 && (
					<span className="normal-case tracking-normal">
						{fmtDelta(delta, format)}
					</span>
				)}
			</dt>
		</div>
	);
}
