/**
 * PROTOTYPE — the headline metric block. Wayfinder ticket #80.
 *
 * LOCKED BY THE OWNER, so it is shared by every C-family variant instead of
 * being varied:
 *
 *   - TOKENS is the default metric and leads.
 *   - Spend sits below it, a bit smaller, over the same width.
 *   - One hover area covers BOTH numbers and opens the site's usual animated
 *     popup, which says the dollar figure is not real money spent.
 *
 * What varies between D, E and F is how history and the model mix are
 * expressed around this block — not the block itself.
 */
import HoverCard from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { fmtTokens, fmtUSD, type ProtoPoint } from "./fixtures";

export function MetricBlock({
	point,
	children,
	backdrop,
	className,
}: {
	point: ProtoPoint;
	/** Trail rendered inside the hover area, under the two numbers. */
	children?: React.ReactNode;
	/** Trail rendered BEHIND the numbers, so history costs no vertical space. */
	backdrop?: React.ReactNode;
	className?: string;
}) {
	return (
		<HoverCard
			mode="wrapper"
			position="below"
			width={320}
			height="auto"
			maxRotation={5}
			maxOffset={8}
			offset={12}
			className={cn("w-full", className)}
			renderContent={() => <MeasuredNumbersTooltip point={point} />}
		>
			{/* The hover area is the whole block, so the tooltip explains the pair
			    and not just the dollar line. */}
			<div className="relative w-full cursor-help border border-transparent px-3 py-3 transition-colors hover:border-stroke-subtle hover:bg-bg-panel/40">
				{backdrop && (
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 overflow-hidden"
					>
						{backdrop}
					</div>
				)}
				<p className="relative font-mono text-5xl font-black leading-none text-fg-primary md:text-6xl">
					{fmtTokens(point.tokens)}
				</p>
				<p className={cn(MONO_LABEL, "mt-2 text-fg-muted")}>
					tokens · last {point.windowDays} days
				</p>

				<p className="mt-4 font-mono text-2xl font-black leading-none text-fg-secondary md:text-3xl">
					{point.usd !== null ? `≈${fmtUSD(point.usd)}` : "kept private"}
				</p>
				<p className={cn(MONO_LABEL, "mt-1.5 text-fg-muted")}>
					{point.usd !== null ? "at api list prices" : "cost not published"}
				</p>

				{children}
			</div>
		</HoverCard>
	);
}

/**
 * The one place the site explains what the dollar figure is: a conversion of
 * measured tokens at published list prices, not a bill.
 *
 * Two sentences, no label/value table. The numbers are already an inch away
 * under the reader's cursor, so restating them in a grid only adds furniture.
 */
function MeasuredNumbersTooltip({ point }: { point: ProtoPoint }) {
	return (
		<div className="border-[3px] border-stroke-strong bg-bg-panel p-4 shadow-[6px_6px_0_var(--stroke-strong)]">
			<p className="mb-3 border-b-2 border-stroke-strong pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-lime">
				What these numbers are
			</p>

			<p className="text-sm leading-relaxed text-fg-secondary">
				<span className="font-mono font-bold text-fg-primary">
					{point.tokens.toLocaleString("en-US")}
				</span>{" "}
				tokens, measured between {point.from} and {point.to}.
			</p>

			{point.usd !== null && (
				<p className="mt-2 text-sm leading-relaxed text-fg-secondary">
					<span className="font-bold text-accent-lime">Not money spent</span> —
					it is what those tokens would cost at public list prices.
				</p>
			)}
		</div>
	);
}
