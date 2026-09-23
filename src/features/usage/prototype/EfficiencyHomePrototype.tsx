/**
 * PROTOTYPE - throwaway. WHERE the owner-only token-efficiency insights live,
 * four homes via `?variant=` on /prototype/token-efficiency-home. The hosts
 * are the site's existing owner-private surfaces, mocked where the real
 * component needs a signed-in owner. Insights are real (v3 from the mirror,
 * v4 from the local measurement).
 *
 *   D  Owner drawer     a fourth row in the stack page's Owner tools drawer;
 *                       the row is the verdict, opening it shows the tiles
 *   E  Profile fence    a dashed private panel on /@handle beside Views,
 *                       the ledger form, across the owner's stacks
 *   F  Settings page    /settings/efficiency, a sibling of Views and Machines,
 *                       tiles on top and the ledger under them
 *   G  Hero stamp       an owner-only fourth tile in the stack hero column
 *                       that jumps to the drawer, which holds the tiles
 */
import type { EfficiencyInsight } from "@aistack/workflow-rules";
import { useQuery } from "convex/react";
import { ChartLine, ChevronRight, Laptop, Lock, Zap } from "lucide-react";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { OwnerViewsPanel } from "@/features/view-analytics/OwnerViewsPanel";
import { api } from "../../../../convex/_generated/api";
import {
	LedgerList,
	ScorecardTiles,
	verdictLine,
} from "./EfficiencyIntegrationPrototype";
import { Switcher } from "./StatsBlocksPrototype";

export const VARIANTS = {
	D: "Owner drawer",
	E: "Profile fence",
	F: "Settings page",
	G: "Hero stamp",
} as const;
export type VariantKey = keyof typeof VARIANTS;
export const VARIANT_KEYS = Object.keys(VARIANTS) as VariantKey[];

const PAINT = {
	high: "var(--destructive)",
	medium: "var(--warning)",
	low: "var(--fg-muted)",
	ok: "var(--accent-lime)",
} as const;

export function EfficiencyHomePrototype({
	variant,
	onChange,
	insights,
	handle,
}: {
	variant: VariantKey;
	onChange: (next: { variant?: VariantKey }) => void;
	insights: EfficiencyInsight[];
	handle: string;
}) {
	const cycle = (step: number) => {
		const at = VARIANT_KEYS.indexOf(variant);
		onChange({
			variant:
				VARIANT_KEYS[(at + step + VARIANT_KEYS.length) % VARIANT_KEYS.length],
		});
	};
	return (
		<>
			{variant === "D" && <VariantD insights={insights} />}
			{variant === "E" && <VariantE insights={insights} handle={handle} />}
			{variant === "F" && <VariantF insights={insights} />}
			{variant === "G" && <VariantG insights={insights} />}
			<Switcher variant={variant} onCycle={cycle} names={VARIANTS} />
		</>
	);
}

const worst = (insights: EfficiencyInsight[]) =>
	insights.find((i) => i.severity !== "ok")?.severity ?? "ok";

// ---------------------------------------------------------------------------
// The stack page's owner drawer, mocked: the same summary row and compact
// rows, with the new fourth row. D and G share it.
// ---------------------------------------------------------------------------
function OwnerDrawerMock({
	insights,
	open,
	efficiencyOpen,
}: {
	insights: EfficiencyInsight[];
	open: boolean;
	efficiencyOpen: boolean;
}) {
	return (
		<div className="mx-auto mb-6 max-w-7xl px-6">
			<details className="group bg-bg-shell px-4 py-3" open={open}>
				<summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] [&::-webkit-details-marker]:hidden">
					<span className="font-bold uppercase tracking-[0.22em] text-accent-lime">
						Owner tools
					</span>
					<span className="font-semibold text-fg-primary">
						Updated 2 hours ago
					</span>
					<span className="text-fg-muted">
						2 suggestions · 41 views · {verdictLine(insights)}
					</span>
					<ChevronRight
						aria-hidden="true"
						className="ml-auto size-3 text-fg-muted transition-transform group-open:rotate-90"
					/>
				</summary>
				<div className="mt-3 divide-y divide-stroke-subtle border-t border-stroke-subtle">
					<MockRow label="Auto-sync" value="on · every 6 hours" />
					<MockRow
						label="What changed"
						value="2 suggestions from your last sync"
					/>
					<MockRow
						label="Views"
						value="41 deduped daily visitors · last 30 days"
					/>
					<details className="group/eff py-3" open={efficiencyOpen}>
						<summary className="flex cursor-pointer list-none items-center gap-3 font-mono text-[11px] [&::-webkit-details-marker]:hidden">
							<i
								className="size-2 shrink-0"
								style={{ background: PAINT[worst(insights)] }}
							/>
							<span className="font-bold uppercase tracking-[0.18em] text-fg-primary">
								Token efficiency
							</span>
							<span className="text-fg-muted">{verdictLine(insights)}</span>
							<ChevronRight
								aria-hidden="true"
								className="ml-auto size-3 text-fg-muted transition-transform group-open/eff:rotate-90"
							/>
						</summary>
						<div className="mt-4">
							<ScorecardTiles insights={insights} />
						</div>
					</details>
				</div>
			</details>
		</div>
	);
}

function MockRow({ label, value }: { label: string; value: string }) {
	return (
		<p className="flex flex-wrap items-baseline gap-3 py-3 font-mono text-[11px]">
			<span className="font-bold uppercase tracking-[0.18em] text-fg-primary">
				{label}
			</span>
			<span className="text-fg-muted">{value}</span>
		</p>
	);
}

export function HeroMock({ stamp }: { stamp?: React.ReactNode }) {
	return (
		<header className="bg-bg-canvas">
			<div className="relative pt-10 pb-8 md:pt-14 md:pb-9">
				<div className="mx-auto max-w-7xl px-6">
					<div className="grid items-stretch gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16.25rem,17rem)] lg:gap-16">
						<div className="min-w-0">
							<p className="font-mono text-xs text-fg-secondary">
								<span className="font-bold">Alper Ortac</span>{" "}
								<span className="text-fg-muted">@alper-ortac</span>
							</p>
							<h1 className="mt-5 text-6xl font-black uppercase leading-[0.88] tracking-[-0.035em] text-fg-primary md:text-8xl">
								Alper's Coding Stack
							</h1>
							<p className="mt-3.5 max-w-3xl text-base text-fg-secondary md:text-lg">
								Claude Code and Codex, side by side, on one repo a day.
							</p>
						</div>
						<div className="grid grid-cols-2 gap-2.5 lg:flex lg:flex-col">
							<div className="col-span-2 flex h-11 items-stretch gap-2 lg:col-span-1">
								<span className="flex flex-1 items-center justify-center border border-stroke-strong font-mono text-xs">
									▲ 12
								</span>
								<span className="flex w-11 items-center justify-center border border-stroke-strong font-mono text-xs">
									↗
								</span>
							</div>
							<div className="bg-accent-lime px-4 py-4 text-accent-lime-contrast shadow-[4px_4px_0_var(--stroke-strong)] sm:px-5">
								<p className="font-mono text-3xl font-black leading-none sm:text-4xl">
									$240+
								</p>
								<p className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em]">
									per month · solo
								</p>
							</div>
							<div className="border border-stroke-strong px-4 py-4 sm:px-5">
								<p className="font-mono text-3xl font-black leading-none sm:text-4xl">
									6.9B
								</p>
								<p className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
									tokens · 30 days
								</p>
							</div>
							{stamp}
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}

function PageRest() {
	return (
		<div className="mx-auto max-w-7xl px-6 pb-40">
			<div className="border-t border-stroke-subtle pt-8 font-mono text-[11px] text-fg-muted">
				01 STATS · 02 PROJECTS · 03 TOOLS · 04 GUIDE (the public page continues
				here)
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// D. Owner drawer row.
// ---------------------------------------------------------------------------
function VariantD({ insights }: { insights: EfficiencyInsight[] }) {
	return (
		<div className="pb-40">
			<HeroMock />
			<OwnerDrawerMock insights={insights} open efficiencyOpen />
			<PageRest />
		</div>
	);
}

// ---------------------------------------------------------------------------
// G. Hero stamp: an owner-only fourth tile in the hero column. The stamp is
// the entry point; the drawer below holds the tiles.
// ---------------------------------------------------------------------------
function VariantG({ insights }: { insights: EfficiencyInsight[] }) {
	const sev = worst(insights);
	const todo = insights.filter((i) => i.severity !== "ok").length;
	const usd = insights.reduce((n, i) => n + (i.usd ?? 0), 0);
	return (
		<div className="pb-40">
			<HeroMock
				stamp={
					<a
						href="#owner-drawer"
						className="block bg-bg-panel px-4 py-4 sm:px-5"
						style={{ borderLeft: `8px solid ${PAINT[sev]}` }}
					>
						<p className="font-mono text-3xl font-black leading-none sm:text-4xl">
							{todo}
						</p>
						<p className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
							changes{usd >= 1 ? ` · $${Math.round(usd)}` : ""} · only you
						</p>
					</a>
				}
			/>
			<div id="owner-drawer">
				<OwnerDrawerMock insights={insights} open efficiencyOpen />
			</div>
			<PageRest />
		</div>
	);
}

// ---------------------------------------------------------------------------
// E. Profile fence: the real profile page with a fake owner, and a dashed
// private panel beside Views holding the ledger.
// ---------------------------------------------------------------------------
function VariantE({
	insights,
	handle,
}: {
	insights: EfficiencyInsight[];
	handle: string;
}) {
	const data = useQuery(api.creators.getByHandle, { handle });
	if (!data) {
		return (
			<p className="p-10 font-mono text-sm text-fg-muted">
				{data === null ? `no creator @${handle} in the mirror` : "loading"}
			</p>
		);
	}
	return (
		<ProfilePage
			profile={data.profile}
			stacks={data.stacks}
			ownProfile={{ isOwner: true }}
			ownerViewsSlot={
				<>
					<section className="border border-dashed border-stroke-strong bg-bg-panel-muted p-5">
						<div className="flex items-center gap-1.5">
							<Lock aria-hidden="true" className="size-3 text-fg-muted" />
							<h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
								Token efficiency - only you can see this
							</h2>
						</div>
						<p className="mt-3 text-2xl font-black leading-none text-fg-primary">
							{verdictLine(insights)}
						</p>
						<div className="mt-4">
							<LedgerList insights={insights} />
						</div>
					</section>
					<OwnerViewsPanel />
				</>
			}
		/>
	);
}

// ---------------------------------------------------------------------------
// F. Settings page: /settings/efficiency, a sibling of Views and Machines.
// The account menu gets a third entry.
// ---------------------------------------------------------------------------
function VariantF({ insights }: { insights: EfficiencyInsight[] }) {
	return (
		<div className="relative pb-40">
			<div className="absolute right-6 top-2 z-10 w-56 border-2 border-stroke-strong bg-bg-panel shadow-[4px_4px_0_var(--stroke-strong)]">
				<div className="border-b border-stroke-subtle px-4 py-3">
					<p className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-primary">
						Alper Ortac
					</p>
				</div>
				<p className="flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wide text-fg-secondary">
					<ChartLine className="size-3.5" /> Views
				</p>
				<p className="flex items-center gap-2 bg-bg-panel-muted px-4 py-2 font-mono text-xs uppercase tracking-wide text-fg-primary">
					<Zap className="size-3.5" /> Efficiency
				</p>
				<p className="flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wide text-fg-secondary">
					<Laptop className="size-3.5" /> Machines
				</p>
			</div>
			<div className="mx-auto max-w-5xl px-6 py-12">
				<h1 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
					Efficiency
				</h1>
				<p className="mt-3 max-w-prose text-sm leading-relaxed text-fg-secondary">
					What your last 30 days of syncs say you could change. Only you can see
					this page.
				</p>
				<div className="mt-8 border-2 border-stroke-strong bg-bg-panel p-6">
					<p className="font-mono text-4xl font-black text-accent">
						{verdictLine(insights)}
					</p>
					<p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-fg-muted">
						across your stacks · last 30 days
					</p>
				</div>
				<section className="mt-8">
					<h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
						Scorecard
					</h2>
					<div className="mt-3">
						<ScorecardTiles insights={insights} columns="xl:grid-cols-3" />
					</div>
				</section>
				<section className="mt-10">
					<h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
						In order
					</h2>
					<div className="mt-3">
						<LedgerList insights={insights} />
					</div>
				</section>
			</div>
		</div>
	);
}
