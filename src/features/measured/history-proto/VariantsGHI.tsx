/**
 * PROTOTYPE - Variants G, H, I. Wayfinder ticket #80, third round.
 *
 * E won on structure: no mix chart, every model row carries its own history.
 * The correction is emphasis - in E the trail was drawn ON TOP of a 30%-opacity
 * share bar, so history read as the foreground. Here that is inverted:
 *
 *   THE CURRENT SHARE BAR IS SOLID, FULL COLOR AND THE TALLEST THING IN THE ROW.
 *   HISTORY RECEDES.
 *
 * All three share E's shell and the owner-locked MetricBlock, and differ only in
 * HOW history recedes:
 *
 *   G  behind   a faint filled trail sits behind the solid bar, same track
 *   H  beside   the trail is evicted to a small gray aside at the row's edge
 *   I  one tick history collapses to a single marker for "where it was"
 *
 * The headline trail is a watermark in all three, for the same reason.
 */
import HoverCard from "@/components/ui/hover-card";
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { cn, timeAgo } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { DeltaChip, type MixSeries, mixSeries, Sparkline } from "./charts";
import {
	fmtDay,
	fmtDelta,
	fmtTokens,
	harnessLabel,
	type ProtoPoint,
} from "./fixtures";
import { MetricBlock, type RollKey } from "./MetricBlock";
import type { TipKey } from "./TokenTips";

export const VARIANT_G_NAME = "Solid bars, trail behind";
export const VARIANT_H_NAME = "Solid bars, trail beside";
export const VARIANT_I_NAME = "Solid bars, one 'was here' tick";

type RowProps = {
	id: string;
	series: MixSeries;
	points: ProtoPoint[];
	multi: boolean;
};

// ---------------------------------------------------------------------------
// The shell - identical in all three, so only the row treatment is under test.
// ---------------------------------------------------------------------------

function Shell({
	index,
	anchor,
	points,
	tip,
	roll,
	renderRow,
	historyNote,
}: {
	index: number;
	anchor: string;
	points: ProtoPoint[];
	tip?: TipKey;
	roll?: RollKey;
	renderRow: (props: RowProps) => React.ReactNode;
	historyNote: string;
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

			<div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
				<div>
					{/* The headline trail is a watermark too - history behind, not beside. */}
					<MetricBlock
						point={now}
						tip={tip}
						roll={roll}
						backdrop={
							multi ? (
								<Sparkline
									values={points.map((p) => p.tokens)}
									width={400}
									height={140}
									className="absolute inset-0 h-full w-full opacity-[0.16]"
									stretch
									area
									dot={false}
									strokeWidth={1}
								/>
							) : null
						}
					/>

					<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-3">
						{prev && (
							<DeltaChip>
								{fmtDelta(now.tokens - prev.tokens, fmtTokens)} since the last
								check
							</DeltaChip>
						)}
						{multi && (
							<span className={cn(MONO_LABEL, "text-fg-muted")}>
								{points.length} readings since {fmtDay(points[0].at)}
							</span>
						)}
					</div>

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
					<div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
						<p className={cn(MONO_LABEL, "text-accent-lime")}>
							where the tokens went
						</p>
						{multi && (
							<p className="font-mono text-[11px] text-fg-muted">
								{historyNote}
							</p>
						)}
					</div>

					<div className="divide-y divide-stroke-subtle border-y border-stroke-subtle">
						{series.ids.map((id) => (
							<div key={id}>{renderRow({ id, series, points, multi })}</div>
						))}
					</div>

					<div className="mt-8 grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle sm:grid-cols-4">
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
				</div>
			</div>
		</Section>
	);
}

/** Name + swatch. The left half of every row, unchanged across G, H and I. */
function RowHead({ id, series }: { id: string; series: MixSeries }) {
	return (
		<>
			<span
				aria-hidden="true"
				className="size-3 shrink-0"
				style={{ background: series.colorOf(id) }}
			/>
			<span className="w-40 shrink-0 truncate text-sm text-fg-primary">
				{series.labelOf(id)}
			</span>
		</>
	);
}

/** The share number and its drift. The right half, unchanged across G, H and I. */
function RowTail({
	id,
	series,
	multi,
}: {
	id: string;
	series: MixSeries;
	multi: boolean;
}) {
	const share = series.shareAt(
		// The newest reading is what the number states.
		series.newest,
		id,
	);
	const drift = series.driftOf(id);
	return (
		<>
			<span className="w-14 shrink-0 text-right font-mono text-sm font-bold text-fg-primary">
				{(share * 100).toFixed(1)}%
			</span>
			<span className="w-12 shrink-0 text-right font-mono text-[11px]">
				{multi && Math.abs(drift) >= 0.5 ? (
					<span className="text-fg-muted">
						{drift > 0 ? "↑" : "↓"}
						{Math.abs(Math.round(drift))}
					</span>
				) : (
					<span className="text-fg-muted">-</span>
				)}
			</span>
		</>
	);
}

// ---------------------------------------------------------------------------
// G - the trail sits BEHIND the solid bar, in the same track.
// ---------------------------------------------------------------------------

export function VariantG({
	index,
	anchor,
	points,
	tip,
	roll,
}: {
	index: number;
	anchor: string;
	points: ProtoPoint[];
	tip?: TipKey;
	roll?: RollKey;
}) {
	return (
		<Shell
			index={index}
			anchor={anchor}
			points={points}
			tip={tip}
			roll={roll}
			historyNote="the faint fill behind each bar is that model's share over time"
			renderRow={({ id, series, points: pts, multi }) => (
				<div className="flex items-center gap-3 py-3">
					<RowHead id={id} series={series} />
					<span className="relative h-7 flex-1 overflow-hidden bg-bg-panel">
						{multi && (
							<Sparkline
								values={pts.map((p) => series.shareAt(p, id))}
								width={240}
								height={28}
								color={series.colorOf(id)}
								className="absolute inset-0 h-full w-full opacity-25"
								area
								dot={false}
								strokeWidth={1}
							/>
						)}
						<span
							className="absolute inset-y-0 left-0"
							style={{
								width: `${Math.max(1, series.shareAt(series.newest, id) * 100)}%`,
								background: series.colorOf(id),
							}}
						/>
					</span>
					<RowTail id={id} series={series} multi={multi} />
				</div>
			)}
		/>
	);
}

// ---------------------------------------------------------------------------
// H - the trail is evicted from the bar and parked at the row's edge, in gray.
// ---------------------------------------------------------------------------

export function VariantH({
	index,
	anchor,
	points,
	tip,
	roll,
}: {
	index: number;
	anchor: string;
	points: ProtoPoint[];
	tip?: TipKey;
	roll?: RollKey;
}) {
	return (
		<Shell
			index={index}
			anchor={anchor}
			points={points}
			tip={tip}
			roll={roll}
			historyNote="the gray mark at the end of each row is that model's share over time"
			renderRow={({ id, series, points: pts, multi }) => (
				<div className="flex items-center gap-3 py-3">
					<RowHead id={id} series={series} />
					<span className="h-7 flex-1 bg-bg-panel">
						<span
							className="block h-full"
							style={{
								width: `${Math.max(1, series.shareAt(series.newest, id) * 100)}%`,
								background: series.colorOf(id),
							}}
						/>
					</span>
					<RowTail id={id} series={series} multi={multi} />
					<span className="w-16 shrink-0">
						{multi && (
							<Sparkline
								values={pts.map((p) => series.shareAt(p, id))}
								width={64}
								height={16}
								color="var(--fg-muted)"
								dot={false}
								strokeWidth={1}
							/>
						)}
					</span>
				</div>
			)}
		/>
	);
}

// ---------------------------------------------------------------------------
// I - history collapses to ONE marker: where this model's share started.
// ---------------------------------------------------------------------------

export function VariantI({
	index,
	anchor,
	points,
	tip,
	roll,
}: {
	index: number;
	anchor: string;
	points: ProtoPoint[];
	tip?: TipKey;
	roll?: RollKey;
}) {
	return (
		<Shell
			index={index}
			anchor={anchor}
			points={points}
			tip={tip}
			roll={roll}
			historyNote={`the hatched notch marks where each share stood on ${fmtDay(points[0].at)}`}
			renderRow={({ id, series, points: pts, multi }) => {
				const share = series.shareAt(series.newest, id);
				const then = series.shareAt(pts[0], id);
				const moved = multi && Math.abs(share - then) >= 0.005;
				return (
					<div className="flex items-center gap-3 py-3">
						<RowHead id={id} series={series} />

						{/* The bar is the hover target: the whole history lives in the
						    popup, so the row itself stays one solid bar and a number. */}
						<HoverCard
							mode="wrapper"
							position="below"
							width={300}
							height="auto"
							maxRotation={4}
							maxOffset={6}
							offset={10}
							className="flex-1"
							renderContent={() => (
								<BarTooltip id={id} series={series} points={pts} />
							)}
						>
							<div className="relative h-7 w-full cursor-help bg-bg-panel">
								<div
									className="absolute inset-y-0 left-0"
									style={{
										width: `${Math.max(1, share * 100)}%`,
										background: series.colorOf(id),
									}}
								/>
								{moved && <WasHereTick at={then} />}
							</div>
						</HoverCard>

						<RowTail id={id} series={series} multi={multi} />
					</div>
				);
			}}
		/>
	);
}

/**
 * The "was here" marker: where this share stood at the first reading.
 *
 * Hatched rather than solid, and taller than the bar, so it reads as a ruler
 * mark laid over the data and never as a slice of the data. The stripes are
 * opaque, so it stays legible over the filled part of the bar and over the
 * empty track alike.
 */
function WasHereTick({ at }: { at: number }) {
	return (
		<span
			aria-hidden="true"
			className="absolute -top-1 -bottom-1 w-[6px] -translate-x-1/2"
			style={{
				left: `${Math.min(100, Math.max(0, at * 100))}%`,
				backgroundImage:
					"repeating-linear-gradient(135deg, var(--fg-primary) 0 2px, var(--bg-canvas) 2px 4px)",
			}}
		/>
	);
}

/**
 * One model's history, on hover: the trail, and one plain sentence saying which
 * way it went.
 *
 * The sentence deliberately carries no arithmetic. "More Opus 5 than before" is
 * the thing a reader wants; the exact drift is already on the row, and repeating
 * it here only makes the popup read like a report. Public voice throughout - the
 * reader is a stranger, so it is "this machine", never "you".
 */
function BarTooltip({
	id,
	series,
	points,
}: {
	id: string;
	series: MixSeries;
	points: ProtoPoint[];
}) {
	const share = series.shareAt(series.newest, id);
	const then = series.shareAt(points[0], id);
	const drift = series.driftOf(id);
	const multi = points.length > 1;
	const moved = multi && Math.abs(share - then) >= 0.005;

	return (
		<div className="border-[3px] border-stroke-strong bg-bg-panel p-4 shadow-[6px_6px_0_var(--stroke-strong)]">
			<div className="mb-3 flex items-center gap-2 border-b-2 border-stroke-strong pb-2">
				<span
					aria-hidden="true"
					className="size-3 shrink-0"
					style={{ background: series.colorOf(id) }}
				/>
				<span className="flex-1 truncate text-sm font-bold text-fg-primary">
					{series.labelOf(id)}
				</span>
				<span className="font-mono text-sm font-black text-fg-primary">
					{(share * 100).toFixed(1)}%
				</span>
			</div>

			{multi ? (
				<>
					<Sparkline
						values={points.map((p) => series.shareAt(p, id))}
						width={264}
						height={44}
						color={series.colorOf(id)}
						className="w-full"
						area
					/>
					<p className={cn(MONO_LABEL, "mt-1.5 text-[10px] text-fg-muted")}>
						{points.length} readings since {fmtDay(points[0].at)}
					</p>

					<p className="mt-3 text-sm leading-relaxed text-fg-secondary">
						{moved ? (
							<>
								This machine is using{" "}
								<span
									className={drift > 0 ? "text-accent-lime" : "text-orange-400"}
								>
									{drift > 0 ? "more" : "less"}
								</span>{" "}
								{series.labelOf(id)} than before. The notch marks where it
								started.
							</>
						) : (
							<>
								{series.labelOf(id)} has held about the same share throughout.
							</>
						)}
					</p>
				</>
			) : (
				<p className="text-sm leading-relaxed text-fg-secondary">
					One reading so far. The next sync starts this line.
				</p>
			)}
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-bg-canvas px-4 py-4">
			<p className="font-mono text-xl font-black text-fg-primary">{value}</p>
			<p className={cn(MONO_LABEL, "mt-1 text-fg-muted")}>{label}</p>
		</div>
	);
}
