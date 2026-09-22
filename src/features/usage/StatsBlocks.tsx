import { vendorModelId } from "@aistack/pricing";
import type { ReactNode } from "react";
import HoverCard from "@/components/ui/hover-card";
import {
	ActivityChart,
	ActivityMarginals,
	HarnessPieChart,
	LinesChart,
	SegmentChart,
	ShareChart,
	type StatsSegment,
	WaffleChart,
} from "@/features/charts";
import { fmtShare, fmtTokens, fmtUSD } from "@/features/measured/copy";
import { MetricBlock } from "@/features/measured/MetricBlock";
import { ModelShareRows } from "@/features/measured/ModelShareRows";
import { fmtPercent, MEASURED_TIME_NOTE } from "@/features/workflow/copy";
import { cn } from "@/lib/utils";
import { CONTEXT_PAINT, type ContextHarness, waffleCells } from "./context";
import type { UsageRead, UsageReading } from "./copy";
import { EfficiencyBlock, type EfficiencyRead } from "./EfficiencyBlock";
import { harnessLabel } from "./HarnessShareRows";
import {
	activityData,
	countLabel,
	gitDays,
	harnessSegments,
	type Inventory,
	languageSegments,
	medianLabel,
	phaseSegments,
	type StatsRead,
} from "./stats";
import { type ModelTrail, usageTrails } from "./trails";

export function Block({
	title,
	note,
	figure,
	children,
}: {
	title: string;
	note?: ReactNode;
	figure?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="min-w-0" aria-label={title}>
			<header className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 md:mb-4">
				<h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-lime">
					{title}
				</h3>
				{note && (
					<span className="font-mono text-[11px] text-fg-muted">{note}</span>
				)}
				{figure && (
					<span className="ml-auto font-mono text-xs font-bold text-fg-primary md:text-sm">
						{figure}
					</span>
				)}
			</header>
			{children}
		</section>
	);
}
export function More({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<details className="group mt-3">
			<summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-2 border border-stroke-subtle px-2 py-1 font-mono text-[11px] text-fg-muted [&::-webkit-details-marker]:hidden">
				<span className="group-open:hidden">+</span>
				<span className="hidden group-open:inline">-</span>
				{label}
			</summary>
			<div className="mt-3">{children}</div>
		</details>
	);
}
function Headline({
	usage,
	current,
}: {
	usage: UsageRead;
	current: UsageReading;
}) {
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
	const cost = current.cost?.pricingTables.length ? current.cost : null;
	return (
		<>
			<div className="hidden md:block">
				<MetricBlock
					tokens={current.totalTokens}
					inputTokens={parts[0].value}
					outputTokens={parts[1].value}
					cacheReadTokens={parts[2].value}
					usd={cost?.usd ?? null}
					pricedShare={cost?.pricedShare ?? null}
					pricingTables={cost?.pricingTables ?? []}
					windowDays={30}
					trail={usage.series.map((p) => ({
						at: Date.parse(p.date),
						value: p.tokens,
					}))}
				/>
			</div>
			<div className="border border-stroke-subtle p-3 md:hidden">
				<p className="mb-3 font-mono text-[10px] text-fg-muted">
					Tokens processed · last 30 days
				</p>
				<div className="grid grid-cols-3 gap-2">
					{parts.map((p) => (
						<div key={p.label} className="min-w-0">
							<p className="font-mono text-xl font-black leading-none text-fg-primary">
								{fmtTokens(p.value)}
							</p>
							<p className="mt-2 font-mono text-[10px] text-accent-lime">
								{p.label}{" "}
								<span className="text-fg-muted">
									{fmtShare(
										current.totalTokens > 0 ? p.value / current.totalTokens : 0,
									)}
								</span>
							</p>
						</div>
					))}
				</div>
				{cost && (
					<details className="mt-3 border-t border-stroke-subtle pt-2">
						<summary className="flex min-h-9 cursor-pointer list-none flex-wrap items-baseline justify-between gap-1 font-mono [&::-webkit-details-marker]:hidden">
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
		</>
	);
}
function Tile({
	label,
	value,
	meter,
	current,
	previous,
	prior,
}: {
	label: string;
	value: string;
	meter?: number;
	current?: number;
	previous?: number;
	prior?: string;
}) {
	const change =
		current !== undefined && previous !== undefined && previous > 0
			? (current - previous) / previous
			: null;
	return (
		<div
			className="flex min-w-0 flex-col gap-1.5 border border-stroke-subtle bg-bg-panel p-2 md:p-3"
			title={label === "median session" ? MEASURED_TIME_NOTE : undefined}
		>
			<span className="font-mono text-lg font-black leading-tight text-fg-primary sm:text-xl lg:text-[28px]">
				{value}
			</span>
			{meter !== undefined && (
				<ShareChart share={meter} label={`${label}: ${value}`} height={4} />
			)}
			<span className="font-mono text-[10px] text-fg-muted md:text-[11px]">
				{label}
			</span>
			{prior ? (
				<span className="font-mono text-[10px] text-fg-muted">was {prior}</span>
			) : change !== null ? (
				<span
					className={cn(
						"font-mono text-[10px]",
						change > 0 ? "text-accent-lime" : "text-fg-muted",
					)}
					title="vs the 30 days before"
				>
					{Math.round(Math.abs(change) * 100) === 0
						? "±0%"
						: `${change > 0 ? "▲" : "▼"} ${Math.round(Math.abs(change) * 100)}%`}
				</span>
			) : previous === 0 ? (
				<span className="font-mono text-[10px] text-fg-muted">was 0</span>
			) : null}
		</div>
	);
}
function Tiles({
	current,
	previous,
	stats,
}: {
	current: UsageReading | null;
	previous: UsageReading | null;
	stats: StatsRead | null;
}) {
	const median = stats?.medianSession.current;
	if (!current && !median) return null;
	return (
		<div className="grid grid-cols-3 gap-2 md:flex md:gap-3 [&>div]:md:flex-1">
			{current && (
				<>
					<Tile
						label="active days"
						value={`${current.activeDays}/30`}
						meter={current.activeDays / 30}
						current={current.activeDays}
						previous={previous?.activeDays}
					/>
					<Tile
						label="sessions"
						value={current.sessions.toLocaleString("en-US")}
						current={current.sessions}
						previous={previous?.sessions}
					/>
					{current.totalTokens > 0 && (
						<Tile
							label="cache hits"
							value={fmtPercent(current.cacheHitShare)}
							meter={current.cacheHitShare}
							current={current.cacheHitShare}
							previous={
								previous && previous.totalTokens > 0
									? previous.cacheHitShare
									: undefined
							}
						/>
					)}
					{current.totalTokens > 0 && (
						<Tile
							label="run by subagents"
							value={fmtPercent(current.subagentShare)}
							meter={current.subagentShare}
							current={current.subagentShare}
							previous={
								previous && previous.totalTokens > 0
									? previous.subagentShare
									: undefined
							}
						/>
					)}
				</>
			)}
			{median && (
				<Tile
					label="median session"
					value={medianLabel(median)}
					prior={
						stats?.medianSession.previous
							? medianLabel(stats.medianSession.previous)
							: undefined
					}
				/>
			)}
		</div>
	);
}
function ThinModels({ trails }: { trails: readonly ModelTrail[] }) {
	return (
		<ul className="space-y-2.5">
			{trails.map((t) => (
				<li key={t.id}>
					<p className="flex items-baseline gap-2">
						<span className="min-w-0 flex-1 break-words text-sm text-fg-primary">
							{t.label}
						</span>
						<b className="shrink-0 font-mono text-sm text-fg-primary">
							{fmtShare(t.share)}
						</b>
					</p>
					<ShareChart
						share={t.share}
						previous={t.moved ? t.first : null}
						paint={t.paint}
						label={`${t.label}: ${fmtShare(t.share)}`}
					/>
				</li>
			))}
		</ul>
	);
}
function Routing({
	stats,
	trails,
}: {
	stats: StatsRead;
	trails: readonly ModelTrail[];
}) {
	const rows = stats.routing?.subagents.filter((r) => r.tokens > 0) ?? [];
	const total = rows.reduce((n, r) => n + r.tokens, 0);
	if (!total) return null;
	return (
		<ul className="space-y-2">
			{[...rows]
				.sort((a, b) => b.tokens - a.tokens)
				.map((r) => {
					const t = trails.find((t) => t.id === r.model);
					const paint =
						t?.paint ??
						trails.find((t) => t.id === "__rest")?.paint ??
						"var(--fg-muted)";
					return (
						<li
							key={r.model}
							className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 md:grid-cols-[184px_minmax(0,1fr)_56px_48px]"
						>
							<span
								className="min-w-0 break-words text-xs text-fg-muted md:truncate md:pl-6"
								title={t?.label ?? vendorModelId(r.model)}
							>
								{t?.label ?? vendorModelId(r.model)}
							</span>
							<span className="col-start-2 row-start-1 shrink-0 text-right font-mono text-xs text-fg-primary md:col-start-3">
								{fmtShare(r.tokens / total)}
							</span>
							<div className="col-span-2 md:col-span-1 md:col-start-2 md:row-start-1">
								<ShareChart
									share={r.tokens / total}
									paint={paint}
									label={`${r.model}: ${fmtTokens(r.tokens)} subagent tokens`}
									height={14}
								/>
							</div>
						</li>
					);
				})}
		</ul>
	);
}
function Models({
	usage,
	stats,
}: {
	usage: UsageRead;
	stats: StatsRead | null;
}) {
	const current = usage.current;
	if (!current) return null;
	const previousAt = Date.parse(usage.from) - 30 * 86400000;
	const trails = usageTrails(
		current.models,
		usage.previous?.models ?? null,
		Date.parse(usage.from),
		previousAt,
	);
	const routing = stats?.routing?.subagents.some((r) => r.tokens > 0);
	if (!trails.length && !routing) return null;
	return (
		<Block title="Models" note={`${trails.length} measured`}>
			<div className="hidden md:block">
				<ModelShareRows
					trails={trails}
					firstAt={usage.previous ? previousAt : null}
				/>
				{routing && stats && (
					<div className="mt-5">
						<p className="mb-3 font-mono text-[11px] text-fg-muted">
							run by subagents{" "}
							<b className="text-fg-primary">
								{fmtPercent(current.subagentShare)}
							</b>
						</p>
						<Routing stats={stats} trails={trails} />
					</div>
				)}
			</div>
			<div className="md:hidden">
				<ThinModels trails={trails.slice(0, 4)} />
				{trails.length > 4 && (
					<More
						label={`${trails.length - 4} more ${trails.length === 5 ? "model" : "models"}`}
					>
						<ThinModels trails={trails.slice(4)} />
					</More>
				)}
				{routing && stats && (
					<More
						label={`Subagent routing · ${fmtPercent(current.subagentShare)}`}
					>
						<Routing stats={stats} trails={trails} />
					</More>
				)}
			</div>
		</Block>
	);
}
function Legend({ segments }: { segments: readonly StatsSegment[] }) {
	return (
		<ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-fg-muted">
			{segments.map((s) => (
				<li
					key={s.key}
					className="inline-flex max-w-full items-baseline gap-1.5"
				>
					<i
						className="size-2 shrink-0 self-center"
						style={{ background: s.paint }}
					/>
					<span className="min-w-0 break-words">{s.label}</span>
					<b className="shrink-0 text-fg-primary">
						{s.share > 0 && s.share < 0.005 ? "<1%" : fmtPercent(s.share)}
					</b>
				</li>
			))}
		</ul>
	);
}
function Context({ h }: { h: ContextHarness }) {
	const colors = {
		...CONTEXT_PAINT,
		usualChat:
			h.breakdownAvailable === false
				? "var(--accent-lime)"
				: CONTEXT_PAINT.usualChat,
		longChat: "transparent",
		free: "var(--bg-panel-muted)",
	};
	const label = `${harnessLabel(h.harness)}: typical ${h.retainedCallsOnly ? "retained " : ""}call ${fmtTokens(h.medianCall)}${h.window ? ` of ${fmtTokens(h.window)} window` : ""}`;
	return (
		<div>
			<p className="mb-2 flex flex-wrap items-baseline gap-2">
				<b className="text-sm text-fg-primary">{harnessLabel(h.harness)}</b>
				<b className="ml-auto font-mono text-lg text-fg-primary">
					{h.window
						? fmtPercent(h.medianCall / h.window)
						: fmtTokens(h.medianCall)}
				</b>
				{h.window && (
					<span className="font-mono text-[10px] text-fg-muted">
						{fmtTokens(h.medianCall)} / {fmtTokens(h.window)}
					</span>
				)}
			</p>
			{h.retainedCallsOnly && (
				<p className="mb-1 font-mono text-[10px] text-fg-muted">
					retained calls
				</p>
			)}
			{h.breakdownAvailable === false && (
				<p className="mb-1 font-mono text-[10px] text-fg-muted">
					call breakdown unavailable
				</p>
			)}
			{h.window !== null && (
				<>
					<div className="md:hidden">
						<WaffleChart
							cells={waffleCells(h, h.window)}
							colors={colors}
							columns={40}
							label={label}
						/>
					</div>
					<div className="hidden md:block">
						<WaffleChart
							cells={waffleCells(h, h.window)}
							colors={colors}
							columns={20}
							label={label}
						/>
					</div>
				</>
			)}
		</div>
	);
}
function InventoryBlock({
	title,
	inventory,
	counts = false,
}: {
	title: string;
	inventory: Inventory;
	counts?: boolean;
}) {
	if (!inventory.atoms.length) return null;
	const atoms = inventory.atoms;
	const measured = atoms.filter((a) => a.callShare !== null && a.callShare > 0);
	// One call-count series, with the approved rank shading.
	const steps = [100, 78, 60, 46, 36, 28];
	const paint = (i: number) =>
		`color-mix(in oklab, var(--accent-lime) ${steps[Math.min(i, steps.length - 1)]}%, var(--bg-panel))`;
	const segments = measured.map((a) => ({
		key: a.name,
		label: a.name,
		share: a.callShare ?? 0,
		paint: paint(atoms.indexOf(a)),
	}));
	const chips = (
		<ul className="flex flex-wrap gap-1.5">
			{atoms.map((a, i) => (
				<li
					key={a.name}
					className={cn(
						"inline-flex max-w-full flex-wrap items-baseline gap-x-2 px-2 py-1 text-[13px] font-bold",
						i < 3 ? "text-accent-lime-contrast" : "text-fg-primary",
					)}
					style={{ background: paint(i) }}
				>
					<span className="min-w-0 break-all">{a.name}</span>
					<b className="font-mono text-xs">
						{counts
							? countLabel(a)
							: a.callShare !== null
								? fmtPercent(a.callShare)
								: countLabel(a)}
					</b>
				</li>
			))}
		</ul>
	);
	return (
		<Block
			title={title}
			note={atoms.length ? `${atoms.length} used` : undefined}
		>
			<div className="md:hidden">{chips}</div>
			<div className="hidden md:block">
				{counts ? (
					<ul className="grid grid-cols-3 gap-x-6 gap-y-5 lg:grid-cols-4">
						{atoms.map((a, i) => (
							<li key={a.name}>
								<b className="font-mono text-2xl font-black text-fg-primary">
									{countLabel(a) ??
										(a.callShare !== null ? fmtPercent(a.callShare) : "")}
								</b>
								{a.callShare !== null && (
									<ShareChart
										share={a.callShare}
										label={`${a.name}: ${fmtPercent(a.callShare)}`}
										paint={paint(i)}
										height={3}
									/>
								)}
								<p className="mt-1 break-all text-sm text-fg-primary">
									{a.name}
								</p>
							</li>
						))}
					</ul>
				) : segments.length ? (
					<>
						<div className="relative">
							<SegmentChart
								segments={segments}
								label={`${title} share of calls`}
								height={64}
							/>
							<div className="pointer-events-none absolute inset-0 flex">
								{segments.map((s) => (
									<div
										key={s.key}
										style={{ width: `${s.share * 100}%` }}
										className="min-w-0 overflow-hidden border-r-2 border-bg-canvas"
									>
										{s.share >= 0.09 && (
											<div
												className={cn(
													"flex h-full flex-col justify-between px-2 py-2",
													segments.indexOf(s) < 3
														? "text-accent-lime-contrast"
														: "text-fg-primary",
												)}
											>
												<p className="truncate text-xs font-semibold">
													{s.label}
												</p>
												<b className="font-mono text-lg">
													{s.share > 0 && s.share < 0.005
														? "<1%"
														: fmtPercent(s.share)}
												</b>
											</div>
										)}
									</div>
								))}
							</div>
						</div>
						<p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-fg-muted">
							{atoms
								.filter((a) => a.callShare === null || a.callShare < 0.09)
								.map((a) => (
									<span key={a.name} className="break-all">
										{a.name}{" "}
										<b className="text-fg-primary">
											{a.callShare !== null
												? fmtPercent(a.callShare)
												: countLabel(a)}
										</b>
									</span>
								))}
						</p>
					</>
				) : (
					chips
				)}
			</div>
			{inventory.withheldNames > 0 && (
				<p className="mt-2 font-mono text-[10px] text-fg-muted">
					{inventory.withheldNames} names withheld across sources
				</p>
			)}
		</Block>
	);
}
function Phases({ stats }: { stats: StatsRead }) {
	const segments = phaseSegments(stats.phaseShare);
	if (!segments.length) return null;
	const strip = (
		<>
			<SegmentChart
				segments={segments}
				label="Share of measured session time"
				height={24}
			/>
			<Legend segments={segments} />
		</>
	);
	return (
		<Block title="Where the time goes">
			<div className="md:hidden">{strip}</div>
			<div className="hidden md:block">
				{stats.phaseTracks ? (
					<HoverCard
						mode="wrapper"
						position="above"
						width={360}
						height="auto"
						className="w-full"
						renderContent={() => (
							<div className="space-y-4 p-4">
								<p className="text-xs text-fg-muted">{MEASURED_TIME_NOTE}</p>
								{stats.phaseTracks?.tracks.map((t) => (
									<div key={t.id}>
										<p className="mb-2 font-mono text-xs text-fg-primary">
											{t.id} sessions · {t.sessions}
										</p>
										<SegmentChart
											segments={phaseSegments(t.phaseShare)}
											label={`${t.id} sessions`}
										/>
										<Legend segments={phaseSegments(t.phaseShare)} />
									</div>
								))}
							</div>
						)}
					>
						{strip}
					</HoverCard>
				) : (
					strip
				)}
			</div>
		</Block>
	);
}
export function StatsBlocks({
	usage,
	stats,
	efficiency = null,
}: {
	usage: UsageRead | null;
	stats: StatsRead | null;
	/** The owner's scorecard. Null for every other viewer and for an old wire. */
	efficiency?: EfficiencyRead | null;
}) {
	const current = usage?.hasDays ? usage.current : null;
	const previous = usage?.previous ?? null;
	const harnesses = current ? harnessSegments(current, previous) : [];
	const showHarnesses = harnesses.length > 1;
	const context = stats?.context;
	const activity = stats ? activityData(stats) : null;
	const languages = stats?.git ? languageSegments(stats.git) : [];
	return (
		<div className="space-y-8 md:space-y-12">
			{usage && current && <Headline usage={usage} current={current} />}
			<Tiles current={current} previous={previous} stats={stats} />
			{efficiency && <EfficiencyBlock read={efficiency} />}
			{usage && <Models usage={usage} stats={stats} />}
			{(showHarnesses || context) && (
				<div
					className={cn(
						"grid gap-x-10 gap-y-8",
						showHarnesses &&
							context &&
							"lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]",
					)}
				>
					{showHarnesses && (
						<Block
							title="Harnesses"
							figure={`${current?.sessions.toLocaleString("en-US")} sessions`}
						>
							<div className="md:hidden">
								<SegmentChart
									segments={harnesses}
									label="Harness token shares"
								/>
								<Legend segments={harnesses} />
							</div>
							<div className="hidden md:flex md:items-center md:gap-5">
								<HarnessPieChart segments={harnesses} />
								<div className="min-w-0 flex-1">
									<ul className="space-y-2">
										{harnesses.map((h) => (
											<li
												key={h.key}
												className="flex flex-wrap items-baseline gap-2"
											>
												<i
													className="size-2 shrink-0 self-center"
													style={{ background: h.paint }}
												/>
												<span className="text-sm text-fg-primary">
													{h.label}
												</span>
												<b className="ml-auto font-mono text-sm text-fg-primary">
													{fmtShare(h.share)}
												</b>
												<span className="font-mono text-[10px] text-fg-muted">
													{h.sessions.toLocaleString("en-US")} ses
												</span>
											</li>
										))}
									</ul>
									{harnesses.some((h) => h.previous !== null) && (
										<p className="mt-3 font-mono text-[10px] text-fg-muted">
											outer ring: the 30 days before
										</p>
									)}
								</div>
							</div>
						</Block>
					)}
					{context && (
						<Block title="Context per call">
							<div className="grid gap-5 md:grid-cols-2">
								{context.harnesses.map((h) => (
									<Context key={h.harness} h={h} />
								))}
							</div>
							<p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-fg-muted">
								{Object.entries(CONTEXT_PAINT).map(([label, paint]) => (
									<span key={label} className="inline-flex items-center gap-1">
										<i className="size-2" style={{ background: paint }} />
										{label === "usualChat" ? "usual chat" : label}
									</span>
								))}
								<span>□ 1 in 10 chats</span>
							</p>
						</Block>
					)}
				</div>
			)}
			{stats && (
				<>
					<InventoryBlock title="Skills" inventory={stats.inventory.skills} />
					<InventoryBlock
						title="MCP servers"
						inventory={stats.inventory.mcpServers}
					/>
					<InventoryBlock
						title="Subagent types"
						inventory={stats.inventory.subagents}
						counts
					/>
				</>
			)}
			{activity?.cells.some((d) => d.some((n) => n > 0)) && (
				<Block
					title="The week"
					note={stats?.utcOffsetMinutes === null ? "UTC" : "local time"}
					figure={current ? `${current.activeDays}/30 days` : undefined}
				>
					<div className="hidden md:block">
						<ActivityChart {...activity} />
					</div>
					<div className="md:hidden">
						<ActivityMarginals cells={activity.cells} />
						<More label="every hour">
							<ActivityChart {...activity} portrait />
						</More>
					</div>
				</Block>
			)}
			{stats?.git && stats.git.additions + stats.git.removals > 0 && (
				<Block
					title="Lines changed"
					figure={
						<>
							<span style={{ color: "var(--chart-1)" }}>
								+{stats.git.additions.toLocaleString("en-US")}
							</span>{" "}
							<span style={{ color: "var(--chart-3)" }}>
								-{stats.git.removals.toLocaleString("en-US")}
							</span>
						</>
					}
				>
					<LinesChart days={gitDays(stats)} />
					<p className="mt-1 flex justify-between font-mono text-[10px] text-fg-muted">
						<span>{stats.window.from}</span>
						<span>{stats.window.to}</span>
					</p>
				</Block>
			)}
			{stats &&
				(phaseSegments(stats.phaseShare).length > 0 ||
					languages.length > 0) && (
					<div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
						<Phases stats={stats} />
						{languages.length > 0 && (
							<Block title="Languages">
								<SegmentChart
									segments={languages}
									label="Share of changed lines by language"
									height={6}
								/>
								<Legend segments={languages} />
								{(stats.git?.withheldExtensionLines ?? 0) > 0 && (
									<p className="mt-2 font-mono text-[10px] text-fg-muted">
										some extensions withheld
									</p>
								)}
							</Block>
						)}
					</div>
				)}
		</div>
	);
}
