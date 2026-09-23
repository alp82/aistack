import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { fmtUSD } from "@/features/measured/copy";
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
};
const WORD: Record<Tile["severity"], string> = {
	high: "Fix",
	medium: "Look",
	low: "Minor",
	ok: "Good",
};

/** "Save tokens: 7 findings". A finding is a rule that did not pass. */
export function findingsLine(read: EfficiencyRead): string {
	const n = read.tiles.filter((t) => t.severity !== "ok").length;
	if (n === 0) return "Save tokens: no findings";
	return `Save tokens: ${n} finding${n === 1 ? "" : "s"}`;
}

const worstPaint = (read: EfficiencyRead): string =>
	PAINT[read.tiles.find((t) => t.severity !== "ok")?.severity ?? "ok"];

/** The full grid: one tile per lever, passing rules included, detail on click. */
export function EfficiencyTiles({ read }: { read: EfficiencyRead }) {
	const [open, setOpen] = useState<string | null>(null);
	const many = new Set(read.tiles.map((t) => t.harness)).size > 1;
	return (
		<ul className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
			{read.tiles.map((tile) => {
				const isOpen = open === tile.id;
				const paint = PAINT[tile.severity];
				const ok = tile.severity === "ok";
				return (
					<li key={tile.id} className="flex min-w-0">
						<button
							type="button"
							aria-expanded={isOpen}
							onClick={() => setOpen(isOpen ? null : tile.id)}
							className="flex min-h-44 w-full flex-col bg-bg-panel text-left"
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
							<span className="mt-auto flex items-baseline justify-between gap-3 px-4 pt-4 pb-3 font-mono text-[11px] text-fg-muted">
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
							{isOpen && (
								<span className="block space-y-2 border-t border-stroke-subtle px-4 py-3">
									{!ok && (
										<span className="block text-sm text-fg-primary">
											{tile.action}
										</span>
									)}
									<span className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-fg-muted">
										{tile.evidence.map((e) => (
											<span key={e.label}>
												<b className="text-fg-primary">{e.value}</b> {e.label}
											</span>
										))}
									</span>
								</span>
							)}
						</button>
					</li>
				);
			})}
		</ul>
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
				change.
			</p>
			{read === undefined ? (
				<p className="mt-8 font-mono text-sm text-fg-muted">Loading...</p>
			) : read === null || read.tiles.length === 0 ? (
				<div className="mt-8 border-2 border-stroke-strong bg-bg-panel p-6">
					<p className="font-mono text-sm text-fg-primary">No findings yet.</p>
					<p className="mt-2 text-sm text-fg-secondary">
						Findings appear after a sync from a CLI that measures them.
					</p>
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
