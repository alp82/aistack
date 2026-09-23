/**
 * PROTOTYPE - throwaway. Round three: the settings page as the home, with a
 * hero link on the stack page and a small preview on the profile. Three
 * variants via `?variant=` on /prototype/token-efficiency-settings. Each
 * variant shows the three frames stacked: stack hero, profile preview,
 * /settings/efficiency. The settings page is one form per variant, never
 * tiles and ledger both.
 *
 *   H  Ranked ledger    settings: one ranked list, severity edge per row,
 *                       action verbatim. Hero: the G stamp as a link.
 *                       Profile: fence with verdict and small chips.
 *   I  Tiles            settings: the tile grid only, passing rules as one
 *                       strip. Hero: a slim bar under the hero, not a tile.
 *                       Profile: chips in the stacks column header.
 *   J  By harness       settings: four stat tiles, then one column per
 *                       harness with compact rows. Hero: the stamp names the
 *                       top fix. Profile: the top three fixes as chips.
 */
import type { EfficiencyInsight } from "@aistack/workflow-rules";
import { ArrowRight, ChartLine, Laptop, Lock, Zap } from "lucide-react";
import { useState } from "react";
import { fmtUSD } from "@/features/measured/copy";
import { cn } from "@/lib/utils";
import { harnessLabel } from "../HarnessShareRows";
import { HeroMock } from "./EfficiencyHomePrototype";
import {
	LedgerList,
	ScorecardTiles,
	verdictLine,
} from "./EfficiencyIntegrationPrototype";
import { Switcher } from "./StatsBlocksPrototype";

export const VARIANTS = {
	H: "Ranked ledger",
	I: "Tiles",
	J: "By harness",
	K: "Save tokens",
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

export function EfficiencySettingsPrototype({
	variant,
	onChange,
	insights,
	all,
}: {
	variant: VariantKey;
	onChange: (next: { variant?: VariantKey }) => void;
	/** One per lever, ranked. */
	insights: EfficiencyInsight[];
	/** Every insight, per harness. */
	all: EfficiencyInsight[];
}) {
	const cycle = (step: number) => {
		const at = VARIANT_KEYS.indexOf(variant);
		onChange({
			variant:
				VARIANT_KEYS[(at + step + VARIANT_KEYS.length) % VARIANT_KEYS.length],
		});
	};
	return (
		<div className="pb-40">
			{variant === "H" && <VariantH insights={insights} />}
			{variant === "I" && <VariantI insights={insights} />}
			{variant === "J" && <VariantJ insights={insights} all={all} />}
			{variant === "K" && <VariantK insights={insights} />}
			<Switcher variant={variant} onCycle={cycle} names={VARIANTS} />
		</div>
	);
}

const todoOf = (insights: EfficiencyInsight[]) =>
	insights.filter((i) => i.severity !== "ok");
const usdOf = (insights: EfficiencyInsight[]) =>
	insights.reduce((n, i) => n + (i.usd ?? 0), 0);
const worst = (insights: EfficiencyInsight[]): Sev =>
	insights.find((i) => i.severity !== "ok")?.severity ?? "ok";

function Frame({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<section className="border-b-4 border-stroke-strong pb-10">
			<p className="mx-auto max-w-7xl px-6 pt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
				{label}
			</p>
			{children}
		</section>
	);
}

/** A small severity chip: dot, fix, figure. */
function Chip({
	i,
	size = "sm",
}: {
	i: EfficiencyInsight;
	size?: "sm" | "xs";
}) {
	return (
		<span
			className={cn(
				"inline-flex max-w-full items-center gap-1.5 border border-stroke-subtle font-mono text-fg-primary",
				size === "sm" ? "px-2 py-1 text-[11px]" : "px-1.5 py-0.5 text-[10px]",
			)}
		>
			<i
				className="size-1.5 shrink-0"
				style={{ background: PAINT[i.severity] }}
			/>
			<span className="truncate font-bold">
				{i.severity === "ok" ? i.keep : i.fix}
			</span>
			<span className="shrink-0 text-fg-muted">{i.figure.value}</span>
		</span>
	);
}

/** The account menu with the third entry, pinned to the settings frame. */
function MenuMock({ label = "Efficiency" }: { label?: string }) {
	return (
		<div className="absolute right-6 top-8 z-10 w-56 border-2 border-stroke-strong bg-bg-panel shadow-[4px_4px_0_var(--stroke-strong)]">
			<div className="border-b border-stroke-subtle px-4 py-3">
				<p className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-primary">
					Alper Ortac
				</p>
			</div>
			<p className="flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wide text-fg-secondary">
				<ChartLine className="size-3.5" /> Views
			</p>
			<p className="flex items-center gap-2 bg-bg-panel-muted px-4 py-2 font-mono text-xs uppercase tracking-wide text-fg-primary">
				<Zap className="size-3.5" /> {label}
			</p>
			<p className="flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wide text-fg-secondary">
				<Laptop className="size-3.5" /> Machines
			</p>
		</div>
	);
}

function SettingsShell({
	children,
	wide = false,
	title = "Efficiency",
	intro = "What your last 30 days of syncs say you could change.",
}: {
	children: React.ReactNode;
	wide?: boolean;
	title?: string;
	intro?: string;
}) {
	return (
		<div className="relative">
			<MenuMock label={title} />
			<div
				className={cn("mx-auto px-6 py-12", wide ? "max-w-5xl" : "max-w-3xl")}
			>
				<h1 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
					{title}
				</h1>
				<p className="mt-3 max-w-prose text-sm leading-relaxed text-fg-secondary">
					{intro}
				</p>
				{children}
			</div>
		</div>
	);
}

/** The profile's stacks column, narrowed, with the preview panel in it. */
function ProfileColumnMock({ children }: { children: React.ReactNode }) {
	return (
		<div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-10 md:grid-cols-[300px_1fr] md:gap-12">
			<aside className="font-mono text-xs text-fg-muted">
				<div className="mb-4 size-32 bg-bg-panel-muted" />
				<p className="text-2xl font-black uppercase text-fg-primary">
					Alper Ortac
				</p>
				<p className="text-accent-lime">@alperortac</p>
			</aside>
			<main className="min-w-0">
				<div className="mb-4 flex items-center justify-between border-b border-stroke-subtle pb-2 font-mono text-xs uppercase tracking-wider text-fg-muted">
					<span>Stacks - 1</span>
					<span>+ New stack</span>
				</div>
				<div className="mb-6 border border-stroke-subtle p-5">
					<p className="font-mono text-[10px] uppercase tracking-wider text-accent-lime">
						most recent
					</p>
					<p className="mt-2 text-lg font-black uppercase text-fg-primary">
						Alper's Coding Stack
					</p>
				</div>
				{children}
			</main>
		</div>
	);
}

// ---------------------------------------------------------------------------
// H. Ranked ledger.
// ---------------------------------------------------------------------------
function VariantH({ insights }: { insights: EfficiencyInsight[] }) {
	const todo = todoOf(insights);
	const usd = usdOf(insights);
	return (
		<>
			<Frame label="stack page · owner only tile in the hero">
				<HeroMock
					stamp={
						<a
							href="#settings"
							className="block bg-bg-panel px-4 py-4 sm:px-5"
							style={{ borderLeft: `8px solid ${PAINT[worst(insights)]}` }}
						>
							<p className="font-mono text-3xl font-black leading-none sm:text-4xl">
								{todo.length}
							</p>
							<p className="mt-1.5 flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
								changes{usd >= 1 ? ` · ${fmtUSD(usd)}` : ""}
								<ArrowRight className="ml-auto size-3" />
							</p>
						</a>
					}
				/>
			</Frame>

			<Frame label="profile · private preview beside views">
				<ProfileColumnMock>
					<a
						href="#settings"
						className="block border border-dashed border-stroke-strong bg-bg-panel-muted p-5 hover:border-accent-lime"
					>
						<div className="flex items-center gap-1.5">
							<Lock aria-hidden="true" className="size-3 text-fg-muted" />
							<h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
								Efficiency - only you can see this
							</h2>
						</div>
						<p className="mt-3 text-2xl font-black leading-none text-fg-primary">
							{verdictLine(insights)}
						</p>
						<p className="mt-3 flex flex-wrap gap-1.5">
							{insights.map((i) => (
								<Chip key={i.id} i={i} size="xs" />
							))}
						</p>
						<p className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] text-accent-lime">
							Open efficiency <ArrowRight className="size-3" />
						</p>
					</a>
				</ProfileColumnMock>
			</Frame>

			<Frame label="/settings/efficiency">
				<div id="settings">
					<SettingsShell wide>
						<div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b-2 border-stroke-strong pb-4">
							<p className="font-mono text-4xl font-black text-fg-primary">
								{todo.length} changes
							</p>
							{usd >= 1 && (
								<p className="font-mono text-lg text-fg-muted">
									at least <b className="text-fg-primary">{fmtUSD(usd)}</b> over
									30 days
								</p>
							)}
						</div>
						<div className="mt-2">
							<LedgerList insights={insights} />
						</div>
					</SettingsShell>
				</div>
			</Frame>
		</>
	);
}

// ---------------------------------------------------------------------------
// I. Tiles only. The hero gets a slim bar, not a tile.
// ---------------------------------------------------------------------------
function VariantI({ insights }: { insights: EfficiencyInsight[] }) {
	const todo = todoOf(insights);
	const usd = usdOf(insights);
	return (
		<>
			<Frame label="stack page · owner only bar under the hero">
				<HeroMock />
				<div className="mx-auto max-w-7xl px-6">
					<a
						href="#settings"
						className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-bg-shell px-4 py-3 font-mono text-[11px] hover:bg-bg-panel-muted"
						style={{ borderLeft: `8px solid ${PAINT[worst(insights)]}` }}
					>
						<span className="font-bold uppercase tracking-[0.22em] text-fg-primary">
							Efficiency
						</span>
						<span className="font-semibold text-fg-primary">
							{todo.length} changes would save tokens
						</span>
						{usd >= 1 && (
							<span className="text-fg-muted">at least {fmtUSD(usd)}</span>
						)}
						<span className="text-fg-muted">only you see this</span>
						<ArrowRight className="ml-auto size-3 text-fg-muted" />
					</a>
				</div>
			</Frame>

			<Frame label="profile · chips in the stacks column header">
				<ProfileColumnMock>
					<a
						href="#settings"
						className="flex flex-wrap items-center gap-2 border border-stroke-subtle p-3 hover:border-accent-lime"
					>
						<Lock aria-hidden="true" className="size-3 text-fg-muted" />
						<span className="font-mono text-[11px] font-bold text-fg-primary">
							{verdictLine(insights)}
						</span>
						{todo.slice(0, 4).map((i) => (
							<Chip key={i.id} i={i} size="xs" />
						))}
						{todo.length > 4 && (
							<span className="font-mono text-[10px] text-fg-muted">
								+{todo.length - 4}
							</span>
						)}
						<ArrowRight className="ml-auto size-3 text-fg-muted" />
					</a>
				</ProfileColumnMock>
			</Frame>

			<Frame label="/settings/efficiency">
				<div id="settings">
					<SettingsShell wide>
						<p className="mt-8 font-mono text-4xl font-black text-fg-primary">
							{verdictLine(insights)}
						</p>
						<div className="mt-6">
							<ScorecardTiles insights={insights} columns="xl:grid-cols-3" />
						</div>
					</SettingsShell>
				</div>
			</Frame>
		</>
	);
}

// ---------------------------------------------------------------------------
// J. By harness: stat tiles, then one column per harness with compact rows.
// ---------------------------------------------------------------------------
function VariantJ({
	insights,
	all,
}: {
	insights: EfficiencyInsight[];
	all: EfficiencyInsight[];
}) {
	const [open, setOpen] = useState<string | null>(all[0]?.id ?? null);
	const todo = todoOf(insights);
	const usd = usdOf(insights);
	const top = todo[0];
	const harnesses = [...new Set(all.map((i) => i.harness))];
	const cache = all.find(
		(i) => i.lever === "cache" && i.harness === "claude-code",
	);
	const tools = all.find(
		(i) => i.lever === "tools" && i.harness === "claude-code",
	);
	return (
		<>
			<Frame label="stack page · the stamp names the top fix">
				<HeroMock
					stamp={
						top && (
							<a
								href="#settings"
								className="block bg-bg-panel px-4 py-4 sm:px-5"
								style={{ borderLeft: `8px solid ${PAINT[top.severity]}` }}
							>
								<p className="text-lg font-black leading-tight text-fg-primary">
									{top.fix}
								</p>
								<p className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
									+{todo.length - 1} more{usd >= 1 ? ` · ${fmtUSD(usd)}` : ""}
								</p>
							</a>
						)
					}
				/>
			</Frame>

			<Frame label="profile · the top three fixes">
				<ProfileColumnMock>
					<a
						href="#settings"
						className="block border border-dashed border-stroke-strong bg-bg-panel-muted p-5 hover:border-accent-lime"
					>
						<div className="flex items-center justify-between">
							<h2 className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
								<Lock aria-hidden="true" className="size-3" /> Efficiency
							</h2>
							<span className="font-mono text-[11px] text-fg-muted">
								{verdictLine(insights)}
							</span>
						</div>
						<ol className="mt-3 space-y-1.5">
							{todo.slice(0, 3).map((i, n) => (
								<li
									key={i.id}
									className="flex items-baseline gap-3 font-mono text-[11px]"
								>
									<span
										className="font-black"
										style={{ color: PAINT[i.severity] }}
									>
										{String(n + 1).padStart(2, "0")}
									</span>
									<span className="font-bold text-fg-primary">{i.fix}</span>
									<span className="text-fg-muted">{i.figure.value}</span>
								</li>
							))}
						</ol>
					</a>
				</ProfileColumnMock>
			</Frame>

			<Frame label="/settings/efficiency">
				<div id="settings">
					<SettingsShell wide>
						<div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
							{[
								{ value: String(todo.length), label: "changes" },
								{
									value: usd >= 1 ? fmtUSD(usd) : "·",
									label: "at least, 30 days",
								},
								{
									value: cache?.figure.value ?? "·",
									label: cache?.figure.label ?? "",
								},
								{
									value: tools?.figure.value ?? "·",
									label: tools?.figure.label ?? "",
								},
							].map((t) => (
								<div
									key={t.label}
									className="border border-stroke-subtle bg-bg-panel p-3"
								>
									<p className="font-mono text-2xl font-black text-fg-primary">
										{t.value}
									</p>
									<p className="mt-1 font-mono text-[10px] text-fg-muted">
										{t.label}
									</p>
								</div>
							))}
						</div>
						<div className="mt-8 grid gap-8 md:grid-cols-2">
							{harnesses.map((h) => {
								const rows = all
									.filter((i) => i.harness === h)
									.sort((a, b) => b.meter - a.meter);
								return (
									<section key={h} className="min-w-0">
										<h2 className="mb-2 border-b border-stroke-subtle pb-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
											{harnessLabel(h)}
										</h2>
										<ul className="divide-y divide-stroke-subtle">
											{rows.map((i) => {
												const on = open === i.id;
												return (
													<li key={i.id}>
														<button
															type="button"
															onClick={() => setOpen(on ? null : i.id)}
															className="flex w-full items-baseline gap-3 py-2.5 text-left"
														>
															<i
																className="size-2 shrink-0 self-center"
																style={{ background: PAINT[i.severity] }}
															/>
															<span className="min-w-0 flex-1 text-sm font-bold text-fg-primary">
																{i.severity === "ok" ? i.keep : i.fix}
															</span>
															<span className="shrink-0 font-mono text-[11px] text-fg-muted">
																{i.figure.value}
															</span>
															{i.usd !== null && i.usd >= 1 && (
																<b className="shrink-0 font-mono text-sm text-fg-primary">
																	{fmtUSD(i.usd)}
																</b>
															)}
														</button>
														{on && (
															<div className="pb-3 pl-5">
																<p className="text-sm text-fg-primary">
																	{i.action}
																</p>
																<p className="mt-1 font-mono text-[11px] text-fg-muted">
																	{i.figure.label}
																	{i.evidence.map((e) => (
																		<span key={e.label}>
																			{" · "}
																			<b className="text-fg-primary">
																				{e.value}
																			</b>{" "}
																			{e.label}
																		</span>
																	))}
																</p>
															</div>
														)}
													</li>
												);
											})}
										</ul>
									</section>
								);
							})}
						</div>
					</SettingsShell>
				</div>
			</Frame>
		</>
	);
}

// ---------------------------------------------------------------------------
// K. "Save tokens". I's placements, renamed after what it is: ways to save
// tokens, and how. No change count, no dollar headline. The profile preview
// is the same boxes, shorter: the severity word and the fix, nothing else.
// ---------------------------------------------------------------------------
const WORD: Record<Sev, string> = {
	high: "Fix",
	medium: "Look",
	low: "Minor",
	ok: "Good",
};

/** The scorecard box with the small text removed: severity word, fix. */
function CompactTiles({ insights }: { insights: EfficiencyInsight[] }) {
	return (
		<ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
			{insights.map((i) => (
				<li
					key={i.id}
					className="min-w-0 bg-bg-panel px-3 py-2.5"
					style={{ borderLeft: `6px solid ${PAINT[i.severity]}` }}
				>
					<p
						className="font-mono text-[9px] font-bold uppercase tracking-[0.2em]"
						style={{ color: PAINT[i.severity] }}
					>
						{WORD[i.severity]}
					</p>
					<p className="mt-1 text-sm font-black leading-tight text-fg-primary">
						{i.severity === "ok" ? i.keep : i.fix}
					</p>
				</li>
			))}
		</ul>
	);
}

function VariantK({ insights }: { insights: EfficiencyInsight[] }) {
	const ways = todoOf(insights).length;
	return (
		<>
			<Frame label="stack page · owner only bar under the hero">
				<HeroMock />
				<div className="mx-auto max-w-7xl px-6">
					<a
						href="#settings"
						className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-bg-shell px-4 py-3 font-mono text-[11px] hover:bg-bg-panel-muted"
						style={{ borderLeft: `8px solid ${PAINT[worst(insights)]}` }}
					>
						<span className="font-bold uppercase tracking-[0.22em] text-fg-primary">
							Save tokens: {ways} findings
						</span>
						<span className="text-fg-muted">only you see this</span>
						<ArrowRight className="ml-auto size-3 text-fg-muted" />
					</a>
				</div>
			</Frame>

			<Frame label="profile · the same boxes, shorter">
				<ProfileColumnMock>
					<a href="#settings" className="block hover:opacity-90">
						<div className="mb-2 flex items-center justify-between font-mono text-[11px]">
							<span className="font-bold uppercase tracking-[0.18em] text-fg-primary">
								Token efficiency
							</span>
							<span className="inline-flex items-center gap-1 text-accent-lime">
								how <ArrowRight className="size-3" />
							</span>
						</div>
						<CompactTiles insights={insights} />
					</a>
				</ProfileColumnMock>
			</Frame>

			<Frame label="/settings/token-efficiency">
				<div id="settings">
					<SettingsShell
						wide
						title="Token efficiency"
						intro="Where your last 30 days of syncs say tokens go to waste, and what to change."
					>
						<p className="mt-8 font-mono text-4xl font-black text-fg-primary">
							Save tokens: {ways} findings
						</p>
						<div className="mt-6">
							<ScorecardTiles
								insights={insights}
								columns="xl:grid-cols-3"
								merged
							/>
						</div>
					</SettingsShell>
				</div>
			</Frame>
		</>
	);
}
