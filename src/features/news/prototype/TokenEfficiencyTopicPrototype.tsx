/**
 * PROTOTYPE - throwaway. A new LAST top-level knowledge base topic, "Token
 * efficiency", holding one entry that lists all eight insights. Three forms
 * of the topic page via `?variant=` on /prototype/kb-token-efficiency, with
 * the topic index card mocked at the top of each. Copy is short: the fix,
 * the rule, the atoms, one measured figure. No price talk, no disclaimers.
 *
 *   A  Numbered ledger   the knowledge base entry style, eight numbered rows
 *   B  Card grid         eight tiles in the Stats scorecard form, severity-free
 *   C  Two columns       the fix on the left, the rule and its atoms on the right
 */
import { useState } from "react";
import { Switcher } from "@/features/usage/prototype/StatsBlocksPrototype";
import { cn } from "@/lib/utils";

export const VARIANTS = {
	A: "Numbered ledger",
	B: "Card grid",
	C: "Two columns",
} as const;
export type VariantKey = keyof typeof VARIANTS;
export const VARIANT_KEYS = Object.keys(VARIANTS) as VariantKey[];

/** The catalogue, verbatim from efficiency-rules/v1. */
export const INSIGHTS = [
	{
		lever: "cache",
		fix: "Use the 1h cache TTL",
		problem: "Breaks are cold-starting your cache",
		rule: "A main call more than 5 minutes after the last rewrites the whole prefix.",
		reads: "calls after a break, cache-write tokens after a break",
		figure: "502 calls after a break · 17.7M tokens rewritten",
	},
	{
		lever: "switches",
		fix: "Pick model and effort at start",
		problem: "Mid-session switches reset the cache",
		rule: "A call that writes cache and reads none had its prefix invalidated.",
		reads: "orphan cache writes over main calls",
		figure: "84 calls · 14.8M tokens rewritten",
	},
	{
		lever: "tools",
		fix: "Read with offset and limit",
		problem: "Read output floods the context",
		rule: "Every byte a tool returns stays in the context until compaction.",
		reads: "tool-result bytes by tool, results of 32 KB or more",
		figure: "Read is 68% of tool output · 54% of Reads over 32 KB",
	},
	{
		lever: "context",
		fix: "Clear between tasks",
		problem: "Sessions run near the context limit",
		rule: "Cost per call scales with context. 150K costs four times 40K on every call.",
		reads: "sessions peaking over 128K, sessions compacted",
		figure: "33% of sessions peak over 128K",
	},
	{
		lever: "routing",
		fix: "Route subagents to a smaller model",
		problem: "Subagents burn the top model",
		rule: "Subagent work is reading and searching. It starts on a cold cache.",
		reads: "subagent tokens by model against the main loop",
		figure: "30% of subagent tokens on the top model · 54% of all tokens",
	},
	{
		lever: "startup",
		fix: "Trim instructions and unused MCP",
		problem: "Every session starts heavy",
		rule: "The first call carries instructions, memory and every tool schema, as a cache write.",
		reads: "first-call context, harness and instructions split",
		figure: "median first call 46K to 66K · 6.0M startup tokens",
	},
	{
		lever: "effort",
		fix: "Default to medium effort",
		problem: "High effort on routine work",
		rule: "Effort scales thinking output. Changing it mid-session rebuilds the cache.",
		reads: "calls per effort level",
		figure: "8% of calls at high effort",
	},
	{
		lever: "sessions",
		fix: "Ask quick questions in a running session",
		problem: "One-liners pay the full startup",
		rule: "A one-question session pays the startup prefix for one answer.",
		reads: "sessions of 2 calls or fewer, their first-call tokens",
		figure: "6 short sessions · 222K startup tokens",
	},
] as const;

export function TokenEfficiencyTopicPrototype({
	variant,
	onChange,
}: {
	variant: VariantKey;
	onChange: (next: { variant?: VariantKey }) => void;
}) {
	const cycle = (step: number) => {
		const at = VARIANT_KEYS.indexOf(variant);
		onChange({
			variant:
				VARIANT_KEYS[(at + step + VARIANT_KEYS.length) % VARIANT_KEYS.length],
		});
	};
	return (
		<div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
			<IndexCardMock />
			<div className="mx-auto mt-24 max-w-3xl">
				<TopicHeader />
				{variant === "A" && <VariantA />}
				{variant === "B" && <VariantB />}
				{variant === "C" && <VariantC />}
			</div>
			<Switcher variant={variant} onCycle={cycle} names={VARIANTS} />
		</div>
	);
}

/** The Topics grid on /news, with the new topic LAST. Other cards are mocked. */
function IndexCardMock() {
	const topics = [
		{
			name: "Agents",
			count: 14,
			lines: ["Claude Code 2.1.241", "Codex subagents ship"],
		},
		{
			name: "Models",
			count: 9,
			lines: ["Gemini 3.6 Flash", "Opus 5.5 pricing"],
		},
		{
			name: "Harnesses",
			count: 11,
			lines: ["opencode 1.4", "Cursor 3 composer"],
		},
		{
			name: "Tooling",
			count: 6,
			lines: ["MCP registry", "Skills spec update"],
		},
	];
	return (
		<section aria-label="Topics on /news">
			<p className="mb-6 font-mono text-[11px] text-fg-muted">
				prototype: the /news topic index with the new last card
			</p>
			<div className="mb-4 flex items-baseline justify-between border-b-2 border-stroke-strong pb-2">
				<h2 className="font-mono text-sm uppercase tracking-widest text-accent-lime">
					Topics
				</h2>
				<span className="font-mono text-xs text-fg-muted">
					{topics.length + 1}
				</span>
			</div>
			<div className="grid gap-px border border-stroke-subtle bg-stroke-subtle sm:grid-cols-2">
				{topics.map((t) => (
					<div key={t.name} className="bg-bg-panel p-5 opacity-50">
						<div className="mb-4 flex items-baseline justify-between gap-4 font-mono text-sm uppercase tracking-wider text-accent-lime">
							<span>{t.name}</span>
							<span className="text-xs text-fg-muted">{t.count}</span>
						</div>
						<div className="space-y-2 text-sm text-fg-secondary">
							{t.lines.map((l) => (
								<p key={l}>{l}</p>
							))}
						</div>
					</div>
				))}
				<a
					href="#topic"
					className="group bg-bg-panel p-5 transition-colors hover:bg-bg-panel-muted"
				>
					<div className="mb-4 flex items-baseline justify-between gap-4 font-mono text-sm uppercase tracking-wider text-accent-lime">
						<span>Token efficiency</span>
						<span className="text-xs text-fg-muted">1</span>
					</div>
					<div className="space-y-2 text-sm text-fg-secondary">
						<p>The eight insights: what each one reads and what to change</p>
					</div>
				</a>
			</div>
		</section>
	);
}

function TopicHeader() {
	return (
		<header id="topic" className="border-b-2 border-stroke-strong pb-6">
			<p className="mb-4 font-mono text-sm uppercase tracking-widest text-accent-lime">
				{"// KNOWLEDGE_BASE"}
			</p>
			<div className="flex items-end justify-between gap-6">
				<h1 className="text-4xl font-black uppercase tracking-tighter text-fg-primary sm:text-6xl">
					Token efficiency
				</h1>
				<span className="font-mono text-sm text-fg-muted">1</span>
			</div>
		</header>
	);
}

function EntryTitle() {
	return (
		<h2 className="mb-2 text-xl font-bold leading-tight tracking-tight text-fg-primary">
			The eight insights
		</h2>
	);
}

// ---------------------------------------------------------------------------
// A. Numbered ledger, in the knowledge base entry style.
// ---------------------------------------------------------------------------
function VariantA() {
	return (
		<article className="border-b border-stroke-subtle py-7">
			<EntryTitle />
			<p className="mb-6 font-mono text-xs uppercase tracking-wider text-fg-muted">
				aistack stats · efficiency-rules/v1
			</p>
			<ol className="divide-y divide-stroke-subtle border-y border-stroke-subtle">
				{INSIGHTS.map((i, n) => (
					<li
						key={i.lever}
						className="grid gap-x-6 py-4 sm:grid-cols-[2.5rem_1fr]"
					>
						<span className="font-mono text-2xl font-black leading-none text-accent-lime">
							{String(n + 1).padStart(2, "0")}
						</span>
						<div>
							<p className="text-lg font-black leading-tight text-fg-primary">
								{i.fix}
							</p>
							<p className="mt-1 text-sm text-fg-secondary">{i.rule}</p>
							<p className="mt-2 font-mono text-[11px] text-fg-muted">
								reads {i.reads}
							</p>
						</div>
					</li>
				))}
			</ol>
		</article>
	);
}

// ---------------------------------------------------------------------------
// B. Card grid in the scorecard's tile form, with the lime edge on every
// card because a catalogue has no severity.
// ---------------------------------------------------------------------------
function VariantB() {
	const [open, setOpen] = useState<string | null>(null);
	return (
		<article className="py-7">
			<EntryTitle />
			<p className="mb-6 font-mono text-xs uppercase tracking-wider text-fg-muted">
				tap a card for the rule
			</p>
			<ul className="grid gap-3 sm:grid-cols-2">
				{INSIGHTS.map((i, n) => {
					const on = open === i.lever;
					return (
						<li key={i.lever} className="flex">
							<button
								type="button"
								onClick={() => setOpen(on ? null : i.lever)}
								className="flex min-h-36 w-full flex-col bg-bg-panel text-left"
								style={{ borderLeft: "8px solid var(--accent-lime)" }}
							>
								<span className="px-4 pt-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-lime">
									{String(n + 1).padStart(2, "0")} · {i.lever}
								</span>
								<span className="mt-2 px-4 text-[22px] font-black leading-tight text-fg-primary">
									{i.fix}
								</span>
								<span className="mt-1.5 px-4 text-sm text-fg-muted">
									{i.problem}
								</span>
								<span className="mt-auto px-4 pt-4 pb-3 font-mono text-[11px] text-fg-muted">
									{i.figure}
								</span>
								{on && (
									<span className="block border-t border-stroke-subtle px-4 py-3 text-sm text-fg-secondary">
										{i.rule}
										<span className="mt-1 block font-mono text-[11px] text-fg-muted">
											reads {i.reads}
										</span>
									</span>
								)}
							</button>
						</li>
					);
				})}
			</ul>
		</article>
	);
}

// ---------------------------------------------------------------------------
// C. Two columns: the fix as the left column, the rule and atoms on the right.
// Reads as a table of contents and a reference in one.
// ---------------------------------------------------------------------------
function VariantC() {
	return (
		<article className="py-7">
			<EntryTitle />
			<dl className="mt-6 border-t border-stroke-subtle">
				{INSIGHTS.map((i, n) => (
					<div
						key={i.lever}
						className={cn(
							"grid gap-x-8 gap-y-2 border-b border-stroke-subtle py-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]",
						)}
					>
						<dt>
							<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-lime">
								{String(n + 1).padStart(2, "0")}
							</p>
							<p className="mt-1 text-xl font-black leading-tight text-fg-primary">
								{i.fix}
							</p>
						</dt>
						<dd>
							<p className="text-sm text-fg-secondary">{i.rule}</p>
							<p className="mt-2 font-mono text-[11px] text-fg-muted">
								{i.reads}
							</p>
							<p className="mt-1 font-mono text-[11px] text-fg-primary">
								{i.figure}
							</p>
						</dd>
					</div>
				))}
			</dl>
		</article>
	);
}
