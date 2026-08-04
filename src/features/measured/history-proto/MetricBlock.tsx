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
import HoverCard from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { fmtTokens, fmtUSD, type ProtoPoint } from "./fixtures";
import { type TipKey, TokenTip } from "./TokenTips";

export function MetricBlock({
	point,
	children,
	backdrop,
	className,
	tip = "plain",
}: {
	point: ProtoPoint;
	/** Trail rendered inside the hover area, under the two numbers. */
	children?: React.ReactNode;
	/** Trail rendered BEHIND the numbers, so history costs no vertical space. */
	backdrop?: React.ReactNode;
	className?: string;
	/** Which framing the popup uses to make the token count tangible. */
	tip?: TipKey;
}) {
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
			renderContent={() => <TokenTip point={point} tip={tip} />}
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

// The popup itself lives in TokenTips.tsx, because its whole job is now under
// test: six ways to make a token count tangible, switchable with `tip=`.
