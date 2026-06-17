import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { AlertTriangle, CheckCircle, Flag, Globe, Pencil } from "lucide-react";
import { CostBreakdownTooltip } from "@/components/CostBreakdownTooltip";
import { UpvoteButton } from "@/components/UpvoteButton";
import { UpvotersTooltip } from "@/components/UpvotersTooltip";
import HoverCard from "@/components/ui/hover-card";
import { formatPriceDisplay } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { api } from "../../../convex/_generated/api";
import { ShareMenu } from "./ShareMenu";
import { categoryColor, STACK_WIDTH, StackIcon } from "./ui";

type StackData = NonNullable<FunctionReturnType<typeof api.stacks.getBySlug>>;
type UpvoteStatus = FunctionReturnType<typeof api.stacks.getUpvoteStatus>;
type ReportStatus = FunctionReturnType<typeof api.stacks.getReportStatus>;
type UpvotersData = FunctionReturnType<typeof api.stacks.getUpvoters>;

type StackHeaderProps = {
	stack: StackData;
	upvoteStatus: UpvoteStatus | undefined;
	reportStatus: ReportStatus | undefined;
	upvotersData: UpvotersData | undefined;
	upvoting: boolean;
	reporting: boolean;
	onUpvote: () => void;
	onReport: () => void;
	onUpvoteHover: () => void;
	onTileActivate: (target: "tools" | "models" | "bundles") => void;
};

export function StackHeader({
	stack,
	upvoteStatus,
	reportStatus,
	upvotersData,
	upvoting,
	reporting,
	onUpvote,
	onReport,
	onUpvoteHover,
	onTileActivate,
}: StackHeaderProps) {
	const { creator, personalPageUrl } = stack;
	const hasUpvotes = (upvoteStatus?.count ?? 0) > 0;
	const price = formatPriceDisplay(
		stack.fixedTotal?.amount ?? 0,
		"month",
		"floor",
	);

	return (
		<header className="relative border-b border-stroke-strong py-8 md:py-12 px-6">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 z-0 opacity-10"
				style={{
					backgroundImage:
						"linear-gradient(to right, var(--stroke-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--stroke-subtle) 1px, transparent 1px)",
					backgroundSize: "4rem 4rem",
				}}
			/>
			<div className={cn("relative z-[1] mx-auto", STACK_WIDTH)}>
				<div className="relative flex flex-col items-center text-center gap-6 md:gap-8">
					{/* Avatar + companion upvote */}
					<div className="relative inline-flex">
						<StackIcon
							name={creator.name}
							src={creator.avatarUrl}
							color={categoryColor(undefined)}
							size="xl"
						/>
						{hasUpvotes ? (
							// biome-ignore lint/a11y/noStaticElementInteractions: onMouseEnter is a non-interactive prefetch gate (un-skips the upvoters query), not a user action; positioning wrapper must stay a span
							<span
								className="absolute left-full top-1/2 -translate-y-1/2 ml-3 border border-stroke-strong"
								onMouseEnter={onUpvoteHover}
							>
								<HoverCard
									mode="wrapper"
									position="below"
									width={280}
									height="auto"
									maxRotation={6}
									maxOffset={8}
									renderContent={() => (
										<UpvotersTooltip
											upvoters={upvotersData?.upvoters ?? []}
											totalCount={
												upvotersData?.totalCount ?? upvoteStatus?.count ?? 0
											}
											currentUserId={upvoteStatus?.currentUserId ?? null}
											loading={upvotersData === undefined}
										/>
									)}
								>
									<UpvoteButton
										count={upvoteStatus?.count ?? 0}
										upvoted={upvoteStatus?.upvoted}
										disabled={upvoting || upvoteStatus?.isOwner}
										size="md"
										onClick={onUpvote}
										title={
											upvoteStatus?.isOwner
												? "You can't upvote your own stack"
												: undefined
										}
									/>
								</HoverCard>
							</span>
						) : (
							<span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 border border-stroke-strong">
								<UpvoteButton
									count={upvoteStatus?.count ?? 0}
									upvoted={upvoteStatus?.upvoted}
									disabled={upvoting || upvoteStatus?.isOwner}
									size="md"
									onClick={onUpvote}
									title={
										upvoteStatus?.isOwner
											? "You can't upvote your own stack"
											: undefined
									}
								/>
							</span>
						)}
					</div>

					{/* Title */}
					<h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-fg-primary break-words">
						{stack.name}
					</h1>

					{/* Byline */}
					<div className="flex flex-wrap items-center justify-center gap-2 font-mono text-sm">
						{creator.xHandle && (
							<>
								<a
									href={`https://x.com/${creator.xHandle}`}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 text-fg-secondary transition-colors hover:text-accent-lime"
								>
									<svg
										className="size-3.5 shrink-0"
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<title>X</title>
										<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
									</svg>
									<span>@{creator.xHandle}</span>
								</a>
							</>
						)}
						{personalPageUrl && (
							<>
								{creator.xHandle && (
									<span className="text-stroke-strong">·</span>
								)}
								<a
									href={
										personalPageUrl.startsWith("http")
											? personalPageUrl
											: `https://${personalPageUrl}`
									}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 text-fg-secondary transition-colors hover:text-accent-lime"
								>
									<Globe className="size-3.5 shrink-0" />
									<span>
										{personalPageUrl.replace(/^https?:\/\//, "").split("/")[0]}
									</span>
								</a>
							</>
						)}
						{creator.verified && (
							<>
								<span className="text-stroke-strong">·</span>
								<span className="inline-flex items-center gap-1.5 text-accent-lime">
									<CheckCircle className="size-3.5 shrink-0" />
									<span>Verified</span>
								</span>
							</>
						)}
					</div>

					{/* Lime keyline */}
					<div className="h-1 w-14 bg-accent-lime" />

					{/* One-liner */}
					<p className="text-base md:text-xl text-fg-secondary max-w-prose mx-auto">
						{stack.oneLiner}
					</p>

					{/* Meta row: price tile + stat cells */}
					<div className="flex flex-wrap gap-x-6 gap-y-4 justify-center items-center">
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
							<div className="bg-accent-lime text-accent-lime-contrast shadow-[4px_4px_0_var(--stroke-strong)] px-5 py-4 inline-flex flex-col items-center text-center transition-all hover:shadow-[6px_6px_0_var(--stroke-strong)]">
								<span className="font-mono font-black text-3xl leading-none text-accent-lime-contrast">
									${price.amountText}
									{stack.hasUsageComponent && "+"}
								</span>
								<span className="mt-1 font-mono text-[10px] tracking-wide uppercase text-accent-lime-contrast">
									{price.suffix} ·{" "}
									{stack.teamSize ? `Team ${stack.teamSize}` : "Solo"}
								</span>
							</div>
						</HoverCard>

						<div className="inline-flex">
							{(
								[
									[stack.tools.length, "Tool", "Tools", "tools"],
									[stack.models.length, "Model", "Models", "models"],
									[stack.bundles.length, "Bundle", "Bundles", "bundles"],
								] as const
							).map(([n, singular, plural, target]) => (
								<button
									type="button"
									key={singular}
									onClick={() => onTileActivate(target)}
									aria-label={`Jump to ${plural} section`}
									className="flex flex-col items-center px-5 py-2 border-l border-stroke-strong first:border-l-0 cursor-pointer transition-colors hover:text-accent-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lime/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas"
								>
									<span className="font-mono font-black text-2xl leading-none text-fg-primary">
										{n}
									</span>
									<span className="mt-1 font-mono text-[10px] tracking-wider uppercase text-fg-muted">
										{n === 1 ? singular : plural}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* Share + edit / report slot */}
					<div className="flex justify-center gap-2 mt-2 lg:mt-0 lg:absolute lg:bottom-0 lg:right-0">
						<ShareMenu slug={stack.slug} />
						{upvoteStatus?.isOwner ? (
							<Link
								to="/stacks/$slug/edit"
								params={{ slug: stack.slug }}
								className="inline-flex items-center gap-1.5 border border-stroke-strong bg-bg-panel px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime"
							>
								<Pencil className="size-3" />
								Edit
							</Link>
						) : (
							<button
								type="button"
								onClick={onReport}
								disabled={reporting}
								className={cn(
									"inline-flex items-center gap-1.5 border px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] transition-colors disabled:opacity-50",
									reportStatus?.reported
										? "border-orange-400 text-orange-400 hover:border-orange-300 hover:text-orange-300"
										: "border-stroke-strong bg-bg-panel text-fg-muted hover:border-orange-400 hover:text-orange-400",
								)}
							>
								<Flag className="size-3" />
								{reportStatus?.reported ? "Unreport" : "Report"}
							</button>
						)}
					</div>
				</div>

				{/* Low-quality / reported banner */}
				{(stack.isLowQuality || reportStatus?.reported) && (
					<div className="mt-6 flex items-center gap-3 border border-orange-400/40 bg-orange-400/5 px-5 py-4">
						<AlertTriangle className="size-4 text-orange-400 shrink-0" />
						<p className="font-mono text-sm text-fg-secondary">
							{stack.isLowQuality
								? "This stack has been flagged as low quality by the community. The content may be incomplete or inaccurate."
								: "You reported this stack as low quality. It's pending admin review."}
						</p>
					</div>
				)}
			</div>
		</header>
	);
}
