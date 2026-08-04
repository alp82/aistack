/**
 * PROTOTYPE - the headline metric block. Wayfinder ticket #80.
 *
 * LOCKED BY THE OWNER, so it is shared by every C-family variant instead of
 * being varied:
 *
 *   - TOKENS is the default metric and leads.
 *   - Spend sits below it, a bit smaller, over the same width.
 *   - One hover area covers BOTH numbers and opens the site's usual animated
 *     popup, which says the dollar figure is not real money spent.
 *   - CLICKING THE BLOCK deals the next framing. No separate button, because a
 *     control beside the number sat too far from what it changed.
 *   - The affordance is the SWAP, and only the swap: on hover the caption under
 *     the number turns into "random fun fact". It costs no extra row, and it
 *     lands where the eye already is after reading the number. A dashed
 *     underline on the number was tried alongside it and dropped - the number
 *     is the one thing on the block that should never look like a control.
 *
 * THE ROW MUST NOT RESIZE. Both captions are stacked in one grid cell, so the
 * row is always as tall as the taller of the two and only opacity changes. The
 * earlier version toggled `hidden`, which made the whole block jump on hover.
 */
import { Dices } from "lucide-react";
import HoverCard from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { fmtTokens, fmtUSD, type ProtoPoint } from "./fixtures";
import { type TipKey, TokenTip, useTipDeck } from "./TokenTips";

const HINT = "random fun fact";

export function MetricBlock({
	point,
	children,
	backdrop,
	className,
	tip,
}: {
	point: ProtoPoint;
	/** Trail rendered inside the hover area, under the two numbers. */
	children?: React.ReactNode;
	/** Trail rendered BEHIND the numbers, so history costs no vertical space. */
	backdrop?: React.ReactNode;
	className?: string;
	/** Pins one framing. Left undefined, the popup deals from a shuffled deck. */
	tip?: TipKey;
}) {
	const deck = useTipDeck(tip);
	const canRoll = deck.shuffling;

	return (
		<HoverCard
			mode="wrapper"
			position="below"
			width={340}
			height="auto"
			maxRotation={5}
			maxOffset={8}
			offset={12}
			className={cn("w-full", className)}
			renderContent={() => (
				<TokenTip
					point={point}
					tip={deck.tip}
					index={deck.index}
					total={deck.total}
					shuffling={deck.shuffling}
				/>
			)}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: prototype-only click surface; the shipped version gets a real button */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: same */}
			<div
				onClick={canRoll ? deck.next : undefined}
				className={cn(
					"group relative w-full border border-transparent px-3 py-3 transition-colors hover:border-stroke-subtle hover:bg-bg-panel/40",
					canRoll ? "cursor-pointer" : "cursor-help",
				)}
			>
				{/* The backdrop stretches to the block's bottom edge. Letterboxed, its
				    fill stopped mid-block and read as a box around part of the text. */}
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

				{/* Both captions share one grid cell: the row keeps the height of the
				    taller one at rest, so nothing below it can move. */}
				<span className="relative mt-2 grid">
					<span
						className={cn(
							MONO_LABEL,
							"col-start-1 row-start-1 flex items-center text-fg-muted transition-opacity duration-150",
							canRoll && "group-hover:opacity-0",
						)}
					>
						tokens · last {point.windowDays} days
					</span>
					{canRoll && (
						<span
							aria-hidden="true"
							className={cn(
								MONO_LABEL,
								"pointer-events-none col-start-1 row-start-1 flex items-center gap-2 font-semibold text-accent-lime opacity-0 transition-opacity duration-150 group-hover:opacity-100",
							)}
						>
							<Dices size={18} />
							{HINT}
						</span>
					)}
				</span>

				{/* Roomier than the caption gap above, so the swapped row never crowds
				    the second number. */}
				<p className="relative mt-6 font-mono text-2xl font-black leading-none text-fg-secondary md:text-3xl">
					{point.usd !== null ? `≈${fmtUSD(point.usd)}` : "kept private"}
				</p>
				<p className={cn(MONO_LABEL, "relative mt-1.5 text-fg-muted")}>
					{point.usd !== null ? "at api list prices" : "cost not published"}
				</p>

				{children}
			</div>
		</HoverCard>
	);
}
