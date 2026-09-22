import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { fmtUSD } from "@/features/measured/copy";
import { cn } from "@/lib/utils";
import type { api } from "../../../convex/_generated/api";
import { harnessLabel } from "./HarnessShareRows";

export type EfficiencyRead = NonNullable<
	FunctionReturnType<typeof api.workflow.getEfficiencyByStackSlug>
>;
type Tile = EfficiencyRead["tiles"][number];

/**
 * The owner's token-efficiency scorecard (variant B, decided 2026-09-23).
 *
 * A tile leads with the FIX as its biggest text, the problem as one muted
 * line, one figure at the bottom, and the detail on click. Severity colors
 * the left edge: destructive for a fix, warning for a look, muted for a
 * minor. Lime is reserved for a passing rule, rendered as a two-row mini
 * card ("Keep ..." plus one figure). No data-source chrome on the page; the
 * price tables a dollar cites sit under the headline as one line.
 */
const SEV_PAINT: Record<Tile["severity"], string> = {
	high: "var(--destructive)",
	medium: "var(--warning)",
	low: "var(--fg-muted)",
	ok: "var(--accent-lime)",
};
const SEV_WORD: Record<Tile["severity"], string> = {
	high: "Fix this",
	medium: "Worth a look",
	low: "Minor",
	ok: "Good",
};

export function EfficiencyBlock({ read }: { read: EfficiencyRead }) {
	const [open, setOpen] = useState<string | null>(null);
	const todo = read.tiles.filter((t) => t.severity !== "ok");
	const good = read.tiles.filter((t) => t.severity === "ok");
	const harnesses = new Set(read.tiles.map((t) => t.harness));
	if (read.tiles.length === 0) return null;
	return (
		<section className="min-w-0" aria-label="Token efficiency">
			<header className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 md:mb-4">
				<h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-lime">
					Token efficiency
				</h3>
				<span className="font-mono text-[11px] text-fg-muted">
					only you see this
				</span>
			</header>
			<div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 md:mb-5">
				<h4 className="text-xl font-black leading-tight text-fg-primary md:text-2xl">
					{todo.length === 0
						? "Nothing to change"
						: `${todo.length} change${todo.length === 1 ? "" : "s"} would save tokens`}
				</h4>
				{read.recoverableUsd !== null && read.recoverableUsd >= 1 && (
					<span className="font-mono text-sm text-fg-muted">
						at least{" "}
						<b className="text-fg-primary">{fmtUSD(read.recoverableUsd)}</b>{" "}
						over 30 days
					</span>
				)}
			</div>
			{todo.length > 0 && (
				<ul className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
					{todo.map((tile) => {
						const isOpen = open === tile.id;
						const paint = SEV_PAINT[tile.severity];
						return (
							<li key={tile.id} className="flex min-w-0">
								<button
									type="button"
									aria-expanded={isOpen}
									onClick={() => setOpen(isOpen ? null : tile.id)}
									className="flex min-h-40 w-full flex-col bg-bg-panel text-left md:min-h-48"
									style={{ borderLeft: `8px solid ${paint}` }}
								>
									<span
										className="px-4 pt-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] md:px-5 md:pt-4"
										style={{ color: paint }}
									>
										{SEV_WORD[tile.severity]}
										{harnesses.size > 1 && (
											<span className="ml-2 font-normal text-fg-muted">
												{harnessLabel(tile.harness)}
											</span>
										)}
									</span>
									<span className="mt-2 px-4 text-xl font-black leading-tight text-fg-primary md:px-5 md:text-[26px]">
										{tile.fix}
									</span>
									<span className="mt-2 px-4 text-sm text-fg-muted md:px-5">
										{tile.verdict}
									</span>
									<span className="mt-auto flex items-baseline justify-between gap-3 px-4 pt-4 pb-3 font-mono text-[11px] text-fg-muted md:px-5 md:pt-5 md:pb-4">
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
										<span className="block space-y-2 border-t border-stroke-subtle px-4 py-3 md:px-5">
											<span className="block text-sm text-fg-primary">
												{tile.action}
											</span>
											<Evidence items={tile.evidence} />
											<span className="block text-xs text-fg-muted">
												{tile.why}
											</span>
											{tile.usdNote && (
												<span className="block font-mono text-[10px] text-fg-muted">
													{tile.usdNote}
												</span>
											)}
										</span>
									)}
								</button>
							</li>
						);
					})}
				</ul>
			)}
			{good.length > 0 && (
				<ul
					className={cn(
						"grid gap-2 md:gap-3",
						todo.length > 0 && "mt-4",
						"grid-cols-2 xl:grid-cols-4",
					)}
				>
					{good.map((tile) => (
						<li
							key={tile.id}
							className="min-w-0 bg-bg-panel px-3 py-2.5 md:px-4 md:py-3"
							style={{ borderLeft: "8px solid var(--accent-lime)" }}
						>
							<p className="text-sm font-bold text-fg-primary">{tile.keep}</p>
							<p className="mt-1 font-mono text-[11px] text-fg-muted">
								<b className="text-fg-primary">{tile.figure.value}</b>{" "}
								{tile.figure.label}
							</p>
						</li>
					))}
				</ul>
			)}
			{read.pricingTables.length > 0 && (
				<p className="mt-3 break-all font-mono text-[10px] text-fg-muted">
					Dollars are lower bounds at API list prices. Price tables:{" "}
					{read.pricingTables.join(", ")}
				</p>
			)}
		</section>
	);
}

function Evidence({ items }: { items: Tile["evidence"] }) {
	if (items.length === 0) return null;
	return (
		<dl className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px]">
			{items.map((e) => (
				<div key={e.label} className="flex items-baseline gap-2">
					<dt className="text-fg-muted">{e.label}</dt>
					<dd className="font-bold text-fg-primary">{e.value}</dd>
				</div>
			))}
		</dl>
	);
}
