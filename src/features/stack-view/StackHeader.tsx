import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { AlertTriangle, CheckCircle, Flag, Pencil } from "lucide-react";
import {
	type ReactNode,
	type RefObject,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { CostBreakdownTooltip } from "@/components/CostBreakdownTooltip";
import { RelativeTime } from "@/components/RelativeTime";
import { UpvoteButton } from "@/components/UpvoteButton";
import { UpvotersTooltip } from "@/components/UpvotersTooltip";
import HoverCard from "@/components/ui/hover-card";
import { Sparkline } from "@/features/charts";
import { fmtTokens, MEASURED_ANCHOR } from "@/features/measured/copy";
import { RANGES, type RangeId } from "@/features/usage/copy";
import { Delta } from "@/features/usage/Delta";
import { formatPriceDisplay, orderToolsForDisplay } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { api } from "../../../convex/_generated/api";
import type { HeroReading } from "./heroReading";
import { ShareMenu } from "./ShareMenu";
import {
	fitTitle,
	TITLE_FALLBACK_FONT_SIZE,
	TITLE_MIN_PX,
	type TitleFit,
	titleCeilingPx,
} from "./titleFit";
import { categoryColor, STACK_WIDTH, StackIcon } from "./ui";

type StackData = NonNullable<FunctionReturnType<typeof api.stacks.getBySlug>>;
type UpvoteStatus = FunctionReturnType<typeof api.stacks.getUpvoteStatus>;
type ReportStatus = FunctionReturnType<typeof api.stacks.getReportStatus>;
type UpvotersData = FunctionReturnType<typeof api.stacks.getUpvoters>;

type StackHeaderProps = {
	stack: StackData;
	/** The hero's measured tile, from the page's one usage read. Null hides it. */
	reading: HeroReading | null;
	/** The range the page shows. The tile's hover text names the window. */
	range: RangeId;
	upvoteStatus: UpvoteStatus | undefined;
	reportStatus: ReportStatus | undefined;
	upvotersData: UpvotersData | undefined;
	upvoting: boolean;
	reporting: boolean;
	onUpvote: () => void;
	onReport: () => void;
	onUpvoteHover: () => void;
	onToolsActivate: () => void;
};

/** Logos in the hero row. Six tools show all six; more than six show five and a chip. */
const HERO_TOOLS = 5;

const REPORT_MESSAGE = "You reported this stack. The report remains private.";
const LOW_QUALITY_MESSAGE =
	"This stack has been flagged as low quality by the community. The content may be incomplete or inaccurate.";

/**
 * The hero (#356, prototype v43). Identity first: avatar and byline, the stack
 * name at the size the fitter picks, the one-liner and a logo row that jumps
 * to Tools. The tile column holds the actions, the authored price and, only
 * when a reading exists, the measured token figure. The hero prints no
 * measured dollars: the authored price is its only money.
 */
export function StackHeader({
	stack,
	reading,
	range,
	upvoteStatus,
	reportStatus,
	upvotersData,
	upvoting,
	reporting,
	onUpvote,
	onReport,
	onUpvoteHover,
	onToolsActivate,
}: StackHeaderProps) {
	const { creator } = stack;
	const price = formatPriceDisplay(
		stack.fixedTotal?.amount ?? 0,
		"month",
		"floor",
	);
	const orderedTools = orderToolsForDisplay(stack.tools);
	const shownCount =
		orderedTools.length <= 6 ? orderedTools.length : HERO_TOOLS;
	const heroTools = orderedTools.slice(0, shownCount);
	const restCount = Math.max(0, orderedTools.length - shownCount);
	const reported = reportStatus?.reported === true;
	const rangeLabel = RANGES.find((r) => r.id === range)?.label ?? "30 days";
	const titleWrapRef = useRef<HTMLDivElement>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const fit = useTitleFit(titleWrapRef, titleRef, stack.name);

	return (
		<header className="bg-bg-canvas">
			{/* The patterned block holds the hero only. The warning bands render
			    after it, so the grid never tints them. */}
			<div className="relative pt-10 pb-8 md:pt-14 md:pb-9">
				<div
					aria-hidden="true"
					data-testid="hero-grid-pattern"
					className="pointer-events-none absolute inset-0 z-0 opacity-10"
					style={{
						backgroundImage:
							"linear-gradient(to right, var(--stroke-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--stroke-subtle) 1px, transparent 1px)",
						backgroundSize: "4rem 4rem",
					}}
				/>
				<div className={cn("relative z-[1] mx-auto px-6", STACK_WIDTH)}>
					<div className="grid items-stretch gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16.25rem,17rem)] lg:gap-16">
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-3">
								<StackIcon
									name={creator.name}
									src={creator.avatarUrl}
									color={categoryColor(undefined)}
									size="md"
									className="p-0"
								/>
								<Link
									to="/$creator"
									params={{ creator: `@${creator.handle}` }}
									className="font-mono text-xs text-fg-secondary hover:text-accent-lime"
								>
									<span className="font-bold">{creator.name}</span>{" "}
									<span className="text-fg-muted">@{creator.handle}</span>
								</Link>
								{creator.verified && (
									<span className="inline-flex items-center gap-1 font-mono text-[11px] text-accent-lime">
										<CheckCircle className="size-3" /> verified
									</span>
								)}
							</div>
							{/* No reserved height: a one-line name sits directly above the
						    one-liner. The fitter still picks the size, so the block is as
						    tall as the name it holds and no taller. */}
							<div ref={titleWrapRef} className="mt-5 flex items-start">
								<h1
									ref={titleRef}
									className={cn(
										"max-w-full font-black uppercase leading-[0.88] tracking-[-0.035em] text-fg-primary",
										fit?.mode === "one-line"
											? "whitespace-nowrap"
											: "[overflow-wrap:anywhere]",
									)}
									style={{
										fontSize: fit
											? `${fit.fontSize}px`
											: TITLE_FALLBACK_FONT_SIZE,
									}}
								>
									{stack.name}
								</h1>
							</div>
							<p className="mt-3.5 max-w-3xl text-base text-fg-secondary md:text-lg">
								{stack.oneLiner}
							</p>
							{heroTools.length > 0 && (
								<button
									type="button"
									onClick={onToolsActivate}
									className="mt-7 flex flex-wrap items-center gap-2.5 text-left"
									aria-label="Jump to Tools section"
								>
									{heroTools.map((tool) => (
										<span key={tool._id} title={tool.name}>
											<StackIcon
												name={tool.name}
												src={tool.iconUrl}
												color={categoryColor(tool.categories)}
												size="md"
												className="size-9 p-1"
											/>
										</span>
									))}
									{restCount > 0 && (
										<span
											title={orderedTools
												.slice(shownCount)
												.map((tool) => tool.name)
												.join(", ")}
											className="inline-flex size-9 items-center justify-center border border-stroke-subtle font-mono text-[10px] text-fg-muted"
										>
											+{restCount}
										</span>
									)}
								</button>
							)}
						</div>

						{/* Two columns, one top edge. Below lg the two tiles sit side by
						    side at every width, the prototype's mobile read; from lg the
						    column is a flex stack, so the stamp row sits at the bottom of
						    whichever column is taller. */}
						<div className="grid grid-cols-2 gap-2.5 lg:flex lg:flex-col">
							<div className="col-span-2 flex items-stretch gap-2 lg:col-span-1">
								<UpvoteAction
									status={upvoteStatus}
									upvotersData={upvotersData}
									upvoting={upvoting}
									onUpvote={onUpvote}
									onHover={onUpvoteHover}
								/>
								<ShareMenu
									slug={stack.slug}
									className="flex"
									triggerVariant="ghost"
								/>
							</div>
							<HoverCard
								mode="wrapper"
								position="below"
								width={320}
								offset={12}
								maxRotation={5}
								maxOffset={10}
								renderContent={() => (
									<CostBreakdownTooltip
										tools={stack.tools}
										bundles={stack.bundles}
										fixedTotal={stack.fixedTotal}
										hasUsageComponent={stack.hasUsageComponent}
										usageTotalNotes={stack.usageTotalNotes}
									/>
								)}
							>
								<div className="bg-accent-lime px-4 py-4 text-accent-lime-contrast shadow-[4px_4px_0_var(--stroke-strong)] sm:px-5">
									<p className="font-mono text-3xl font-black leading-none sm:text-4xl">
										${price.amountText}
										{stack.hasUsageComponent && "+"}
									</p>
									<p className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em]">
										{price.suffix} ·{" "}
										{stack.teamSize ? `team ${stack.teamSize}` : "solo"}
									</p>
								</div>
							</HoverCard>
							{reading && (
								<a
									href={`#${MEASURED_ANCHOR}`}
									title={`Measured: tokens across all machines, last ${rangeLabel}`}
									className="relative block overflow-hidden border border-stroke-strong px-4 py-4 sm:px-5"
								>
									<div
										aria-hidden="true"
										className="pointer-events-none absolute inset-0 opacity-[0.14]"
									>
										<Sparkline
											points={reading.points}
											ariaLabel="Token history"
											area
											fluid
											width={280}
											height={96}
										/>
									</div>
									<p className="relative font-mono text-3xl font-black leading-none text-fg-primary sm:text-4xl">
										{fmtTokens(reading.tokens)}
									</p>
									<p className="relative mt-1.5 flex flex-wrap items-baseline gap-x-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
										<span>
											tokens · {reading.days}{" "}
											{reading.days === 1 ? "day" : "days"}
										</span>
										{reading.previousTokens !== null && (
											<Delta
												comparison={{
													current: reading.tokens,
													previous: reading.previousTokens,
												}}
												range={range}
												short
											/>
										)}
									</p>
								</a>
							)}
							<div className="col-span-2 flex min-h-5 items-center justify-end gap-4 font-mono text-[10px] text-fg-muted lg:col-span-1 lg:mt-auto lg:pt-2">
								{reading?.receivedAt != null && (
									<span>
										updated <RelativeTime at={reading.receivedAt} />
									</span>
								)}
								{upvoteStatus?.isOwner ? (
									<Link
										to="/stacks/$slug/edit"
										params={{ slug: stack.slug }}
										className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-4 hover:text-accent-lime"
									>
										<Pencil className="size-3" /> Edit stack
									</Link>
								) : (
									<button
										type="button"
										onClick={onReport}
										disabled={reporting}
										className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-4 hover:text-orange-400 disabled:opacity-50"
									>
										<Flag className="size-3" />
										{reported ? "Reported · undo" : "Report"}
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{stack.isLowQuality && (
				<WarningBand label="Community warning" message={LOW_QUALITY_MESSAGE} />
			)}
			{reported && (
				<WarningBand
					label="Report received"
					message={REPORT_MESSAGE}
					action={
						<button
							type="button"
							onClick={onReport}
							disabled={reporting}
							className="font-mono text-xs underline underline-offset-4 disabled:opacity-50"
						>
							Undo
						</button>
					}
				/>
			)}
		</header>
	);
}

/**
 * A page-level warning directly below the hero: a full-width orange band with
 * its content aligned to the shared frame. The row wraps, so the label, the
 * message and the action never collide at 390px.
 */
function WarningBand({
	label,
	message,
	action,
}: {
	label: string;
	message: string;
	action?: ReactNode;
}) {
	return (
		<div className="mt-8 border-y border-orange-400/60 bg-orange-400/10 py-3">
			<div
				className={cn(
					"mx-auto flex flex-wrap items-center gap-x-4 gap-y-1 px-6",
					STACK_WIDTH,
				)}
			>
				<b className="inline-flex shrink-0 items-center gap-2 font-mono text-xs uppercase text-orange-400">
					<AlertTriangle className="size-4" />
					{label}
				</b>
				<p className="font-mono text-xs text-fg-secondary">{message}</p>
				{action && <span className="ml-auto">{action}</span>}
			</div>
		</div>
	);
}

/** Runs after layout in the browser and never on the server. */
const useIsomorphicLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Measures the title after layout and again whenever the wrapper's width
 * changes, and hands back the fit. Null until the first measurement, so the
 * server render and the hydrating paint use the CSS clamp and never touch
 * `window` during render.
 */
function useTitleFit(
	wrapRef: RefObject<HTMLDivElement | null>,
	titleRef: RefObject<HTMLHeadingElement | null>,
	name: string,
): TitleFit | null {
	const [fit, setFit] = useState<TitleFit | null>(null);
	useIsomorphicLayoutEffect(() => {
		const wrap = wrapRef.current;
		const title = titleRef.current;
		if (!wrap || !title) return;
		let lastWidth = -1;
		const measure = () => {
			const maxPx = titleCeilingPx(window.innerWidth);
			title.style.whiteSpace = "nowrap";
			title.style.fontSize = `${maxPx}px`;
			const next = fitTitle({
				maxPx,
				minPx: TITLE_MIN_PX,
				naturalWidthAtMax: title.scrollWidth,
				availableWidth: wrap.clientWidth,
				wrappedHeightAt: (px) => {
					title.style.whiteSpace = "normal";
					title.style.fontSize = `${px}px`;
					return title.offsetHeight;
				},
			});
			title.style.whiteSpace = next.mode === "one-line" ? "nowrap" : "normal";
			title.style.fontSize = `${next.fontSize}px`;
			setFit((prev) =>
				prev && prev.mode === next.mode && prev.fontSize === next.fontSize
					? prev
					: next,
			);
		};
		measure();
		lastWidth = wrap.clientWidth;
		const onResize = () => {
			if (wrap.clientWidth === lastWidth) return;
			lastWidth = wrap.clientWidth;
			measure();
		};
		const observer =
			typeof ResizeObserver === "undefined"
				? null
				: new ResizeObserver(onResize);
		observer?.observe(wrap);
		window.addEventListener("resize", onResize);
		return () => {
			observer?.disconnect();
			window.removeEventListener("resize", onResize);
		};
	}, [name, wrapRef, titleRef]);
	return fit;
}

function UpvoteAction({
	status,
	upvotersData,
	upvoting,
	onUpvote,
	onHover,
}: {
	status: UpvoteStatus | undefined;
	upvotersData: UpvotersData | undefined;
	upvoting: boolean;
	onUpvote: () => void;
	onHover: () => void;
}) {
	const button = (
		<UpvoteButton
			count={status?.count ?? 0}
			upvoted={status?.upvoted}
			disabled={upvoting || status?.isOwner}
			variant="outline"
			className="w-full"
			onClick={onUpvote}
			title={status?.isOwner ? "You can't upvote your own stack" : undefined}
		/>
	);
	// The upvoters query starts on hover of the whole control, never on render,
	// and only when there is someone to list.
	if ((status?.count ?? 0) === 0)
		return <span className="flex-1">{button}</span>;
	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: hover only starts the tooltip query
		<span className="flex-1" onMouseEnter={onHover}>
			<HoverCard
				mode="wrapper"
				position="below"
				width={280}
				height="auto"
				maxRotation={6}
				maxOffset={8}
				// The card's own root is `inline-block`, which shrink-wraps and
				// leaves the gap before Share. Block plus full width hands the
				// row's spare space back to the button inside.
				className="block w-full"
				renderContent={() => (
					<UpvotersTooltip
						upvoters={upvotersData?.upvoters ?? []}
						totalCount={upvotersData?.totalCount ?? status?.count ?? 0}
						currentUserId={status?.currentUserId ?? null}
						loading={upvotersData === undefined}
					/>
				)}
			>
				{button}
			</HoverCard>
		</span>
	);
}
