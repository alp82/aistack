/**
 * PROTOTYPE — throwaway. Wayfinder ticket #92 (map #76).
 *
 * VARIANT B — Statistics-first. The page is "the state of AI coding spend",
 * and the board is one module inside it.
 *
 * The position this variant argues: the citable thing is the **population**,
 * not the ranking. A journalist quotes "builders spent at least $X across N
 * measured stacks, and 62% of it went to one model" — none of which is a row.
 *
 * It takes both ride-along questions head on:
 *   1. Every candidate chart from #92 is on the page, so the ones that do not
 *      earn a place fail visibly rather than by argument.
 *   2. The weight switch repaints every share, and the model chart prints the
 *      *other* framing underneath as a muted line. At `real` density the two
 *      sentences disagree so hard that the page cannot mean both.
 *
 * Charts come from `src/features/charts`, which is the real module (#91). #92
 * calls the charts here throwaway — using the real ones costs nothing and shows
 * the house palette against real proportions.
 */

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { BarsChart, type ChartBar } from "@/features/charts";
import type { Aggregate, Weight } from "./aggregate";
import { shareSentence, weightedValue } from "./aggregate";
import * as f from "./format";

export const VARIANT_B_NAME = "Statistics-first — the state of AI coding spend";

export function VariantB({
	agg,
	weight,
}: {
	readonly agg: Aggregate;
	readonly weight: Weight;
}) {
	const topModel = agg.models[0];
	const otherWeight: Weight = weight === "tokens" ? "stacks" : "tokens";

	const modelBars: ChartBar[] = agg.models.slice(0, 8).map((m) => ({
		key: m.key,
		label: m.key,
		value: weightedValue(m, weight, agg.stackCount) * 100,
	}));
	const harnessBars: ChartBar[] = agg.harnesses.slice(0, 8).map((h) => ({
		key: h.key,
		label: h.key,
		value: weightedValue(h, weight, agg.stackCount) * 100,
	}));
	const toolBars: ChartBar[] = agg.tools.slice(0, 10).map((t) => ({
		key: t.key,
		label: t.key,
		value: t.stackCount,
	}));
	const spendBars: ChartBar[] = agg.all
		.filter((s) => s.spendLowerBound !== null)
		.slice(0, 12)
		.map((s) => ({
			key: s.id,
			label: s.name,
			value: s.spendLowerBound ?? 0,
		}));
	const rateBars: ChartBar[] = agg.all
		.filter((s) => s.costPerMtok !== null)
		.slice(0, 12)
		.map((s) => ({
			key: s.id,
			label: s.name,
			value: Number((s.costPerMtok ?? 0).toFixed(2)),
		}));

	const pctAxis = (n: number) => `${n.toFixed(0)}%`;

	return (
		<div className="min-h-screen bg-bg-canvas">
			<section className="px-6 py-20 md:px-12">
				<div className="mx-auto max-w-content">
					<p className="font-mono text-sm text-accent-lime">{"//"} MEASURED</p>
					<h1 className="mt-5 max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-tighter text-fg-primary md:text-7xl">
						The state of AI coding spend
					</h1>
					<p className="mt-6 max-w-2xl text-xl leading-relaxed text-fg-secondary">
						Not a survey. Every number below is counted on a builder's own
						machine and published by them, across {agg.stackCount} stacks and
						their last 30 days.
					</p>

					<Headline agg={agg} />

					{/* Chart 1 — models. The ride-along question, made visible. */}
					<Block
						title="Models"
						lead={
							topModel
								? `${topModel.key} — ${shareSentence(topModel, weight, agg.stackCount)}`
								: "Nothing measured yet"
						}
						sub={
							topModel
								? `Read the other way: ${shareSentence(topModel, otherWeight, agg.stackCount)}.`
								: undefined
						}
					>
						<BarsChart
							bars={modelBars}
							ariaLabel="Models by share"
							valueLabel={weight === "tokens" ? "% of tokens" : "% of stacks"}
							formatValue={pctAxis}
							caption={
								weight === "tokens"
									? `share of ${f.tokens(agg.totalTokens)} attributed tokens`
									: `stacks it leads, of ${agg.stackCount} measured`
							}
						/>
						<p className="mt-3 max-w-2xl font-mono text-xs leading-relaxed text-fg-muted">
							{f.pct(agg.unattributedShare, 1)} of measured tokens carry no
							model name and are left out of these shares.
							{topModel &&
								` ${topModel.key} appears on ${topModel.stackCount} of ${agg.stackCount} stacks and leads ${topModel.leadsCount}.`}
						</p>
					</Block>

					{/* Chart 2 — harnesses. */}
					<Block
						title="Harnesses"
						lead={
							agg.harnesses[0]
								? `${agg.harnesses[0].key} — ${shareSentence(agg.harnesses[0], weight, agg.stackCount)}`
								: "Nothing measured yet"
						}
					>
						<BarsChart
							bars={harnessBars}
							ariaLabel="Harnesses by share"
							valueLabel={weight === "tokens" ? "% of tokens" : "% of stacks"}
							formatValue={pctAxis}
							caption="a harness that logged nothing is not counted"
						/>
					</Block>

					{/* Chart 3 — spend distribution. At four stacks this is the board
					    again, drawn sideways. That is the point of putting it here. */}
					<Block
						title="Spend distribution"
						lead={`At least ${f.usd(agg.spendLowerBound)} across ${agg.costPublishers} stacks that publish a cost`}
					>
						<BarsChart
							bars={spendBars}
							ariaLabel="Published spend per stack"
							valueLabel="USD, lower bound"
							formatValue={f.usdCompact}
							caption="30 days · every figure a lower bound"
						/>
					</Block>

					{/* Chart 4 — cost per token. */}
					<Block
						title="Cost per million tokens"
						lead="What a million tokens costs, stack by stack"
						sub="A stack running cheap models on long contexts lands low. A stack on frontier models lands high."
					>
						<BarsChart
							bars={rateBars}
							ariaLabel="Cost per million tokens per stack"
							valueLabel="USD per Mtok"
							formatValue={(n) => `$${n.toFixed(2)}`}
							caption="published cost over measured tokens"
						/>
					</Block>

					{/* Chart 5 — tools. Stack-weighted by construction. */}
					<Block
						title="Tools"
						lead={
							agg.tools[0]
								? `${agg.tools[0].key} — on ${agg.tools[0].stackCount} of ${agg.stackCount} stacks`
								: "Nothing listed yet"
						}
						sub="A tool has no tokens, so this one can only ever count stacks."
					>
						<BarsChart
							bars={toolBars}
							ariaLabel="Tools by number of stacks listing them"
							valueLabel="Stacks"
							formatValue={(n) => n.toFixed(0)}
							caption={`listed on a stack · ${agg.stackCount} stacks`}
						/>
					</Block>

					{/* The board, as one module. */}
					<section className="mt-20 border-t-2 border-stroke-strong pt-10">
						<div className="flex items-baseline justify-between gap-4">
							<h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-fg-muted">
								Ranked by measured tokens
							</h2>
							<span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent-lime">
								Full board <ArrowRight className="size-3" />
							</span>
						</div>
						<ol className="mt-4">
							{agg.living.slice(0, 10).map((s) => (
								<li
									key={s.id}
									className="flex items-baseline gap-4 border-b border-stroke-subtle py-3 last:border-b-0"
								>
									<span className="w-6 shrink-0 font-mono text-sm text-fg-muted">
										{s.rank}
									</span>
									<Link
										to="/stacks/$slug"
										params={{ slug: s.slug }}
										className="min-w-0 flex-1 truncate font-mono text-sm font-bold text-fg-primary hover:text-accent-lime"
									>
										{s.name}
										<span className="ml-2 font-normal text-fg-muted">
											@{s.handle}
										</span>
									</Link>
									<span className="shrink-0 font-mono text-sm text-fg-primary">
										{f.tokens(s.tokens)}
									</span>
									<span className="w-28 shrink-0 text-right font-mono text-sm text-fg-secondary">
										{s.spendLowerBound === null
											? "—"
											: `${s.spendExact ? "" : "≥ "}${f.usd(s.spendLowerBound)}`}
									</span>
								</li>
							))}
						</ol>
					</section>

					<p className="mt-12 max-w-2xl font-mono text-xs leading-relaxed text-fg-muted">
						Each stack's window ends when it last synced, so the{" "}
						{agg.stackCount} windows are offset by up to{" "}
						{Math.round(agg.windowSpreadDays)} days and cannot be aligned.
						Unpublished stacks, flagged stacks and harnesses that logged nothing
						are left out.
					</p>
				</div>
			</section>
		</div>
	);
}

function Headline({ agg }: { readonly agg: Aggregate }) {
	const items = [
		{
			label: "measured tokens",
			value: f.tokens(agg.totalTokens),
			accent: true,
		},
		{
			label: `at least, across ${agg.costPublishers} stacks`,
			value: f.usd(agg.spendLowerBound),
			accent: false,
		},
		{ label: "stacks measured", value: f.count(agg.stackCount), accent: false },
		{ label: "sessions", value: f.count(agg.totalSessions), accent: false },
	];
	return (
		<div className="mt-12 grid grid-cols-2 border-2 border-stroke-strong md:grid-cols-4">
			{items.map((it) => (
				<div
					key={it.label}
					className="border-b-2 border-r-2 border-stroke-strong p-6 last:border-r-0 md:border-b-0"
				>
					<p
						className={`font-mono text-3xl font-black md:text-4xl ${
							it.accent ? "text-accent-lime" : "text-fg-primary"
						}`}
					>
						{it.value}
					</p>
					<p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
						{it.label}
					</p>
				</div>
			))}
		</div>
	);
}

function Block({
	title,
	lead,
	sub,
	children,
}: {
	readonly title: string;
	readonly lead: string;
	readonly sub?: string;
	readonly children: React.ReactNode;
}) {
	return (
		<section className="mt-20">
			<h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-fg-muted">
				{title}
			</h2>
			<p className="mt-3 max-w-3xl text-2xl font-black leading-tight tracking-tight text-fg-primary">
				{lead}
			</p>
			{sub && (
				<p className="mt-2 max-w-2xl font-mono text-xs leading-relaxed text-fg-muted">
					{sub}
				</p>
			)}
			<div className="mt-6">{children}</div>
		</section>
	);
}
