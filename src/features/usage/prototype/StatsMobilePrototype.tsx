/**
 * PROTOTYPE - throwaway (#465, map #462).
 *
 * Three variants of the Stats section at phone width, switchable via
 * `?variant=` on `/prototype/stats-mobile`. Same live queries and the same
 * block order as the winning desktop layout (#463 variant A v2, flat and
 * ungrouped per #464). On a wide screen every stack renders in a 390px frame,
 * side by side. On a real phone only the `?slug=` stack renders, full width.
 *
 *   A  Reflow      every block keeps its desktop form and stacks in one
 *                  column; only the grids change (tiles 2x3, pie over legend)
 *   B  Portrait    the forms that fight a narrow screen are redrawn for it:
 *                  the week is transposed (hours run down), skills are a
 *                  vertical plate stack, context is one bar per harness,
 *                  tiles are a swipe row
 *   C  Digest      winner: compact boxed tiles, visible context waffles,
 *                  thin marks, week marginals, and separate tap disclosures
 *                  for more models, subagent routing and every hour
 */
import { useQuery } from "convex/react";
import { type ReactNode, useEffect } from "react";
import { fmtShare, fmtTokens, fmtUSD } from "@/features/measured/copy";
import { accentClassFor } from "@/features/stack-view/accentPresets";
import {
	fmtCount,
	fmtPercent,
	hourLabel,
	type WorkflowView,
	weekdayLabel,
} from "@/features/workflow/copy";
import { heatCells, startProfile } from "@/features/workflow/derive";
import { heatPaint, Tip } from "@/features/workflow/parts";
import { cn } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";
import { CONTEXT_PAINT, type ContextHarness, contextOf } from "../context";
import { harnessLabel } from "../HarnessShareRows";
import type { ModelTrail } from "../trails";
import {
	Block,
	HarnessPie,
	Heat,
	harnessRows,
	type KitItem,
	kitItems,
	LanguageBar,
	LinesFigure,
	LinesPerDay,
	languageRows,
	PlateStrip,
	phaseSegments,
	SegStrip,
	type ShareRow,
	subagentModelRows,
	Tile,
	tileSpecs,
	Waffle,
	WaffleHead,
	WaffleLegend,
} from "./blocks";
import { type Data, modelLookup, Switcher } from "./StatsBlocksPrototype";

export const MOBILE_VARIANTS = {
	A: "Reflow",
	B: "Portrait",
	C: "Digest",
} as const;
export type MobileVariantKey = keyof typeof MOBILE_VARIANTS;
export const MOBILE_VARIANT_KEYS = Object.keys(
	MOBILE_VARIANTS,
) as MobileVariantKey[];

const STACKS = [
	{ slug: "alpers-coding-stack-unw0sl", label: "rich" },
	{ slug: "brilliant-insane-xg5pfo", label: "sparse" },
	{ slug: "abernier-mbp2-ok7asp", label: "sparse 2" },
] as const;

const ACCENT = "var(--accent-lime)";
const NOTCH =
	"repeating-linear-gradient(135deg, var(--fg-primary) 0 2px, var(--bg-canvas) 2px 4px)";

export function StatsMobilePrototype({
	slug,
	variant,
	onChange,
}: {
	slug: string;
	variant: MobileVariantKey;
	onChange: (next: { slug?: string; variant?: MobileVariantKey }) => void;
}) {
	const cycle = (step: number) => {
		const at = MOBILE_VARIANT_KEYS.indexOf(variant);
		const count = MOBILE_VARIANT_KEYS.length;
		onChange({ variant: MOBILE_VARIANT_KEYS[(at + step + count) % count] });
	};
	// biome-ignore lint/correctness/useExhaustiveDependencies: prototype
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			const el = event.target as HTMLElement | null;
			if (el?.closest("input, textarea, select, [contenteditable]")) return;
			if (event.key === "ArrowLeft") cycle(-1);
			if (event.key === "ArrowRight") cycle(1);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [variant]);

	const slugs = STACKS.some((s) => s.slug === slug)
		? STACKS
		: [{ slug, label: "custom" }, ...STACKS];

	return (
		<div className="pb-40">
			<p className="flex flex-wrap items-center gap-2 px-4 pt-6 pb-4 font-mono text-[11px] text-fg-muted md:hidden">
				{slugs.map((s) => (
					<button
						key={s.slug}
						type="button"
						onClick={() => onChange({ slug: s.slug })}
						className={cn(
							"border px-2 py-0.5",
							s.slug === slug
								? "border-accent-lime text-fg-primary"
								: "border-stroke-subtle",
						)}
					>
						{s.label}
					</button>
				))}
			</p>
			<div className="md:flex md:items-start md:gap-8 md:overflow-x-auto md:px-8 md:pt-10">
				{slugs.map((s) => (
					<div
						key={s.slug}
						className={cn("md:block", s.slug !== slug && "hidden")}
					>
						<p className="mb-2 hidden font-mono text-[11px] text-fg-muted md:block">
							{s.label}: {s.slug} · 390px
						</p>
						<Phone slug={s.slug} variant={variant} />
					</div>
				))}
			</div>
			<Switcher variant={variant} onCycle={cycle} names={MOBILE_VARIANTS} />
		</div>
	);
}

/** One stack at phone width. The frame only exists on a wide screen. */
function Phone({ slug, variant }: { slug: string; variant: MobileVariantKey }) {
	const usage = useQuery(api.measured.getUsageByStackSlug, {
		slug,
		range: "30d",
	});
	const view = useQuery(api.workflow.getWorkflowByStackSlug, {
		slug,
		window: "30d",
	});
	const stack = useQuery(api.stacks.getBySlug, { slug });
	const data: Data | null =
		usage?.current && stack
			? {
					usage,
					current: usage.current,
					previous: usage.previous,
					view: view && view.window.days > 0 ? view : null,
					stackToolSlugs: stack.tools.map((t: { slug: string }) => t.slug),
				}
			: null;
	return (
		<div
			data-shot={slug}
			className={cn(
				accentClassFor(stack?.accentPreset),
				"bg-bg-canvas px-4 pb-10 md:w-[390px] md:shrink-0 md:border md:border-stroke-strong md:pt-6",
			)}
		>
			{usage === undefined || stack === undefined ? (
				<p className="font-mono text-sm text-fg-muted">loading {slug}</p>
			) : !data ? (
				<p className="font-mono text-sm text-fg-muted">
					{slug}: no measured days locally. Run scripts/sync-prod-db.sh.
				</p>
			) : variant === "A" ? (
				<Reflow {...data} />
			) : variant === "B" ? (
				<Portrait {...data} />
			) : (
				<Digest {...data} />
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Shared reads. Layout is never shared.
// ---------------------------------------------------------------------------

/** Fixed phone layout, including when previewed inside a wide viewport. */
function MobileHeadline({ current }: Data) {
	const parts = [
		{
			label: "in",
			value: current.models.reduce(
				(n, m) => n + m.tokens.input + m.tokens.cacheWrite,
				0,
			),
		},
		{
			label: "out",
			value: current.models.reduce((n, m) => n + m.tokens.output, 0),
		},
		{
			label: "cached",
			value: current.models.reduce((n, m) => n + m.tokens.cacheRead, 0),
		},
	];
	const cost =
		current.cost && current.cost.pricingTables.length > 0 ? current.cost : null;
	return (
		<div className="border border-stroke-subtle p-3">
			<p className="mb-3 font-mono text-[10px] text-fg-muted">
				Tokens processed · last 30 days
			</p>
			<div className="grid grid-cols-3 gap-2">
				{parts.map((part) => (
					<div key={part.label} className="min-w-0">
						<p className="font-mono text-xl font-black leading-none text-fg-primary">
							{fmtTokens(part.value)}
						</p>
						<p className="mt-2 font-mono text-[10px] text-accent-lime">
							{part.label}{" "}
							<span className="text-fg-muted">
								{fmtShare(
									current.totalTokens > 0
										? part.value / current.totalTokens
										: 0,
								)}
							</span>
						</p>
					</div>
				))}
			</div>
			{cost && (
				<details className="mt-3 border-t border-stroke-subtle pt-2">
					<summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-1 font-mono [&::-webkit-details-marker]:hidden">
						<b className="text-lg text-fg-primary">≈{fmtUSD(cost.usd)}</b>
						<span className="text-[10px] text-fg-muted">
							API list prices · {fmtShare(cost.pricedShare)} covered +
						</span>
					</summary>
					<p className="mt-2 break-all font-mono text-[10px] text-fg-muted">
						Price tables: {cost.pricingTables.join(", ")}
					</p>
				</details>
			)}
		</div>
	);
}

function reads(data: Data) {
	const { current, previous, view, stackToolSlugs } = data;
	const lookup = modelLookup(data);
	const harnesses = harnessRows(current, previous, stackToolSlugs);
	return {
		tiles: tileSpecs(current, previous, view, 30),
		context: contextOf(view),
		trails: lookup.trails,
		subRows: view ? subagentModelRows(view, lookup.paint, lookup.label) : [],
		harnesses,
		showPie: harnesses.length > 1,
		skills: view ? kitItems(view, "skills") : null,
		mcp: view ? kitItems(view, "mcpServers") : null,
		types: view ? kitItems(view, "subagents") : null,
	};
}

/**
 * The model breakdown on a phone. The desktop row reserves 160px for the name
 * and 116px for figures, so at 358px the bar is 30px wide and the standard
 * stops being one. Two lines: the name and the figures, then the bar at the
 * full width of the section.
 */
function ModelRowsTwoLine({ trails }: { trails: readonly ModelTrail[] }) {
	return (
		<div className="divide-y divide-stroke-subtle border-y border-stroke-subtle">
			{trails.map((trail) => (
				<div key={trail.id} className="py-2.5">
					<p className="mb-1.5 flex items-center gap-2">
						<i
							className="block size-3 shrink-0"
							style={{ background: trail.paint }}
						/>
						<span className="min-w-0 flex-1 truncate text-sm text-fg-primary">
							{trail.label}
						</span>
						<span className="font-mono text-[11px] text-fg-muted">
							<Drift trail={trail} />
						</span>
						<b className="w-14 text-right font-mono text-sm text-fg-primary">
							{fmtShare(trail.share)}
						</b>
					</p>
					<Tip
						className="flex w-full"
						label={`${trail.label} · ${fmtShare(trail.share)} · before ${fmtShare(trail.first)}`}
					>
						<span className="relative block h-6 w-full bg-bg-panel">
							<span
								className="absolute inset-y-0 left-0"
								style={{
									width: `${Math.max(1, trail.share * 100)}%`,
									background: trail.paint,
								}}
							/>
							{trail.moved && (
								<span
									aria-hidden="true"
									className="absolute -top-1 -bottom-1 w-[6px] -translate-x-1/2"
									style={{
										left: `${Math.min(100, Math.max(0, trail.first * 100))}%`,
										backgroundImage: NOTCH,
									}}
								/>
							)}
						</span>
					</Tip>
				</div>
			))}
		</div>
	);
}

function Drift({ trail }: { trail: ModelTrail }) {
	if (!trail.moved || Math.abs(trail.driftPoints) < 0.5) return null;
	return (
		<>
			{trail.driftPoints > 0 ? "↑" : "↓"}
			{Math.abs(Math.round(trail.driftPoints))}
		</>
	);
}

/** Subagent routing at phone width: the token column goes, the bar keeps half the row. */
function RoutingRows({ rows }: { rows: readonly ShareRow[] }) {
	return (
		<ul className="space-y-1.5">
			{rows.map((row) => (
				<li key={row.key} className="flex items-center gap-2">
					<span className="w-32 shrink-0 truncate text-[13px] text-fg-secondary">
						{row.label}
					</span>
					<span className="block h-3 flex-1 bg-bg-panel">
						<span
							className="block h-full"
							style={{
								width: `${Math.min(100, Math.max(0.5, row.share * 100))}%`,
								background: row.paint,
							}}
						/>
					</span>
					<b className="w-12 shrink-0 text-right font-mono text-xs text-fg-primary">
						{row.figure}
					</b>
				</li>
			))}
		</ul>
	);
}

function RoutingHead({ share }: { share: number }) {
	return (
		<p className="mt-4 mb-2 flex items-baseline gap-2 font-mono text-[11px] text-fg-muted">
			<span>run by subagents</span>
			<b className="text-fg-primary">{fmtPercent(share)}</b>
		</p>
	);
}

// ---------------------------------------------------------------------------
// A. Reflow: every desktop form survives, only the grids change.
// ---------------------------------------------------------------------------

function Reflow(data: Data) {
	const { current, view } = data;
	const r = reads(data);
	return (
		<div className="space-y-10">
			<MobileHeadline {...data} />
			<div className="grid grid-cols-2 gap-2">
				{r.tiles.map((tile) => (
					<Tile key={tile.key} tile={tile} />
				))}
			</div>

			<Block title="Models" note={`${r.trails.length} measured`}>
				<ModelRowsTwoLine trails={r.trails} />
				{r.subRows.length > 0 && (
					<>
						<RoutingHead share={current.subagentShare} />
						<RoutingRows rows={r.subRows} />
					</>
				)}
			</Block>

			{r.showPie && (
				<Block
					title="Harnesses"
					figure={`${current.sessions.toLocaleString("en-US")} sessions`}
				>
					<HarnessPie rows={r.harnesses} size="size-44" stacked />
				</Block>
			)}

			{r.context && (
				<Block title="Context per call">
					<div className="space-y-5">
						{r.context.harnesses.map((h) => (
							<div key={h.harness}>
								<WaffleHead h={h} />
								<Waffle h={h} cols={40} className="gap-[2px]" />
							</div>
						))}
					</div>
					<WaffleLegend />
				</Block>
			)}

			{r.skills && r.skills.items.length > 0 && (
				<Block title="Skills" note={`${r.skills.items.length} used`}>
					<PlateStrip
						items={r.skills.items}
						withheld={r.skills.withheld}
						minInside={0.2}
					/>
				</Block>
			)}
			{r.mcp && r.mcp.items.length > 0 && (
				<Block title="MCP servers" note={`${r.mcp.items.length} used`}>
					<PlateStrip
						items={r.mcp.items}
						withheld={r.mcp.withheld}
						minInside={0.2}
					/>
				</Block>
			)}

			{r.types && r.types.items.length > 0 && (
				<Block title="Subagent types" note={`${r.types.items.length} used`}>
					<CountGrid items={r.types.items} />
				</Block>
			)}

			{view && (
				<Block title="The week" figure={`${current.activeDays}/30 days`}>
					<Heat view={view} startMarginal cell="h-6" />
				</Block>
			)}

			{view && view.section.git.commits > 0 && (
				<Block title="Lines changed" figure={<LinesFigure view={view} />}>
					<LinesPerDay view={view} height="h-32" />
				</Block>
			)}

			{view && phaseSegments(view).length > 0 && (
				<Block title="Where the time goes">
					<SegStrip segments={phaseSegments(view)} />
				</Block>
			)}
			{view && languageRows(view).length > 0 && (
				<Block title="Languages">
					<LanguageBar view={view} />
				</Block>
			)}
		</div>
	);
}

/** The desktop count columns, two to a row. */
function CountGrid({ items }: { items: readonly KitItem[] }) {
	return (
		<div className="grid grid-cols-2 gap-x-6 gap-y-6">
			{items.slice(0, 4).map((item) => (
				<div key={item.name} className="min-w-0">
					<p className="font-mono text-3xl font-black leading-none text-fg-primary">
						{item.calls === null
							? fmtPercent(item.share)
							: fmtCount(item.calls)}
						{item.calls !== null && (
							<span className="text-base text-fg-muted">×</span>
						)}
					</p>
					<Rule share={item.share} />
					<p className="mt-1.5 flex items-baseline justify-between gap-2">
						<span className="truncate text-sm text-fg-primary">
							{item.name}
						</span>
						<span className="font-mono text-[11px] text-fg-muted">
							{fmtPercent(item.share)}
						</span>
					</p>
				</div>
			))}
		</div>
	);
}

function Rule({ share }: { share: number }) {
	return (
		<span className="mt-2 block h-1 w-full bg-bg-panel">
			<span
				className="block h-full"
				style={{ width: `${Math.max(1, share * 100)}%`, background: ACCENT }}
			/>
		</span>
	);
}

// ---------------------------------------------------------------------------
// B. Portrait: the forms that fight a narrow screen are redrawn for it.
// ---------------------------------------------------------------------------

function Portrait(data: Data) {
	const { current, view } = data;
	const r = reads(data);
	return (
		<div className="space-y-10">
			<MobileHeadline {...data} />

			{/* A swipe row: the sixth tile peeks in from the edge, which is the cue. */}
			<div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
				{r.tiles.map((tile) => (
					<div key={tile.key} className="w-[46%] shrink-0 snap-start">
						<Tile tile={tile} />
					</div>
				))}
			</div>

			<Block title="Models" note={`${r.trails.length} measured`}>
				<ModelRowsTwoLine trails={r.trails} />
				{r.subRows.length > 0 && (
					<>
						<RoutingHead share={current.subagentShare} />
						<RoutingRows rows={r.subRows} />
					</>
				)}
			</Block>

			{r.showPie && (
				<Block
					title="Harnesses"
					figure={`${current.sessions.toLocaleString("en-US")} sessions`}
				>
					<HarnessPie rows={r.harnesses} size="size-28" />
				</Block>
			)}

			{r.context && (
				<Block title="Context per call">
					<div className="space-y-4">
						{r.context.harnesses.map((h) => (
							<ContextBand key={h.harness} h={h} />
						))}
					</div>
					<WaffleLegend />
				</Block>
			)}

			{r.skills && r.skills.items.length > 0 && (
				<Block title="Skills" note={`${r.skills.items.length} used`}>
					<PlateStack items={r.skills.items} withheld={r.skills.withheld} />
				</Block>
			)}
			{r.mcp && r.mcp.items.length > 0 && (
				<Block title="MCP servers" note={`${r.mcp.items.length} used`}>
					<PlateStack items={r.mcp.items} withheld={r.mcp.withheld} />
				</Block>
			)}

			{r.types && r.types.items.length > 0 && (
				<Block title="Subagent types" note={`${r.types.items.length} used`}>
					<CountRows items={r.types.items} />
				</Block>
			)}

			{view && (
				<Block title="The week" figure={`${current.activeDays}/30 days`}>
					<HeatTall view={view} />
				</Block>
			)}

			{view && view.section.git.commits > 0 && (
				<Block title="Lines changed" figure={<LinesFigure view={view} />}>
					<LinesPerDay view={view} height="h-40" />
				</Block>
			)}

			{view && phaseSegments(view).length > 0 && (
				<Block title="Where the time goes">
					<SegStrip segments={phaseSegments(view)} />
				</Block>
			)}
			{view && languageRows(view).length > 0 && (
				<Block title="Languages">
					<LanguageBar view={view} />
				</Block>
			)}
		</div>
	);
}

/** The waffle's numbers as one band per harness: 400 cells do not fit twice in 358px. */
function ContextBand({ h }: { h: ContextHarness }) {
	if (h.window === null) return <WaffleHead h={h} />;
	const w = h.window;
	const parts = [
		{ key: "harness", value: h.harnessTokens, paint: CONTEXT_PAINT.harness },
		{
			key: "instructions",
			value: h.instructionsTokens,
			paint: CONTEXT_PAINT.instructions,
		},
		{
			key: "chat",
			value: h.usualChat,
			paint: h.breakdownAvailable === false ? ACCENT : CONTEXT_PAINT.usualChat,
		},
	];
	return (
		<div>
			<WaffleHead h={h} />
			<Tip
				className="flex w-full"
				label={`${harnessLabel(h.harness)} · typical call ${fmtTokens(h.medianCall)} · 1 in 10 pass ${fmtTokens(h.p90Call)}`}
			>
				<span className="relative flex h-6 w-full gap-0.5 bg-bg-panel">
					{parts.map((part) => (
						<i
							key={part.key}
							className="block h-full"
							style={{
								width: `${(part.value / w) * 100}%`,
								background: part.paint,
							}}
						/>
					))}
					<i
						className="absolute inset-y-0 border border-stroke-strong"
						style={{
							left: `${Math.min(100, (h.medianCall / w) * 100)}%`,
							width: `${Math.max(0, Math.min(100, (h.p90Call / w) * 100) - Math.min(100, (h.medianCall / w) * 100))}%`,
						}}
					/>
				</span>
			</Tip>
		</div>
	);
}

/**
 * The plate strip turned on its side. A plate is as wide as the section, so
 * every name fits, and the share is the plate's height.
 */
function PlateStack({
	items,
	withheld,
}: {
	items: readonly KitItem[];
	withheld: number;
}) {
	const steps = [100, 78, 60, 46, 36, 28];
	const paint = (i: number) =>
		`color-mix(in oklab, var(--accent-lime) ${steps[Math.min(i, steps.length - 1)]}%, var(--bg-panel))`;
	const shown = items.filter((item) => item.share >= 0.04).slice(0, 6);
	const rest = items.filter((item) => !shown.includes(item));
	const HEIGHT = 300;
	return (
		<div>
			<div className="flex flex-col gap-0.5">
				{shown.map((item, i) => (
					<Tip
						key={item.name}
						className="flex w-full"
						label={`${item.name} · ${fmtPercent(item.share)}${item.calls === null ? "" : ` · ${fmtCount(item.calls)}×`}`}
					>
						<span
							className={cn(
								"flex w-full items-center justify-between gap-3 px-2.5",
								i < 3 ? "text-accent-lime-contrast" : "text-fg-primary",
							)}
							style={{
								background: paint(i),
								height: Math.max(26, item.share * HEIGHT),
							}}
						>
							<span className="truncate text-[13px] font-bold">
								{item.name}
							</span>
							<span className="font-mono text-base font-black leading-none">
								{fmtPercent(item.share)}
							</span>
						</span>
					</Tip>
				))}
			</div>
			{(rest.length > 0 || withheld > 0) && (
				<p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-fg-muted">
					{rest.map((item) => (
						<span key={item.name}>
							{item.name}{" "}
							<b className="text-fg-primary">{fmtPercent(item.share)}</b>
						</span>
					))}
					{withheld > 0 && <span>{withheld} withheld</span>}
				</p>
			)}
		</div>
	);
}

/** Count columns as rows: the count leads at the left, the rule runs the full width. */
function CountRows({ items }: { items: readonly KitItem[] }) {
	return (
		<ul className="space-y-3">
			{items.slice(0, 4).map((item) => (
				<li key={item.name}>
					<p className="flex items-baseline gap-3">
						<b className="w-20 shrink-0 font-mono text-2xl font-black leading-none text-fg-primary">
							{item.calls === null
								? fmtPercent(item.share)
								: `${fmtCount(item.calls)}×`}
						</b>
						<span className="min-w-0 flex-1 truncate text-sm text-fg-primary">
							{item.name}
						</span>
						<span className="font-mono text-[11px] text-fg-muted">
							{fmtPercent(item.share)}
						</span>
					</p>
					<Rule share={item.share} />
				</li>
			))}
		</ul>
	);
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

/**
 * The week, transposed: 7 columns across, 24 hours down. A cell is 40px wide
 * and 13px tall, a touch target the 12px desktop cell is not. Session starts
 * run down the right edge as bars.
 */
function HeatTall({ view }: { view: WorkflowView }) {
	const cells = heatCells(view, "sessions");
	if (cells.size === 0) return null;
	const busiest = Math.max(...cells.values());
	const starts = startProfile(view);
	const mostStarts = Math.max(...starts, 0);
	return (
		<div>
			<div className="mb-1 flex gap-0.5 pl-7 font-mono text-[10px] text-fg-muted">
				{WEEKDAYS.map((weekday) => (
					<span key={weekday} className="flex-1 text-center">
						{weekdayLabel(weekday).slice(0, 2)}
					</span>
				))}
				<span className="w-14 shrink-0 text-right text-[9px]">starts</span>
			</div>
			{HOURS.map((hour) => (
				<div key={hour} className="flex items-center gap-0.5 pb-0.5">
					<span className="w-6 shrink-0 font-mono text-[9px] leading-none text-fg-muted">
						{hour % 3 === 0 ? String(hour).padStart(2, "0") : ""}
					</span>
					{WEEKDAYS.map((weekday) => {
						const count = cells.get(`${weekday}-${hour}`) ?? 0;
						return (
							<Tip
								key={weekday}
								className="flex min-w-0 flex-1"
								label={`${weekdayLabel(weekday)} ${hourLabel(hour)} · ${fmtCount(count)} events`}
							>
								<span
									className="block h-[13px] w-full"
									style={{ background: heatPaint(count, busiest) }}
								/>
							</Tip>
						);
					})}
					<span className="flex h-[13px] w-14 shrink-0 items-center pl-1">
						<i
							className="block h-1.5"
							style={{
								width:
									mostStarts > 0
										? `${((starts[hour] ?? 0) / mostStarts) * 100}%`
										: 0,
								background: "var(--fg-muted)",
							}}
						/>
					</span>
				</div>
			))}
		</div>
	);
}

// ---------------------------------------------------------------------------
// C. Digest: short page, thin marks, and a mobile-only detail layer on a tap.
// ---------------------------------------------------------------------------

function Digest(data: Data) {
	const { current, view } = data;
	const r = reads(data);
	const top = r.trails.slice(0, 4);
	const tail = r.trails.slice(4);
	return (
		<div className="space-y-8">
			<MobileHeadline {...data} />

			<div className="grid grid-cols-3 gap-2">
				{r.tiles.map((tile) => (
					<Tile key={tile.key} tile={tile} compact />
				))}
			</div>

			<Block title="Models" note={`${r.trails.length} measured`}>
				<ThinRows trails={top} />
				{tail.length > 0 && (
					<More
						label={`${tail.length} more ${tail.length === 1 ? "model" : "models"}`}
					>
						<ThinRows trails={tail} />
					</More>
				)}
				{r.subRows.length > 0 && (
					<More
						label={`Subagent routing · ${fmtPercent(current.subagentShare)}`}
					>
						<RoutingRows rows={r.subRows} />
					</More>
				)}
			</Block>

			{r.showPie && (
				<Block
					title="Harnesses"
					figure={`${current.sessions.toLocaleString("en-US")} sessions`}
				>
					<SegStrip
						segments={r.harnesses.map((row) => ({
							key: row.key,
							label: row.label,
							paint: row.paint,
							value: row.share,
						}))}
					/>
				</Block>
			)}

			{r.context && (
				<Block title="Context per call">
					<div className="space-y-4">
						{r.context.harnesses.map((h) => (
							<div key={h.harness}>
								<WaffleHead h={h} />
								<Waffle h={h} cols={40} className="gap-[2px]" />
							</div>
						))}
					</div>
					<WaffleLegend />
				</Block>
			)}

			{r.skills && r.skills.items.length > 0 && (
				<Block title="Skills" note={`${r.skills.items.length} used`}>
					<Chips items={r.skills.items} withheld={r.skills.withheld} />
				</Block>
			)}
			{r.mcp && r.mcp.items.length > 0 && (
				<Block title="MCP servers" note={`${r.mcp.items.length} used`}>
					<Chips items={r.mcp.items} withheld={r.mcp.withheld} />
				</Block>
			)}
			{r.types && r.types.items.length > 0 && (
				<Block title="Subagent types" note={`${r.types.items.length} used`}>
					<Chips items={r.types.items} withheld={0} counts />
				</Block>
			)}

			{view && (
				<Block title="The week" figure={`${current.activeDays}/30 days`}>
					<WeekMarginals view={view} />
					<More label="every hour">
						<HeatTall view={view} />
					</More>
				</Block>
			)}

			{view && view.section.git.commits > 0 && (
				<Block title="Lines changed" figure={<LinesFigure view={view} />}>
					<LinesPerDay view={view} height="h-16" />
				</Block>
			)}

			{view && phaseSegments(view).length > 0 && (
				<Block title="Where the time goes">
					<SegStrip segments={phaseSegments(view)} />
				</Block>
			)}
			{view && languageRows(view).length > 0 && (
				<Block title="Languages">
					<LanguageBar view={view} max={4} />
				</Block>
			)}
		</div>
	);
}

/** The mobile-only detail layer: a tap, where the desktop has a hover. */
function More({ label, children }: { label: string; children: ReactNode }) {
	return (
		<details className="group mt-3">
			<summary className="inline-flex cursor-pointer list-none items-center gap-1.5 border border-stroke-subtle px-2 py-1 font-mono text-[11px] text-fg-muted [&::-webkit-details-marker]:hidden">
				<span className="group-open:hidden">+</span>
				<span className="hidden group-open:inline">-</span>
				{label}
			</summary>
			<div className="mt-3">{children}</div>
		</details>
	);
}

/** One line per model: name and share, and the bar as a 6px rule under them. */
function ThinRows({ trails }: { trails: readonly ModelTrail[] }) {
	return (
		<ul className="space-y-2.5">
			{trails.map((trail) => (
				<li key={trail.id}>
					<p className="flex items-baseline gap-2">
						<span className="min-w-0 flex-1 truncate text-sm text-fg-primary">
							{trail.label}
						</span>
						<span className="font-mono text-[11px] text-fg-muted">
							<Drift trail={trail} />
						</span>
						<b className="font-mono text-sm text-fg-primary">
							{fmtShare(trail.share)}
						</b>
					</p>
					<span className="relative mt-1 block h-1.5 w-full bg-bg-panel">
						<span
							className="absolute inset-y-0 left-0"
							style={{
								width: `${Math.max(1, trail.share * 100)}%`,
								background: trail.paint,
							}}
						/>
						{trail.moved && (
							<span
								className="absolute -top-1 -bottom-1 w-0.5 bg-fg-primary"
								style={{ left: `${Math.min(100, trail.first * 100)}%` }}
							/>
						)}
					</span>
				</li>
			))}
		</ul>
	);
}

/** Names in rank order, wrapped. The lightness steps down with the rank. */
function Chips({
	items,
	withheld,
	counts = false,
}: {
	items: readonly KitItem[];
	withheld: number;
	counts?: boolean;
}) {
	const steps = [100, 78, 60, 46, 36, 28];
	return (
		<p className="flex flex-wrap gap-1.5">
			{items.slice(0, 8).map((item, i) => (
				<span
					key={item.name}
					className={cn(
						"inline-flex items-baseline gap-2 px-2 py-1 text-[13px] font-bold",
						i < 3 ? "text-accent-lime-contrast" : "text-fg-primary",
					)}
					style={{
						background: `color-mix(in oklab, var(--accent-lime) ${steps[Math.min(i, steps.length - 1)]}%, var(--bg-panel))`,
					}}
				>
					{item.name}
					<span className="font-mono text-xs font-black">
						{counts && item.calls !== null
							? `${fmtCount(item.calls)}×`
							: fmtPercent(item.share)}
					</span>
				</span>
			))}
			{(items.length > 8 || withheld > 0) && (
				<span className="self-center font-mono text-[11px] text-fg-muted">
					{[
						items.length > 8 ? `+${items.length - 8}` : null,
						withheld > 0 ? `${withheld} withheld` : null,
					]
						.filter(Boolean)
						.join(" · ")}
				</span>
			)}
		</p>
	);
}

/** The 168 cells folded to their two margins: 7 weekday bars and one 24-cell hour strip. */
function WeekMarginals({ view }: { view: WorkflowView }) {
	const cells = heatCells(view, "sessions");
	if (cells.size === 0) return null;
	const byDay = WEEKDAYS.map((weekday) =>
		HOURS.reduce(
			(sum, hour) => sum + (cells.get(`${weekday}-${hour}`) ?? 0),
			0,
		),
	);
	const byHour = HOURS.map((hour) =>
		WEEKDAYS.reduce(
			(sum, weekday) => sum + (cells.get(`${weekday}-${hour}`) ?? 0),
			0,
		),
	);
	const topDay = Math.max(...byDay, 1);
	const topHour = Math.max(...byHour, 1);
	return (
		<div>
			<div className="flex h-16 items-end gap-1">
				{WEEKDAYS.map((weekday, i) => (
					<span key={weekday} className="flex h-full flex-1 flex-col">
						<span className="flex flex-1 items-end">
							<i
								className="block w-full"
								style={{
									height: `${((byDay[i] ?? 0) / topDay) * 100}%`,
									minHeight: 1,
									background: ACCENT,
								}}
							/>
						</span>
						<span className="mt-1 text-center font-mono text-[10px] text-fg-muted">
							{weekdayLabel(weekday).slice(0, 2)}
						</span>
					</span>
				))}
			</div>
			<div className="mt-3 flex gap-0.5">
				{HOURS.map((hour) => (
					<span
						key={hour}
						className="block h-4 flex-1"
						style={{ background: heatPaint(byHour[hour] ?? 0, topHour) }}
					/>
				))}
			</div>
			<p className="mt-1 flex justify-between font-mono text-[9px] text-fg-muted">
				<span>00</span>
				<span>06</span>
				<span>12</span>
				<span>18</span>
				<span>23</span>
			</p>
		</div>
	);
}
