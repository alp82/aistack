/**
 * PROTOTYPE — A × C combinations for the reconcile surface
 * ---------------------------------------------------------------------------
 * Wayfinder ticket #39 (map #29). THROWAWAY. Round 2.
 *
 * Round 1 produced A (inbox — a destination you clear) and C (deck — a focused
 * session you finish). The owner liked A's overview AND C's review process, so
 * this file asks the only question that remains once you want both:
 *
 *     WHICH ONE DO YOU LAND ON, AND WHO OWNS THE DECISION?
 *
 * That is not a cosmetic choice. Each arrangement makes a different thing the
 * source of truth, and they diverge hardest in exactly the states the ticket
 * asks about — `clear` and `presync`, where one of the two halves has nothing
 * to say.
 *
 *   D  INBOX-FIRST  — the list is home; the deck is an accelerator over it.
 *                     "Here's everything. Want to power through?"
 *                     Deck exits back into the list, which stays authoritative.
 *
 *   E  DECK-FIRST   — the deck is home; the list is the ledger you consult
 *                     afterwards. "Just give me the next decision."
 *                     The list is read-mostly: undo, re-edit, audit.
 *
 *   F  PEERS        — one surface, two lenses, a LIST/FOCUS toggle in its own
 *                     header. Neither is the entry; the last mode is sticky.
 *                     Focus always opens on the row the list has selected, and
 *                     returns you to it — like a mail client's reading pane.
 *
 * Everything upstream stays locked (#33/#34): derived on read, dismissals are
 * the only persisted state, what-for writes straight to the authored layer,
 * LLM-free, catalog slugs only, not the stack editor.
 * ---------------------------------------------------------------------------
 */
import {
	ArrowLeft,
	ArrowRight,
	Check,
	ChevronRight,
	List,
	Plus,
	RotateCcw,
	Target,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
	type Dismissal,
	MONO_LABEL,
	Monogram,
	PBtn,
	SNAPSHOT_META,
	ShareBar,
	type StateKey,
	STATES,
	StackHeroStub,
	type Suggestion,
	SyncCta,
	SyncStamp,
} from "./reconcile-shared";

// ===========================================================================
// One reconcile session's worth of state, shared by all three arrangements.
// Extracted because the WHOLE POINT of these variants is that the list and the
// deck are two views of the SAME state — if each kept its own, switching would
// lose drafts and that would be the arrangement's fault, not the design's.
// ===========================================================================

function useReconcileSession(state: StateKey) {
	const seed = STATES[state];
	const [open, setOpen] = useState<Suggestion[]>(seed.suggestions);
	const [dismissed, setDismissed] = useState<Dismissal[]>(seed.dismissed);
	const [drafts, setDrafts] = useState<Record<string, string>>({});
	const [resolvedCount, setResolvedCount] = useState(0);

	useEffect(() => {
		setOpen(STATES[state].suggestions);
		setDismissed(STATES[state].dismissed);
		setDrafts({});
		setResolvedCount(0);
	}, [state]);

	const resolve = useCallback(
		(sug: Suggestion, asDismissal: boolean) => {
			setOpen((prev) => prev.filter((p) => p.atomKey !== sug.atomKey));
			setResolvedCount((c) => c + 1);
			if (asDismissal) {
				setDismissed((prev) => [
					{
						atomKind: sug.atomKind,
						atomKey: sug.atomKey,
						label: sug.label,
						ago: "just now",
					},
					...prev,
				]);
			}
		},
		[],
	);

	const undismiss = useCallback((key: string) => {
		setDismissed((prev) => prev.filter((p) => p.atomKey !== key));
	}, []);

	const setDraft = useCallback((key: string, value: string) => {
		setDrafts((d) => ({ ...d, [key]: value }));
	}, []);

	return {
		...seed,
		open,
		dismissed,
		drafts,
		resolvedCount,
		resolve,
		undismiss,
		setDraft,
	};
}

type Session = ReturnType<typeof useReconcileSession>;

// ===========================================================================
// The LIST lens — A's worklist, factored so all three can mount it.
// ===========================================================================

function ListLens({
	session,
	onFocus,
	focusLabel = "Review all",
	selectedKey,
	onSelect,
	showStats = true,
}: {
	session: Session;
	/** Absent = this arrangement has no deck to hand off to. */
	onFocus?: (startKey?: string) => void;
	focusLabel?: string;
	selectedKey?: string | null;
	onSelect?: (key: string) => void;
	showStats?: boolean;
}) {
	const models = session.open.filter(
		(o) => o.kind === "missing_from_authored",
	);
	const whatFors = session.open.filter((o) => o.kind === "missing_what_for");

	return (
		<div>
			{showStats && session.hasSnapshot && (
				<div className="mb-10 grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle sm:grid-cols-4">
					{[
						["harness", SNAPSHOT_META.harness],
						["sessions", String(SNAPSHOT_META.sessions)],
						["active days", `${SNAPSHOT_META.activeDays} / 30`],
						["window", "30 days"],
					].map(([k, v]) => (
						<div key={k} className="bg-bg-canvas px-4 py-3">
							<p className={cn(MONO_LABEL, "text-fg-muted")}>{k}</p>
							<p className="mt-1 font-mono text-sm text-fg-primary">{v}</p>
						</div>
					))}
				</div>
			)}

			{!session.hasSnapshot && (
				<div className="mb-10">
					<SyncCta />
				</div>
			)}

			{/* The accelerator. Only rendered when there IS a deck behind it. */}
			{onFocus && session.open.length > 0 && (
				<div className="mb-8 flex flex-wrap items-center gap-4 border border-accent-lime/50 bg-accent-lime/5 px-5 py-4">
					<div className="min-w-0 flex-1">
						<p className="font-semibold text-fg-primary">
							{session.open.length}{" "}
							{session.open.length === 1 ? "decision" : "decisions"} waiting
						</p>
						<p className="mt-0.5 text-sm text-fg-secondary">
							Take them one at a time, keyboard-first — or act on any row below.
						</p>
					</div>
					<PBtn
						tone="primary"
						onClick={() => onFocus()}
						className="px-5 py-2.5"
					>
						{focusLabel} <ArrowRight className="size-3.5" />
					</PBtn>
				</div>
			)}

			{models.length > 0 && (
				<section className="mb-12">
					<h2 className={cn(MONO_LABEL, "mb-4 text-accent-lime")}>
						// measured, not on your stack ({models.length})
					</h2>
					<div className="border border-stroke-subtle">
						{models.map((m, i) => (
							<div
								key={m.atomKey}
								onMouseEnter={() => onSelect?.(m.atomKey)}
								className={cn(
									"flex items-center gap-4 px-4 py-4 transition-colors",
									i > 0 && "border-t border-stroke-subtle",
									selectedKey === m.atomKey && "bg-accent-lime/5",
								)}
							>
								{selectedKey === m.atomKey && (
									<span className="-ml-4 h-9 w-0.5 bg-accent-lime" />
								)}
								<Monogram label={m.label} tone="measured" />
								<div className="min-w-0 flex-1">
									<p className="font-semibold text-fg-primary">{m.label}</p>
									{m.tokenShare !== undefined && (
										<div className="mt-1.5">
											<ShareBar share={m.tokenShare} />
										</div>
									)}
								</div>
								<div className="flex shrink-0 gap-2">
									{onFocus && (
										<PBtn tone="ghost" onClick={() => onFocus(m.atomKey)}>
											<Target className="size-3" />
										</PBtn>
									)}
									<PBtn
										tone="primary"
										onClick={() => session.resolve(m, false)}
									>
										<Plus className="size-3" /> Add
									</PBtn>
									<PBtn tone="danger" onClick={() => session.resolve(m, true)}>
										<X className="size-3" /> Dismiss
									</PBtn>
								</div>
							</div>
						))}
					</div>
				</section>
			)}

			{whatFors.length > 0 && (
				<section className="mb-12">
					<h2 className={cn(MONO_LABEL, "mb-4 text-accent-lime")}>
						// no what-for yet ({whatFors.length})
					</h2>
					<div className="border border-stroke-subtle">
						{whatFors.map((w, i) => (
							<div
								key={w.atomKey}
								onMouseEnter={() => onSelect?.(w.atomKey)}
								className={cn(
									"flex flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:items-center",
									i > 0 && "border-t border-stroke-subtle",
									selectedKey === w.atomKey && "bg-accent-lime/5",
								)}
							>
								<div className="flex min-w-0 flex-1 items-center gap-4">
									<Monogram label={w.label} tone="authored" />
									<div className="min-w-0 flex-1">
										<p className="mb-1.5 font-semibold text-fg-primary">
											{w.label}
										</p>
										<input
											value={session.drafts[w.atomKey] ?? ""}
											onChange={(e) => session.setDraft(w.atomKey, e.target.value)}
											placeholder="What do you use it for?"
											className="w-full border border-stroke-subtle bg-bg-canvas px-2.5 py-1.5 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
										/>
									</div>
								</div>
								<div className="flex shrink-0 gap-2 sm:self-end">
									{onFocus && (
										<PBtn tone="ghost" onClick={() => onFocus(w.atomKey)}>
											<Target className="size-3" />
										</PBtn>
									)}
									<PBtn
										tone="primary"
										onClick={() => session.resolve(w, false)}
										className={cn(
											!(session.drafts[w.atomKey] ?? "").trim() &&
												"pointer-events-none opacity-40",
										)}
									>
										<Check className="size-3" /> Save
									</PBtn>
									<PBtn tone="danger" onClick={() => session.resolve(w, true)}>
										Skip
									</PBtn>
								</div>
							</div>
						))}
					</div>
				</section>
			)}

			{session.open.length === 0 && session.hasSnapshot && (
				<div className="mb-12 border border-accent-lime/40 bg-accent-lime/5 p-8 text-center">
					<Check className="mx-auto mb-3 size-8 text-accent-lime" />
					<p className="text-lg font-bold text-fg-primary">
						{session.resolvedCount > 0
							? "That's all of them"
							: "Nothing to reconcile"}
					</p>
					<p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-secondary">
						{session.resolvedCount > 0
							? `${session.resolvedCount} decided just now. Your authored stack matches what was measured.`
							: `Your authored stack matches what was measured ${session.receivedAgo}. This fills itself the next time your usage drifts from what you wrote down.`}
					</p>
				</div>
			)}

			<DismissedDrawer session={session} />
		</div>
	);
}

function DismissedDrawer({
	session,
	defaultOpen,
}: {
	session: Session;
	defaultOpen?: boolean;
}) {
	const [show, setShow] = useState(defaultOpen ?? false);
	if (session.dismissed.length === 0) return null;
	return (
		<div className="border border-stroke-subtle">
			<button
				type="button"
				aria-expanded={show}
				onClick={() => setShow((v) => !v)}
				className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left hover:bg-bg-panel/40"
			>
				<ChevronRight
					className={cn(
						"size-3 text-fg-muted transition-transform",
						show && "rotate-90",
					)}
				/>
				<span className={cn(MONO_LABEL, "text-fg-muted")}>
					Dismissed ({session.dismissed.length})
				</span>
			</button>
			{show && (
				<div className="border-t border-stroke-subtle">
					{session.dismissed.map((d) => (
						<div key={d.atomKey} className="flex items-center gap-3 px-4 py-3">
							<span className="font-mono text-xs text-fg-muted">
								{d.atomKind}
							</span>
							<span className="flex-1 text-sm text-fg-secondary">{d.label}</span>
							<span className="font-mono text-[11px] text-fg-muted">
								{d.ago}
							</span>
							<PBtn tone="ghost" onClick={() => session.undismiss(d.atomKey)}>
								<RotateCcw className="size-3" /> Undo
							</PBtn>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

// ===========================================================================
// The FOCUS lens — C's deck, factored. `queue` is passed in so each
// arrangement decides what "the queue" means.
// ===========================================================================

function FocusLens({
	session,
	queue,
	startKey,
	onExit,
	onDone,
	chromeless,
}: {
	session: Session;
	queue: Suggestion[];
	startKey?: string | null;
	onExit: () => void;
	/** Rendered instead of the built-in summary when the arrangement owns it. */
	onDone?: (decided: number) => void;
	/** F embeds the lens in the page instead of overlaying it. */
	chromeless?: boolean;
}) {
	const startIdx = useMemo(() => {
		if (!startKey) return 0;
		const i = queue.findIndex((q) => q.atomKey === startKey);
		return i >= 0 ? i : 0;
	}, [queue, startKey]);

	const [idx, setIdx] = useState(startIdx);
	const [decisions, setDecisions] = useState<Record<string, "added" | "dismissed">>(
		{},
	);

	const current = queue[idx];
	const done = idx >= queue.length;

	const decide = useCallback(
		(action: "added" | "dismissed") => {
			if (!current) return;
			setDecisions((d) => ({ ...d, [current.atomKey]: action }));
			session.resolve(current, action === "dismissed");
			setIdx((i) => i + 1);
		},
		[current, session],
	);

	useEffect(() => {
		if (done && onDone) onDone(Object.keys(decisions).length);
	}, [done, onDone, decisions]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			const typing =
				t &&
				(t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
			if (e.key === "Escape") {
				e.stopPropagation();
				onExit();
				return;
			}
			if (done) return;
			if (e.key === "Enter") {
				e.preventDefault();
				decide("added");
				return;
			}
			if (typing) return;
			if (e.key === "d" || e.key === "D") decide("dismissed");
			if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
		};
		window.addEventListener("keydown", onKey, true);
		return () => window.removeEventListener("keydown", onKey, true);
	}, [decide, done, onExit]);

	const body = (
		<>
			<div className="flex items-center gap-4 border-b border-stroke-subtle px-6 py-4">
				<span className={cn(MONO_LABEL, "text-accent-lime")}>// focus</span>
				{!done && (
					<span className="font-mono text-xs text-fg-muted">
						{idx + 1} / {queue.length}
					</span>
				)}
				<div className="ml-auto flex items-center gap-4">
					<span className="hidden font-mono text-[11px] text-fg-muted sm:block">
						ENTER add · D dismiss · ← back · ESC {chromeless ? "list" : "close"}
					</span>
					<button
						type="button"
						onClick={onExit}
						className="cursor-pointer text-fg-muted hover:text-fg-primary"
					>
						{chromeless ? <List className="size-5" /> : <X className="size-5" />}
					</button>
				</div>
			</div>

			<div className="flex gap-1 px-6 py-3">
				{queue.map((o, i) => (
					<div
						key={o.atomKey}
						className={cn(
							"h-1 flex-1",
							i < idx
								? decisions[o.atomKey] === "added"
									? "bg-accent-lime"
									: "bg-stroke-strong"
								: i === idx
									? "bg-accent-lime/50"
									: "bg-stroke-subtle",
						)}
					/>
				))}
			</div>

			<div
				className={cn(
					"flex items-center justify-center px-6",
					chromeless ? "min-h-[26rem] py-10" : "flex-1 pb-16",
				)}
			>
				{!done && current && (
					<div className="w-full max-w-2xl">
						<p className={cn(MONO_LABEL, "mb-6 text-fg-muted")}>
							{current.kind === "missing_from_authored"
								? "// measured, not on your stack"
								: "// on your stack, no what-for"}
						</p>
						<div className="flex items-center gap-5">
							<Monogram
								label={current.label}
								tone={
									current.kind === "missing_from_authored"
										? "measured"
										: "authored"
								}
								size="lg"
							/>
							<h2 className="text-4xl font-black tracking-tight text-fg-primary md:text-5xl">
								{current.label}
							</h2>
						</div>

						{current.tokenShare !== undefined && (
							<div className="mt-6">
								<ShareBar share={current.tokenShare} />
								{current.hint && (
									<p className="mt-2 font-mono text-xs text-fg-muted">
										{current.hint}
									</p>
								)}
							</div>
						)}

						{current.kind === "missing_what_for" ? (
							<>
								<input
									// biome-ignore lint/a11y/noAutofocus: prototype; the deck is keyboard-first by design
									autoFocus
									value={session.drafts[current.atomKey] ?? ""}
									onChange={(e) =>
										session.setDraft(current.atomKey, e.target.value)
									}
									placeholder="What do you use it for?"
									className="mt-8 w-full border-b-2 border-stroke-strong bg-transparent px-1 py-3 text-xl text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
								/>
								<div className="mt-8 flex gap-3">
									<PBtn
										tone="primary"
										onClick={() => decide("added")}
										className={cn(
											"px-5 py-2.5",
											!(session.drafts[current.atomKey] ?? "").trim() &&
												"pointer-events-none opacity-40",
										)}
									>
										Save <span className="opacity-60">↵</span>
									</PBtn>
									<PBtn
										tone="danger"
										onClick={() => decide("dismissed")}
										className="px-5 py-2.5"
									>
										Skip forever <span className="opacity-60">D</span>
									</PBtn>
								</div>
							</>
						) : (
							<div className="mt-10 flex gap-3">
								<PBtn
									tone="primary"
									onClick={() => decide("added")}
									className="px-5 py-2.5"
								>
									<Plus className="size-3.5" /> Add to stack{" "}
									<span className="opacity-60">↵</span>
								</PBtn>
								<PBtn
									tone="danger"
									onClick={() => decide("dismissed")}
									className="px-5 py-2.5"
								>
									<X className="size-3.5" /> Not mine{" "}
									<span className="opacity-60">D</span>
								</PBtn>
							</div>
						)}
					</div>
				)}

				{done && !onDone && (
					<div className="w-full max-w-2xl">
						<Check className="mb-4 size-10 text-accent-lime" />
						<h2 className="text-3xl font-black uppercase tracking-tight text-fg-primary">
							Reconciled
						</h2>
						<p className="mt-3 text-fg-secondary">
							{Object.values(decisions).filter((d) => d === "added").length}{" "}
							added,{" "}
							{Object.values(decisions).filter((d) => d === "dismissed").length}{" "}
							dismissed.
						</p>
						<div className="mt-8">
							<PBtn tone="ghost" onClick={onExit} className="px-5 py-2.5">
								Back
							</PBtn>
						</div>
					</div>
				)}
			</div>
		</>
	);

	if (chromeless) return <div className="border border-stroke-subtle">{body}</div>;

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-bg-canvas/98 backdrop-blur">
			{body}
		</div>
	);
}

// ===========================================================================
// D — INBOX-FIRST. The list is home. The deck is a power tool over it.
// ===========================================================================

export function VariantD({ state }: { state: StateKey }) {
	const session = useReconcileSession(state);
	const [deck, setDeck] = useState<{ startKey?: string } | null>(null);
	const [flash, setFlash] = useState<number | null>(null);

	// The deck's queue is a SNAPSHOT taken at open. Recomputing it live would
	// make the list shift under the deck as rows resolve.
	const [queue, setQueue] = useState<Suggestion[]>([]);

	return (
		<div className="min-h-screen bg-bg-canvas">
			{/* How it's reached: a banner on the stack page. */}
			<StackHeroStub>
				<div className="mt-6 flex flex-wrap items-center gap-4 border border-accent-lime/50 bg-accent-lime/5 px-4 py-3">
					<span className={cn(MONO_LABEL, "text-accent-lime")}>
						// owner only
					</span>
					<span className="text-sm text-fg-secondary">
						{session.open.length > 0
							? `${session.open.length} things to reconcile`
							: "Measured layer up to date"}
					</span>
					<span className="ml-auto flex items-center gap-3">
						<SyncStamp
							hasSnapshot={session.hasSnapshot}
							isFresh={session.isFresh}
							receivedAgo={session.receivedAgo}
							compact
						/>
						<PBtn tone="ghost">
							Open reconcile <ArrowRight className="size-3" />
						</PBtn>
					</span>
				</div>
			</StackHeroStub>

			<div className="mx-auto max-w-3xl px-6 py-12">
				<button
					type="button"
					className={cn(
						MONO_LABEL,
						"mb-8 inline-flex cursor-pointer items-center gap-2 text-fg-muted hover:text-accent-lime",
					)}
				>
					<ArrowLeft className="size-3" />
					Alp&apos;s Stack
				</button>

				<div className="mb-2 flex items-baseline justify-between gap-4">
					<h1 className="text-3xl font-black uppercase tracking-tight text-fg-primary md:text-4xl">
						Reconcile
					</h1>
					<SyncStamp
						hasSnapshot={session.hasSnapshot}
						isFresh={session.isFresh}
						receivedAgo={session.receivedAgo}
					/>
				</div>
				<p className="mb-10 max-w-2xl text-sm leading-relaxed text-fg-secondary">
					What your machine measured, against what you wrote down. Nothing is
					published until you say so — and nothing you dismiss comes back.
				</p>

				{flash !== null && (
					<div className="mb-8 flex items-center gap-3 border border-accent-lime bg-accent-lime/10 px-4 py-3">
						<Check className="size-4 shrink-0 text-accent-lime" />
						<span className="text-sm text-fg-primary">
							{flash} {flash === 1 ? "decision" : "decisions"} recorded.
						</span>
						<button
							type="button"
							onClick={() => setFlash(null)}
							className="ml-auto cursor-pointer text-fg-muted hover:text-fg-primary"
						>
							<X className="size-4" />
						</button>
					</div>
				)}

				<ListLens
					session={session}
					focusLabel={`Review all ${session.open.length}`}
					onFocus={(startKey) => {
						setQueue(session.open);
						setFlash(null);
						setDeck({ startKey });
					}}
				/>
			</div>

			{deck && (
				<FocusLens
					session={session}
					queue={queue}
					startKey={deck.startKey}
					onExit={() => setDeck(null)}
					onDone={(n) => {
						setDeck(null);
						setFlash(n);
					}}
				/>
			)}
		</div>
	);
}

// ===========================================================================
// E — DECK-FIRST. The deck is home. The list is the ledger you consult after.
// ===========================================================================

export function VariantE({ state }: { state: StateKey }) {
	const session = useReconcileSession(state);
	const [view, setView] = useState<"card" | "deck" | "ledger">("card");
	const [queue, setQueue] = useState<Suggestion[]>([]);
	const [lastRun, setLastRun] = useState<number | null>(null);

	useEffect(() => {
		setView("card");
		setLastRun(null);
	}, [state]);

	if (view === "deck") {
		return (
			<FocusLens
				session={session}
				queue={queue}
				onExit={() => setView("card")}
				onDone={(n) => {
					setLastRun(n);
					setView("ledger");
				}}
			/>
		);
	}

	if (view === "ledger") {
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

					{lastRun !== null && (
						<div className="mb-8 border border-accent-lime bg-accent-lime/10 px-5 py-4">
							<Check className="mb-2 size-5 text-accent-lime" />
							<p className="font-bold text-fg-primary">
								{lastRun} {lastRun === 1 ? "decision" : "decisions"} recorded
							</p>
							<p className="mt-1 text-sm text-fg-secondary">
								Everything below is the ledger — what you decided, and what you
								can still take back.
							</p>
						</div>
					)}

					<h1 className="mb-2 text-3xl font-black uppercase tracking-tight text-fg-primary">
						Ledger
					</h1>
					<p className="mb-10 max-w-2xl text-sm leading-relaxed text-fg-secondary">
						Read-mostly. The review is where decisions get made; this is where
						you check what you decided and undo the ones you regret.
					</p>

					{/* No onFocus: the ledger deliberately does NOT relaunch the deck
					    from a row. The deck is entered from the stack page, once. */}
					<ListLens session={session} showStats={false} />

					{session.open.length > 0 && (
						<div className="mt-8">
							<PBtn
								tone="primary"
								className="px-5 py-2.5"
								onClick={() => {
									setQueue(session.open);
									setView("deck");
								}}
							>
								Review the remaining {session.open.length}{" "}
								<ArrowRight className="size-3.5" />
							</PBtn>
						</div>
					)}
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
						session.open.length > 0
							? "border-accent-lime/50 bg-accent-lime/5"
							: "border-stroke-subtle",
					)}
				>
					<div className="flex flex-wrap items-center gap-x-6 gap-y-4">
						<div className="min-w-0 flex-1">
							<p className={cn(MONO_LABEL, "text-accent-lime")}>
								// measured layer
							</p>
							<p className="mt-2 text-xl font-bold text-fg-primary">
								{!session.hasSnapshot
									? "Nothing measured yet"
									: session.open.length === 0
										? "Your stack matches what you measured"
										: `${session.open.length} ${
												session.open.length === 1
													? "difference"
													: "differences"
											} between measured and authored`}
							</p>
							<div className="mt-2">
								<SyncStamp
									hasSnapshot={session.hasSnapshot}
									isFresh={session.isFresh}
									receivedAgo={session.receivedAgo}
								/>
							</div>
						</div>
						<div className="flex gap-2">
							{session.open.length > 0 && (
								<PBtn
									tone="primary"
									className="px-5 py-2.5"
									onClick={() => {
										setQueue(session.open);
										setView("deck");
									}}
								>
									Start review <ArrowRight className="size-3.5" />
								</PBtn>
							)}
							<PBtn tone="ghost" onClick={() => setView("ledger")}>
								<List className="size-3" /> Ledger
								{session.dismissed.length > 0 &&
									` (${session.dismissed.length})`}
							</PBtn>
						</div>
					</div>

					{!session.hasSnapshot && (
						<div className="mt-6">
							<SyncCta dense />
						</div>
					)}
				</div>

				<p className="mt-12 font-mono text-xs text-fg-muted">
					// rest of the stack page renders exactly as a visitor sees it
				</p>
			</div>
		</div>
	);
}

// ===========================================================================
// F — PEERS. One surface, two lenses, sticky mode. Neither is the entry.
// ===========================================================================

export function VariantF({ state }: { state: StateKey }) {
	const session = useReconcileSession(state);
	const [mode, setMode] = useState<"list" | "focus">("list");
	const [selected, setSelected] = useState<string | null>(null);

	useEffect(() => {
		setMode("list");
		setSelected(null);
	}, [state]);

	// The queue is SNAPSHOT when focus opens, not the live `session.open`.
	// Live looks right on paper — same surface, two lenses — but the deck also
	// advances its own index, so a shrinking array plus an advancing cursor
	// skips every other item and calls itself finished at the halfway mark.
	// Re-snapshotting on each entry is what actually makes the lenses agree:
	// rows resolved inline in LIST are simply gone the next time FOCUS opens.
	const [queue, setQueue] = useState<Suggestion[]>([]);

	const enterFocus = useCallback(
		(key?: string) => {
			if (key) setSelected(key);
			setQueue(session.open);
			setMode("focus");
		},
		[session.open],
	);

	// Keep the selection valid as rows resolve, so ESC always lands somewhere.
	useEffect(() => {
		if (selected && !session.open.some((o) => o.atomKey === selected)) {
			setSelected(session.open[0]?.atomKey ?? null);
		}
	}, [session.open, selected]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			if (
				t &&
				(t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
			)
				return;
			if (mode === "list" && (e.key === "f" || e.key === "F")) {
				if (session.open.length > 0) enterFocus();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [mode, session.open.length, enterFocus]);

	return (
		<div className="min-h-screen bg-bg-canvas">
			<StackHeroStub>
				<div className="mt-6 flex flex-wrap items-center gap-4 border border-accent-lime/50 bg-accent-lime/5 px-4 py-3">
					<span className={cn(MONO_LABEL, "text-accent-lime")}>
						// owner only
					</span>
					<span className="text-sm text-fg-secondary">
						{session.open.length > 0
							? `${session.open.length} things to reconcile`
							: "Measured layer up to date"}
					</span>
					<span className="ml-auto">
						<PBtn tone="ghost">
							Open reconcile <ArrowRight className="size-3" />
						</PBtn>
					</span>
				</div>
			</StackHeroStub>

			<div className="mx-auto max-w-3xl px-6 py-12">
				<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
					<div>
						<button
							type="button"
							className={cn(
								MONO_LABEL,
								"mb-4 inline-flex cursor-pointer items-center gap-2 text-fg-muted hover:text-accent-lime",
							)}
						>
							<ArrowLeft className="size-3" />
							Alp&apos;s Stack
						</button>
						<h1 className="text-3xl font-black uppercase tracking-tight text-fg-primary md:text-4xl">
							Reconcile
						</h1>
						<div className="mt-2">
							<SyncStamp
								hasSnapshot={session.hasSnapshot}
								isFresh={session.isFresh}
								receivedAgo={session.receivedAgo}
							/>
						</div>
					</div>

					{/* The toggle. Equal weight, both always present — that IS the
					    arrangement. Disabled rather than hidden when the queue is
					    empty, so the surface never changes shape under you. */}
					<div className="flex items-stretch border border-stroke-strong">
						{(
							[
								["list", List, "List"],
								["focus", Target, "Focus"],
							] as const
						).map(([key, Icon, label]) => {
							const disabled = key === "focus" && session.open.length === 0;
							return (
								<button
									type="button"
									key={key}
									disabled={disabled}
									onClick={() => (key === "focus" ? enterFocus() : setMode("list"))}
									className={cn(
										"inline-flex items-center gap-2 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
										mode === key
											? "bg-accent-lime text-accent-lime-contrast"
											: "text-fg-secondary hover:text-accent-lime",
										disabled && "cursor-not-allowed opacity-30 hover:text-fg-secondary",
										!disabled && "cursor-pointer",
									)}
								>
									<Icon className="size-3.5" />
									{label}
									{key === "focus" && session.open.length > 0 && (
										<span className="opacity-60">
											({session.open.length})
										</span>
									)}
								</button>
							);
						})}
					</div>
				</div>

				{mode === "list" ? (
					<>
						<p className="mb-8 font-mono text-xs text-fg-muted">
							// press F to focus the highlighted row
						</p>
						<ListLens
							session={session}
							selectedKey={selected}
							onSelect={setSelected}
							onFocus={enterFocus}
						/>
					</>
				) : (
					<div className="space-y-8">
						<FocusLens
							session={session}
							queue={queue}
							startKey={selected}
							chromeless
							onExit={() => setMode("list")}
							onDone={() => setMode("list")}
						/>
						<DismissedDrawer session={session} />
					</div>
				)}
			</div>
		</div>
	);
}
