/**
 * PROTOTYPE - throwaway. Three ways to integrate all eight token-efficiency
 * insights into the Stats page, switchable via `?variant=` on
 * /prototype/token-efficiency-live. Real usage and Stats for the slug, real
 * insights (v3 from the mirror, v4 from the local measurement).
 *
 *   A  Scorecard block   the decided tile grid, after the tiles; copy trimmed
 *   B  Verdict strip     one line under the headline plus eight chips; a chip
 *                        opens its detail inline; the rest of Stats unchanged
 *   C  Closing ledger    Stats first, then "What to change" as a ranked
 *                        numbered list with the action verbatim, at the end
 */
import type { EfficiencyInsight } from "@aistack/workflow-rules";
import { useState } from "react";
import { fmtUSD } from "@/features/measured/copy";
import { cn } from "@/lib/utils";
import type { UsageRead } from "../copy";
import { harnessLabel } from "../HarnessShareRows";
import { StatsBlocks } from "../StatsBlocks";
import type { StatsRead } from "../stats";
import { Switcher } from "./StatsBlocksPrototype";

export const VARIANTS = {
	A: "Scorecard block",
	B: "Verdict strip",
	C: "Closing ledger",
} as const;
export type VariantKey = keyof typeof VARIANTS;
export const VARIANT_KEYS = Object.keys(VARIANTS) as VariantKey[];

type Sev = EfficiencyInsight["severity"];
const PAINT: Record<Sev, string> = {
	high: "var(--destructive)",
	medium: "var(--warning)",
	low: "var(--fg-muted)",
	ok: "var(--accent-lime)",
};
const WORD: Record<Sev, string> = {
	high: "Fix",
	medium: "Look",
	low: "Minor",
	ok: "Good",
};

export function EfficiencyIntegrationPrototype({
	variant,
	onChange,
	usage,
	stats,
	insights,
}: {
	variant: VariantKey;
	onChange: (next: { variant?: VariantKey }) => void;
	usage: UsageRead | null;
	stats: StatsRead | null;
	insights: EfficiencyInsight[];
}) {
	const cycle = (step: number) => {
		const at = VARIANT_KEYS.indexOf(variant);
		onChange({
			variant:
				VARIANT_KEYS[(at + step + VARIANT_KEYS.length) % VARIANT_KEYS.length],
		});
	};
	return (
		<div className="mx-auto max-w-7xl px-6 pt-10 pb-40">
			{variant === "A" && (
				<VariantA usage={usage} stats={stats} insights={insights} />
			)}
			{variant === "B" && (
				<VariantB usage={usage} stats={stats} insights={insights} />
			)}
			{variant === "C" && (
				<VariantC usage={usage} stats={stats} insights={insights} />
			)}
			<Switcher variant={variant} onCycle={cycle} names={VARIANTS} />
		</div>
	);
}

type Props = {
	usage: UsageRead | null;
	stats: StatsRead | null;
	insights: EfficiencyInsight[];
};

const recoverable = (insights: EfficiencyInsight[]) =>
	insights.reduce((n, i) => n + (i.usd ?? 0), 0);
const headline = (todo: number) =>
	todo === 0 ? "Nothing to change" : `${todo} change${todo === 1 ? "" : "s"}`;

// ---------------------------------------------------------------------------
// A. Scorecard block after the tiles. The decided form, copy trimmed: no
// privacy note, no price-table line, no "why", no rate note.
// ---------------------------------------------------------------------------
/** The scorecard tile grid: severity edge, fix first, one figure, detail on click. */
export function ScorecardTiles({
	insights,
	columns = "xl:grid-cols-4",
	merged = false,
}: {
	insights: EfficiencyInsight[];
	columns?: string;
	/** Passing rules as full tiles inside the same grid, not as mini cards. */
	merged?: boolean;
}) {
	const [open, setOpen] = useState<string | null>(null);
	const todo = merged ? insights : insights.filter((i) => i.severity !== "ok");
	const good = merged ? [] : insights.filter((i) => i.severity === "ok");
	const many = new Set(insights.map((i) => i.harness)).size > 1;
	return (
		<>
			<ul className={cn("grid gap-3 md:grid-cols-2 md:gap-4", columns)}>
				{todo.map((i) => {
					const isOpen = open === i.id;
					return (
						<li key={i.id} className="flex min-w-0">
							<button
								type="button"
								onClick={() => setOpen(isOpen ? null : i.id)}
								className="flex min-h-44 w-full flex-col bg-bg-panel text-left"
								style={{ borderLeft: `8px solid ${PAINT[i.severity]}` }}
							>
								<span
									className="px-4 pt-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em]"
									style={{ color: PAINT[i.severity] }}
								>
									{WORD[i.severity]}
									{many && (
										<span className="ml-2 font-normal text-fg-muted">
											{harnessLabel(i.harness)}
										</span>
									)}
								</span>
								<span className="mt-2 px-4 text-[22px] font-black leading-tight text-fg-primary">
									{i.severity === "ok" ? i.keep : i.fix}
								</span>
								<span className="mt-1.5 px-4 text-sm text-fg-muted">
									{i.verdict}
								</span>
								<span className="mt-auto flex items-baseline justify-between gap-3 px-4 pt-4 pb-3 font-mono text-[11px] text-fg-muted">
									<span>
										<b className="text-fg-primary">{i.figure.value}</b>{" "}
										{i.figure.label}
									</span>
									{i.usd !== null && i.usd >= 1 && (
										<b className="text-base text-fg-primary">{fmtUSD(i.usd)}</b>
									)}
								</span>
								{isOpen && (
									<span className="block border-t border-stroke-subtle px-4 py-3">
										<span className="block text-sm text-fg-primary">
											{i.action}
										</span>
										<span className="mt-2 flex flex-wrap gap-x-4 font-mono text-[11px] text-fg-muted">
											{i.evidence.map((e) => (
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
			{good.length > 0 && (
				<ul className={cn("mt-3 grid grid-cols-2 gap-2 md:gap-3", columns)}>
					{good.map((i) => (
						<li
							key={i.id}
							className="bg-bg-panel px-3 py-2.5"
							style={{ borderLeft: "8px solid var(--accent-lime)" }}
						>
							<p className="text-sm font-bold text-fg-primary">{i.keep}</p>
							<p className="mt-1 font-mono text-[11px] text-fg-muted">
								<b className="text-fg-primary">{i.figure.value}</b>{" "}
								{i.figure.label}
							</p>
						</li>
					))}
				</ul>
			)}
		</>
	);
}

/** The block header line: "N changes · $X". */
export function verdictLine(insights: EfficiencyInsight[]): string {
	const todo = insights.filter((i) => i.severity !== "ok").length;
	const usd = recoverable(insights);
	return `${headline(todo)}${usd >= 1 ? ` · ${fmtUSD(usd)}` : ""}`;
}

/** The ranked ledger: number, fix, figures, the action verbatim, dollars. */
export function LedgerList({ insights }: { insights: EfficiencyInsight[] }) {
	const todo = insights.filter((i) => i.severity !== "ok");
	const good = insights.filter((i) => i.severity === "ok");
	return (
		<>
			<ol className="divide-y divide-stroke-subtle border-y border-stroke-subtle">
				{todo.map((i, n) => (
					<li
						key={i.id}
						className="grid gap-x-6 gap-y-1 py-4 md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_6rem]"
					>
						<span
							className="font-mono text-2xl font-black leading-none"
							style={{ color: PAINT[i.severity] }}
						>
							{String(n + 1).padStart(2, "0")}
						</span>
						<div className="min-w-0">
							<p className="text-lg font-black leading-tight text-fg-primary">
								{i.fix}
							</p>
							<p className="mt-1 font-mono text-[11px] text-fg-muted">
								<b className="text-fg-primary">{i.figure.value}</b>{" "}
								{i.figure.label}
								{i.evidence.map((e) => (
									<span key={e.label}>
										{" · "}
										<b className="text-fg-primary">{e.value}</b> {e.label}
									</span>
								))}
							</p>
						</div>
						<p className="text-sm text-fg-primary">{i.action}</p>
						<span className="font-mono text-lg font-black text-fg-primary md:text-right">
							{i.usd !== null && i.usd >= 1 ? fmtUSD(i.usd) : ""}
						</span>
					</li>
				))}
			</ol>
			{good.length > 0 && (
				<ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-fg-muted">
					{good.map((i) => (
						<li key={i.id} className="inline-flex items-center gap-2">
							<i className="size-2 bg-accent-lime" />
							<span className="text-fg-primary">{i.keep}</span>
							<span>{i.figure.value}</span>
						</li>
					))}
				</ul>
			)}
		</>
	);
}

function VariantA({ usage, stats, insights }: Props) {
	const block = (
		<section className="min-w-0" aria-label="Token efficiency">
			<header className="mb-3 flex flex-wrap items-baseline gap-x-3 md:mb-4">
				<h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-lime">
					Token efficiency
				</h3>
				<span className="ml-auto font-mono text-xs font-bold text-fg-primary md:text-sm">
					{verdictLine(insights)}
				</span>
			</header>
			<ScorecardTiles insights={insights} />
		</section>
	);
	return <StatsBlocksWithSlot usage={usage} stats={stats} afterTiles={block} />;
}

// ---------------------------------------------------------------------------
// B. Verdict strip. One line, eight chips, no grid. The chip is the fix;
// the color is the severity; the figure is inside the chip. Clicking a chip
// opens one detail row under the strip. Everything else on Stats stays.
// ---------------------------------------------------------------------------
function VariantB({ usage, stats, insights }: Props) {
	const [open, setOpen] = useState<string | null>(insights[0]?.id ?? null);
	const todo = insights.filter((i) => i.severity !== "ok");
	const usd = recoverable(insights);
	const current = insights.find((i) => i.id === open) ?? null;
	const strip = (
		<section
			className="min-w-0 border-y border-stroke-subtle py-4"
			aria-label="Token efficiency"
		>
			<p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
				<span className="text-2xl font-black leading-none text-fg-primary md:text-3xl">
					{headline(todo.length)}
				</span>
				{usd >= 1 && (
					<span className="font-mono text-sm text-fg-muted">
						saves at least <b className="text-fg-primary">{fmtUSD(usd)}</b>
					</span>
				)}
			</p>
			<ul className="mt-3 flex flex-wrap gap-2">
				{insights.map((i) => {
					const on = open === i.id;
					return (
						<li key={i.id}>
							<button
								type="button"
								onClick={() => setOpen(on ? null : i.id)}
								className={cn(
									"flex items-center gap-2 border px-2.5 py-1.5 font-mono text-[11px]",
									on
										? "border-fg-primary bg-bg-panel-elevated text-fg-primary"
										: "border-stroke-subtle text-fg-primary hover:border-fg-muted",
								)}
							>
								<i
									className="size-2 shrink-0"
									style={{ background: PAINT[i.severity] }}
								/>
								<span className="font-bold">
									{i.severity === "ok" ? i.keep : i.fix}
								</span>
								<span className="text-fg-muted">{i.figure.value}</span>
							</button>
						</li>
					);
				})}
			</ul>
			{current && (
				<div
					className="mt-3 grid gap-x-8 gap-y-2 bg-bg-panel p-4 md:grid-cols-[1fr_auto]"
					style={{ borderLeft: `8px solid ${PAINT[current.severity]}` }}
				>
					<div>
						<p className="text-lg font-black leading-tight text-fg-primary">
							{current.severity === "ok" ? current.keep : current.fix}
						</p>
						<p className="mt-1 text-sm text-fg-muted">{current.verdict}</p>
						{current.severity !== "ok" && (
							<p className="mt-2 text-sm text-fg-primary">{current.action}</p>
						)}
					</div>
					<dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 self-start font-mono text-[11px] md:text-right">
						{[current.figure, ...current.evidence].map((e) => (
							<div key={e.label} className="contents">
								<dt className="text-fg-muted">{e.label}</dt>
								<dd className="font-bold text-fg-primary">{e.value}</dd>
							</div>
						))}
						{current.usd !== null && current.usd >= 1 && (
							<div className="contents">
								<dt className="text-fg-muted">over 30 days</dt>
								<dd className="font-bold text-fg-primary">
									{fmtUSD(current.usd)}
								</dd>
							</div>
						)}
					</dl>
				</div>
			)}
		</section>
	);
	return <StatsBlocksWithSlot usage={usage} stats={stats} afterTiles={strip} />;
}

// ---------------------------------------------------------------------------
// C. Closing ledger. Stats first, untouched. Then "What to change": a ranked
// numbered list, the action verbatim on the row, dollars on the right, no
// click needed. Passing rules are one line each at the bottom.
// ---------------------------------------------------------------------------
function VariantC({ usage, stats, insights }: Props) {
	return (
		<div className="space-y-8 md:space-y-12">
			<StatsBlocks usage={usage} stats={stats} />
			<section className="min-w-0" aria-label="What to change">
				<header className="mb-3 flex flex-wrap items-baseline gap-x-3 md:mb-4">
					<h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-lime">
						What to change
					</h3>
					<span className="ml-auto font-mono text-xs font-bold text-fg-primary md:text-sm">
						{verdictLine(insights)}
					</span>
				</header>
				<LedgerList insights={insights} />
			</section>
		</div>
	);
}

/**
 * StatsBlocks with a slot after the tiles: the prototype's only seam into the
 * real page. The real blocks render twice and CSS hides the halves: the
 * headline is two elements (desktop and mobile) and the tiles are the third,
 * so the slot lands after child three.
 */
function StatsBlocksWithSlot({
	usage,
	stats,
	afterTiles,
}: {
	usage: UsageRead | null;
	stats: StatsRead | null;
	afterTiles: React.ReactNode;
}) {
	return (
		<div className="space-y-8 md:space-y-12">
			<div className="contents [&>div>*:nth-child(n+4)]:hidden">
				<StatsBlocks usage={usage} stats={stats} />
			</div>
			{afterTiles}
			<div className="contents [&>div>*:nth-child(-n+3)]:hidden">
				<StatsBlocks usage={usage} stats={stats} />
			</div>
		</div>
	);
}
