import HoverCard from "@/components/ui/hover-card";
import { Sparkline } from "@/features/charts";
import { cn } from "@/lib/utils";
import { fmtDay, fmtShare, MONO_LABEL, readingsLine } from "./copy";
import type { ModelTrail } from "./history";

/**
 * Where the tokens went - one row per model, locked as variant I by #80.
 *
 * THE CURRENT SHARE IS THE LOUDEST THING IN THE ROW: a solid, full-color bar.
 * History recedes to a single hatched notch marking where that share stood at
 * the first reading, and the whole trail lives in the card the bar opens. Five
 * earlier structures put history in front and every one of them buried the
 * number the reader came for.
 *
 * A model the catalog has never heard of renders as its raw vendor id (#33
 * decision 3). On the owner's own window that row is the biggest one, so it is
 * not an error state.
 */
export function ModelShareRows({
	trails,
	firstAt,
}: {
	readonly trails: readonly ModelTrail[];
	/** The day the notch speaks for, or null when there is only one reading. */
	readonly firstAt: number | null;
}) {
	return (
		<div className="divide-y divide-stroke-subtle border-y border-stroke-subtle">
			{trails.map((trail) => (
				<ModelRow key={trail.id} trail={trail} firstAt={firstAt} />
			))}
		</div>
	);
}

function ModelRow({
	trail,
	firstAt,
}: {
	readonly trail: ModelTrail;
	readonly firstAt: number | null;
}) {
	return (
		<div className="flex items-center gap-3 py-3">
			<span
				aria-hidden="true"
				className="size-3 shrink-0"
				style={{ background: trail.paint }}
			/>
			<span className="w-40 shrink-0 truncate text-sm text-fg-primary">
				{trail.label}
			</span>

			{/* The bar is the hover target: the trail lives in the card, so the row
			    itself stays one solid bar and a number. */}
			<HoverCard
				mode="wrapper"
				position="below"
				width={300}
				height="auto"
				maxRotation={4}
				maxOffset={6}
				offset={10}
				className="flex-1"
				renderContent={() => <TrailCard trail={trail} firstAt={firstAt} />}
			>
				<div className="relative h-7 w-full cursor-help bg-bg-panel">
					<div
						className="absolute inset-y-0 left-0"
						style={{
							width: `${Math.max(1, trail.share * 100)}%`,
							background: trail.paint,
						}}
					/>
					{trail.moved && <WasHereNotch at={trail.first} />}
				</div>
			</HoverCard>

			<span className="w-14 shrink-0 text-right font-mono text-sm font-bold text-fg-primary">
				{fmtShare(trail.share)}
			</span>
			<span className="w-12 shrink-0 text-right font-mono text-[11px] text-fg-muted">
				{trail.moved && Math.abs(trail.driftPoints) >= 0.5 ? (
					<>
						{trail.driftPoints > 0 ? "↑" : "↓"}
						{Math.abs(Math.round(trail.driftPoints))}
					</>
				) : (
					"-"
				)}
			</span>
		</div>
	);
}

/**
 * Where this share stood at the first reading.
 *
 * Hatched rather than solid, and taller than the bar, so it reads as a ruler
 * mark laid over the data and never as a slice of it. The stripes are opaque, so
 * it stays legible over the filled part of the bar and over the empty track.
 */
function WasHereNotch({ at }: { at: number }) {
	return (
		<span
			aria-hidden="true"
			data-testid="share-notch"
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
 * The sentence carries no arithmetic on purpose. "More Opus 5 than before" is
 * what a reader wants; the exact drift is already on the row, and repeating it
 * here only makes the card read like a report. Public voice throughout - the
 * reader is a stranger, so it is "this machine", never "you".
 */
function TrailCard({
	trail,
	firstAt,
}: {
	readonly trail: ModelTrail;
	readonly firstAt: number | null;
}) {
	const many = trail.points.length > 1;
	return (
		<div className="border-[3px] border-stroke-strong bg-bg-panel p-4 shadow-[6px_6px_0_var(--stroke-strong)]">
			<div className="mb-3 flex items-center gap-2 border-b-2 border-stroke-strong pb-2">
				<span
					aria-hidden="true"
					className="size-3 shrink-0"
					style={{ background: trail.paint }}
				/>
				<span className="flex-1 truncate text-sm font-bold text-fg-primary">
					{trail.label}
				</span>
				<span className="font-mono text-sm font-black text-fg-primary">
					{fmtShare(trail.share)}
				</span>
			</div>

			{many && firstAt !== null ? (
				<>
					<Sparkline
						points={trail.points}
						ariaLabel={`${trail.label} share over ${trail.points.length} readings`}
						paint={trail.paint}
						area
						fluid
						width={264}
						height={44}
						className="w-full"
					/>
					<p className={cn(MONO_LABEL, "mt-1.5 text-[10px] text-fg-muted")}>
						{readingsLine(trail.points.length, firstAt)}
					</p>

					<p className="mt-3 text-sm leading-relaxed text-fg-secondary">
						{trail.moved ? (
							<>
								This machine is using{" "}
								<span
									className={
										trail.driftPoints > 0
											? "text-accent-lime"
											: "text-orange-400"
									}
								>
									{trail.driftPoints > 0 ? "more" : "less"}
								</span>{" "}
								{trail.label} than before. The notch marks where it started, on{" "}
								{fmtDay(firstAt)}.
							</>
						) : (
							<>{trail.label} has held about the same share throughout.</>
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
