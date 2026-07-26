/**
 * PROTOTYPE SHARED — mock data + primitives for the reconcile-surface variants.
 * Wayfinder ticket #39. THROWAWAY.
 *
 * Split out so A/B/C (reconcile-surface.tsx) and the A×C combinations
 * (reconcile-combined.tsx) can sit under one switcher without a circular
 * import. Nothing here is a design decision — the decisions live in the
 * variant files. Keep this boring.
 */
import { Check, Clock, Terminal } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ===========================================================================
// Mock data
// ===========================================================================

export type Suggestion = {
	atomKind: "model" | "tool";
	atomKey: string;
	label: string;
	kind: "missing_from_authored" | "missing_what_for";
	tokenShare?: number;
	/** Prototype-only colour for the focused card. */
	hint?: string;
};

export type Dismissal = {
	atomKind: "model" | "tool";
	atomKey: string;
	label: string;
	ago: string;
};

export const MEASURED_MODELS: Suggestion[] = [
	{
		atomKind: "model",
		atomKey: "claude-opus-5",
		label: "Claude Opus 5",
		kind: "missing_from_authored",
		tokenShare: 0.62,
		hint: "3.1B tokens · $3,402 API-equivalent",
	},
	{
		atomKind: "model",
		atomKey: "claude-haiku-4-5",
		label: "Claude Haiku 4.5",
		kind: "missing_from_authored",
		tokenShare: 0.09,
		hint: "331M tokens · $98 API-equivalent",
	},
];

export const MISSING_WHAT_FOR: Suggestion[] = [
	{
		atomKind: "tool",
		atomKey: "claude-code",
		label: "Claude Code",
		kind: "missing_what_for",
	},
	{
		atomKind: "tool",
		atomKey: "convex",
		label: "Convex",
		kind: "missing_what_for",
	},
	{
		atomKind: "tool",
		atomKey: "linear",
		label: "Linear",
		kind: "missing_what_for",
	},
	{
		atomKind: "tool",
		atomKey: "resend",
		label: "Resend",
		kind: "missing_what_for",
	},
];

export const DISMISSED_SEED: Dismissal[] = [
	{ atomKind: "model", atomKey: "gpt-5-4", label: "GPT-5.4", ago: "3d ago" },
	{ atomKind: "tool", atomKey: "vercel", label: "Vercel", ago: "11d ago" },
];

export type StateKey = "live" | "clear" | "presync" | "stale";

export const STATES: Record<
	StateKey,
	{
		label: string;
		hasSnapshot: boolean;
		isFresh: boolean;
		receivedAgo: string;
		suggestions: Suggestion[];
		dismissed: Dismissal[];
	}
> = {
	live: {
		label: "fresh sync, 6 open",
		hasSnapshot: true,
		isFresh: true,
		receivedAgo: "2 hours ago",
		suggestions: [...MEASURED_MODELS, ...MISSING_WHAT_FOR],
		dismissed: DISMISSED_SEED,
	},
	clear: {
		label: "all reconciled",
		hasSnapshot: true,
		isFresh: true,
		receivedAgo: "40 minutes ago",
		suggestions: [],
		dismissed: DISMISSED_SEED,
	},
	presync: {
		label: "never synced",
		hasSnapshot: false,
		isFresh: false,
		receivedAgo: "never",
		// NOT empty: what-for suggestions are authored-side and exist before the
		// first sync. Every variant has to render that asymmetry.
		suggestions: MISSING_WHAT_FOR,
		dismissed: [],
	},
	stale: {
		label: "12-day-old sync",
		hasSnapshot: true,
		isFresh: false,
		receivedAgo: "12 days ago",
		suggestions: [...MEASURED_MODELS, ...MISSING_WHAT_FOR],
		dismissed: DISMISSED_SEED,
	},
};

export const SNAPSHOT_META = {
	harness: "claude-code 2.1.220",
	window: "rolling 30 days · 2026-06-25 → 2026-07-25",
	sessions: 1_284,
	activeDays: 29,
};

// ===========================================================================
// Primitives
// ===========================================================================

export const MONO_LABEL =
	"font-mono text-[11px] font-semibold uppercase tracking-[0.25em]";

export function Monogram({
	label,
	tone,
	size = "md",
}: {
	label: string;
	tone: "measured" | "authored";
	size?: "md" | "lg";
}) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center justify-center border font-mono font-bold uppercase",
				size === "md" ? "size-9 text-sm" : "size-14 text-2xl",
				tone === "measured"
					? "border-accent-lime/40 bg-accent-lime/10 text-accent-lime"
					: "border-stroke-subtle bg-bg-panel/60 text-fg-secondary",
			)}
		>
			{label.charAt(0)}
		</span>
	);
}

export function ShareBar({ share }: { share: number }) {
	return (
		<div className="flex items-center gap-2">
			<div className="h-1 w-20 bg-stroke-subtle">
				<div
					className="h-full bg-accent-lime"
					style={{ width: `${Math.round(share * 100)}%` }}
				/>
			</div>
			<span className="font-mono text-[11px] text-fg-muted">
				{Math.round(share * 100)}% of tokens
			</span>
		</div>
	);
}

export function PBtn({
	children,
	onClick,
	tone = "ghost",
	className,
}: {
	children: ReactNode;
	onClick?: () => void;
	tone?: "primary" | "ghost" | "danger";
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"inline-flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
				tone === "primary" &&
					"border-accent-lime bg-accent-lime text-accent-lime-contrast hover:bg-accent-lime-strong",
				tone === "ghost" &&
					"border-stroke-strong text-fg-secondary hover:border-accent-lime hover:text-accent-lime",
				tone === "danger" &&
					"border-stroke-subtle text-fg-muted hover:border-fg-muted hover:text-fg-secondary",
				className,
			)}
		>
			{children}
		</button>
	);
}

/**
 * The freshness stamp. Present in every variant because the 7-day window is
 * this map's done-bar — a surface that hides it can't tell a living stack from
 * a dead one.
 */
export function SyncStamp({
	hasSnapshot,
	isFresh,
	receivedAgo,
	compact,
}: {
	hasSnapshot: boolean;
	isFresh: boolean;
	receivedAgo: string;
	compact?: boolean;
}) {
	if (!hasSnapshot) {
		return <span className={cn(MONO_LABEL, "text-fg-muted")}>never synced</span>;
	}
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em]",
				isFresh ? "text-accent-lime" : "text-amber-400",
			)}
		>
			{isFresh ? <Check className="size-3" /> : <Clock className="size-3" />}
			synced {receivedAgo}
			{!compact && !isFresh && (
				<span className="normal-case tracking-normal text-fg-muted">
					— outside the 7-day window
				</span>
			)}
		</span>
	);
}

export function SyncCta({ dense }: { dense?: boolean }) {
	return (
		<div
			className={cn(
				"border border-stroke-subtle bg-bg-panel/40",
				dense ? "p-4" : "p-6",
			)}
		>
			<p className={cn(MONO_LABEL, "text-accent-lime")}>// no measurements yet</p>
			<p className="mt-3 max-w-xl text-sm leading-relaxed text-fg-secondary">
				Your authored stack is here, but nothing has been measured against it.
				Run the sync from a machine where you actually work — it analyzes your
				transcripts locally and asks before anything leaves.
			</p>
			<div className="mt-4 flex items-center gap-2 border border-stroke-strong bg-bg-canvas px-3 py-2">
				<Terminal className="size-3.5 shrink-0 text-accent-lime" />
				<code className="font-mono text-xs text-fg-primary">aistack sync</code>
			</div>
		</div>
	);
}

/** The stand-in stack hero, so every variant is judged against real chrome. */
export function StackHeroStub({ children }: { children?: ReactNode }) {
	return (
		<div className="border-b border-stroke-subtle px-6 py-10">
			<div className="mx-auto max-w-7xl">
				<p className={cn(MONO_LABEL, "text-accent-lime")}>// alp82</p>
				<h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-fg-primary md:text-5xl">
					Alp&apos;s Stack
				</h1>
				{children}
			</div>
		</div>
	);
}
