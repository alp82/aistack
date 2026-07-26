/**
 * PROTOTYPE — Round 3: E's shape, F's tabs, plain words
 * ---------------------------------------------------------------------------
 * Wayfinder ticket #39 (map #29). THROWAWAY.
 *
 * Round 2 landed on E (start in the review, the list is what you consult
 * afterwards) with F's tab switcher wanted on top. Round 3 keeps that shape
 * fixed for all three and varies the two things still open:
 *
 *   1. WHAT THE TABS ARE, and how much of the surface they own.
 *   2. HOW THE WHOLE THING IS FRAMED — which changes the words, and the words
 *      turned out to change the design.
 *
 *   G  WHAT'S CHANGED  — arrival framing. E almost exactly, plus a tabbed
 *                        results page after the run. Smallest step from E.
 *   H  FILL IN THE GAPS— completeness framing. A meter, not a queue. The deck
 *                        asks literal questions; progress is the reward.
 *   I  COMPARE         — the tabs ARE the surface and are reachable directly.
 *                        Adds a "What you use" tab: the measured inventory,
 *                        read-only. That tab is also where #42's withheld
 *                        counts would have to live, so it is worth seeing now.
 *
 * ---------------------------------------------------------------------------
 * THE VOCABULARY PASS
 *
 * Everything below was jargon in rounds 1–2. Nothing in this file says any of
 * the words in the left column — including the section headings, the buttons,
 * and the empty states. If a term survives review it should survive here too;
 * if it doesn't, this is the replacement to carry into the real build.
 *
 *   reconcile ................ check / what's changed
 *   the measured layer ....... what we measured / from your machine
 *   authored / authored layer  your stack / what you've listed
 *   suggestion ............... thing to look at
 *   missing_from_authored .... "You use this, but it's not on your stack"
 *   missing_what_for ......... "You haven't said what you use this for"
 *   what-for note ............ note
 *   dismiss .................. not mine / hide
 *   undismiss ................ bring back
 *   snapshot ................. your last check
 *   capturedAt / receivedAt .. "checked 2 hours ago"
 *   focus mode ............... one at a time
 *   list mode ................ all at once
 *   ledger ................... history
 *   token share .............. "62% of everything you ran"
 *   API-equivalent USD ....... "≈$3,402 at API prices"
 *   harness .................. Claude Code
 *   coverage ................. "1,284 sessions"
 *   living stack ............. up to date
 *   stale .................... "your last check was 12 days ago"
 *
 * Two words are deliberately KEPT, because replacing them would be a lie:
 *   - "API prices" — the dollar figure is not a bill, and #37 was explicit that
 *     it must never read like one.
 *   - "Claude Code" — it is the product name, not jargon.
 * ---------------------------------------------------------------------------
 */
import {
	ArrowLeft,
	ArrowRight,
	Check,
	EyeOff,
	Plus,
	RotateCcw,
	Terminal,
	X,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
	type Dismissal,
	MONO_LABEL,
	Monogram,
	PBtn,
	SNAPSHOT_META,
	type StateKey,
	STATES,
	StackHeroStub,
	type Suggestion,
} from "./reconcile-shared";

// ===========================================================================
// Plain-language copy, in one place so the wording is reviewable as wording.
// ===========================================================================

/** How long ago we last looked, said like a person would say it. */
function lastCheckedLine(hasSnapshot: boolean, receivedAgo: string): string {
	return hasSnapshot ? `Checked ${receivedAgo}` : "Never checked";
}

export function usageLine(s: Suggestion): string | null {
	if (s.tokenShare === undefined) return null;
	return `${Math.round(s.tokenShare * 100)}% of everything you ran`;
}

/** "≈$3,402 at API prices" — never "cost", never a bill. */
export function priceLine(s: Suggestion): string | null {
	if (!s.hint) return null;
	const m = s.hint.match(/\$[\d,]+/);
	return m ? `≈${m[0]} at API prices` : null;
}

export function askLine(s: Suggestion): string {
	return s.kind === "missing_from_authored"
		? "You use this, but it's not on your stack"
		: "You haven't said what you use this for";
}

/** The freshness line, in words instead of a status chip. */
export function FreshLine({
	hasSnapshot,
	isFresh,
	receivedAgo,
}: {
	hasSnapshot: boolean;
	isFresh: boolean;
	receivedAgo: string;
}) {
	if (!hasSnapshot) {
		return (
			<span className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg-muted">
				Never checked
			</span>
		);
	}
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em]",
				isFresh ? "text-accent-lime" : "text-amber-400",
			)}
		>
			{isFresh ? <Check className="size-3" /> : <ArrowRight className="size-3" />}
			{lastCheckedLine(hasSnapshot, receivedAgo)}
			{!isFresh && (
				<span className="normal-case tracking-normal text-fg-muted">
					— your stack stops counting as up to date after a week
				</span>
			)}
		</span>
	);
}

export function NeverCheckedBox({ dense }: { dense?: boolean }) {
	return (
		<div
			className={cn(
				"border border-stroke-subtle bg-bg-panel/40",
				dense ? "p-4" : "p-6",
			)}
		>
			<p className={cn(MONO_LABEL, "text-accent-lime")}>
				// nothing from your machine yet
			</p>
			<p className="mt-3 max-w-xl text-sm leading-relaxed text-fg-secondary">
				Your stack is here, but we haven&apos;t looked at how you actually work
				yet. Run this on the machine you code on — it reads your Claude Code
				history locally and shows you everything before any of it leaves.
			</p>
			<div className="mt-4 flex items-center gap-2 border border-stroke-strong bg-bg-canvas px-3 py-2">
				<Terminal className="size-3.5 shrink-0 text-accent-lime" />
				<code className="font-mono text-xs text-fg-primary">aistack sync</code>
			</div>
		</div>
	);
}

// ===========================================================================
// Session state — one reconcile run, shared by all three.
// ===========================================================================

type Decision = "added" | "hidden";

export function useRun(state: StateKey) {
	const seed = STATES[state];
	const [open, setOpen] = useState<Suggestion[]>(seed.suggestions);
	const [added, setAdded] = useState<Suggestion[]>([]);
	const [hidden, setHidden] = useState<Dismissal[]>(seed.dismissed);
	const [notes, setNotes] = useState<Record<string, string>>({});

	const decide = useCallback(
		(s: Suggestion, d: Decision) => {
			setOpen((prev) => prev.filter((p) => p.atomKey !== s.atomKey));
			if (d === "added") setAdded((prev) => [s, ...prev]);
			else
				setHidden((prev) => [
					{
						atomKind: s.atomKind,
						atomKey: s.atomKey,
						label: s.label,
						ago: "just now",
					},
					...prev,
				]);
		},
		[],
	);

	const bringBack = useCallback((key: string) => {
		setHidden((prev) => prev.filter((p) => p.atomKey !== key));
	}, []);

	const setNote = useCallback((key: string, value: string) => {
		setNotes((n) => ({ ...n, [key]: value }));
	}, []);

	const total = seed.suggestions.length;
	const doneCount = total - open.length;

	return {
		...seed,
		open,
		added,
		hidden,
		notes,
		total,
		doneCount,
		decide,
		bringBack,
		setNote,
	};
}

export type Run = ReturnType<typeof useRun>;

// ===========================================================================
// The one-at-a-time card — E's deck, reworded. Shared by all three.
// ===========================================================================

function OneAtATime({
	run,
	queue,
	onClose,
	onFinish,
	label = "One at a time",
	/** H asks literal questions instead of showing a labelled card. */
	asQuestion,
}: {
	run: Run;
	queue: Suggestion[];
	onClose: () => void;
	onFinish: (decided: number) => void;
	label?: string;
	asQuestion?: boolean;
}) {
	const [idx, setIdx] = useState(0);
	const [marks, setMarks] = useState<Record<string, Decision>>({});

	const current = queue[idx];
	const done = idx >= queue.length;

	const answer = useCallback(
		(d: Decision) => {
			if (!current) return;
			setMarks((m) => ({ ...m, [current.atomKey]: d }));
			run.decide(current, d);
			setIdx((i) => i + 1);
		},
		[current, run],
	);

	useEffect(() => {
		if (done) onFinish(Object.keys(marks).length);
		// biome-ignore lint/correctness/useExhaustiveDependencies: fire once on completion, not on every mark
	}, [done]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			const typing =
				t &&
				(t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
			if (e.key === "Escape") {
				onClose();
				return;
			}
			if (done) return;
			if (e.key === "Enter") {
				e.preventDefault();
				answer("added");
				return;
			}
			if (typing) return;
			if (e.key === "n" || e.key === "N") answer("hidden");
			if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [answer, done, onClose]);

	if (done || !current) return null;

	const isModel = current.kind === "missing_from_authored";
	const note = run.notes[current.atomKey] ?? "";

	return (
		<div
			data-deck-open
			className="fixed inset-0 z-50 flex flex-col bg-bg-canvas/98 backdrop-blur"
		>
			<div className="flex items-center gap-4 border-b border-stroke-subtle px-6 py-4">
				<span className={cn(MONO_LABEL, "text-accent-lime")}>// {label}</span>
				<span className="font-mono text-xs text-fg-muted">
					{asQuestion ? "Question " : ""}
					{idx + 1} of {queue.length}
				</span>
				<div className="ml-auto flex items-center gap-4">
					<span className="hidden font-mono text-[11px] text-fg-muted sm:block">
						ENTER yes · N no · ← back · ESC stop
					</span>
					<button
						type="button"
						onClick={onClose}
						className="cursor-pointer text-fg-muted hover:text-fg-primary"
					>
						<X className="size-5" />
					</button>
				</div>
			</div>

			<div className="flex gap-1 px-6 py-3">
				{queue.map((q, i) => (
					<div
						key={q.atomKey}
						className={cn(
							"h-1 flex-1",
							i < idx
								? marks[q.atomKey] === "added"
									? "bg-accent-lime"
									: "bg-stroke-strong"
								: i === idx
									? "bg-accent-lime/50"
									: "bg-stroke-subtle",
						)}
					/>
				))}
			</div>

			<div className="flex flex-1 items-center justify-center px-6 pb-16">
				<div className="w-full max-w-2xl">
					{asQuestion ? (
						<h2 className="text-3xl font-black leading-tight tracking-tight text-fg-primary md:text-4xl">
							{isModel
								? `Do you want ${current.label} on your stack?`
								: `What do you use ${current.label} for?`}
						</h2>
					) : (
						<>
							<p className="mb-6 text-lg text-fg-secondary">
								{askLine(current)}
							</p>
							<div className="flex items-center gap-5">
								<Monogram
									label={current.label}
									tone={isModel ? "measured" : "authored"}
									size="lg"
								/>
								<h2 className="text-4xl font-black tracking-tight text-fg-primary md:text-5xl">
									{current.label}
								</h2>
							</div>
						</>
					)}

					{isModel && (
						<div className="mt-6 space-y-1">
							<p className="text-sm text-fg-secondary">{usageLine(current)}</p>
							{priceLine(current) && (
								<p className="font-mono text-xs text-fg-muted">
									{priceLine(current)}
								</p>
							)}
						</div>
					)}

					{isModel ? (
						<div className="mt-10 flex flex-wrap gap-3">
							<PBtn
								tone="primary"
								onClick={() => answer("added")}
								className="px-5 py-2.5"
							>
								<Plus className="size-3.5" /> Add it{" "}
								<span className="opacity-60">↵</span>
							</PBtn>
							<PBtn
								tone="danger"
								onClick={() => answer("hidden")}
								className="px-5 py-2.5"
							>
								<EyeOff className="size-3.5" /> Not mine, hide it{" "}
								<span className="opacity-60">N</span>
							</PBtn>
						</div>
					) : (
						<>
							<input
								// biome-ignore lint/a11y/noAutofocus: prototype; typing is the whole interaction here
								autoFocus
								value={note}
								onChange={(e) => run.setNote(current.atomKey, e.target.value)}
								placeholder="e.g. writing and reviewing code"
								className="mt-8 w-full border-b-2 border-stroke-strong bg-transparent px-1 py-3 text-xl text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
							/>
							<p className="mt-2 text-xs text-fg-muted">
								One line. Anyone looking at your stack will see it.
							</p>
							<div className="mt-8 flex flex-wrap gap-3">
								<PBtn
									tone="primary"
									onClick={() => answer("added")}
									className={cn(
										"px-5 py-2.5",
										!note.trim() && "pointer-events-none opacity-40",
									)}
								>
									Save it <span className="opacity-60">↵</span>
								</PBtn>
								<PBtn
									tone="danger"
									onClick={() => answer("hidden")}
									className="px-5 py-2.5"
								>
									Leave it blank <span className="opacity-60">N</span>
								</PBtn>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

// ===========================================================================
// Tabs — F's switcher, generalised. Counts live in the tab, plain nouns only.
// ===========================================================================

export function Tabs({
	tabs,
	active,
	onChange,
	size = "md",
}: {
	tabs: { key: string; label: string; count?: number; disabled?: boolean }[];
	active: string;
	onChange: (key: string) => void;
	size?: "md" | "lg";
}) {
	return (
		<div className="flex flex-wrap items-stretch border border-stroke-strong">
			{tabs.map((t) => (
				<button
					type="button"
					key={t.key}
					disabled={t.disabled}
					onClick={() => onChange(t.key)}
					className={cn(
						"inline-flex items-center gap-2 border-stroke-strong font-mono font-semibold uppercase tracking-[0.12em] transition-colors [&:not(:first-child)]:border-l",
						size === "md" ? "px-4 py-2 text-[11px]" : "px-5 py-3 text-xs",
						active === t.key
							? "bg-accent-lime text-accent-lime-contrast"
							: "text-fg-secondary hover:text-accent-lime",
						t.disabled
							? "cursor-not-allowed opacity-30 hover:text-fg-secondary"
							: "cursor-pointer",
					)}
				>
					{t.label}
					{t.count !== undefined && (
						<span className="opacity-60">({t.count})</span>
					)}
				</button>
			))}
		</div>
	);
}

// ===========================================================================
// Row renderers, shared by the tab panes.
// ===========================================================================

export function OpenRow({ run, s }: { run: Run; s: Suggestion }) {
	const isModel = s.kind === "missing_from_authored";
	const note = run.notes[s.atomKey] ?? "";
	return (
		<div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
			<div className="flex min-w-0 flex-1 items-center gap-4">
				<Monogram label={s.label} tone={isModel ? "measured" : "authored"} />
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-fg-primary">{s.label}</p>
					<p className="mt-0.5 text-sm text-fg-secondary">{askLine(s)}</p>
					{isModel && (
						<p className="mt-1 font-mono text-[11px] text-fg-muted">
							{usageLine(s)}
							{priceLine(s) ? ` · ${priceLine(s)}` : ""}
						</p>
					)}
					{!isModel && (
						<input
							value={note}
							onChange={(e) => run.setNote(s.atomKey, e.target.value)}
							placeholder="e.g. writing and reviewing code"
							className="mt-2 w-full border border-stroke-subtle bg-bg-canvas px-2.5 py-1.5 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
						/>
					)}
				</div>
			</div>
			<div className="flex shrink-0 gap-2 sm:self-end">
				<PBtn
					tone="primary"
					onClick={() => run.decide(s, "added")}
					className={cn(
						!isModel && !note.trim() && "pointer-events-none opacity-40",
					)}
				>
					{isModel ? (
						<>
							<Plus className="size-3" /> Add it
						</>
					) : (
						"Save it"
					)}
				</PBtn>
				<PBtn tone="danger" onClick={() => run.decide(s, "hidden")}>
					<EyeOff className="size-3" /> Hide
				</PBtn>
			</div>
		</div>
	);
}

export function Framed({ children }: { children: ReactNode }) {
	return (
		<div className="divide-y divide-stroke-subtle border border-stroke-subtle">
			{children}
		</div>
	);
}

export function HiddenPane({ run }: { run: Run }) {
	if (run.hidden.length === 0) {
		return (
			<p className="border border-stroke-subtle p-6 text-sm text-fg-secondary">
				Nothing hidden. Anything you say isn&apos;t yours ends up here, and you
				can always bring it back.
			</p>
		);
	}
	return (
		<Framed>
			{run.hidden.map((h) => (
				<div key={h.atomKey} className="flex items-center gap-3 px-4 py-3">
					<span className="flex-1 text-sm text-fg-secondary">{h.label}</span>
					<span className="font-mono text-[11px] text-fg-muted">{h.ago}</span>
					<PBtn tone="ghost" onClick={() => run.bringBack(h.atomKey)}>
						<RotateCcw className="size-3" /> Bring it back
					</PBtn>
				</div>
			))}
		</Framed>
	);
}

export function AddedPane({ run }: { run: Run }) {
	if (run.added.length === 0) {
		return (
			<p className="border border-stroke-subtle p-6 text-sm text-fg-secondary">
				Nothing added yet.
			</p>
		);
	}
	return (
		<Framed>
			{run.added.map((a) => (
				<div key={a.atomKey} className="flex items-center gap-3 px-4 py-3">
					<Check className="size-4 shrink-0 text-accent-lime" />
					<span className="flex-1 text-sm text-fg-primary">{a.label}</span>
					{run.notes[a.atomKey] && (
						<span className="text-sm text-fg-secondary">
							&ldquo;{run.notes[a.atomKey]}&rdquo;
						</span>
					)}
				</div>
			))}
		</Framed>
	);
}

function ToDoPane({ run, onStart }: { run: Run; onStart: () => void }) {
	if (run.open.length === 0) {
		return (
			<div className="border border-accent-lime/40 bg-accent-lime/5 p-8 text-center">
				<Check className="mx-auto mb-3 size-8 text-accent-lime" />
				<p className="text-lg font-bold text-fg-primary">
					{run.doneCount > 0 ? "That was all of them" : "Nothing to look at"}
				</p>
				<p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-secondary">
					{run.doneCount > 0
						? "Your stack now matches how you actually work."
						: `Your stack already matches what we saw ${run.receivedAgo}. We'll let you know when that changes.`}
				</p>
			</div>
		);
	}
	return (
		<>
			<div className="mb-6 flex flex-wrap items-center gap-4 border border-accent-lime/50 bg-accent-lime/5 px-5 py-4">
				<p className="min-w-0 flex-1 text-sm text-fg-secondary">
					Rather go through them one at a time?
				</p>
				<PBtn tone="primary" onClick={onStart}>
					Go one by one <ArrowRight className="size-3" />
				</PBtn>
			</div>
			<Framed>
				{run.open.map((s) => (
					<OpenRow key={s.atomKey} run={run} s={s} />
				))}
			</Framed>
		</>
	);
}

/** I's extra tab: everything we saw, read-only. */
export function WhatYouUsePane({ run }: { run: Run }) {
	if (!run.hasSnapshot) {
		return <NeverCheckedBox />;
	}
	return (
		<div className="space-y-8">
			<div className="grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle sm:grid-cols-4">
				{[
					["Sessions", String(SNAPSHOT_META.sessions)],
					["Days you worked", `${SNAPSHOT_META.activeDays} of 30`],
					["Looked at", "Last 30 days"],
					["Tool", "Claude Code"],
				].map(([k, v]) => (
					<div key={k} className="bg-bg-canvas px-4 py-3">
						<p className={cn(MONO_LABEL, "text-fg-muted")}>{k}</p>
						<p className="mt-1 font-mono text-sm text-fg-primary">{v}</p>
					</div>
				))}
			</div>

			<div>
				<p className={cn(MONO_LABEL, "mb-3 text-accent-lime")}>
					// models you ran
				</p>
				<Framed>
					{[
						{ name: "Claude Opus 5", pct: 62 },
						{ name: "Claude Sonnet 5", pct: 27 },
						{ name: "Claude Haiku 4.5", pct: 9 },
						{ name: "GPT-5.4", pct: 2 },
					].map((m) => (
						<div key={m.name} className="flex items-center gap-4 px-4 py-3">
							<Monogram label={m.name} tone="measured" />
							<span className="flex-1 text-sm text-fg-primary">{m.name}</span>
							<div className="h-1 w-24 bg-stroke-subtle">
								<div
									className="h-full bg-accent-lime"
									style={{ width: `${m.pct}%` }}
								/>
							</div>
							<span className="w-10 text-right font-mono text-xs text-fg-muted">
								{m.pct}%
							</span>
						</div>
					))}
				</Framed>
			</div>

			{/*
			 * The honest hole. #42 has not decided what may be named, so most of
			 * what someone runs shows up as a number. Putting it here, worded
			 * plainly, is the only way to see whether that reads as a promise
			 * kept or as a page with nothing on it.
			 */}
			<div>
				<p className={cn(MONO_LABEL, "mb-3 text-accent-lime")}>
					// everything else you ran
				</p>
				<Framed>
					{[
						["Built-in tools", "22 shown"],
						["Skills", "7 shown · 10 kept private"],
						["Sub-agents", "5 shown · 47 kept private"],
						["Slash commands", "5 shown · 8 kept private"],
						["Connected servers", "2 kept private"],
					].map(([k, v]) => (
						<div key={k} className="flex items-center gap-4 px-4 py-3">
							<span className="flex-1 text-sm text-fg-primary">{k}</span>
							<span className="font-mono text-xs text-fg-muted">{v}</span>
						</div>
					))}
				</Framed>
				<p className="mt-3 max-w-xl text-xs leading-relaxed text-fg-muted">
					Names only get published when we already know them to be public.
					Anything we don&apos;t recognise stays on your machine and is counted,
					never named.
				</p>
			</div>
		</div>
	);
}

// ===========================================================================
// G — WHAT'S CHANGED. E, reworded, with a tabbed results page after the run.
// ===========================================================================

export function VariantG({ state }: { state: StateKey }) {
	const run = useRun(state);
	const [view, setView] = useState<"card" | "run" | "results">("card");
	const [queue, setQueue] = useState<Suggestion[]>([]);
	const [tab, setTab] = useState("todo");
	const [justDid, setJustDid] = useState<number | null>(null);

	const start = () => {
		setQueue(run.open);
		setView("run");
	};

	if (view === "run") {
		return (
			<OneAtATime
				run={run}
				queue={queue}
				onClose={() => setView("results")}
				onFinish={(n) => {
					setJustDid(n);
					setTab(n > 0 ? "added" : "todo");
					setView("results");
				}}
			/>
		);
	}

	if (view === "results") {
		return (
			<div className="min-h-screen bg-bg-canvas px-6 py-12">
				<div className="mx-auto max-w-3xl">
					<button
						type="button"
						onClick={() => setView("card")}
						className={cn(
							MONO_LABEL,
							"mb-8 inline-flex cursor-pointer items-center gap-2 text-fg-muted hover:text-accent-lime",
						)}
					>
						<ArrowLeft className="size-3" />
						Alp&apos;s Stack
					</button>

					{justDid !== null && justDid > 0 && (
						<div className="mb-8 border border-accent-lime bg-accent-lime/10 px-5 py-4">
							<Check className="mb-2 size-5 text-accent-lime" />
							<p className="font-bold text-fg-primary">
								Done — you went through {justDid}{" "}
								{justDid === 1 ? "thing" : "things"}
							</p>
							<p className="mt-1 text-sm text-fg-secondary">
								Here&apos;s where everything landed. Nothing is final — you can
								change any of it.
							</p>
						</div>
					)}

					<h1 className="mb-2 text-3xl font-black uppercase tracking-tight text-fg-primary md:text-4xl">
						What&apos;s changed
					</h1>
					<div className="mb-8">
						<FreshLine
							hasSnapshot={run.hasSnapshot}
							isFresh={run.isFresh}
							receivedAgo={run.receivedAgo}
						/>
					</div>

					<div className="mb-8">
						<Tabs
							active={tab}
							onChange={setTab}
							tabs={[
								{ key: "todo", label: "To look at", count: run.open.length },
								{ key: "added", label: "Added", count: run.added.length },
								{ key: "hidden", label: "Hidden", count: run.hidden.length },
							]}
						/>
					</div>

					{tab === "todo" && <ToDoPane run={run} onStart={start} />}
					{tab === "added" && <AddedPane run={run} />}
					{tab === "hidden" && <HiddenPane run={run} />}
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-bg-canvas">
			<StackHeroStub />
			<div className="mx-auto max-w-7xl px-6 py-12">
				<div
					className={cn(
						"border p-6",
						run.open.length > 0
							? "border-accent-lime/50 bg-accent-lime/5"
							: "border-stroke-subtle",
					)}
				>
					<div className="flex flex-wrap items-center gap-x-6 gap-y-4">
						<div className="min-w-0 flex-1">
							<p className={cn(MONO_LABEL, "text-accent-lime")}>
								// from your machine
							</p>
							<p className="mt-2 text-xl font-bold text-fg-primary">
								{!run.hasSnapshot
									? "We haven't looked at your machine yet"
									: run.open.length === 0
										? "Your stack matches how you work"
										: `${run.open.length} ${run.open.length === 1 ? "thing" : "things"} to look at`}
							</p>
							<p className="mt-1 text-sm text-fg-secondary">
								{run.hasSnapshot
									? "We read your last 30 days of Claude Code and compared it to what you've listed."
									: "Once you run the check, anything that doesn't match shows up here."}
							</p>
							<div className="mt-2">
								<FreshLine
									hasSnapshot={run.hasSnapshot}
									isFresh={run.isFresh}
									receivedAgo={run.receivedAgo}
								/>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							{run.open.length > 0 && (
								<PBtn tone="primary" className="px-5 py-2.5" onClick={start}>
									Go through them <ArrowRight className="size-3.5" />
								</PBtn>
							)}
							<PBtn tone="ghost" onClick={() => setView("results")}>
								See everything
							</PBtn>
						</div>
					</div>

					{!run.hasSnapshot && (
						<div className="mt-6">
							<NeverCheckedBox dense />
						</div>
					)}
				</div>

				<p className="mt-12 font-mono text-xs text-fg-muted">
					// rest of the stack page looks exactly as a visitor sees it
				</p>
			</div>
		</div>
	);
}

// ===========================================================================
// H — FILL IN THE GAPS. A meter, not a queue. The deck asks real questions.
// ===========================================================================

function Meter({ filled, total }: { filled: number; total: number }) {
	const pct = total === 0 ? 100 : Math.round((filled / total) * 100);
	return (
		<div>
			<div className="flex items-baseline gap-3">
				<span className="font-mono text-4xl font-black leading-none text-fg-primary">
					{pct}%
				</span>
				<span className="text-sm text-fg-secondary">filled in</span>
			</div>
			<div className="mt-3 flex gap-1">
				{Array.from({ length: total }, (_, i) => (
					<div
						key={`seg-${total}-${i}`}
						className={cn(
							"h-2 flex-1",
							i < filled ? "bg-accent-lime" : "bg-stroke-subtle",
						)}
					/>
				))}
			</div>
		</div>
	);
}

export function VariantH({ state }: { state: StateKey }) {
	const run = useRun(state);
	const [view, setView] = useState<"card" | "run" | "results">("card");
	const [queue, setQueue] = useState<Suggestion[]>([]);
	const [tab, setTab] = useState("missing");

	// A stack "fully filled in" = every listed tool has a note and everything
	// measured is listed. Six known slots here; the meter counts against them.
	const SLOTS = 6;
	const filled = SLOTS - run.open.length;

	const start = () => {
		setQueue(run.open);
		setView("run");
	};

	if (view === "run") {
		return (
			<OneAtATime
				run={run}
				queue={queue}
				label="filling in the gaps"
				asQuestion
				onClose={() => setView("results")}
				onFinish={() => {
					setTab("missing");
					setView("results");
				}}
			/>
		);
	}

	if (view === "results") {
		return (
			<div className="min-h-screen bg-bg-canvas px-6 py-12">
				<div className="mx-auto max-w-3xl">
					<button
						type="button"
						onClick={() => setView("card")}
						className={cn(
							MONO_LABEL,
							"mb-8 inline-flex cursor-pointer items-center gap-2 text-fg-muted hover:text-accent-lime",
						)}
					>
						<ArrowLeft className="size-3" />
						Alp&apos;s Stack
					</button>

					<h1 className="mb-6 text-3xl font-black uppercase tracking-tight text-fg-primary md:text-4xl">
						How complete your stack is
					</h1>

					{/* The meter stays put — that's H's whole argument. */}
					<div className="mb-8 border border-stroke-subtle p-6">
						<Meter filled={filled} total={SLOTS} />
						<p className="mt-4 text-sm text-fg-secondary">
							{run.open.length === 0
								? "Nothing left to fill in. Your stack says everything it can."
								: `${run.open.length} ${run.open.length === 1 ? "gap" : "gaps"} left — about a minute's work.`}
						</p>
						<div className="mt-4">
							<FreshLine
								hasSnapshot={run.hasSnapshot}
								isFresh={run.isFresh}
								receivedAgo={run.receivedAgo}
							/>
						</div>
					</div>

					<div className="mb-8">
						<Tabs
							active={tab}
							onChange={setTab}
							tabs={[
								{ key: "missing", label: "Still missing", count: run.open.length },
								{ key: "done", label: "Filled in", count: run.added.length },
								{ key: "hidden", label: "Hidden", count: run.hidden.length },
							]}
						/>
					</div>

					{tab === "missing" && <ToDoPane run={run} onStart={start} />}
					{tab === "done" && <AddedPane run={run} />}
					{tab === "hidden" && <HiddenPane run={run} />}
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-bg-canvas">
			<StackHeroStub />
			<div className="mx-auto max-w-7xl px-6 py-12">
				<div
					className={cn(
						"border p-6",
						run.open.length > 0
							? "border-accent-lime/50 bg-accent-lime/5"
							: "border-stroke-subtle",
					)}
				>
					<div className="flex flex-wrap items-center gap-x-8 gap-y-5">
						<div className="min-w-[14rem] flex-1">
							<p className={cn(MONO_LABEL, "mb-3 text-accent-lime")}>
								// your stack
							</p>
							<Meter filled={filled} total={SLOTS} />
						</div>
						<div className="min-w-[16rem] flex-1">
							<p className="text-sm leading-relaxed text-fg-secondary">
								{!run.hasSnapshot
									? "We haven't looked at your machine yet, so we can only see the notes you're missing."
									: run.open.length === 0
										? "Everything you use is listed, and everything listed says what it's for."
										: `${run.open.length === 6 ? "Four tools have no note, and two things you use aren't listed." : "A few things still need an answer."} Each one is a single question.`}
							</p>
							<div className="mt-3">
								<FreshLine
									hasSnapshot={run.hasSnapshot}
									isFresh={run.isFresh}
									receivedAgo={run.receivedAgo}
								/>
							</div>
							<div className="mt-4 flex flex-wrap gap-2">
								{run.open.length > 0 && (
									<PBtn tone="primary" className="px-5 py-2.5" onClick={start}>
										Fill in the gaps <ArrowRight className="size-3.5" />
									</PBtn>
								)}
								<PBtn tone="ghost" onClick={() => setView("results")}>
									See details
								</PBtn>
							</div>
						</div>
					</div>

					{!run.hasSnapshot && (
						<div className="mt-6">
							<NeverCheckedBox dense />
						</div>
					)}
				</div>

				<p className="mt-12 font-mono text-xs text-fg-muted">
					// rest of the stack page looks exactly as a visitor sees it
				</p>
			</div>
		</div>
	);
}

// ===========================================================================
// I — COMPARE. The tabs are the surface, and one of them is what you use.
// ===========================================================================

export function VariantI({ state }: { state: StateKey }) {
	const run = useRun(state);
	const [view, setView] = useState<"card" | "run" | "page">("card");
	const [queue, setQueue] = useState<Suggestion[]>([]);
	const [tab, setTab] = useState("diff");

	const start = () => {
		setQueue(run.open);
		setView("run");
	};

	if (view === "run") {
		return (
			<OneAtATime
				run={run}
				queue={queue}
				onClose={() => setView("page")}
				onFinish={() => setView("page")}
			/>
		);
	}

	if (view === "page") {
		return (
			<div className="min-h-screen bg-bg-canvas px-6 py-12">
				<div className="mx-auto max-w-3xl">
					<button
						type="button"
						onClick={() => setView("card")}
						className={cn(
							MONO_LABEL,
							"mb-8 inline-flex cursor-pointer items-center gap-2 text-fg-muted hover:text-accent-lime",
						)}
					>
						<ArrowLeft className="size-3" />
						Alp&apos;s Stack
					</button>

					<h1 className="mb-2 text-3xl font-black uppercase tracking-tight text-fg-primary md:text-4xl">
						How you work
					</h1>
					<p className="mb-3 max-w-2xl text-sm leading-relaxed text-fg-secondary">
						What we saw on your machine, next to what you&apos;ve listed. Only
						you can see this page.
					</p>
					<div className="mb-8">
						<FreshLine
							hasSnapshot={run.hasSnapshot}
							isFresh={run.isFresh}
							receivedAgo={run.receivedAgo}
						/>
					</div>

					{/* Tabs are the primary navigation here, so they get the big size. */}
					<div className="mb-8">
						<Tabs
							size="lg"
							active={tab}
							onChange={setTab}
							tabs={[
								{
									key: "diff",
									label: "Doesn't match",
									count: run.open.length,
								},
								{ key: "use", label: "What you use" },
								{ key: "hidden", label: "Hidden", count: run.hidden.length },
							]}
						/>
					</div>

					{tab === "diff" && <ToDoPane run={run} onStart={start} />}
					{tab === "use" && <WhatYouUsePane run={run} />}
					{tab === "hidden" && <HiddenPane run={run} />}
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-bg-canvas">
			<StackHeroStub />
			<div className="mx-auto max-w-7xl px-6 py-12">
				<div
					className={cn(
						"border p-6",
						run.open.length > 0
							? "border-accent-lime/50 bg-accent-lime/5"
							: "border-stroke-subtle",
					)}
				>
					<div className="flex flex-wrap items-center gap-x-6 gap-y-4">
						<div className="min-w-0 flex-1">
							<p className={cn(MONO_LABEL, "text-accent-lime")}>
								// only you can see this
							</p>
							<p className="mt-2 text-xl font-bold text-fg-primary">
								{!run.hasSnapshot
									? "We haven't looked at your machine yet"
									: run.open.length === 0
										? "What you use and what you've listed match"
										: `${run.open.length} ${run.open.length === 1 ? "thing doesn't" : "things don't"} match what you've listed`}
							</p>
							<div className="mt-2">
								<FreshLine
									hasSnapshot={run.hasSnapshot}
									isFresh={run.isFresh}
									receivedAgo={run.receivedAgo}
								/>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							{run.open.length > 0 && (
								<PBtn tone="primary" className="px-5 py-2.5" onClick={start}>
									Go one by one <ArrowRight className="size-3.5" />
								</PBtn>
							)}
							<PBtn
								tone="ghost"
								onClick={() => {
									setTab(run.open.length > 0 ? "diff" : "use");
									setView("page");
								}}
							>
								How you work
							</PBtn>
						</div>
					</div>

					{!run.hasSnapshot && (
						<div className="mt-6">
							<NeverCheckedBox dense />
						</div>
					)}
				</div>

				<p className="mt-12 font-mono text-xs text-fg-muted">
					// rest of the stack page looks exactly as a visitor sees it
				</p>
			</div>
		</div>
	);
}
