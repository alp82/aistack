/**
 * PROTOTYPE — ROUND 2: nailing the hero
 * ---------------------------------------------------------------------------
 * Wayfinder ticket #40 (map #29). THROWAWAY.
 *
 * Round 1 settled the shape: A + B together.
 *   - B ("What actually ran") becomes journey section 02, BEFORE Tools.
 *     Tools slides to 03, Workflow to 04.
 *   - A folds INTO the hero rather than sitting under it as its own band,
 *     and carries NO DOLLAR FIGURE — the money lives in B.
 *   - A links down to B.
 *   - Because Tools is now buried at 03, the top 3 tools fold into the hero.
 *
 * So the hero now has to carry four things at once without becoming a wall:
 *   1. identity (avatar, name, byline, one-liner)
 *   2. the authored price tile ($154/mo) — unchanged, and the ONLY dollars here
 *   3. the top 3 tools, which no longer get to be section 02
 *   4. a dollar-free measured hook that links down to 02
 *
 * THE THREE HERO TREATMENTS disagree about what gets sacrificed to make room:
 *
 *   H1  FOURTH TILE  — sacrifice nothing. The count tiles stay, a fourth
 *                      "checked 2h ago" tile joins them as the link to 02, and
 *                      the top 3 tools ride underneath as a single quiet line.
 *                      Smallest possible change to a hero that already works.
 *
 *   H2  EVIDENCE STRIP — sacrifice the COUNT TILES. "11 tools / 5 models /
 *                      1 bundle" is three numbers that say nothing; the three
 *                      actual tools say more in the same space. The counts
 *                      demote into a full-width measured strip that spans the
 *                      hero and reads as the seam between authored and
 *                      measured.
 *
 *   H3  SPLIT        — sacrifice the CENTERED SYMMETRY. Identity goes left,
 *                      and a bordered "from this machine" panel goes right
 *                      carrying the top 3 tools AND the measured facts, so the
 *                      hero states the claim and the evidence side by side.
 *                      The most radical, and the only one where the measured
 *                      layer is architecture rather than a garnish.
 *
 * DOLLAR-FREE MEASURED VOCABULARY used here (the honest non-money hooks):
 *   382 sessions · 22 of the last 30 days · 4.27B tokens · Fable 5 leads at
 *   35% · checked 2h ago. Money is deliberately absent — it is B's headline.
 *
 * `?hero=H1|H2|H3|off` · `?mstate=` as in round 1.
 * ---------------------------------------------------------------------------
 */
import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { AlertTriangle, ArrowDown, CheckCircle, Flag, Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { CostBreakdownTooltip } from "@/components/CostBreakdownTooltip";
import { UpvoteButton } from "@/components/UpvoteButton";
import { UpvotersTooltip } from "@/components/UpvotersTooltip";
import HoverCard from "@/components/ui/hover-card";
import { ShareMenu } from "@/features/stack-view/ShareMenu";
import {
	categoryColor,
	STACK_WIDTH,
	StackIcon,
} from "@/features/stack-view/ui";
import { formatPriceDisplay, orderToolsForDisplay } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { api } from "../convex/_generated/api";
import { ago, fmtTokens, modelLabel, type Snapshot } from "./measured-public";

type StackData = NonNullable<FunctionReturnType<typeof api.stacks.getBySlug>>;
type UpvoteStatus = FunctionReturnType<typeof api.stacks.getUpvoteStatus>;
type ReportStatus = FunctionReturnType<typeof api.stacks.getReportStatus>;
type UpvotersData = FunctionReturnType<typeof api.stacks.getUpvoters>;

export type HeroProps = {
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
	snapshot: Snapshot | null;
};

const MONO = "font-mono uppercase tracking-wider";
/** The anchor B mounts on. */
export const MEASURED_ANCHOR = "section-measured";

function scrollToMeasured() {
	document
		.getElementById(MEASURED_ANCHOR)
		?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------------------------------------------------------------------------
// Shared identity pieces. Deliberately NOT a shared layout — each treatment
// arranges these itself, and H3 tears the arrangement up completely.
// ---------------------------------------------------------------------------

function Avatar({
	stack,
	upvoteStatus,
	upvotersData,
	upvoting,
	onUpvote,
	onUpvoteHover,
	size = "xl",
}: Pick<
	HeroProps,
	"stack" | "upvoteStatus" | "upvotersData" | "upvoting" | "onUpvote" | "onUpvoteHover"
> & { size?: "lg" | "xl" }) {
	const hasUpvotes = (upvoteStatus?.count ?? 0) > 0;
	const button = (
		<UpvoteButton
			count={upvoteStatus?.count ?? 0}
			upvoted={upvoteStatus?.upvoted}
			disabled={upvoting || upvoteStatus?.isOwner}
			size="md"
			onClick={onUpvote}
			title={
				upvoteStatus?.isOwner ? "You can't upvote your own stack" : undefined
			}
		/>
	);
	return (
		<div className="relative inline-flex">
			<StackIcon
				name={stack.creator.name}
				src={stack.creator.avatarUrl}
				color={categoryColor(undefined)}
				size={size}
			/>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: prefetch gate, as in the real header */}
			<span
				className="absolute left-full top-1/2 -translate-y-1/2 ml-3 border border-stroke-strong"
				onMouseEnter={onUpvoteHover}
			>
				{hasUpvotes ? (
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
								totalCount={upvotersData?.totalCount ?? upvoteStatus?.count ?? 0}
								currentUserId={upvoteStatus?.currentUserId ?? null}
								loading={upvotersData === undefined}
							/>
						)}
					>
						{button}
					</HoverCard>
				) : (
					button
				)}
			</span>
		</div>
	);
}

function Byline({ stack }: { stack: StackData }) {
	return (
		<div className="flex flex-wrap items-center gap-2 font-mono text-sm">
			<Link
				to="/$creator"
				params={{ creator: `@${stack.creator.handle}` }}
				className="inline-flex items-center gap-1.5 text-fg-secondary transition-colors hover:text-accent-lime"
			>
				<span>{stack.creator.name}</span>
				<span className="text-fg-muted">@{stack.creator.handle}</span>
			</Link>
			{stack.creator.verified && (
				<>
					<span className="text-stroke-strong">·</span>
					<span className="inline-flex items-center gap-1.5 text-accent-lime">
						<CheckCircle className="size-3.5 shrink-0" />
						<span>Verified</span>
					</span>
				</>
			)}
		</div>
	);
}

function PriceTile({ stack }: { stack: StackData }) {
	const price = formatPriceDisplay(
		stack.fixedTotal?.amount ?? 0,
		"month",
		"floor",
	);
	return (
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
					{price.suffix} · {stack.teamSize ? `Team ${stack.teamSize}` : "Solo"}
				</span>
			</div>
		</HoverCard>
	);
}

function CountTiles({
	stack,
	onTileActivate,
	extra,
}: Pick<HeroProps, "stack" | "onTileActivate"> & { extra?: ReactNode }) {
	return (
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
					className="flex flex-col items-center px-5 py-2 border-l border-stroke-strong first:border-l-0 cursor-pointer transition-colors hover:text-accent-lime"
				>
					<span className="font-mono font-black text-2xl leading-none text-fg-primary">
						{n}
					</span>
					<span className="mt-1 font-mono text-[10px] tracking-wider uppercase text-fg-muted">
						{n === 1 ? singular : plural}
					</span>
				</button>
			))}
			{extra}
		</div>
	);
}

function ActionsSlot({
	stack,
	upvoteStatus,
	reportStatus,
	reporting,
	onReport,
	className,
}: Pick<
	HeroProps,
	"stack" | "upvoteStatus" | "reportStatus" | "reporting" | "onReport"
> & { className?: string }) {
	return (
		<div className={cn("flex gap-2", className)}>
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
							? "border-orange-400 text-orange-400"
							: "border-stroke-strong bg-bg-panel text-fg-muted hover:border-orange-400 hover:text-orange-400",
					)}
				>
					<Flag className="size-3" />
					{reportStatus?.reported ? "Unreport" : "Report"}
				</button>
			)}
		</div>
	);
}

function QualityBanner({
	stack,
	reportStatus,
}: Pick<HeroProps, "stack" | "reportStatus">) {
	if (!stack.isLowQuality && !reportStatus?.reported) return null;
	return (
		<div className="mt-6 flex items-center gap-3 border border-orange-400/40 bg-orange-400/5 px-5 py-4">
			<AlertTriangle className="size-4 text-orange-400 shrink-0" />
			<p className="font-mono text-sm text-fg-secondary">
				{stack.isLowQuality
					? "This stack has been flagged as low quality by the community. The content may be incomplete or inaccurate."
					: "You reported this stack as low quality. It's pending admin review."}
			</p>
		</div>
	);
}

function HeroShell({ children }: { children: ReactNode }) {
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
			<div className={cn("relative z-[1] mx-auto", STACK_WIDTH)}>{children}</div>
		</header>
	);
}

// ---------------------------------------------------------------------------
// The top 3 tools, in the page's canonical display order.
// ---------------------------------------------------------------------------

function topTools(stack: StackData) {
	const ordered = orderToolsForDisplay(stack.tools);
	return { top: ordered.slice(0, 3), rest: Math.max(0, ordered.length - 3) };
}

/** The dollar-free measured hook. Money is B's headline, never the hero's. */
function measuredFacts(s: Snapshot) {
	const lead = [...s.models].sort((a, b) => b.tokenShare - a.tokenShare)[0];
	return {
		sessions: `${s.activity.sessions.toLocaleString()} sessions`,
		days: `${s.activity.activeDays} of the last ${s.window.days} days`,
		tokens: `${fmtTokens(s.activity.totalTokens)} tokens`,
		lead: lead
			? `${modelLabel(lead)} leads at ${(lead.tokenShare * 100).toFixed(0)}%`
			: null,
		checked: `checked ${ago(s.receivedAt)}`,
		fresh: s.isFresh,
	};
}

function FreshDot({ fresh }: { fresh: boolean }) {
	return (
		<span
			className={cn(
				"inline-block size-1.5 shrink-0",
				fresh ? "bg-accent-lime" : "bg-orange-400",
			)}
		/>
	);
}

// ===========================================================================
// H1 — FOURTH TILE
// Sacrifice nothing. The measured layer earns one cell in the row that is
// already there, and the top 3 tools ride underneath as one quiet line.
// ===========================================================================

export function HeroH1(props: HeroProps) {
	const { stack, snapshot } = props;
	const { top, rest } = topTools(stack);
	const f = snapshot ? measuredFacts(snapshot) : null;

	return (
		<HeroShell>
			<div className="relative flex flex-col items-center text-center gap-6 md:gap-8">
				<Avatar {...props} />
				<h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-fg-primary break-words">
					{stack.name}
				</h1>
				<Byline stack={stack} />
				<div className="h-1 w-14 bg-accent-lime" />
				<p className="text-base md:text-xl text-fg-secondary max-w-prose mx-auto">
					{stack.oneLiner}
				</p>

				<div className="flex flex-wrap gap-x-6 gap-y-4 justify-center items-center">
					<PriceTile stack={stack} />
					<CountTiles
						stack={stack}
						onTileActivate={props.onTileActivate}
						extra={
							f ? (
								<button
									type="button"
									onClick={scrollToMeasured}
									aria-label="Jump to what actually ran"
									className="flex flex-col items-center border-l border-stroke-strong px-5 py-2 transition-colors hover:text-accent-lime"
								>
									<span className="inline-flex items-center gap-1.5 font-mono text-2xl font-black leading-none text-accent-lime">
										<FreshDot fresh={f.fresh} />
										{snapshot?.activity.sessions.toLocaleString()}
									</span>
									<span
										className={cn(MONO, "mt-1 text-[10px] text-fg-muted")}
									>
										Sessions
									</span>
								</button>
							) : undefined
						}
					/>
				</div>

				{/* The top 3 tools, surfaced because Tools is now section 03. */}
				<div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
					{top.map((t) => (
						<span
							key={t._id}
							className="inline-flex items-center gap-2 border border-stroke-subtle px-2.5 py-1"
						>
							<StackIcon
								name={t.name}
								src={t.iconUrl}
								color={categoryColor(t.categories)}
								size="sm"
								className="size-4"
							/>
							<span className="font-mono text-xs text-fg-primary">
								{t.name}
							</span>
						</span>
					))}
					{rest > 0 && (
						<button
							type="button"
							onClick={() => props.onTileActivate("tools")}
							className="font-mono text-xs text-fg-muted hover:text-accent-lime"
						>
							+{rest} more
						</button>
					)}
				</div>

				{f && (
					<button
						type="button"
						onClick={scrollToMeasured}
						className={cn(
							MONO,
							"text-[11px] text-fg-muted transition-colors hover:text-accent-lime",
						)}
					>
						// from this machine — {f.days} · {f.checked}{" "}
						<ArrowDown className="ml-1 inline size-3" />
					</button>
				)}

				<ActionsSlot
					{...props}
					className="justify-center mt-2 lg:mt-0 lg:absolute lg:bottom-0 lg:right-0"
				/>
			</div>
			<QualityBanner stack={stack} reportStatus={props.reportStatus} />
		</HeroShell>
	);
}

// ===========================================================================
// H2 — EVIDENCE STRIP
// Sacrifice the count tiles: "11 / 5 / 1" is three numbers that say nothing,
// and the three actual tools say more in the same space. The counts survive
// as small print inside a full-width measured strip that spans the hero and
// reads as the seam between what's claimed and what ran.
// ===========================================================================

export function HeroH2(props: HeroProps) {
	const { stack, snapshot } = props;
	const { top, rest } = topTools(stack);
	const f = snapshot ? measuredFacts(snapshot) : null;

	return (
		<HeroShell>
			<div className="relative flex flex-col items-center text-center gap-6 md:gap-8">
				<Avatar {...props} />
				<h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-fg-primary break-words">
					{stack.name}
				</h1>
				<Byline stack={stack} />
				<div className="h-1 w-14 bg-accent-lime" />
				<p className="text-base md:text-xl text-fg-secondary max-w-prose mx-auto">
					{stack.oneLiner}
				</p>

				{/* Price + the three tools themselves, in place of the counts. */}
				<div className="flex flex-wrap items-stretch justify-center gap-4">
					<PriceTile stack={stack} />
					{top.map((t) => (
						<button
							type="button"
							key={t._id}
							onClick={() => props.onTileActivate("tools")}
							className="inline-flex min-w-36 items-center gap-3 border border-stroke-strong px-4 py-3 text-left transition-colors hover:border-accent-lime"
						>
							<StackIcon
								name={t.name}
								src={t.iconUrl}
								color={categoryColor(t.categories)}
								size="sm"
							/>
							<span className="min-w-0">
								<span className="block truncate text-sm text-fg-primary">
									{t.name}
								</span>
								<span className={cn(MONO, "block text-[10px] text-fg-muted")}>
									{t.categories?.[0] ?? "tool"}
								</span>
							</span>
						</button>
					))}
					{rest > 0 && (
						<button
							type="button"
							onClick={() => props.onTileActivate("tools")}
							className={cn(
								MONO,
								"inline-flex items-center border border-dashed border-stroke-strong px-4 text-xs text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime",
							)}
						>
							+{rest} more
						</button>
					)}
				</div>

				<ActionsSlot
					{...props}
					className="justify-center mt-2 lg:mt-0 lg:absolute lg:bottom-0 lg:right-0"
				/>
			</div>

			{/* The seam. Full hero width, dollar-free, and the link into 02. */}
			{f && (
				<button
					type="button"
					onClick={scrollToMeasured}
					className="mt-8 flex w-full flex-wrap items-center gap-x-4 gap-y-2 border-y border-accent-lime/40 bg-accent-lime/5 px-5 py-3 text-left transition-colors hover:bg-accent-lime/10"
				>
					<span
						className={cn(
							MONO,
							"inline-flex items-center gap-2 text-[11px] font-bold text-accent-lime",
						)}
					>
						<FreshDot fresh={f.fresh} />
						from this machine
					</span>
					<span className="font-mono text-sm text-fg-primary">{f.sessions}</span>
					<span className="text-stroke-strong">·</span>
					<span className="font-mono text-sm text-fg-primary">{f.days}</span>
					{f.lead && (
						<>
							<span className="text-stroke-strong">·</span>
							<span className="font-mono text-sm text-fg-primary">{f.lead}</span>
						</>
					)}
					<span className={cn(MONO, "ml-auto text-[11px] text-fg-muted")}>
						{stack.tools.length} tools · {stack.models.length} models ·{" "}
						{f.checked}
					</span>
					<span
						className={cn(MONO, "text-[11px] font-bold text-accent-lime")}
					>
						What actually ran <ArrowDown className="inline size-3" />
					</span>
				</button>
			)}
			<QualityBanner stack={stack} reportStatus={props.reportStatus} />
		</HeroShell>
	);
}

// ===========================================================================
// H3 — SPLIT
// Sacrifice the centered symmetry. Claim on the left, evidence on the right,
// stated at the same moment. The only treatment where the measured layer is
// architecture rather than a garnish — and the only one where a stack with no
// snapshot leaves a visibly empty half.
// ===========================================================================

export function HeroH3(props: HeroProps) {
	const { stack, snapshot } = props;
	const { top, rest } = topTools(stack);
	const f = snapshot ? measuredFacts(snapshot) : null;

	return (
		<HeroShell>
			<div className="grid gap-10 md:grid-cols-[1fr_minmax(0,22rem)] md:items-start">
				{/* Claim */}
				<div className="flex flex-col items-start gap-5 text-left">
					<Avatar {...props} size="lg" />
					<h1 className="text-4xl font-black uppercase leading-[0.9] tracking-tighter text-fg-primary break-words sm:text-5xl md:text-6xl">
						{stack.name}
					</h1>
					<Byline stack={stack} />
					<div className="h-1 w-14 bg-accent-lime" />
					<p className="max-w-prose text-base text-fg-secondary md:text-lg">
						{stack.oneLiner}
					</p>
					<div className="flex flex-wrap items-center gap-4">
						<PriceTile stack={stack} />
						<CountTiles stack={stack} onTileActivate={props.onTileActivate} />
					</div>
					<ActionsSlot {...props} />
				</div>

				{/* Evidence */}
				<div className="border border-stroke-strong">
					<div className="border-b border-stroke-subtle px-4 py-3">
						<p className={cn(MONO, "text-[10px] text-fg-muted")}>
							Running on
						</p>
					</div>
					<div className="divide-y divide-stroke-subtle">
						{top.map((t) => (
							<button
								type="button"
								key={t._id}
								onClick={() => props.onTileActivate("tools")}
								className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-panel/50"
							>
								<StackIcon
									name={t.name}
									src={t.iconUrl}
									color={categoryColor(t.categories)}
									size="sm"
								/>
								<span className="min-w-0 flex-1 truncate text-sm text-fg-primary">
									{t.name}
								</span>
							</button>
						))}
						{rest > 0 && (
							<button
								type="button"
								onClick={() => props.onTileActivate("tools")}
								className={cn(
									MONO,
									"w-full px-4 py-2 text-left text-[10px] text-fg-muted hover:text-accent-lime",
								)}
							>
								+{rest} more
							</button>
						)}
					</div>

					{f ? (
						<button
							type="button"
							onClick={scrollToMeasured}
							className="block w-full border-t border-accent-lime/40 bg-accent-lime/5 px-4 py-4 text-left transition-colors hover:bg-accent-lime/10"
						>
							<p
								className={cn(
									MONO,
									"inline-flex items-center gap-2 text-[10px] font-bold text-accent-lime",
								)}
							>
								<FreshDot fresh={f.fresh} />
								from this machine
							</p>
							<dl className="mt-3 space-y-1.5">
								<Fact label="sessions" value={f.sessions.split(" ")[0]} />
								<Fact
									label={`active of ${snapshot?.window.days} days`}
									value={String(snapshot?.activity.activeDays)}
								/>
								<Fact label="tokens" value={f.tokens.split(" ")[0]} />
							</dl>
							<p
								className={cn(
									MONO,
									"mt-3 text-[10px] font-bold text-accent-lime",
								)}
							>
								What actually ran <ArrowDown className="inline size-3" />
							</p>
							<p className={cn(MONO, "mt-1 text-[9px] text-fg-muted")}>
								{f.checked}
							</p>
						</button>
					) : (
						<div className="border-t border-stroke-subtle px-4 py-4">
							<p className={cn(MONO, "text-[10px] text-fg-muted")}>
								not measured yet
							</p>
						</div>
					)}
				</div>
			</div>
			<QualityBanner stack={stack} reportStatus={props.reportStatus} />
		</HeroShell>
	);
}

function Fact({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-baseline justify-between gap-3">
			<dt className={cn(MONO, "text-[10px] text-fg-muted")}>{label}</dt>
			<dd className="font-mono text-lg font-black leading-none text-fg-primary">
				{value}
			</dd>
		</div>
	);
}
