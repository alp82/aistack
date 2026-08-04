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
 *
 * The open question is only what that click LOOKS like before you make it.
 * Six affordances, on the `look=` axis, every one of them invisible until the
 * block is hovered.
 */
import { Dices } from "lucide-react";
import HoverCard from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { fmtTokens, fmtUSD, type ProtoPoint } from "./fixtures";
import { type TipKey, TokenTip, useTipDeck } from "./TokenTips";

export type LookKey = "hint" | "dice" | "frame" | "chip" | "underline" | "lift";

export const LOOKS: { key: LookKey; label: string }[] = [
	{ key: "hint", label: "corner text: click to reroll" },
	{ key: "dice", label: "dice in the corner, no words" },
	{ key: "frame", label: "the border turns lime and dashed" },
	{ key: "chip", label: "a bordered chip at the bottom" },
	{ key: "underline", label: "the number gets a dashed underline" },
	{ key: "lift", label: "the block lifts on a brutal shadow" },
];

/** Hidden until the block is hovered, per the owner's rule. */
const ON_HOVER =
	"opacity-0 transition-opacity duration-150 group-hover:opacity-100";

export function MetricBlock({
	point,
	children,
	backdrop,
	className,
	tip,
	look = "hint",
}: {
	point: ProtoPoint;
	/** Trail rendered inside the hover area, under the two numbers. */
	children?: React.ReactNode;
	/** Trail rendered BEHIND the numbers, so history costs no vertical space. */
	backdrop?: React.ReactNode;
	className?: string;
	/** Pins one framing. Left undefined, the popup deals from a shuffled deck. */
	tip?: TipKey;
	/** How the block announces that clicking it deals another framing. */
	look?: LookKey;
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
					"group relative w-full border px-3 py-3 transition-all duration-150",
					canRoll ? "cursor-pointer" : "cursor-help",
					// The resting state is identical in every look. Only the hover differs.
					look === "frame" && canRoll
						? "border-transparent hover:border-dashed hover:border-accent-lime hover:bg-accent-lime/5"
						: look === "lift" && canRoll
							? "border-transparent hover:-translate-x-[3px] hover:-translate-y-[3px] hover:border-stroke-strong hover:shadow-[3px_3px_0_var(--accent-lime)]"
							: "border-transparent hover:border-stroke-subtle hover:bg-bg-panel/40",
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

				{canRoll && look === "dice" && (
					<span
						aria-hidden="true"
						className={cn(
							ON_HOVER,
							"pointer-events-none absolute right-3 top-3 text-accent-lime",
						)}
					>
						<Dices size={18} />
					</span>
				)}

				<p className="relative font-mono text-5xl font-black leading-none text-fg-primary md:text-6xl">
					<span
						className={cn(
							"inline-block border-b-2 border-transparent pb-1",
							canRoll &&
								look === "underline" &&
								"transition-colors group-hover:border-dashed group-hover:border-accent-lime",
						)}
					>
						{fmtTokens(point.tokens)}
					</span>
				</p>
				<p className={cn(MONO_LABEL, "relative mt-2 text-fg-muted")}>
					tokens · last {point.windowDays} days
				</p>

				<p className="relative mt-4 font-mono text-2xl font-black leading-none text-fg-secondary md:text-3xl">
					{point.usd !== null ? `≈${fmtUSD(point.usd)}` : "kept private"}
				</p>
				<p className={cn(MONO_LABEL, "relative mt-1.5 text-fg-muted")}>
					{point.usd !== null ? "at api list prices" : "cost not published"}
				</p>

				{children}

				{canRoll && look === "chip" && (
					<span
						aria-hidden="true"
						className={cn(
							ON_HOVER,
							MONO_LABEL,
							"relative mt-4 inline-flex items-center gap-2 border border-accent-lime/50 px-2.5 py-1 text-accent-lime",
						)}
					>
						<Dices size={12} />
						another way to picture it
					</span>
				)}

				{canRoll && look === "hint" && (
					<span
						aria-hidden="true"
						className={cn(
							ON_HOVER,
							MONO_LABEL,
							"pointer-events-none absolute bottom-2 right-3 text-fg-muted",
						)}
					>
						click to reroll
					</span>
				)}
			</div>
		</HoverCard>
	);
}
