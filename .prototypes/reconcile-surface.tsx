/**
 * PROTOTYPE — The reconcile surface (authored <-> measured overlap)
 * ---------------------------------------------------------------------------
 * Wayfinder ticket #39 (map #29). THROWAWAY. No tests, no error handling, no
 * backend. All state is in memory; every "mutation" is a setState.
 *
 * THE QUESTION
 *   Where does the reconcile surface live, and what shape is it?
 *
 * Locked upstream, NOT up for grabs here (#33 / #34):
 *   - Suggestions are DERIVED ON READ. No queue, no merge, no pending state.
 *   - The only persisted state is `reconcileDismissals` (stackId, kind, key).
 *   - The what-for writes straight into `stacks.toolSubscriptions[].primaryUsageLabel`.
 *   - v1 is LLM-free: the what-for is typed by the human, and skippable.
 *   - The overlap is CATALOG SLUGS ONLY — models + tools. MCP servers and
 *     Skills appear in the measured inventory but have no authored counterpart,
 *     so they are deliberately absent from this surface.
 *   - This is NOT the stack editor.
 *
 * So the surface has exactly two jobs:
 *   1. "measured shows ‹model›, your authored list doesn't — add, or dismiss?"
 *   2. "‹tool› has no what-for — write one, or skip."
 *
 * ROUND 1 — three structurally opposed answers to *where the work happens*:
 *   A  inbox      — a dedicated owner-only route. Reconcile is a destination.
 *   B  in-context — no separate place; suggestions render as ghosts inside the
 *                   real stack page, at the spot the answer belongs.
 *   C  deck       — a focused overlay, one suggestion at a time, keyboard-first.
 *                   Reconcile is a session you start and finish.
 *
 * ROUND 2 — the owner liked A's overview and C's review process, so D/E/F ask
 * which of the two you LAND on. They live in ./reconcile-combined.tsx:
 *   D  inbox-first — list is home, deck is an accelerator over it
 *   E  deck-first  — deck is home, list is the ledger you consult afterwards
 *   F  peers       — one surface, two lenses, a LIST/FOCUS toggle
 *
 * FOUR STATES, because the ticket asks about all of them:
 *   live    — fresh snapshot, 2 model + 4 what-for suggestions, 2 dismissed
 *   clear   — fresh snapshot, nothing to reconcile, 2 dismissed
 *   presync — NO snapshot ever. Note this is NOT empty: what-for suggestions
 *             are authored-side and exist before the first sync. That asymmetry
 *             is a real finding, so every variant has to render it.
 *   stale   — snapshot 12 days old, i.e. outside the 7-day living-stacks window
 *
 * Switch both from the floating bar at the bottom. URL: ?variant=D&state=live
 *
 * TO VIEW: TanStack scans src/routes/ only, so a thin bridge route mounts this.
 *   src/routes/proto.reconcile.tsx  ->  http://localhost:3019/proto/reconcile
 * Every file here is throwaway; they belong on the prototype branch, not main.
 * ---------------------------------------------------------------------------
 */
import {
	ArrowLeft,
	ArrowRight,
	Check,
	ChevronRight,
	Plus,
	RotateCcw,
	X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { VariantD, VariantE, VariantF } from "./reconcile-combined";
import { VariantJ, VariantK, VariantL } from "./reconcile-page";
import { VariantG, VariantH, VariantI } from "./reconcile-plain";
import {
	type Dismissal,
	MONO_LABEL,
	Monogram,
	PBtn,
	SNAPSHOT_META,
	ShareBar,
	type StateKey,
	STATES,
	type Suggestion,
	SyncCta,
	SyncStamp,
} from "./reconcile-shared";

// ===========================================================================
// VARIANT A — INBOX
// Reconcile is a destination: its own owner-only route, reached from a banner
// on the stack page. A worklist you clear.
// ===========================================================================

function VariantA({ state }: { state: StateKey }) {
	const s = STATES[state];
	const [open, setOpen] = useState<Suggestion[]>(s.suggestions);
	const [dismissed, setDismissed] = useState<Dismissal[]>(s.dismissed);
	const [drafts, setDrafts] = useState<Record<string, string>>({});
	const [showDismissed, setShowDismissed] = useState(false);

	const resolve = (sug: Suggestion, asDismissal: boolean) => {
		setOpen((prev) => prev.filter((p) => p.atomKey !== sug.atomKey));
		if (asDismissal)
			setDismissed((prev) => [
				{
					atomKind: sug.atomKind,
					atomKey: sug.atomKey,
					label: sug.label,
					ago: "just now",
				},
				...prev,
			]);
	};

	const models = open.filter((o) => o.kind === "missing_from_authored");
	const whatFors = open.filter((o) => o.kind === "missing_what_for");

	return (
		<div className="min-h-screen bg-bg-canvas px-6 py-12">
			<div className="mx-auto max-w-3xl">
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
						hasSnapshot={s.hasSnapshot}
						isFresh={s.isFresh}
						receivedAgo={s.receivedAgo}
					/>
				</div>
				<p className="mb-10 max-w-2xl text-sm leading-relaxed text-fg-secondary">
					What your machine measured, against what you wrote down. Nothing here
					is published until you say so — and nothing you dismiss comes back.
				</p>

				{s.hasSnapshot && (
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

				{!s.hasSnapshot && (
					<div className="mb-10">
						<SyncCta />
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
									className={cn(
										"flex items-center gap-4 px-4 py-4",
										i > 0 && "border-t border-stroke-subtle",
									)}
								>
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
										<PBtn tone="primary" onClick={() => resolve(m, false)}>
											<Plus className="size-3" /> Add
										</PBtn>
										<PBtn tone="danger" onClick={() => resolve(m, true)}>
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
									className={cn(
										"flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center",
										i > 0 && "border-t border-stroke-subtle",
									)}
								>
									<div className="flex min-w-0 flex-1 items-center gap-4">
										<Monogram label={w.label} tone="authored" />
										<div className="min-w-0 flex-1">
											<p className="mb-1.5 font-semibold text-fg-primary">
												{w.label}
											</p>
											<input
												value={drafts[w.atomKey] ?? ""}
												onChange={(e) =>
													setDrafts((d) => ({
														...d,
														[w.atomKey]: e.target.value,
													}))
												}
												placeholder="What do you use it for?"
												className="w-full border border-stroke-subtle bg-bg-canvas px-2.5 py-1.5 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
											/>
										</div>
									</div>
									<div className="flex shrink-0 gap-2 sm:self-end">
										<PBtn
											tone="primary"
											onClick={() => resolve(w, false)}
											className={cn(
												!(drafts[w.atomKey] ?? "").trim() &&
													"pointer-events-none opacity-40",
											)}
										>
											<Check className="size-3" /> Save
										</PBtn>
										<PBtn tone="danger" onClick={() => resolve(w, true)}>
											Skip
										</PBtn>
									</div>
								</div>
							))}
						</div>
					</section>
				)}

				{open.length === 0 && s.hasSnapshot && (
					<div className="mb-12 border border-accent-lime/40 bg-accent-lime/5 p-8 text-center">
						<Check className="mx-auto mb-3 size-8 text-accent-lime" />
						<p className="text-lg font-bold text-fg-primary">
							Nothing to reconcile
						</p>
						<p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-secondary">
							Your authored stack matches what was measured {s.receivedAgo}.
							This page will fill itself the next time your usage drifts from
							what you wrote down.
						</p>
					</div>
				)}

				{dismissed.length > 0 && (
					<div className="border border-stroke-subtle">
						<button
							type="button"
							aria-expanded={showDismissed}
							onClick={() => setShowDismissed((v) => !v)}
							className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left hover:bg-bg-panel/40"
						>
							<ChevronRight
								className={cn(
									"size-3 text-fg-muted transition-transform",
									showDismissed && "rotate-90",
								)}
							/>
							<span className={cn(MONO_LABEL, "text-fg-muted")}>
								Dismissed ({dismissed.length})
							</span>
						</button>
						{showDismissed && (
							<div className="border-t border-stroke-subtle">
								{dismissed.map((d) => (
									<div
										key={d.atomKey}
										className="flex items-center gap-3 px-4 py-3"
									>
										<span className="font-mono text-xs text-fg-muted">
											{d.atomKind}
										</span>
										<span className="flex-1 text-sm text-fg-secondary">
											{d.label}
										</span>
										<span className="font-mono text-[11px] text-fg-muted">
											{d.ago}
										</span>
										<PBtn
											tone="ghost"
											onClick={() =>
												setDismissed((prev) =>
													prev.filter((p) => p.atomKey !== d.atomKey),
												)
											}
										>
											<RotateCcw className="size-3" /> Undo
										</PBtn>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

// ===========================================================================
// VARIANT B — IN CONTEXT
// There is no reconcile surface. Suggestions render as ghosts inside the real
// stack page, at the spot where the answer belongs. Owner-only.
// ===========================================================================

function VariantB({ state }: { state: StateKey }) {
	const s = STATES[state];
	const [open, setOpen] = useState<Suggestion[]>(s.suggestions);
	const [dismissed, setDismissed] = useState<Dismissal[]>(s.dismissed);
	const [drafts, setDrafts] = useState<Record<string, string>>({});
	const [showDismissed, setShowDismissed] = useState(false);

	const resolve = (sug: Suggestion, asDismissal: boolean) => {
		setOpen((prev) => prev.filter((p) => p.atomKey !== sug.atomKey));
		if (asDismissal)
			setDismissed((prev) => [
				{
					atomKind: sug.atomKind,
					atomKey: sug.atomKey,
					label: sug.label,
					ago: "just now",
				},
				...prev,
			]);
	};

	const ghostModels = open.filter((o) => o.kind === "missing_from_authored");
	const openWhatFor = new Map(
		open.filter((o) => o.kind === "missing_what_for").map((o) => [o.atomKey, o]),
	);

	const authoredTools = [
		{ slug: "claude-code", name: "Claude Code", label: "" },
		{ slug: "convex", name: "Convex", label: "" },
		{ slug: "linear", name: "Linear", label: "" },
		{ slug: "resend", name: "Resend", label: "" },
		{ slug: "biome", name: "Biome", label: "Lint + format on save" },
		{ slug: "tailwind", name: "Tailwind CSS", label: "Every pixel in the app" },
	];
	const authoredModels = [
		{ slug: "claude-sonnet-5", name: "Claude Sonnet 5" },
		{ slug: "gpt-5-4", name: "GPT-5.4" },
	];

	return (
		<div className="min-h-screen bg-bg-canvas">
			<div className="sticky top-0 z-30 border-b border-accent-lime/40 bg-bg-panel/95 backdrop-blur">
				<div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-2.5">
					<span className={cn(MONO_LABEL, "text-accent-lime")}>// owner view</span>
					<span className="text-sm text-fg-secondary">
						{open.length > 0 ? (
							<>
								<strong className="text-fg-primary">{open.length}</strong>{" "}
								{open.length === 1 ? "thing" : "things"} to reconcile, marked
								below
							</>
						) : s.hasSnapshot ? (
							"Everything measured is on your stack"
						) : (
							"Nothing measured yet"
						)}
					</span>
					<span className="ml-auto flex items-center gap-3">
						<SyncStamp
							hasSnapshot={s.hasSnapshot}
							isFresh={s.isFresh}
							receivedAgo={s.receivedAgo}
							compact
						/>
						{dismissed.length > 0 && (
							<button
								type="button"
								onClick={() => setShowDismissed((v) => !v)}
								className={cn(
									MONO_LABEL,
									"cursor-pointer text-fg-muted hover:text-accent-lime",
								)}
							>
								Dismissed ({dismissed.length})
							</button>
						)}
					</span>
				</div>
				{showDismissed && (
					<div className="border-t border-stroke-subtle bg-bg-canvas">
						<div className="mx-auto max-w-7xl px-6 py-3">
							{dismissed.map((d) => (
								<div key={d.atomKey} className="flex items-center gap-3 py-1.5">
									<span className="font-mono text-xs text-fg-muted">
										{d.atomKind}
									</span>
									<span className="flex-1 text-sm text-fg-secondary">
										{d.label}
									</span>
									<span className="font-mono text-[11px] text-fg-muted">
										{d.ago}
									</span>
									<PBtn
										tone="ghost"
										onClick={() =>
											setDismissed((prev) =>
												prev.filter((p) => p.atomKey !== d.atomKey),
											)
										}
									>
										<RotateCcw className="size-3" /> Restore
									</PBtn>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			<div className="border-b border-stroke-subtle px-6 py-12">
				<div className="mx-auto max-w-7xl">
					<p className={cn(MONO_LABEL, "text-accent-lime")}>// alp82</p>
					<h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-fg-primary md:text-6xl">
						Alp&apos;s Stack
					</h1>
					<p className="mt-3 max-w-2xl text-fg-secondary">
						Convex + TanStack Start, driven almost entirely from Claude Code.
					</p>
				</div>
			</div>

			<section className="px-6 py-16">
				<div className="mx-auto max-w-7xl">
					<div className="mb-10 flex items-end gap-5 border-b border-stroke-subtle pb-5">
						<span className="font-mono text-5xl font-black leading-none text-stroke-strong md:text-7xl">
							02
						</span>
						<div className="flex-1">
							<p className={cn(MONO_LABEL, "text-accent-lime")}>
								// AI Components
							</p>
							<h2 className="mt-1 text-3xl font-black uppercase tracking-tight text-fg-primary md:text-4xl">
								Tools
							</h2>
						</div>
					</div>

					<div className="mb-10">
						<p className={cn(MONO_LABEL, "mb-4 text-accent-lime")}>
							Models ({authoredModels.length + ghostModels.length})
						</p>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{authoredModels.map((m) => (
								<div
									key={m.slug}
									className="flex items-center gap-3 border border-stroke-subtle p-4"
								>
									<Monogram label={m.name} tone="authored" />
									<span className="font-semibold text-fg-primary">{m.name}</span>
								</div>
							))}
							{ghostModels.map((g) => (
								<div
									key={g.atomKey}
									className="border border-dashed border-accent-lime/60 bg-accent-lime/5 p-4"
								>
									<div className="flex items-center gap-3">
										<Monogram label={g.label} tone="measured" />
										<div className="min-w-0 flex-1">
											<p className="font-semibold text-fg-primary">{g.label}</p>
											<p className={cn(MONO_LABEL, "mt-0.5 text-accent-lime")}>
												measured, not on your stack
											</p>
										</div>
									</div>
									{g.tokenShare !== undefined && (
										<div className="mt-3">
											<ShareBar share={g.tokenShare} />
										</div>
									)}
									<div className="mt-3 flex gap-2">
										<PBtn tone="primary" onClick={() => resolve(g, false)}>
											<Plus className="size-3" /> Add to stack
										</PBtn>
										<PBtn tone="danger" onClick={() => resolve(g, true)}>
											<X className="size-3" /> Not mine
										</PBtn>
									</div>
								</div>
							))}
						</div>
						{!s.hasSnapshot && (
							<p className="mt-4 font-mono text-xs text-fg-muted">
								// no measured models — nothing synced yet
							</p>
						)}
					</div>

					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						{authoredTools.map((t) => {
							const sug = openWhatFor.get(t.slug);
							return (
								<div
									key={t.slug}
									className={cn(
										"border p-5",
										sug
											? "border-accent-lime/50 bg-accent-lime/5"
											: "border-stroke-subtle",
									)}
								>
									<div className="flex items-center gap-3">
										<Monogram label={t.name} tone="authored" />
										<div className="min-w-0 flex-1">
											<p className="font-semibold text-fg-primary">{t.name}</p>
											{!sug && (
												<p className="mt-0.5 text-sm text-fg-secondary">
													{t.label || "—"}
												</p>
											)}
										</div>
									</div>
									{sug && (
										<div className="mt-4 border-t border-accent-lime/30 pt-4">
											<p className={cn(MONO_LABEL, "mb-2 text-accent-lime")}>
												// what do you use it for?
											</p>
											<div className="flex flex-col gap-2 sm:flex-row">
												<input
													value={drafts[t.slug] ?? ""}
													onChange={(e) =>
														setDrafts((d) => ({
															...d,
															[t.slug]: e.target.value,
														}))
													}
													placeholder="One line. Shows on your public stack."
													className="min-w-0 flex-1 border border-stroke-subtle bg-bg-canvas px-2.5 py-1.5 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
												/>
												<div className="flex gap-2">
													<PBtn
														tone="primary"
														onClick={() => resolve(sug, false)}
														className={cn(
															!(drafts[t.slug] ?? "").trim() &&
																"pointer-events-none opacity-40",
														)}
													>
														Save
													</PBtn>
													<PBtn tone="danger" onClick={() => resolve(sug, true)}>
														Skip
													</PBtn>
												</div>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>

					{!s.hasSnapshot && (
						<div className="mt-10">
							<SyncCta dense />
						</div>
					)}
				</div>
			</section>
		</div>
	);
}

// ===========================================================================
// VARIANT C — DECK
// Reconcile is a session. A compact entry card on the stack page opens a
// focused overlay: one suggestion at a time, keyboard-first, ends in a summary.
// ===========================================================================

function VariantC({ state }: { state: StateKey }) {
	const s = STATES[state];
	const [deckOpen, setDeckOpen] = useState(false);
	const [idx, setIdx] = useState(0);
	const [open] = useState<Suggestion[]>(s.suggestions);
	const [decisions, setDecisions] = useState<
		Record<string, { action: "added" | "dismissed"; note?: string }>
	>({});
	const [dismissed, setDismissed] = useState<Dismissal[]>(s.dismissed);
	const [draft, setDraft] = useState("");

	const current = open[idx];
	const done = idx >= open.length;

	const decide = useCallback(
		(action: "added" | "dismissed") => {
			if (!current) return;
			setDecisions((d) => ({
				...d,
				[current.atomKey]: { action, note: draft.trim() || undefined },
			}));
			if (action === "dismissed")
				setDismissed((prev) => [
					{
						atomKind: current.atomKind,
						atomKey: current.atomKey,
						label: current.label,
						ago: "just now",
					},
					...prev,
				]);
			setDraft("");
			setIdx((i) => i + 1);
		},
		[current, draft],
	);

	useEffect(() => {
		if (!deckOpen || done) return;
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			const typing =
				t &&
				(t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
			if (e.key === "Escape") {
				setDeckOpen(false);
				return;
			}
			if (typing && e.key !== "Enter") return;
			if (e.key === "Enter") {
				e.preventDefault();
				decide("added");
			}
			if (!typing && (e.key === "d" || e.key === "D")) decide("dismissed");
			if (!typing && e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [deckOpen, done, decide]);

	const addedCount = Object.values(decisions).filter(
		(d) => d.action === "added",
	).length;

	return (
		<div className="min-h-screen bg-bg-canvas">
			<div className="border-b border-stroke-subtle px-6 py-12">
				<div className="mx-auto max-w-7xl">
					<p className={cn(MONO_LABEL, "text-accent-lime")}>// alp82</p>
					<h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-fg-primary md:text-6xl">
						Alp&apos;s Stack
					</h1>
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-6 py-12">
				<div
					className={cn(
						"border p-6",
						open.length > 0
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
								{!s.hasSnapshot
									? "Nothing measured yet"
									: open.length === 0
										? "Your stack matches what you measured"
										: `${open.length} ${open.length === 1 ? "difference" : "differences"} between measured and authored`}
							</p>
							<div className="mt-2">
								<SyncStamp
									hasSnapshot={s.hasSnapshot}
									isFresh={s.isFresh}
									receivedAgo={s.receivedAgo}
								/>
							</div>
						</div>
						{open.length > 0 && (
							<PBtn
								tone="primary"
								onClick={() => {
									setDeckOpen(true);
									setIdx(0);
								}}
								className="px-5 py-2.5 text-xs"
							>
								Review {open.length} <ArrowRight className="size-3.5" />
							</PBtn>
						)}
						{dismissed.length > 0 && open.length === 0 && (
							<PBtn tone="ghost" onClick={() => setDeckOpen(true)}>
								Dismissed ({dismissed.length})
							</PBtn>
						)}
					</div>

					{!s.hasSnapshot && (
						<div className="mt-6">
							<SyncCta dense />
						</div>
					)}
				</div>

				<p className="mt-12 font-mono text-xs text-fg-muted">
					// rest of the stack page renders exactly as a visitor sees it
				</p>
			</div>

			{deckOpen && (
				<div
					data-deck-open
					className="fixed inset-0 z-50 flex flex-col bg-bg-canvas/98 backdrop-blur"
				>
					<div className="flex items-center gap-4 border-b border-stroke-subtle px-6 py-4">
						<span className={cn(MONO_LABEL, "text-accent-lime")}>
							// reconcile
						</span>
						{!done && (
							<span className="font-mono text-xs text-fg-muted">
								{idx + 1} / {open.length}
							</span>
						)}
						<div className="ml-auto flex items-center gap-4">
							<span className="hidden font-mono text-[11px] text-fg-muted sm:block">
								ENTER add · D dismiss · ← back · ESC close
							</span>
							<button
								type="button"
								onClick={() => setDeckOpen(false)}
								className="cursor-pointer text-fg-muted hover:text-fg-primary"
							>
								<X className="size-5" />
							</button>
						</div>
					</div>

					<div className="flex gap-1 px-6 py-3">
						{open.map((o, i) => (
							<div
								key={o.atomKey}
								className={cn(
									"h-1 flex-1",
									i < idx
										? decisions[o.atomKey]?.action === "added"
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
											value={draft}
											onChange={(e) => setDraft(e.target.value)}
											placeholder="What do you use it for?"
											className="mt-8 w-full border-b-2 border-stroke-strong bg-transparent px-1 py-3 text-xl text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
										/>
										<div className="mt-8 flex gap-3">
											<PBtn
												tone="primary"
												onClick={() => decide("added")}
												className={cn(
													"px-5 py-2.5",
													!draft.trim() && "pointer-events-none opacity-40",
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

						{done && (
							<div className="w-full max-w-2xl">
								<Check className="mb-4 size-10 text-accent-lime" />
								<h2 className="text-3xl font-black uppercase tracking-tight text-fg-primary">
									Reconciled
								</h2>
								<p className="mt-3 text-fg-secondary">
									{addedCount} added to your stack, {open.length - addedCount}{" "}
									dismissed.
								</p>
								{dismissed.length > 0 && (
									<div className="mt-8 border border-stroke-subtle">
										<p className={cn(MONO_LABEL, "px-4 py-3 text-fg-muted")}>
											Dismissed ({dismissed.length})
										</p>
										<div className="border-t border-stroke-subtle">
											{dismissed.map((d) => (
												<div
													key={d.atomKey}
													className="flex items-center gap-3 px-4 py-2.5"
												>
													<span className="flex-1 text-sm text-fg-secondary">
														{d.label}
													</span>
													<span className="font-mono text-[11px] text-fg-muted">
														{d.ago}
													</span>
													<PBtn
														tone="ghost"
														onClick={() =>
															setDismissed((prev) =>
																prev.filter((p) => p.atomKey !== d.atomKey),
															)
														}
													>
														<RotateCcw className="size-3" /> Undo
													</PBtn>
												</div>
											))}
										</div>
									</div>
								)}
								<div className="mt-8">
									<PBtn
										tone="ghost"
										onClick={() => setDeckOpen(false)}
										className="px-5 py-2.5"
									>
										Back to stack
									</PBtn>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

// ===========================================================================
// Switcher
// ===========================================================================

const VARIANTS = {
	A: { name: "Inbox — its own page", render: VariantA, round: 1 },
	B: { name: "In context — ghosts on the page", render: VariantB, round: 1 },
	C: { name: "Deck — focused, one at a time", render: VariantC, round: 1 },
	D: { name: "A×C · inbox-first (deck accelerates)", render: VariantD, round: 2 },
	E: { name: "A×C · deck-first (list is the ledger)", render: VariantE, round: 2 },
	F: { name: "A×C · peers (LIST / FOCUS toggle)", render: VariantF, round: 2 },
	G: { name: "Plain · What's changed", render: VariantG, round: 3 },
	H: { name: "Plain · Fill in the gaps", render: VariantH, round: 3 },
	I: { name: "Plain · How you work (tabs lead)", render: VariantI, round: 3 },
	J: { name: "Page · banner + segmented toolbar", render: VariantJ, round: 4 },
	K: { name: "Page · banner absorbs the toggle", render: VariantK, round: 4 },
	L: { name: "Page · split (both at once)", render: VariantL, round: 4 },
} as const;

type VariantKey = keyof typeof VARIANTS;
const KEYS = Object.keys(VARIANTS) as VariantKey[];
const STATE_KEYS = Object.keys(STATES) as StateKey[];

function readParam<T extends string>(name: string, allowed: T[], fallback: T): T {
	if (typeof window === "undefined") return fallback;
	const v = new URLSearchParams(window.location.search).get(name) as T | null;
	return v && allowed.includes(v) ? v : fallback;
}

export function ReconcilePrototype() {
	// Round 4 is the live question, so that's where the bar opens.
	const [variant, setVariant] = useState<VariantKey>("J");
	const [state, setState] = useState<StateKey>("live");
	const [hydrated, setHydrated] = useState(false);

	// Read the URL after mount, not in the initializer: this route is SSR'd, and
	// a first client render that disagrees with the server is a hydration
	// mismatch. Costs one frame; a prototype can afford it.
	useEffect(() => {
		setVariant(readParam("variant", KEYS, "J"));
		setState(readParam("state", STATE_KEYS, "live"));
		setHydrated(true);
	}, []);

	useEffect(() => {
		if (typeof window === "undefined" || !hydrated) return;
		const p = new URLSearchParams(window.location.search);
		p.set("variant", variant);
		p.set("state", state);
		window.history.replaceState(null, "", `${window.location.pathname}?${p}`);
	}, [variant, state, hydrated]);

	const cycle = useCallback((dir: 1 | -1) => {
		setVariant((v) => KEYS[(KEYS.indexOf(v) + dir + KEYS.length) % KEYS.length]);
	}, []);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			if (
				t &&
				(t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
			)
				return;
			// Variants that own the arrow keys inside a deck take precedence.
			if (document.querySelector("[data-deck-open]")) return;
			if (e.key === "ArrowRight") cycle(1);
			if (e.key === "ArrowLeft") cycle(-1);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [cycle]);

	const Active = VARIANTS[variant].render;

	return (
		<>
			{/* key remounts the variant so each state starts clean */}
			<Active key={`${variant}-${state}`} state={state} />

			<div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2">
				<div className="flex items-stretch border-2 border-fg-primary bg-bg-canvas shadow-2xl">
					<button
						type="button"
						onClick={() => cycle(-1)}
						className="cursor-pointer border-r border-stroke-subtle px-3 text-fg-primary hover:bg-bg-panel"
						aria-label="Previous variant"
					>
						<ArrowLeft className="size-4" />
					</button>
					<div className="px-4 py-2">
						<p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-fg-primary">
							{variant} — {VARIANTS[variant].name}
						</p>
						<div className="mt-1.5 flex items-center gap-3">
							<div className="flex gap-1">
								{KEYS.map((k) => (
									<button
										type="button"
										key={k}
										onClick={() => setVariant(k)}
										className={cn(
											"cursor-pointer border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase transition-colors",
											variant === k
												? "border-fg-primary bg-fg-primary text-bg-canvas"
												: VARIANTS[k].round === 4
													? "border-accent-lime bg-accent-lime/10 text-accent-lime hover:bg-accent-lime/20"
													: VARIANTS[k].round >= 2 && VARIANTS[k].round <= 3
														? "border-accent-lime/40 text-accent-lime/70 hover:border-accent-lime"
														: "border-stroke-subtle text-fg-muted hover:border-fg-muted",
										)}
									>
										{k}
									</button>
								))}
							</div>
							<span className="h-4 w-px bg-stroke-subtle" />
							<div className="flex gap-1">
								{STATE_KEYS.map((k) => (
									<button
										type="button"
										key={k}
										onClick={() => setState(k)}
										className={cn(
											"cursor-pointer border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors",
											state === k
												? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
												: "border-stroke-subtle text-fg-muted hover:border-fg-muted",
										)}
										title={STATES[k].label}
									>
										{k}
									</button>
								))}
							</div>
						</div>
					</div>
					<button
						type="button"
						onClick={() => cycle(1)}
						className="cursor-pointer border-l border-stroke-subtle px-3 text-fg-primary hover:bg-bg-panel"
						aria-label="Next variant"
					>
						<ArrowRight className="size-4" />
					</button>
				</div>
			</div>
		</>
	);
}
