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
 *
 * What varies between D, E and F is how history and the model mix are
 * expressed around this block - not the block itself.
 */
import { Dices } from "lucide-react";
import HoverCard from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { fmtTokens, fmtUSD, type ProtoPoint } from "./fixtures";
import { type TipKey, TokenTip, useTipDeck } from "./TokenTips";

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
			{/* The hover area is the whole block, so the tooltip explains the pair
			    and not just the dollar line. */}
			<div className="group relative w-full cursor-help border border-transparent px-3 py-3 transition-colors hover:border-stroke-subtle hover:bg-bg-panel/40">
				{backdrop && (
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 overflow-hidden"
					>
						{backdrop}
					</div>
				)}

				{/* The dice sit ON THE BLOCK, not in the popup: the hover surface is
				    pointer-events-none, so a button inside it could never be clicked. */}
				{deck.shuffling && (
					<button
						type="button"
						title="another way to picture it"
						aria-label="another way to picture it"
						onClick={(e) => {
							e.stopPropagation();
							deck.next();
						}}
						className="absolute right-2 top-2 z-10 cursor-pointer border border-stroke-subtle p-1.5 text-fg-muted opacity-40 transition-all hover:border-accent-lime hover:text-accent-lime focus-visible:opacity-100 group-hover:opacity-100"
					>
						<Dices size={14} />
					</button>
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
