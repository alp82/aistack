// PROTOTYPE. THROWAWAY. Ticket #303, round three.
//
// The owner's idea after round two: take G (the receipt), keep the token
// headline and the model rows at the top, and move the "by harness" rows and
// the five stat boxes DOWN into the batch, where they get grouped with the
// workflow rows. The groups are one row of tabs under the top block.
//
// Five variations, each with a different grouping AND a different display:
//
//   I  By topic (Time, Code, Models, Kit, Sessions), receipt display: every
//      item printed in full, one column.
//   J  By question (When? What? Which models? What helped? How much?), card
//      grid display: figure-first cards, two columns, bodies inside.
//   K  By source (Session logs, Git, Inventory, Billing), table display:
//      dense rows that expand in place.
//   L  By shape (Numbers, Shares, Timelines), wall display: a stat grid, then
//      a bar list, then a chart wall, each in the shape's own idiom.
//   M  Two tabs (Machine, Human), spread display: full-width bands with the
//      figure on the left and the body on the right.
//
// The harness rows and the stat boxes travel as ITEMS alongside the workflow
// rows, so every grouping can place them.

import { type ReactNode, useState } from "react";
import {
	fmtTokens,
	KICKER,
	lastCheckLine,
	MEASURED_ANCHOR,
	MIX_KICKER,
	MONO_LABEL,
	notchNote,
	TITLE,
	totalUSD,
} from "@/features/measured/copy";
import {
	modelTrails,
	tokenDelta,
	tokenTrail,
} from "@/features/measured/history";
import { MetricBlock } from "@/features/measured/MetricBlock";
import { ModelShareRows } from "@/features/measured/ModelShareRows";
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { RowBody } from "@/features/workflow/components";
import { rowHead } from "@/features/workflow/heads";
import { cn } from "@/lib/utils";
import { HarnessShareRows } from "./MoreVariants";
import {
	ControlBar,
	Delta,
	type Proto,
	WorkflowEmpty,
} from "./UsageMergePrototype";

// ---------------------------------------------------------------------------
// The top block: headline and model rows only.
// ---------------------------------------------------------------------------

function TopReading({ p }: { p: Proto }) {
	const s = p.snapshot;
	if (!s) return null;
	const points = p.points;
	const trails = modelTrails(s.models, points);
	const firstAt = points.length > 0 ? points[0].at : null;
	const sinceLast = lastCheckLine(tokenDelta(points), fmtTokens);
	const notMeasured = p.window !== "30d";
	return (
		<div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
			<div>
				{notMeasured ? (
					<div className="border border-dashed border-stroke-strong px-4 py-6">
						<p className="font-mono text-3xl font-black text-fg-muted">
							not measured
						</p>
						<p className="mt-1 text-sm text-fg-muted">
							Usage for {p.window} arrives with per-day rows.
						</p>
					</div>
				) : (
					<>
						<MetricBlock
							tokens={s.activity.totalTokens}
							usd={totalUSD(s)}
							windowDays={s.window.days}
							trail={tokenTrail(points)}
						/>
						<p className="mt-2 px-3">
							<Delta value={s.activity.totalTokens} window={p.window} />
						</p>
						{sinceLast && (
							<p className="mt-3 px-3">
								<span
									className={cn(
										MONO_LABEL,
										"inline-flex items-center border border-stroke-subtle px-1.5 py-0.5 text-[10px] tracking-wider text-fg-muted",
									)}
								>
									{sinceLast}
								</span>
							</p>
						)}
					</>
				)}
			</div>
			<div className={cn(notMeasured && "opacity-40")}>
				<div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
					<p className={cn(MONO_LABEL, "text-accent-lime")}>{MIX_KICKER}</p>
					{firstAt !== null && points.length > 1 && (
						<p className="font-mono text-[11px] text-fg-muted">
							{notchNote(firstAt)}
						</p>
					)}
				</div>
				<ModelShareRows trails={trails} firstAt={firstAt} />
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Items: workflow rows, the five stat boxes and the harness rows, one shape.
// ---------------------------------------------------------------------------

export type Item = {
	id: string;
	name: string;
	figure: string;
	caption: string;
	/** A delta seed. Null prints no delta (inventory-like things). */
	delta: number | null;
	picture: (wide: boolean) => ReactNode;
	/** The body, or null for a flat item. */
	body: (() => ReactNode) | null;
	/** Which pictures fit a "shares" or "timelines" wall. */
	shape: "number" | "share" | "timeline";
};

const STAT_IDS = [
	"stat:sessions",
	"stat:active-days",
	"stat:projects",
	"stat:cache-hits",
	"stat:subagents",
] as const;

const SHAPES: Record<string, Item["shape"]> = {
	"component:activity-heatmap": "timeline",
	"component:start-hours": "timeline",
	"metric:late-night-commits": "number",
	"component:phase-playbook": "timeline",
	"component:git-ledger": "timeline",
	"component:coding-languages": "share",
	"component:kit": "share",
	"component:model-routing": "share",
	"component:delegation": "share",
	"metric:effort-levels": "share",
	"metric:thinking-share": "share",
	"metric:turn-duration": "timeline",
	"metric:question-back-share": "number",
	"metric:web-searches-per-active-day": "number",
	"metric:parallel-projects": "number",
};

function buildItems(p: Proto, stackToolSlugs: string[]): Map<string, Item> {
	const items = new Map<string, Item>();
	const view = p.view;
	if (view && view.window.days > 0) {
		for (const row of view.rows) {
			const head = rowHead(row, view);
			items.set(row.rowId, {
				id: row.rowId,
				name: row.name,
				figure: head.figure,
				caption: head.caption,
				delta: row.value,
				picture: head.picture,
				body: row.flat ? null : () => <RowBody rowId={row.rowId} view={view} />,
				shape: SHAPES[row.rowId] ?? "number",
			});
		}
	}
	const s = p.snapshot;
	if (s && p.window === "30d") {
		const stat = (
			id: string,
			name: string,
			figure: string,
			caption: string,
			delta: number | null,
		) =>
			items.set(id, {
				id,
				name,
				figure,
				caption,
				delta,
				picture: () => null,
				body: null,
				shape: "number",
			});
		stat(
			"stat:sessions",
			"Sessions",
			s.activity.sessions.toLocaleString("en-US"),
			"sessions in the window",
			s.activity.sessions,
		);
		stat(
			"stat:active-days",
			"Active days",
			`${s.activity.activeDays.value} of ${s.window.days}`,
			"days with at least one session",
			s.activity.activeDays.value,
		);
		stat(
			"stat:projects",
			"Project workspaces",
			s.activity.projects.value.toLocaleString("en-US"),
			"distinct workspaces touched",
			s.activity.projects.value,
		);
		stat(
			"stat:cache-hits",
			"Cache hits",
			`${Math.round(s.activity.cacheHitShare * 100)}%`,
			"of input tokens served from cache",
			s.activity.cacheHitShare * 1000,
		);
		stat(
			"stat:subagents",
			"Run by subagents",
			`${Math.round(s.activity.subagentShare * 100)}%`,
			"of tokens spent by subagents",
			s.activity.subagentShare * 1000,
		);
		const harnessCount = new Set(s.harnesses.map((h) => h.harness.name)).size;
		items.set("harness", {
			id: "harness",
			name: "By harness",
			figure: String(harnessCount),
			caption: harnessCount === 1 ? "harness measured" : "harnesses measured",
			delta: null,
			picture: () => null,
			body: () => (
				<HarnessShareRows snapshot={s} stackToolSlugs={stackToolSlugs} />
			),
			shape: "share",
		});
	}
	return items;
}

export type Group = { id: string; label: string; ids: readonly string[] };

function pick(items: Map<string, Item>, ids: readonly string[]): Item[] {
	return ids.map((id) => items.get(id)).filter((i): i is Item => !!i);
}

function Tabs({
	groups,
	items,
	value,
	onChange,
}: {
	groups: Group[];
	items: Map<string, Item>;
	value: string;
	onChange: (id: string) => void;
}) {
	return (
		<div
			role="tablist"
			className="mt-12 flex flex-wrap border-b border-stroke-strong"
		>
			{groups.map((g) => {
				const n = pick(items, g.ids).length;
				const on = value === g.id;
				return (
					<button
						key={g.id}
						type="button"
						role="tab"
						aria-selected={on}
						onClick={() => onChange(g.id)}
						className={cn(
							"-mb-px flex items-baseline gap-2 border-b-2 px-4 py-3 font-mono text-xs uppercase tracking-widest",
							on
								? "border-accent-lime text-fg-primary"
								: "border-transparent text-fg-muted hover:text-fg-primary",
						)}
					>
						{g.label}
						<span className="text-[10px] text-fg-muted">{n}</span>
					</button>
				);
			})}
		</div>
	);
}

export type VariantProps = {
	index: number;
	p: Proto;
	stackToolSlugs: string[];
};

export function Shell({
	index,
	p,
	stackToolSlugs,
	groups,
	children,
}: VariantProps & {
	groups: Group[];
	children: (items: Item[], group: Group, all: Map<string, Item>) => ReactNode;
}) {
	const [tab, setTab] = useState(groups[0].id);
	const items = buildItems(p, stackToolSlugs);
	const group = groups.find((g) => g.id === tab) ?? groups[0];
	const ready = !!p.view && p.view.window.days > 0;
	return (
		<Section index={index} id={MEASURED_ANCHOR}>
			<SectionHeader
				index={String(index).padStart(2, "0")}
				kicker={KICKER}
				title={TITLE}
				metaAlwaysVisible
				meta={<ControlBar p={p} />}
			/>
			<TopReading p={p} />
			<Tabs groups={groups} items={items} value={tab} onChange={setTab} />
			<div className="mt-8">
				{ready || items.size > 0 ? (
					children(pick(items, group.ids), group, items)
				) : (
					<WorkflowEmpty p={p} />
				)}
			</div>
		</Section>
	);
}

// ---------------------------------------------------------------------------
// I: by topic, receipt display.
// ---------------------------------------------------------------------------

export const TOPIC: Group[] = [
	{
		id: "time",
		label: "Time",
		ids: [
			"stat:active-days",
			"component:activity-heatmap",
			"component:start-hours",
			"metric:late-night-commits",
			"component:phase-playbook",
			"metric:turn-duration",
		],
	},
	{
		id: "code",
		label: "Code",
		ids: [
			"stat:projects",
			"component:git-ledger",
			"component:coding-languages",
			"metric:parallel-projects",
		],
	},
	{
		id: "models",
		label: "Models",
		ids: [
			"harness",
			"stat:cache-hits",
			"component:model-routing",
			"metric:effort-levels",
			"metric:thinking-share",
		],
	},
	{
		id: "kit",
		label: "Kit",
		ids: [
			"stat:subagents",
			"component:kit",
			"component:delegation",
			"metric:web-searches-per-active-day",
		],
	},
	{
		id: "sessions",
		label: "Sessions",
		ids: ["stat:sessions", "metric:question-back-share"],
	},
];

export const VariantI = {
	name: "By topic · receipt",
	Component: function I(props: VariantProps) {
		return (
			<Shell {...props} groups={TOPIC}>
				{(items) => (
					<div className="mx-auto max-w-3xl">
						{items.map((it) => (
							<article
								key={it.id}
								className="border-b border-dashed border-stroke-subtle py-6"
							>
								<div className="flex flex-wrap items-baseline justify-between gap-x-6">
									<h3 className={cn(MONO_LABEL, "text-fg-muted")}>{it.name}</h3>
									{it.delta !== null && (
										<Delta value={it.delta} window={props.p.window} />
									)}
								</div>
								<p className="mt-1 flex items-baseline gap-3">
									<span className="font-mono text-3xl font-black text-accent-lime">
										{it.figure}
									</span>
									<span className="text-sm text-fg-secondary">
										{it.caption}
									</span>
								</p>
								{it.body && <div className="mt-4">{it.body()}</div>}
							</article>
						))}
					</div>
				)}
			</Shell>
		);
	},
};

// ---------------------------------------------------------------------------
// J: by question, card grid display.
// ---------------------------------------------------------------------------

const QUESTION: Group[] = [
	{
		id: "when",
		label: "When?",
		ids: [
			"component:activity-heatmap",
			"component:start-hours",
			"metric:late-night-commits",
			"stat:active-days",
		],
	},
	{
		id: "what",
		label: "What got built?",
		ids: [
			"component:git-ledger",
			"component:coding-languages",
			"stat:projects",
			"metric:parallel-projects",
		],
	},
	{
		id: "which",
		label: "Which models?",
		ids: [
			"component:model-routing",
			"harness",
			"metric:effort-levels",
			"metric:thinking-share",
		],
	},
	{
		id: "help",
		label: "What helped?",
		ids: [
			"component:kit",
			"component:delegation",
			"stat:subagents",
			"metric:web-searches-per-active-day",
			"metric:question-back-share",
		],
	},
	{
		id: "howmuch",
		label: "How much?",
		ids: [
			"stat:sessions",
			"stat:cache-hits",
			"component:phase-playbook",
			"metric:turn-duration",
		],
	},
];

export const VariantJ = {
	name: "By question · card grid",
	Component: function J(props: VariantProps) {
		return (
			<Shell {...props} groups={QUESTION}>
				{(items) => (
					<div className="grid gap-px border border-stroke-subtle bg-stroke-subtle md:grid-cols-2">
						{items.map((it) => (
							<div key={it.id} className="bg-bg-canvas p-5">
								<p className={cn(MONO_LABEL, "text-fg-muted")}>{it.name}</p>
								<p className="mt-2 font-mono text-[40px] font-black leading-none text-accent-lime">
									{it.figure}
								</p>
								<p className="mt-2 text-sm text-fg-secondary">
									{it.caption}{" "}
									{it.delta !== null && (
										<Delta value={it.delta} window={props.p.window} />
									)}
								</p>
								{it.body ? (
									<div className="mt-5 border-t border-stroke-subtle pt-4">
										{it.body()}
									</div>
								) : (
									<div className="mt-5">{it.picture(true)}</div>
								)}
							</div>
						))}
					</div>
				)}
			</Shell>
		);
	},
};

// ---------------------------------------------------------------------------
// K: by source, table display with expand in place.
// ---------------------------------------------------------------------------

const SOURCE: Group[] = [
	{
		id: "logs",
		label: "Session logs",
		ids: [
			"stat:sessions",
			"stat:active-days",
			"component:activity-heatmap",
			"component:start-hours",
			"component:phase-playbook",
			"metric:turn-duration",
			"metric:question-back-share",
		],
	},
	{
		id: "git",
		label: "Git",
		ids: [
			"component:git-ledger",
			"component:coding-languages",
			"metric:late-night-commits",
			"stat:projects",
			"metric:parallel-projects",
		],
	},
	{
		id: "inventory",
		label: "Inventory",
		ids: [
			"component:kit",
			"component:delegation",
			"stat:subagents",
			"metric:web-searches-per-active-day",
		],
	},
	{
		id: "billing",
		label: "Billing",
		ids: [
			"harness",
			"component:model-routing",
			"metric:effort-levels",
			"metric:thinking-share",
			"stat:cache-hits",
		],
	},
];

export const VariantK = {
	name: "By source · table, expand in place",
	Component: function K(props: VariantProps) {
		const [open, setOpen] = useState<string | null>(null);
		return (
			<Shell {...props} groups={SOURCE}>
				{(items) => (
					<div className="divide-y divide-stroke-subtle border-y border-stroke-subtle">
						{items.map((it) => {
							const on = open === it.id;
							const Tag = it.body ? "button" : "div";
							return (
								<div key={it.id}>
									<Tag
										{...(it.body
											? {
													type: "button" as const,
													onClick: () => setOpen(on ? null : it.id),
													"aria-expanded": on,
												}
											: {})}
										className="grid w-full grid-cols-[220px_110px_1fr_76px_20px] items-center gap-x-7 py-3 text-left"
									>
										<span className="text-sm text-fg-primary">{it.name}</span>
										<span className="font-mono text-lg font-black text-accent-lime">
											{it.figure}
										</span>
										<span className="text-sm text-fg-secondary">
											{it.caption}{" "}
											{it.delta !== null && (
												<Delta value={it.delta} window={props.p.window} />
											)}
										</span>
										<span>{it.picture(false)}</span>
										<span className="font-mono text-fg-muted">
											{it.body ? (on ? "−" : "+") : ""}
										</span>
									</Tag>
									{on && it.body && <div className="pb-5">{it.body()}</div>}
								</div>
							);
						})}
					</div>
				)}
			</Shell>
		);
	},
};

// ---------------------------------------------------------------------------
// L: by shape, wall display.
// ---------------------------------------------------------------------------

const ALL_IDS = [...STAT_IDS, "harness", ...Object.keys(SHAPES)] as const;

const SHAPE_GROUPS: Group[] = [
	{ id: "number", label: "Numbers", ids: ALL_IDS },
	{ id: "share", label: "Shares", ids: ALL_IDS },
	{ id: "timeline", label: "Timelines", ids: ALL_IDS },
];

export const VariantL = {
	name: "By shape · numbers, shares, timelines",
	Component: function L(props: VariantProps) {
		return (
			<Shell {...props} groups={SHAPE_GROUPS}>
				{(all, group) => {
					const items = all.filter((it) => it.shape === group.id);
					if (group.id === "number") {
						return (
							<div className="grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle md:grid-cols-4">
								{items.map((it) => (
									<div key={it.id} className="bg-bg-canvas px-4 py-4">
										<p className="font-mono text-2xl font-black text-fg-primary">
											{it.figure}
										</p>
										<p className={cn(MONO_LABEL, "mt-1 text-fg-muted")}>
											{it.name}
										</p>
										<p className="mt-1 text-[12px] text-fg-secondary">
											{it.caption}
										</p>
										{it.delta !== null && (
											<p className="mt-1">
												<Delta value={it.delta} window={props.p.window} />
											</p>
										)}
									</div>
								))}
							</div>
						);
					}
					if (group.id === "share") {
						return (
							<div className="grid gap-10 md:grid-cols-2">
								{items.map((it) => (
									<div key={it.id}>
										<div className="mb-2 flex items-baseline justify-between">
											<p className={cn(MONO_LABEL, "text-fg-muted")}>
												{it.name}
											</p>
											<p className="font-mono text-sm font-black text-accent-lime">
												{it.figure}{" "}
												<span className="font-normal text-fg-secondary">
													{it.caption}
												</span>
											</p>
										</div>
										{it.body ? it.body() : it.picture(true)}
									</div>
								))}
							</div>
						);
					}
					return (
						<div className="grid gap-px border border-stroke-subtle bg-stroke-subtle md:grid-cols-2">
							{items.map((it) => (
								<div key={it.id} className="bg-bg-canvas p-5">
									<p className={cn(MONO_LABEL, "text-fg-muted")}>{it.name}</p>
									<p className="mt-1 text-sm text-fg-secondary">
										<span className="mr-2 font-mono text-xl font-black text-accent-lime">
											{it.figure}
										</span>
										{it.caption}
									</p>
									<div className="mt-4">
										{it.body ? it.body() : it.picture(true)}
									</div>
								</div>
							))}
						</div>
					);
				}}
			</Shell>
		);
	},
};

// ---------------------------------------------------------------------------
// M: two tabs, Machine and Human, spread display.
// ---------------------------------------------------------------------------

const TWO: Group[] = [
	{
		id: "human",
		label: "The human",
		ids: [
			"stat:active-days",
			"component:activity-heatmap",
			"component:start-hours",
			"metric:late-night-commits",
			"component:phase-playbook",
			"metric:question-back-share",
			"metric:web-searches-per-active-day",
			"component:git-ledger",
			"component:coding-languages",
			"stat:projects",
			"metric:parallel-projects",
		],
	},
	{
		id: "machine",
		label: "The machine",
		ids: [
			"stat:sessions",
			"harness",
			"component:model-routing",
			"metric:effort-levels",
			"metric:thinking-share",
			"stat:cache-hits",
			"component:kit",
			"component:delegation",
			"stat:subagents",
			"metric:turn-duration",
		],
	},
];

export const VariantM = {
	name: "Human / Machine · spread bands",
	Component: function M(props: VariantProps) {
		return (
			<Shell {...props} groups={TWO}>
				{(items) => (
					<div className="divide-y divide-stroke-subtle border-y border-stroke-subtle">
						{items.map((it) => (
							<div
								key={it.id}
								className="grid gap-6 py-6 md:grid-cols-[minmax(0,22rem)_1fr]"
							>
								<div>
									<p className={cn(MONO_LABEL, "text-fg-muted")}>{it.name}</p>
									<p className="mt-1 font-mono text-4xl font-black leading-none text-accent-lime">
										{it.figure}
									</p>
									<p className="mt-2 text-sm text-fg-secondary">{it.caption}</p>
									{it.delta !== null && (
										<p className="mt-1">
											<Delta value={it.delta} window={props.p.window} />
										</p>
									)}
								</div>
								<div>{it.body ? it.body() : it.picture(true)}</div>
							</div>
						))}
					</div>
				)}
			</Shell>
		);
	},
};
