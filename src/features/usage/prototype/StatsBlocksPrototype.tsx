/**
 * PROTOTYPE - throwaway (#463, map #462).
 *
 * Three variants of the Stats section as always-visible blocks, with no
 * accordion, switchable via `?variant=` on `/prototype/stats-blocks`. Live
 * local Convex queries, stack slug as `?slug=`. Desktop only.
 *
 *   A  Ledger         one column, every block full width, a tile strip,
 *                     harness and context as two blocks
 *   B  Harness cards  one merged card per harness (share, sessions, context,
 *                     thinking, effort); no tile strip, figures ride the blocks
 *   C  Board          a dense 12-column board that revives every dead visual
 *                     so each one can be judged in place
 *
 * A previous-period figure the server cannot fold yet wears an orange "stub"
 * mark, and its notch sits at a fake offset.
 */
import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { CHART_PAINTS } from "@/features/charts";
import { fmtShare, fmtTokens } from "@/features/measured/copy";
import { MetricBlock } from "@/features/measured/MetricBlock";
import { ModelShareRows } from "@/features/measured/ModelShareRows";
import { accentClassFor } from "@/features/stack-view/accentPresets";
import {
	fmtCount,
	fmtPercent,
	type WorkflowView,
} from "@/features/workflow/copy";
import { delegation, routing } from "@/features/workflow/derive";
import { cn } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";
import { contextOf } from "../context";
import type { UsageRead, UsageReading } from "../copy";
import { harnessLabel } from "../HarnessShareRows";
import { usageTrails } from "../trails";
import {
	Block,
	CountColumns,
	effortSegments,
	HalfRows,
	HarnessPie,
	Heat,
	harnessPaint,
	harnessRows,
	KitFoot,
	kitItems,
	kitRows,
	LanguageBar,
	LinesFigure,
	LinesPerDay,
	languageRows,
	PhaseTracks,
	PlateStrip,
	phaseSegments,
	SegStrip,
	type ShareRow,
	ShareRows,
	StartHoursBars,
	Stub,
	subagentModelRows,
	Tile,
	TurnBars,
	thinkingRows,
	tileSpecs,
	turnMedian,
	Waffle,
	WaffleHead,
	WaffleLegend,
} from "./blocks";

export const VARIANTS = {
	A: "Ledger",
	B: "Harness cards",
	C: "Board",
} as const;
export type VariantKey = keyof typeof VARIANTS;
export const VARIANT_KEYS = Object.keys(VARIANTS) as VariantKey[];

/** The two stacks the ticket names: the owner's rich one and the sparsest synced one. */
const STACKS = [
	{ slug: "alpers-coding-stack-unw0sl", label: "rich" },
	{ slug: "brilliant-insane-xg5pfo", label: "sparse" },
	{ slug: "abernier-mbp2-ok7asp", label: "sparse 2" },
] as const;

const DAY_MS = 86_400_000;

export type Data = {
	usage: UsageRead;
	current: UsageReading;
	previous: UsageReading | null;
	view: WorkflowView | null;
	stackToolSlugs: string[];
};

export function StatsBlocksPrototype({
	slug,
	variant,
	onChange,
}: {
	slug: string;
	variant: VariantKey;
	onChange: (next: { slug?: string; variant?: VariantKey }) => void;
}) {
	const usage = useQuery(api.measured.getUsageByStackSlug, {
		slug,
		range: "30d",
	});
	const view = useQuery(api.workflow.getWorkflowByStackSlug, {
		slug,
		window: "30d",
	});
	const stack = useQuery(api.stacks.getBySlug, { slug });

	const cycle = (step: number) => {
		const at = VARIANT_KEYS.indexOf(variant);
		onChange({
			variant:
				VARIANT_KEYS[(at + step + VARIANT_KEYS.length) % VARIANT_KEYS.length],
		});
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
		<div className={accentClassFor(stack?.accentPreset)}>
			<div className="mx-auto max-w-7xl px-6 pt-10 pb-40">
				<p className="mb-8 flex flex-wrap items-center gap-2 font-mono text-[11px] text-fg-muted">
					<span>stack</span>
					{STACKS.map((s) => (
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
							{s.label}: {s.slug}
						</button>
					))}
				</p>
				{usage === undefined || stack === undefined ? (
					<p className="font-mono text-sm text-fg-muted">loading {slug}</p>
				) : !data ? (
					<p className="font-mono text-sm text-fg-muted">
						{slug}: no measured days in the local database. Run
						scripts/sync-prod-db.sh.
					</p>
				) : variant === "A" ? (
					<VariantA {...data} />
				) : variant === "B" ? (
					<VariantB {...data} />
				) : (
					<VariantC {...data} />
				)}
			</div>
			<Switcher variant={variant} onCycle={cycle} />
		</div>
	);
}

// ---------------------------------------------------------------------------
// Shared reads. Layout is never shared.
// ---------------------------------------------------------------------------

export function Headline({ usage, current }: Pick<Data, "usage" | "current">) {
	const cost =
		current.cost && current.cost.pricingTables.length > 0 ? current.cost : null;
	type Tokens = (typeof current.models)[number]["tokens"];
	const sum = (pick: (t: Tokens) => number) =>
		current.models.reduce((total, model) => total + pick(model.tokens), 0);
	return (
		<MetricBlock
			tokens={current.totalTokens}
			inputTokens={sum((t) => t.input + t.cacheWrite)}
			outputTokens={sum((t) => t.output)}
			cacheReadTokens={sum((t) => t.cacheRead)}
			usd={cost ? cost.usd : null}
			pricedShare={cost ? cost.pricedShare : null}
			pricingTables={cost ? cost.pricingTables : []}
			windowDays={30}
			trail={usage.series.map((point) => ({
				at: Date.parse(point.date),
				value: point.tokens,
			}))}
		/>
	);
}

function modelTrails({ usage, current, previous }: Data) {
	const currentAt = Date.parse(usage.from);
	const previousAt = currentAt - 30 * DAY_MS;
	return {
		trails: usageTrails(
			current.models,
			previous?.models ?? null,
			currentAt,
			previousAt,
		),
		firstAt: previous ? previousAt : null,
	};
}

/** The standard itself, untouched. */
export function ModelsStandard(data: Data) {
	const { trails, firstAt } = modelTrails(data);
	return <ModelShareRows trails={trails} firstAt={firstAt} />;
}

export function modelLookup(data: Data) {
	const { trails } = modelTrails(data);
	const paint = (id: string) =>
		trails.find((t) => t.id === id)?.paint ?? "var(--fg-muted)";
	const label = (id: string) => trails.find((t) => t.id === id)?.label ?? id;
	return { trails, paint, label };
}

function subagentFigure(data: Data): ReactNode {
	return (
		<>
			{fmtPercent(data.current.subagentShare)}{" "}
			<span className="text-[11px] font-normal text-fg-muted">of tokens</span>
		</>
	);
}

// ---------------------------------------------------------------------------
// A. Ledger: one column, every block full width.
// ---------------------------------------------------------------------------

function VariantA(data: Data) {
	const { current, previous, view, stackToolSlugs } = data;
	const tiles = tileSpecs(current, previous, view, 30);
	const context = contextOf(view);
	const lookup = modelLookup(data);
	const subRows = view
		? subagentModelRows(view, lookup.paint, lookup.label)
		: [];
	const harnesses = harnessRows(current, previous, stackToolSlugs);
	const skills = view ? kitItems(view, "skills") : null;
	const mcp = view ? kitItems(view, "mcpServers") : null;
	const types = view ? kitItems(view, "subagents") : null;
	const showPie = harnesses.length > 1;
	return (
		<div className="space-y-12">
			<Headline {...data} />
			<div
				className="grid gap-3"
				style={{
					gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))`,
				}}
			>
				{tiles.map((tile) => (
					<Tile key={tile.key} tile={tile} />
				))}
			</div>

			{/* The standard, and the only block in this form. The subagent routing
			    rides under it: same colors, half the height. */}
			<Block title="Models" note={`${current.models.length} measured`}>
				<ModelsStandard {...data} />
				{subRows.length > 0 && (
					<div className="mt-5">
						<p className="mb-2.5 flex items-baseline gap-2 pl-6 font-mono text-[11px] text-fg-muted">
							<span>run by subagents</span>
							<b className="text-fg-primary">
								{fmtPercent(current.subagentShare)}
							</b>
						</p>
						<HalfRows rows={subRows} />
					</div>
				)}
			</Block>

			{(showPie || context) && (
				<div
					className={cn(
						"grid gap-x-12 gap-y-10",
						showPie && context && "grid-cols-[minmax(0,5fr)_minmax(0,7fr)]",
					)}
				>
					{showPie && (
						<Block
							title="Harnesses"
							figure={`${current.sessions.toLocaleString("en-US")} sessions`}
						>
							<HarnessPie rows={harnesses} />
						</Block>
					)}
					{context && (
						<Block title="Context per call">
							<div
								className="grid gap-x-8 gap-y-6"
								style={{
									gridTemplateColumns: `repeat(${Math.min(showPie ? 2 : 3, context.harnesses.length)}, minmax(0, 1fr))`,
								}}
							>
								{context.harnesses.map((h) => (
									<div key={h.harness}>
										<WaffleHead h={h} />
										<Waffle h={h} cols={20} />
									</div>
								))}
							</div>
							<WaffleLegend />
						</Block>
					)}
				</div>
			)}

			{skills && skills.items.length > 0 && (
				<Block title="Skills" note={`${skills.items.length} used`}>
					<PlateStrip items={skills.items} withheld={skills.withheld} />
				</Block>
			)}

			{mcp && mcp.items.length > 0 && (
				<Block title="MCP servers" note={`${mcp.items.length} used`}>
					<PlateStrip items={mcp.items} withheld={mcp.withheld} />
				</Block>
			)}

			{types && types.items.length > 0 && (
				<Block title="Subagent types" note={`${types.items.length} used`}>
					<CountColumns items={types.items} />
				</Block>
			)}

			{view && (
				<Block title="The week" figure={`${current.activeDays}/30 days`}>
					<Heat view={view} startMarginal cell="h-7" />
				</Block>
			)}

			{view && view.section.git.commits > 0 && (
				<Block title="Lines changed" figure={<LinesFigure view={view} />}>
					<LinesPerDay view={view} />
				</Block>
			)}

			{view && (
				<div className="grid grid-cols-2 gap-x-12 gap-y-10">
					{phaseSegments(view).length > 0 && (
						<Block title="Where the time goes">
							<SegStrip segments={phaseSegments(view)} />
						</Block>
					)}
					{languageRows(view).length > 0 && (
						<Block title="Languages">
							<LanguageBar view={view} />
						</Block>
					)}
				</div>
			)}
		</div>
	);
}

function KitBlocks({ view, slim }: { view: WorkflowView; slim?: boolean }) {
	const kinds = [
		["Skills", "skills"],
		["MCP servers", "mcpServers"],
		["Subagent types", "subagents"],
	] as const;
	return (
		<>
			{kinds.map(([title, kind]) => {
				const kit = kitRows(view, kind, slim ? 6 : 8);
				if (kit.rows.length === 0) return null;
				return (
					<Block
						key={kind}
						title={title}
						note={`${kit.rows.length + kit.hidden} used`}
					>
						<ShareRows
							rows={kit.rows}
							slim={slim}
							labelWidth={slim ? "w-32" : "w-56"}
						/>
						<KitFoot hidden={kit.hidden} withheld={kit.withheld} />
					</Block>
				);
			})}
		</>
	);
}

// ---------------------------------------------------------------------------
// B. Harness cards: one merged card per harness, no tile strip.
// ---------------------------------------------------------------------------

function VariantB(data: Data) {
	const { current, previous, view, stackToolSlugs } = data;
	const context = contextOf(view);
	const rows = harnessRows(current, previous, stackToolSlugs);
	const lookup = modelLookup(data);
	const r = view ? routing(view) : null;
	// The routing folds INTO the model rows: the hatched end of each bar is the
	// part of that model's tokens that subagents spent.
	const modelRows: ShareRow[] = lookup.trails.map((trail) => {
		const sub = r?.subagents.find((row) => row.name === trail.id)?.value ?? 0;
		const main = r?.main.find((row) => row.name === trail.id)?.value ?? 0;
		const inset = sub + main > 0 ? sub / (sub + main) : 0;
		return {
			key: trail.id,
			label: trail.label,
			paint: trail.paint,
			share: trail.share,
			first: trail.moved ? trail.first : null,
			figure: fmtShare(trail.share),
			sub: inset >= 0.005 ? `${fmtPercent(inset)} sub` : "",
			inset,
		};
	});
	const d = view ? delegation(view) : null;
	// A stack with no kit gives the week column the whole width.
	const hasKit =
		!!view &&
		(["skills", "mcpServers", "subagents"] as const).some(
			(kind) => kitRows(view, kind).rows.length > 0,
		);
	return (
		<div className="space-y-14">
			<Headline {...data} />

			<Block
				title="Models"
				note="hatched: run by subagents"
				figure={subagentFigure(data)}
			>
				<ShareRows rows={modelRows} />
			</Block>

			<Block
				title="Harnesses"
				figure={`${current.sessions.toLocaleString("en-US")} sessions`}
			>
				<div
					className="grid gap-4"
					style={{
						gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, rows.length))}, minmax(0, 1fr))`,
					}}
				>
					{rows.map((row) => {
						const h = context?.harnesses.find((c) => c.harness === row.key);
						const wf = view?.section.harnesses.find(
							(x) => x.harness === row.key,
						);
						const thinking =
							wf?.thinking && wf.thinking.responseTokens > 0
								? wf.thinking.thinkingTokens / wf.thinking.responseTokens
								: null;
						return (
							<article
								key={row.key}
								className="border border-stroke-subtle bg-bg-panel p-4"
								style={{ borderTop: `4px solid ${row.paint}` }}
							>
								<p className="flex items-baseline gap-2">
									<b
										className={cn(
											"text-base text-fg-primary",
											row.dim && "opacity-50",
										)}
									>
										{row.label}
									</b>
									<span className="ml-auto font-mono text-2xl font-black leading-none text-fg-primary">
										{row.figure}
									</span>
								</p>
								<div className="mt-3">
									<ShareRows
										rows={[{ ...row, label: "", sub: undefined }]}
										slim
										labelWidth="w-0"
									/>
								</div>
								<dl className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px] text-fg-muted">
									<Fact label="sessions" value={row.sub?.replace(" ses", "")} />
									<Fact
										label="thinking"
										value={thinking === null ? "-" : fmtPercent(thinking)}
									/>
									<Fact
										label="context"
										value={
											h?.window ? fmtPercent(h.medianCall / h.window) : "-"
										}
									/>
								</dl>
								{h && (
									<div className="mt-4">
										<Waffle h={h} cols={20} />
									</div>
								)}
							</article>
						);
					})}
				</div>
				{context && <WaffleLegend />}
			</Block>

			<div
				className={cn(
					"grid gap-x-12 gap-y-14",
					hasKit ? "grid-cols-2" : "grid-cols-1",
				)}
			>
				{hasKit && view && (
					<div className="space-y-14">
						<KitBlocks view={view} slim />
					</div>
				)}
				<div className="space-y-14">
					{view && (
						<Block title="The week" figure={`${current.activeDays}/30 days`}>
							<Heat view={view} cell="h-6" />
						</Block>
					)}
					{view && view.section.git.commits > 0 && (
						<Block title="Lines changed" figure={<LinesFigure view={view} />}>
							<LinesPerDay view={view} height="h-28" />
						</Block>
					)}
					{view && phaseSegments(view).length > 0 && (
						<Block title="Where the time goes">
							<SegStrip segments={phaseSegments(view)} />
						</Block>
					)}
					<Block title="Cache hits" figure={fmtPercent(current.cacheHitShare)}>
						<ShareRows
							slim
							labelWidth="w-0"
							rows={[
								{
									key: "cache",
									label: "",
									paint: "var(--accent-lime)",
									share: current.cacheHitShare,
									first: previous ? previous.cacheHitShare : null,
									figure: fmtPercent(current.cacheHitShare),
								},
							]}
						/>
					</Block>
					{d && d.widestFanOut > 0 && (
						<p className="font-mono text-[11px] text-fg-muted">
							detail layer: widest fan-out {d.widestFanOut}, most subagents{" "}
							{d.mostSubagents} <Stub what="placement" />
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

function Fact({ label, value }: { label: string; value?: string }) {
	return (
		<div>
			<dd className="text-sm font-bold text-fg-primary">{value ?? "-"}</dd>
			<dt>{label}</dt>
		</div>
	);
}

// ---------------------------------------------------------------------------
// C. Board: dense, and every dead visual revived in place.
// ---------------------------------------------------------------------------

function Cell({ span, children }: { span: number; children: ReactNode }) {
	return (
		<div
			className="min-w-0 border border-stroke-subtle p-5"
			style={{ gridColumn: `span ${span}` }}
		>
			{children}
		</div>
	);
}

function VariantC(data: Data) {
	const { current, previous, view, stackToolSlugs } = data;
	const tiles = tileSpecs(current, previous, view, 30);
	const context = contextOf(view);
	return (
		<div className="space-y-6">
			<Headline {...data} />
			<div className="grid grid-cols-12 gap-4">
				<Cell span={8}>
					<Block title="Models">
						<ModelsStandard {...data} />
					</Block>
				</Cell>
				<div className="col-span-4 grid grid-cols-2 gap-4">
					{tiles.map((tile) => (
						<Tile key={tile.key} tile={tile} />
					))}
				</div>

				<Cell span={6}>
					<Block title="Harnesses">
						<ShareRows
							rows={harnessRows(current, previous, stackToolSlugs)}
							labelWidth="w-28"
						/>
					</Block>
				</Cell>
				<Cell span={6}>
					<Block title="Context per call">
						{context ? (
							<div className="space-y-3">
								{context.harnesses.map((h) => (
									<ContextBar key={h.harness} h={h} />
								))}
								<WaffleLegend />
							</div>
						) : (
							<p className="font-mono text-[11px] text-fg-muted">
								not measured
							</p>
						)}
					</Block>
				</Cell>

				{view && (
					<>
						<Cell span={7}>
							<Block title="The week">
								<Heat view={view} cell="h-6" />
							</Block>
						</Cell>
						<Cell span={5}>
							<Block title="Session starts" note="dead visual, revived">
								<StartHoursBars view={view} />
							</Block>
						</Cell>

						<Cell span={12}>
							<Block title="Lines changed" figure={<LinesFigure view={view} />}>
								<LinesPerDay view={view} height="h-28" />
							</Block>
						</Cell>

						<div className="col-span-12 flex gap-4">
							<KitCells view={view} />
						</div>

						<Cell span={7}>
							<Block title="Where the time goes" note="playbook, revived">
								<SegStrip segments={phaseSegments(view)} />
								<PhaseTracks view={view} />
							</Block>
						</Cell>
						<Cell span={5}>
							<Block title="Languages" note="dead visual, revived">
								<ShareRows rows={languageRows(view)} slim labelWidth="w-24" />
							</Block>
						</Cell>

						<Cell span={4}>
							<Block title="Effort" note="dead visual, revived">
								<SegStrip segments={effortSegments(view)} />
							</Block>
						</Cell>
						<Cell span={4}>
							<Block title="Thinking" note="dead visual, revived">
								<ShareRows rows={thinkingRows(view)} slim labelWidth="w-24" />
							</Block>
						</Cell>
						<Cell span={4}>
							<Block
								title="Turn length"
								note="dead visual, revived"
								figure={turnMedian(view) ?? undefined}
							>
								<TurnBars view={view} />
							</Block>
						</Cell>
					</>
				)}
			</div>
		</div>
	);
}

function KitCells({ view }: { view: WorkflowView }) {
	return (
		<div className="contents [&>section]:flex-1 [&>section]:border [&>section]:border-stroke-subtle [&>section]:p-5">
			<KitBlocks view={view} slim />
		</div>
	);
}

/** The context reading flattened to one bar per harness: the waffle's numbers in the standard's form. */
function ContextBar({
	h,
}: {
	h: NonNullable<ReturnType<typeof contextOf>>["harnesses"][number];
}) {
	if (h.window === null) {
		return (
			<p className="flex items-baseline gap-3 text-sm text-fg-primary">
				<span className="w-28 truncate">{harnessLabel(h.harness)}</span>
				<b className="font-mono">{fmtTokens(h.medianCall)}</b>
			</p>
		);
	}
	const w = h.window;
	const parts = [
		{ key: "harness", value: h.harnessTokens, paint: CHART_PAINTS[3] },
		{
			key: "instructions",
			value: h.instructionsTokens,
			paint: CHART_PAINTS[1],
		},
		{ key: "chat", value: h.usualChat, paint: CHART_PAINTS[0] },
	];
	return (
		<div className="flex items-center gap-3">
			<span
				className="size-3 shrink-0"
				style={{ background: harnessPaint(h.harness) }}
			/>
			<span className="w-28 shrink-0 truncate text-sm text-fg-primary">
				{harnessLabel(h.harness)}
			</span>
			<span className="relative flex h-7 flex-1 gap-0.5 bg-bg-panel">
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
					className="absolute -top-1 -bottom-1 w-px bg-fg-primary"
					title={`1 in 10 chats pass ${fmtTokens(h.p90Call)}`}
					style={{ left: `${Math.min(100, (h.p90Call / w) * 100)}%` }}
				/>
			</span>
			<span className="w-12 shrink-0 text-right font-mono text-sm font-bold text-fg-primary">
				{fmtPercent(h.medianCall / w)}
			</span>
			<span className="w-14 shrink-0 text-right font-mono text-[11px] text-fg-muted">
				{fmtCount(h.compactions)} cmp
			</span>
		</div>
	);
}

// ---------------------------------------------------------------------------
// The floating bar. Deliberately off-brand. Hidden in production builds.
// ---------------------------------------------------------------------------

export function Switcher({
	variant,
	onCycle,
	names = VARIANTS,
}: {
	variant: string;
	onCycle: (step: number) => void;
	names?: Record<string, string>;
}) {
	if (import.meta.env.PROD) return null;
	return (
		<div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
			<div className="flex items-stretch border-2 border-white bg-black font-mono text-xs text-white shadow-[4px_4px_0_rgba(255,255,255,0.35)]">
				<button
					type="button"
					onClick={() => onCycle(-1)}
					aria-label="previous variant"
					className="px-3 hover:bg-white hover:text-black"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<span className="flex min-w-[14rem] items-center gap-2 border-x-2 border-white/40 px-4 py-3">
					<strong className="text-[#c6ff3d]">{variant}</strong>
					<span className="truncate">{names[variant]}</span>
				</span>
				<button
					type="button"
					onClick={() => onCycle(1)}
					aria-label="next variant"
					className="px-3 hover:bg-white hover:text-black"
				>
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}
