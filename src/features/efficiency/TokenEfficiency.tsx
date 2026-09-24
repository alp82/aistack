import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowRight, Check, ChevronDown, Copy } from "lucide-react";
import { Fragment, useState } from "react";
import { CommandBlock } from "@/features/measured/CommandLine";
import { fmtUSD, SYNC_CMD, SYNC_CMD_COMMENT } from "@/features/measured/copy";
import { harnessLabel } from "@/features/usage/HarnessShareRows";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";

/**
 * Token efficiency: the owner's findings on how to save tokens (decided
 * 2026-09-23, variant K on branch prototype/token-efficiency-placement).
 *
 * OWNER ONLY, three surfaces. `/settings/token-efficiency` holds the full
 * tile grid. The stack page links to it with one bar under the hero, and the
 * profile with compact boxes. Every query answers the signed-in creator
 * alone; the components also skip the query for anyone else.
 *
 * A tile leads with the fix. Severity colors the left edge: destructive for
 * a fix, warning for a look, muted for a minor, lime for a passing rule. A
 * passing rule sits in the same grid and prints what to keep doing.
 */
export type EfficiencyRead = NonNullable<
	FunctionReturnType<typeof api.workflow.getMyEfficiency>
>;
type Tile = EfficiencyRead["tiles"][number];

export const TOKEN_EFFICIENCY_PATH = "/settings/token-efficiency";

const PAINT: Record<Tile["severity"], string> = {
	high: "var(--destructive)",
	medium: "var(--warning)",
	low: "var(--fg-muted)",
	ok: "var(--accent-lime)",
	insufficient: "var(--stroke-subtle)",
};
const WORD: Record<Tile["severity"], string> = {
	high: "Fix",
	medium: "Look",
	low: "Minor",
	ok: "Good",
	insufficient: "More data",
};

/** Fix, Look and Minor are findings. Passing rules and rules below their floor are not. */
const isFinding = (severity: Tile["severity"]): boolean =>
	severity === "high" || severity === "medium" || severity === "low";

/** "Save tokens: 7 findings". A finding is a rule that graded Fix, Look or Minor. */
export function findingsLine(read: EfficiencyRead): string {
	const n = read.tiles.filter((t) => isFinding(t.severity)).length;
	if (n === 0) return "Save tokens: no findings";
	return `Save tokens: ${n} finding${n === 1 ? "" : "s"}`;
}

const WORST: readonly Tile["severity"][] = ["high", "medium", "low"];
const worstPaint = (read: EfficiencyRead): string =>
	PAINT[WORST.find((s) => read.tiles.some((t) => t.severity === s)) ?? "ok"];

/**
 * The full grid: one tile per lever, passing rules included. A tile opens its
 * guide in a full-width panel. The panel follows the tile in the list, and
 * `grid-flow-dense` pulls the rest of the tile's row back up, so the guide
 * lands under the row at every column count.
 */
export function EfficiencyTiles({ read }: { read: EfficiencyRead }) {
	const [open, setOpen] = useState<string | null>(null);
	const many = new Set(read.tiles.map((t) => t.harness)).size > 1;
	return (
		<ul className="grid grid-flow-dense gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
			{read.tiles.map((tile) => {
				const isOpen = open === tile.id;
				const paint = PAINT[tile.severity];
				const ok = tile.severity === "ok";
				const panelId = `efficiency-guide-${tile.lever}`;
				return (
					<Fragment key={tile.id}>
						<li className="flex min-w-0">
							<button
								type="button"
								aria-expanded={isOpen}
								aria-controls={panelId}
								onClick={() => setOpen(isOpen ? null : tile.id)}
								className={cn(
									"group flex min-h-44 w-full cursor-pointer flex-col text-left transition-colors",
									"outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent-lime",
									isOpen
										? "bg-bg-panel-elevated"
										: "bg-bg-panel hover:bg-bg-panel-elevated",
								)}
								style={{ borderLeft: `8px solid ${paint}` }}
							>
								<span
									className="px-4 pt-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em]"
									style={{ color: paint }}
								>
									{WORD[tile.severity]}
									{many && (
										<span className="ml-2 font-normal text-fg-muted">
											{harnessLabel(tile.harness)}
										</span>
									)}
								</span>
								<span className="mt-2 px-4 text-[22px] font-black leading-tight text-fg-primary">
									{ok ? tile.keep : tile.fix}
								</span>
								<span className="mt-1.5 px-4 text-sm text-fg-muted">
									{tile.verdict}
								</span>
								<span className="mt-auto flex items-baseline justify-between gap-3 px-4 pt-4 font-mono text-[11px] text-fg-muted">
									<span>
										<b className="text-fg-primary">{tile.figure.value}</b>{" "}
										{tile.figure.label}
									</span>
									{tile.usd !== null && tile.usd >= 1 && (
										<b className="text-base text-fg-primary">
											{fmtUSD(tile.usd)}
										</b>
									)}
								</span>
								<span
									className={cn(
										"mt-3 flex items-center justify-between border-t border-stroke-subtle px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em]",
										isOpen
											? "text-fg-primary"
											: "text-fg-muted group-hover:text-fg-primary",
									)}
								>
									{isOpen
										? "Close"
										: ok
											? "Why it matters"
											: tile.severity === "insufficient"
												? "Details"
												: "How to fix"}
									<ChevronDown
										aria-hidden="true"
										className={cn(
											"size-3.5 transition-transform",
											isOpen && "rotate-180",
										)}
									/>
								</span>
							</button>
						</li>
						{isOpen && (
							<li id={panelId} className="col-span-full min-w-0">
								<EfficiencyGuide tile={tile} />
							</li>
						)}
					</Fragment>
				);
			})}
		</ul>
	);
}

const HEADING =
	"font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-fg-muted";

/** The opened tile: why it costs, what was measured, and the steps to fix it. */
function EfficiencyGuide({ tile }: { tile: Tile }) {
	const ok = tile.severity === "ok";
	const waiting = tile.severity === "insufficient";
	const { have, need, unit } = tile.sample;
	return (
		<div
			className="grid gap-6 bg-bg-panel-elevated px-5 py-5 md:grid-cols-[minmax(0,5fr)_minmax(0,3fr)] md:gap-8 md:px-6"
			style={{ borderLeft: `8px solid ${PAINT[tile.severity]}` }}
		>
			<section>
				{waiting && (
					<div className="mb-6">
						<h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-primary">
							Not enough data yet
						</h3>
						<p className="mt-3 text-base leading-relaxed text-fg-primary">
							This check needs at least {need.toLocaleString("en-US")} {unit}{" "}
							from the last 30 days, and your syncs have{" "}
							{have.toLocaleString("en-US")}. Sync more sessions to get a
							rating.
						</p>
					</div>
				)}
				<h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-primary">
					{ok
						? "To keep it that way"
						: waiting
							? "How to fix, if it applies"
							: "How to fix"}
				</h3>
				<ol className="mt-3 space-y-4">
					{tile.steps.map((step, i) => (
						<li key={step.text} className="flex gap-3">
							<span className="mt-0.5 font-mono text-sm font-bold text-fg-muted">
								{i + 1}.
							</span>
							<div className="min-w-0 flex-1 space-y-2">
								<p className="text-base leading-relaxed text-fg-primary">
									{step.text}
								</p>
								{step.code && <Snippet code={step.code} />}
							</div>
						</li>
					))}
				</ol>
			</section>
			<div className="space-y-5">
				<section>
					<h3 className={HEADING}>
						{ok ? "Why it matters" : "Why it costs tokens"}
					</h3>
					<p className="mt-2 text-sm leading-relaxed text-fg-secondary">
						{tile.why}
					</p>
				</section>
				<section>
					<h3 className={HEADING}>What your syncs show</h3>
					<ul className="mt-2 space-y-1 font-mono text-[12px] text-fg-muted">
						{isFinding(tile.severity) &&
							tile.share !== null &&
							tile.share >= 0.005 && (
								<li>
									<b className="text-fg-primary">
										about {Math.round(tile.share * 100)}%
									</b>{" "}
									of your token spend
								</li>
							)}
						<li>
							<b className="text-fg-primary">{tile.figure.value}</b>{" "}
							{tile.figure.label}
						</li>
						{tile.evidence.map((e) => (
							<li key={e.label}>
								<b className="text-fg-primary">{e.value}</b> {e.label}
							</li>
						))}
						{tile.usd !== null && tile.usd >= 1 && tile.usdNote && (
							<li>
								<b className="text-fg-primary">{fmtUSD(tile.usd)}</b>{" "}
								{tile.usdNote}
							</li>
						)}
					</ul>
				</section>
			</div>
		</div>
	);
}

/** Something to type or paste, verbatim, with a copy button. */
function Snippet({ code }: { code: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<div className="flex items-start gap-2 border border-stroke-subtle bg-bg-canvas px-3 py-2">
			<pre className="min-w-0 flex-1 overflow-x-auto font-mono text-[13px] text-fg-primary">
				<code>{code}</code>
			</pre>
			<button
				type="button"
				aria-label={`Copy ${code}`}
				className="cursor-pointer p-0.5 text-fg-muted transition-colors hover:text-accent-lime"
				onClick={() => {
					navigator.clipboard.writeText(code);
					setCopied(true);
					setTimeout(() => setCopied(false), 1500);
				}}
			>
				{copied ? <Check size={13} /> : <Copy size={13} />}
			</button>
		</div>
	);
}

/** The same boxes, shorter: the severity word and the fix, nothing else. */
export function EfficiencyCompact({ read }: { read: EfficiencyRead }) {
	return (
		<ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
			{read.tiles.map((tile) => (
				<li
					key={tile.id}
					className="min-w-0 bg-bg-panel px-3 py-2.5"
					style={{ borderLeft: `6px solid ${PAINT[tile.severity]}` }}
				>
					<p
						className="font-mono text-[9px] font-bold uppercase tracking-[0.2em]"
						style={{ color: PAINT[tile.severity] }}
					>
						{WORD[tile.severity]}
					</p>
					<p className="mt-1 text-sm font-black leading-tight text-fg-primary">
						{tile.severity === "ok" ? tile.keep : tile.fix}
					</p>
				</li>
			))}
		</ul>
	);
}

/** The stack page's owner-only door, under the hero. */
export function SaveTokensBar({
	slug,
	isOwner,
	className,
}: {
	slug: string;
	isOwner: boolean;
	className?: string;
}) {
	const read = useQuery(
		api.workflow.getEfficiencyByStackSlug,
		isOwner ? { slug } : "skip",
	);
	if (!isOwner || !read) return null;
	return (
		<div className={className}>
			<Link
				to={TOKEN_EFFICIENCY_PATH}
				className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-bg-shell px-4 py-3 font-mono text-[11px] hover:bg-bg-panel-muted"
				style={{ borderLeft: `8px solid ${worstPaint(read)}` }}
			>
				<span className="font-bold uppercase tracking-[0.22em] text-fg-primary">
					{findingsLine(read)}
				</span>
				<span className="text-fg-muted">only you see this</span>
				<ArrowRight
					aria-hidden="true"
					className="ml-auto size-3 text-fg-muted"
				/>
			</Link>
		</div>
	);
}

/** The profile's owner-only preview. The route renders it for the owner only. */
export function ProfileEfficiencyPreview() {
	const read = useQuery(api.workflow.getMyEfficiency, {});
	if (!read || read.tiles.length === 0) return null;
	return (
		<Link
			to={TOKEN_EFFICIENCY_PATH}
			aria-label="Token efficiency"
			className="block hover:opacity-90"
		>
			<span className="mb-2 flex items-center justify-between font-mono text-[11px]">
				<span className="font-bold uppercase tracking-[0.18em] text-fg-primary">
					Token efficiency
				</span>
				<span className="inline-flex items-center gap-1 text-accent-lime">
					how <ArrowRight aria-hidden="true" className="size-3" />
				</span>
			</span>
			<EfficiencyCompact read={read} />
		</Link>
	);
}

/** `/settings/token-efficiency`: the full grid for the signed-in creator. */
export function TokenEfficiencyPage() {
	const read = useQuery(api.workflow.getMyEfficiency, {});
	return (
		<div className="mx-auto max-w-5xl px-6 py-12">
			<h1 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
				Token efficiency
			</h1>
			<p className="mt-3 max-w-prose text-sm leading-relaxed text-fg-secondary">
				Where your last 30 days of syncs say tokens go to waste, and what to
				change. Open a card to see why it costs tokens and the steps to fix it.
			</p>
			{read === undefined ? (
				<p className="mt-8 font-mono text-sm text-fg-muted">Loading...</p>
			) : read === null || read.tiles.length === 0 ? (
				<div className="mt-8 border-2 border-stroke-strong bg-bg-panel p-6">
					<p className="font-mono text-sm text-fg-primary">No findings yet.</p>
					<p className="mt-2 text-sm text-fg-secondary">
						Run a sync with the latest CLI. Your findings appear here after it
						publishes.
					</p>
					<div className="mt-5 max-w-xl">
						<CommandBlock
							commands={[{ cmd: SYNC_CMD, comment: SYNC_CMD_COMMENT }]}
						/>
					</div>
				</div>
			) : (
				<>
					<p
						className={cn(
							"mt-8 font-mono text-3xl font-black text-fg-primary md:text-4xl",
						)}
					>
						{findingsLine(read)}
					</p>
					<div className="mt-6">
						<EfficiencyTiles read={read} />
					</div>
				</>
			)}
		</div>
	);
}
