/**
 * PROTOTYPE — Round 4: G, as its own page
 * ---------------------------------------------------------------------------
 * Wayfinder ticket #39 (map #29). THROWAWAY.
 *
 * Round 3 picked G — the "what's changed" framing and its vocabulary. Round 4
 * takes the three notes that came back with it and treats them as FIXED:
 *
 *   1. IT IS ITS OWN PAGE. Not an overlay over the stack page, not a modal.
 *      You navigate to it.
 *   2. THE "FROM YOUR MACHINE" BOX IS THE PAGE NAV. It stays at the top and
 *      does not scroll away with the work.
 *   3. THE PERCENTAGE REPLACES THE STEPPER. H's meter is the single progress
 *      indicator, and it reads the same in BOTH views — the row of segment
 *      ticks is gone.
 *
 * What stays open, and what these three vary:
 *
 *   J  TOOLBAR   — banner, then a segmented [One at a time | Whole list] under
 *                  it. The most literal reading. Added/Hidden sit to the right
 *                  as quiet secondary views.
 *   K  DASHBOARD — the banner absorbs everything: a big percentage, and the two
 *                  views chosen from two large labelled buttons INSIDE the
 *                  banner. The body below is nothing but the work.
 *   L  SPLIT     — on a wide screen you do not have to choose: the list sits
 *                  left, the current item right, and they stay in sync. The
 *                  toggle collapses to either half when you want one of them
 *                  whole. Narrow screens fall back to the toggle alone.
 *
 * Vocabulary is G's, unchanged — see the table at the top of
 * ./reconcile-plain.tsx. The words are settled; only the layout is in play.
 * ---------------------------------------------------------------------------
 */
import {
	ArrowLeft,
	Check,
	EyeOff,
	LayoutGrid,
	List,
	Plus,
	RotateCcw,
	Rows3,
	Square,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
	AddedPane,
	FreshLine,
	HiddenPane,
	NeverCheckedBox,
	OpenRow,
	type Run,
	askLine,
	priceLine,
	usageLine,
	useRun,
} from "./reconcile-plain";
import {
	MONO_LABEL,
	Monogram,
	PBtn,
	type StateKey,
	type Suggestion,
} from "./reconcile-shared";

// ===========================================================================
// The meter — H's percentage, promoted to the only progress indicator there is.
// ===========================================================================

function pctDone(run: Run): number {
	if (run.total === 0) return 100;
	return Math.round((run.doneCount / run.total) * 100);
}

function Meter({
	run,
	size = "md",
}: {
	run: Run;
	size?: "md" | "lg";
}) {
	const pct = pctDone(run);
	return (
		<div className={size === "lg" ? "w-full" : "w-full max-w-[16rem]"}>
			<div className="flex items-baseline justify-between gap-3">
				<span
					className={cn(
						"font-mono font-black leading-none text-fg-primary",
						size === "lg" ? "text-5xl md:text-6xl" : "text-2xl",
					)}
				>
					{pct}%
				</span>
				<span
					className={cn(
						"font-mono uppercase tracking-[0.12em] text-fg-muted",
						size === "lg" ? "text-xs" : "text-[11px]",
					)}
				>
					{run.open.length === 0
						? "done"
						: `${run.doneCount} of ${run.total} done`}
				</span>
			</div>
			<div
				className={cn(
					"mt-2 w-full bg-stroke-subtle",
					size === "lg" ? "h-2.5" : "h-1.5",
				)}
			>
				<div
					className="h-full bg-accent-lime transition-[width] duration-300"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}

// ===========================================================================
// The one-item view — G's card, unwrapped from its overlay so it can live
// inside a page that already has a header.
// ===========================================================================

function OneItem({
	run,
	item,
	onAnswered,
	compact,
}: {
	run: Run;
	item: Suggestion | undefined;
	onAnswered?: () => void;
	compact?: boolean;
}) {
	const answer = useCallback(
		(d: "added" | "hidden") => {
			if (!item) return;
			run.decide(item, d);
			onAnswered?.();
		},
		[item, run, onAnswered],
	);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			const typing =
				t &&
				(t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
			if (e.key === "Enter") {
				e.preventDefault();
				answer("added");
				return;
			}
			if (typing) return;
			if (e.key === "n" || e.key === "N") answer("hidden");
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [answer]);

	if (!item) {
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

	const isModel = item.kind === "missing_from_authored";
	const note = run.notes[item.atomKey] ?? "";

	return (
		<div
			className={cn(
				"border border-stroke-subtle",
				compact ? "p-6" : "px-6 py-12 md:px-10 md:py-16",
			)}
		>
			<p
				className={cn(
					"text-fg-secondary",
					compact ? "mb-4 text-base" : "mb-6 text-lg",
				)}
			>
				{askLine(item)}
			</p>
			<div className="flex items-center gap-5">
				<Monogram
					label={item.label}
					tone={isModel ? "measured" : "authored"}
					size={compact ? "md" : "lg"}
				/>
				<h2
					className={cn(
						"font-black tracking-tight text-fg-primary",
						compact ? "text-2xl" : "text-4xl md:text-5xl",
					)}
				>
					{item.label}
				</h2>
			</div>

			{isModel && (
				<div className="mt-5 space-y-1">
					<p className="text-sm text-fg-secondary">{usageLine(item)}</p>
					{priceLine(item) && (
						<p className="font-mono text-xs text-fg-muted">{priceLine(item)}</p>
					)}
				</div>
			)}

			{isModel ? (
				<div className="mt-8 flex flex-wrap gap-3">
					<PBtn tone="primary" onClick={() => answer("added")} className="px-5 py-2.5">
						<Plus className="size-3.5" /> Add it <span className="opacity-60">↵</span>
					</PBtn>
					<PBtn tone="danger" onClick={() => answer("hidden")} className="px-5 py-2.5">
						<EyeOff className="size-3.5" /> Not mine, hide it{" "}
						<span className="opacity-60">N</span>
					</PBtn>
				</div>
			) : (
				<>
					<input
						key={item.atomKey}
						// biome-ignore lint/a11y/noAutofocus: prototype; typing is the interaction
						autoFocus
						value={note}
						onChange={(e) => run.setNote(item.atomKey, e.target.value)}
						placeholder="e.g. writing and reviewing code"
						className={cn(
							"mt-6 w-full border-b-2 border-stroke-strong bg-transparent px-1 text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none",
							compact ? "py-2 text-base" : "py-3 text-xl",
						)}
					/>
					<p className="mt-2 text-xs text-fg-muted">
						One line. Anyone looking at your stack will see it.
					</p>
					<div className="mt-6 flex flex-wrap gap-3">
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
	);
}

function WholeList({ run }: { run: Run }) {
	if (run.open.length === 0) return <OneItem run={run} item={undefined} />;
	return (
		<div className="divide-y divide-stroke-subtle border border-stroke-subtle">
			{run.open.map((s) => (
				<OpenRow key={s.atomKey} run={run} s={s} />
			))}
		</div>
	);
}

// ===========================================================================
// Page shell — the back link every variant shares.
// ===========================================================================

function PageShell({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-bg-canvas">
			<div className="mx-auto max-w-3xl px-6 pt-8">
				<button
					type="button"
					className={cn(
						MONO_LABEL,
						"inline-flex cursor-pointer items-center gap-2 text-fg-muted hover:text-accent-lime",
					)}
				>
					<ArrowLeft className="size-3" />
					Alp&apos;s Stack
				</button>
			</div>
			{children}
		</div>
	);
}

/** The headline the banner leads with, in every variant. */
function headline(run: Run): string {
	if (!run.hasSnapshot) return "We haven't looked at your machine yet";
	if (run.open.length === 0)
		return run.doneCount > 0
			? "All caught up"
			: "Your stack matches how you work";
	return `${run.open.length} ${run.open.length === 1 ? "thing" : "things"} to look at`;
}

type View = "one" | "list" | "added" | "hidden";

/** The two secondary views, rendered the same way in J and K. */
function SecondaryLinks({
	run,
	view,
	onChange,
}: {
	run: Run;
	view: View;
	onChange: (v: View) => void;
}) {
	return (
		<div className="flex items-center gap-4">
			{(
				[
					["added", "Added", run.added.length],
					["hidden", "Hidden", run.hidden.length],
				] as const
			).map(([key, label, count]) => (
				<button
					type="button"
					key={key}
					onClick={() => onChange(key)}
					className={cn(
						"cursor-pointer font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
						view === key
							? "text-accent-lime underline underline-offset-4"
							: "text-fg-muted hover:text-accent-lime",
					)}
				>
					{label} ({count})
				</button>
			))}
		</div>
	);
}

function SecondaryPane({ run, view }: { run: Run; view: View }) {
	if (view === "added") return <AddedPane run={run} />;
	return <HiddenPane run={run} />;
}

// ===========================================================================
// J — TOOLBAR. Banner on top, segmented toggle underneath it.
// ===========================================================================

export function VariantJ({ state }: { state: StateKey }) {
	const run = useRun(state);
	const [view, setView] = useState<View>("one");

	return (
		<PageShell>
			{/* The page nav. Sticky, so the percentage and the freshness line are
			    never more than a glance away while you work. */}
			<div className="sticky top-0 z-30 mt-6 border-y border-stroke-subtle bg-bg-canvas/95 backdrop-blur">
				<div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-8 gap-y-4 px-6 py-5">
					<div className="min-w-0 flex-1">
						<p className={cn(MONO_LABEL, "text-accent-lime")}>
							// from your machine
						</p>
						<p className="mt-1.5 text-xl font-bold text-fg-primary">
							{headline(run)}
						</p>
						<div className="mt-1.5">
							<FreshLine
								hasSnapshot={run.hasSnapshot}
								isFresh={run.isFresh}
								receivedAgo={run.receivedAgo}
							/>
						</div>
					</div>
					<Meter run={run} />
				</div>
			</div>

			<div className="mx-auto max-w-3xl px-6 py-8">
				<div className="mb-8 flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-stretch border border-stroke-strong">
						{(
							[
								["one", Square, "One at a time"],
								["list", Rows3, "Whole list"],
							] as const
						).map(([key, Icon, label]) => (
							<button
								type="button"
								key={key}
								onClick={() => setView(key)}
								className={cn(
									"inline-flex cursor-pointer items-center gap-2 border-stroke-strong px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors [&:not(:first-child)]:border-l",
									view === key
										? "bg-accent-lime text-accent-lime-contrast"
										: "text-fg-secondary hover:text-accent-lime",
								)}
							>
								<Icon className="size-3.5" />
								{label}
							</button>
						))}
					</div>
					<SecondaryLinks run={run} view={view} onChange={setView} />
				</div>

				{!run.hasSnapshot && (
					<div className="mb-8">
						<NeverCheckedBox />
					</div>
				)}

				{view === "one" && <OneItem run={run} item={run.open[0]} />}
				{view === "list" && <WholeList run={run} />}
				{(view === "added" || view === "hidden") && (
					<SecondaryPane run={run} view={view} />
				)}
			</div>
		</PageShell>
	);
}

// ===========================================================================
// K — DASHBOARD. The banner absorbs the toggle; the body is only the work.
// ===========================================================================

export function VariantK({ state }: { state: StateKey }) {
	const run = useRun(state);
	const [view, setView] = useState<View>("one");

	return (
		<PageShell>
			<div className="mx-auto max-w-3xl px-6 py-8">
				{/* One box: status, progress, and the choice of view. Nothing else
				    competes with it, and the body below is pure content. */}
				<div className="border border-stroke-subtle">
					<div className="flex flex-wrap items-end gap-x-10 gap-y-6 p-6">
						<div className="min-w-[14rem] flex-1">
							<p className={cn(MONO_LABEL, "text-accent-lime")}>
								// from your machine
							</p>
							<p className="mt-2 text-2xl font-bold leading-tight text-fg-primary">
								{headline(run)}
							</p>
							<p className="mt-2 text-sm text-fg-secondary">
								{run.hasSnapshot
									? "We read your last 30 days of Claude Code and compared it to what you've listed."
									: "Once you run the check, anything that doesn't match shows up here."}
							</p>
							<div className="mt-3">
								<FreshLine
									hasSnapshot={run.hasSnapshot}
									isFresh={run.isFresh}
									receivedAgo={run.receivedAgo}
								/>
							</div>
						</div>
						<div className="min-w-[12rem] flex-1">
							<Meter run={run} size="lg" />
						</div>
					</div>

					{/* Two big buttons that describe what they do, rather than a
					    segmented control that assumes you already know. */}
					<div className="grid grid-cols-1 gap-px border-t border-stroke-subtle bg-stroke-subtle sm:grid-cols-2">
						{(
							[
								[
									"one",
									LayoutGrid,
									"One at a time",
									"Answer them in order, keyboard only",
								],
								[
									"list",
									List,
									"Whole list",
									"See everything at once and pick",
								],
							] as const
						).map(([key, Icon, label, blurb]) => (
							<button
								type="button"
								key={key}
								onClick={() => setView(key)}
								className={cn(
									"flex cursor-pointer items-start gap-3 p-5 text-left transition-colors",
									view === key
										? "bg-accent-lime text-accent-lime-contrast"
										: "bg-bg-canvas text-fg-secondary hover:bg-bg-panel/50",
								)}
							>
								<Icon className="mt-0.5 size-4 shrink-0" />
								<span className="min-w-0">
									<span
										className={cn(
											"block font-mono text-[11px] font-semibold uppercase tracking-[0.12em]",
											view === key
												? "text-accent-lime-contrast"
												: "text-fg-primary",
										)}
									>
										{label}
									</span>
									<span
										className={cn(
											"mt-1 block text-xs leading-relaxed",
											view === key
												? "text-accent-lime-contrast/80"
												: "text-fg-muted",
										)}
									>
										{blurb}
									</span>
								</span>
							</button>
						))}
					</div>

					<div className="flex items-center justify-end gap-4 border-t border-stroke-subtle px-5 py-3">
						<SecondaryLinks run={run} view={view} onChange={setView} />
					</div>
				</div>

				{!run.hasSnapshot && (
					<div className="mt-8">
						<NeverCheckedBox />
					</div>
				)}

				<div className="mt-8">
					{view === "one" && <OneItem run={run} item={run.open[0]} />}
					{view === "list" && <WholeList run={run} />}
					{(view === "added" || view === "hidden") && (
						<SecondaryPane run={run} view={view} />
					)}
				</div>
			</div>
		</PageShell>
	);
}

// ===========================================================================
// L — SPLIT. On a wide screen you get both; the toggle collapses to either.
// ===========================================================================

export function VariantL({ state }: { state: StateKey }) {
	const run = useRun(state);
	const [mode, setMode] = useState<"split" | "one" | "list">("split");
	const [selected, setSelected] = useState<string | null>(null);
	const [secondary, setSecondary] = useState<View | null>(null);

	// Keep the selection pointing at something real as rows resolve, so the
	// right-hand pane never blanks out mid-run.
	const current =
		run.open.find((o) => o.atomKey === selected) ?? run.open[0] ?? undefined;

	useEffect(() => {
		if (selected && !run.open.some((o) => o.atomKey === selected)) {
			setSelected(run.open[0]?.atomKey ?? null);
		}
	}, [run.open, selected]);

	const showList = mode !== "one";
	const showOne = mode !== "list";

	return (
		<PageShell>
			<div className="sticky top-0 z-30 mt-6 border-y border-stroke-subtle bg-bg-canvas/95 backdrop-blur">
				<div className="mx-auto max-w-5xl px-6 py-5">
					<div className="flex flex-wrap items-center gap-x-8 gap-y-4">
						<div className="min-w-0 flex-1">
							<p className={cn(MONO_LABEL, "text-accent-lime")}>
								// from your machine
							</p>
							<p className="mt-1.5 text-xl font-bold text-fg-primary">
								{headline(run)}
							</p>
							<div className="mt-1.5">
								<FreshLine
									hasSnapshot={run.hasSnapshot}
									isFresh={run.isFresh}
									receivedAgo={run.receivedAgo}
								/>
							</div>
						</div>
						<Meter run={run} />
					</div>

					<div className="mt-4 flex flex-wrap items-center justify-between gap-4">
						{/* Three-way, because "both" is the default here and the other
						    two are ways of getting one of them out of the way. */}
						<div className="flex items-stretch border border-stroke-strong">
							{(
								[
									["split", "Both"],
									["one", "One at a time"],
									["list", "Whole list"],
								] as const
							).map(([key, label]) => (
								<button
									type="button"
									key={key}
									onClick={() => {
										setMode(key);
										setSecondary(null);
									}}
									className={cn(
										"cursor-pointer border-stroke-strong px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors [&:not(:first-child)]:border-l",
										secondary === null && mode === key
											? "bg-accent-lime text-accent-lime-contrast"
											: "text-fg-secondary hover:text-accent-lime",
									)}
								>
									{label}
								</button>
							))}
						</div>
						<SecondaryLinks
							run={run}
							view={secondary ?? "one"}
							onChange={(v) => setSecondary(v)}
						/>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-5xl px-6 py-8">
				{!run.hasSnapshot && (
					<div className="mb-8">
						<NeverCheckedBox />
					</div>
				)}

				{secondary ? (
					<SecondaryPane run={run} view={secondary} />
				) : run.open.length === 0 ? (
					<OneItem run={run} item={undefined} />
				) : (
					<div
						className={cn(
							"grid gap-6",
							mode === "split" ? "lg:grid-cols-[18rem_1fr]" : "grid-cols-1",
						)}
					>
						{showList && (
							<div
								className={cn(
									"divide-y divide-stroke-subtle border border-stroke-subtle",
									mode === "split" && "h-fit",
								)}
							>
								{run.open.map((s) =>
									mode === "split" ? (
										// In split the list is a picker, not a form — acting on a
										// row happens on the right. Two sets of buttons for the
										// same decision, six inches apart, is how you get people
										// clicking the wrong one.
										<button
											type="button"
											key={s.atomKey}
											onClick={() => setSelected(s.atomKey)}
											className={cn(
												"flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-left transition-colors",
												current?.atomKey === s.atomKey
													? "bg-accent-lime/10"
													: "hover:bg-bg-panel/50",
											)}
										>
											{current?.atomKey === s.atomKey && (
												<span className="-ml-3 h-8 w-0.5 shrink-0 bg-accent-lime" />
											)}
											<Monogram
												label={s.label}
												tone={
													s.kind === "missing_from_authored"
														? "measured"
														: "authored"
												}
											/>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-sm font-semibold text-fg-primary">
													{s.label}
												</span>
												<span className="block truncate font-mono text-[10px] uppercase tracking-wider text-fg-muted">
													{s.kind === "missing_from_authored"
														? "not listed"
														: "no note"}
												</span>
											</span>
										</button>
									) : (
										<OpenRow key={s.atomKey} run={run} s={s} />
									),
								)}
							</div>
						)}

						{showOne && (
							<OneItem
								run={run}
								item={current}
								compact={mode === "split"}
								onAnswered={() => setSelected(null)}
							/>
						)}
					</div>
				)}

				{secondary === null && run.hidden.length > 0 && mode !== "split" && (
					<p className="mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-fg-muted">
						<RotateCcw className="size-3" />
						{run.hidden.length} hidden — bring any of them back from Hidden
						above
					</p>
				)}
			</div>
		</PageShell>
	);
}
