import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Check,
	EyeOff,
	Plus,
	RotateCcw,
	Terminal,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect } from "react";
import { SYNC_CMD } from "@/features/measured/copy";
import { cn } from "@/lib/utils";
import {
	askLine,
	KICKER_EMPTY,
	priceLine,
	type ReconcileItem,
	usageLine,
} from "./copy";
import type { HiddenItem, ReconcileRun } from "./useReconcileRun";

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

export function PBtn({
	children,
	onClick,
	tone = "ghost",
	disabled,
	className,
}: {
	children: ReactNode;
	onClick?: () => void;
	tone?: "primary" | "ghost" | "danger";
	disabled?: boolean;
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"inline-flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
				tone === "primary" &&
					"border-accent-lime bg-accent-lime text-accent-lime-contrast hover:bg-accent-lime-strong",
				tone === "ghost" &&
					"border-stroke-strong text-fg-secondary hover:border-accent-lime hover:text-accent-lime",
				tone === "danger" &&
					"border-stroke-subtle text-fg-muted hover:border-fg-muted hover:text-fg-secondary",
				disabled && "pointer-events-none opacity-40",
				className,
			)}
		>
			{children}
		</button>
	);
}

/**
 * The single progress indicator, and the reason the segment stepper is gone:
 * it reads the same in every view, so answering a row in the list moves exactly
 * what answering the card would (#39).
 */
export function Meter({ run }: { run: ReconcileRun }) {
	return (
		<div className="w-full max-w-[16rem]">
			<div className="flex items-baseline justify-between gap-3">
				<span className="font-mono text-2xl font-black leading-none text-fg-primary">
					{run.percent}%
				</span>
				<span className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg-muted">
					{run.open.length === 0
						? "done"
						: `${run.doneCount} of ${run.total} done`}
				</span>
			</div>
			<div className="mt-2 h-1.5 w-full bg-stroke-subtle">
				<div
					className="h-full bg-accent-lime transition-[width] duration-300"
					style={{ width: `${run.percent}%` }}
				/>
			</div>
		</div>
	);
}

/**
 * The freshness line, in words rather than a status chip. "Never checked"
 * names the command that changes that, and links the page that explains it
 * (#58) - the reader should never have to guess what a check is.
 */
export function FreshLine({ run }: { run: ReconcileRun }) {
	if (!run.hasSnapshot) {
		return (
			<span className="inline-flex flex-wrap items-center gap-x-2 font-mono text-[11px] uppercase tracking-[0.12em] text-fg-muted">
				<span>{run.checkedLine}</span>
				<span aria-hidden="true">-</span>
				<code className="normal-case text-fg-secondary">{SYNC_CMD}</code>
				<Link to="/sync" className="text-accent-lime hover:underline">
					how syncing works
				</Link>
			</span>
		);
	}
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em]",
				run.isFresh ? "text-accent-lime" : "text-amber-400",
			)}
		>
			{run.isFresh ? (
				<Check className="size-3" />
			) : (
				<ArrowRight className="size-3" />
			)}
			{run.checkedLine}
			{!run.isFresh && (
				<span className="normal-case tracking-normal text-fg-muted">
					- your stack stops counting as up to date after a week
				</span>
			)}
		</span>
	);
}

export function NeverCheckedBox() {
	return (
		<div className="border border-stroke-subtle bg-bg-panel/40 p-6">
			<p className={cn(MONO_LABEL, "text-accent-lime")}>{KICKER_EMPTY}</p>
			<p className="mt-3 max-w-xl text-sm leading-relaxed text-fg-secondary">
				Your stack is here, but we have not looked at how you actually work yet.
				Run this on the machine you code on - it reads your Claude Code history
				locally and shows you everything before any of it leaves.
			</p>
			<div className="mt-4 flex items-center gap-2 border border-stroke-strong bg-bg-canvas px-3 py-2">
				<Terminal className="size-3.5 shrink-0 text-accent-lime" />
				<code className="font-mono text-xs text-fg-primary">{SYNC_CMD}</code>
			</div>
			<Link
				to="/sync"
				className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-lime hover:underline"
			>
				how syncing works
				<ArrowRight className="size-3" />
			</Link>
		</div>
	);
}

function EmptyState({ run }: { run: ReconcileRun }) {
	return (
		<div className="border border-accent-lime/40 bg-accent-lime/5 p-8 text-center">
			<Check className="mx-auto mb-3 size-8 text-accent-lime" />
			<p className="text-lg font-bold text-fg-primary">
				{run.doneCount > 0 ? "That was all of them" : "Nothing to look at"}
			</p>
			<p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-secondary">
				{run.doneCount > 0
					? "Your stack now matches how you actually work."
					: "Your stack already matches what we saw. We will tell you when that changes."}
			</p>
		</div>
	);
}

/** The one-at-a-time card. Enter answers yes, N hides. */
export function OneItem({
	run,
	item,
}: {
	run: ReconcileRun;
	item: ReconcileItem | undefined;
}) {
	const answer = useCallback(
		(decision: "added" | "hidden") => {
			if (!item) return;
			if (
				decision === "added" &&
				item.kind === "missing_what_for" &&
				!(run.notes[item.atomKey] ?? "").trim()
			) {
				return;
			}
			void run.answer(item, decision);
		},
		[item, run],
	);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			const typing =
				target !== null &&
				(target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.isContentEditable);
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

	if (!item) return <EmptyState run={run} />;

	const isModel = item.kind === "missing_from_authored";
	const note = run.notes[item.atomKey] ?? "";

	return (
		<div className="border border-stroke-subtle px-6 py-12 md:px-10 md:py-16">
			<p className="mb-6 text-lg text-fg-secondary">{askLine(item)}</p>
			<div className="flex items-center gap-5">
				<Monogram
					label={item.label}
					tone={isModel ? "measured" : "authored"}
					size="lg"
				/>
				<h2 className="text-4xl font-black tracking-tight text-fg-primary md:text-5xl">
					{item.label}
				</h2>
			</div>

			{isModel && (
				<div className="mt-5 space-y-1">
					{usageLine(item) && (
						<p className="text-sm text-fg-secondary">{usageLine(item)}</p>
					)}
					{priceLine(item) && (
						<p className="font-mono text-xs text-fg-muted">{priceLine(item)}</p>
					)}
				</div>
			)}

			{isModel ? (
				<div className="mt-8 flex flex-wrap gap-3">
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
						key={item.atomKey}
						value={note}
						onChange={(e) => run.setNote(item.atomKey, e.target.value)}
						placeholder="e.g. writing and reviewing code"
						aria-label={`What you use ${item.label} for`}
						className="mt-6 w-full border-b-2 border-stroke-strong bg-transparent px-1 py-3 text-xl text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
					/>
					<p className="mt-2 text-xs text-fg-muted">
						One line. Anyone looking at your stack will see it.
					</p>
					<div className="mt-6 flex flex-wrap gap-3">
						<PBtn
							tone="primary"
							onClick={() => answer("added")}
							disabled={!note.trim()}
							className="px-5 py-2.5"
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

function OpenRow({ run, item }: { run: ReconcileRun; item: ReconcileItem }) {
	const isModel = item.kind === "missing_from_authored";
	const note = run.notes[item.atomKey] ?? "";
	return (
		<div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
			<div className="flex min-w-0 flex-1 items-center gap-4">
				<Monogram label={item.label} tone={isModel ? "measured" : "authored"} />
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-fg-primary">{item.label}</p>
					<p className="mt-0.5 text-sm text-fg-secondary">{askLine(item)}</p>
					{isModel && (
						<p className="mt-1 font-mono text-[11px] text-fg-muted">
							{usageLine(item)}
							{priceLine(item) ? ` · ${priceLine(item)}` : ""}
						</p>
					)}
					{!isModel && (
						<input
							value={note}
							onChange={(e) => run.setNote(item.atomKey, e.target.value)}
							placeholder="e.g. writing and reviewing code"
							aria-label={`What you use ${item.label} for`}
							className="mt-2 w-full border border-stroke-subtle bg-bg-canvas px-2.5 py-1.5 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
						/>
					)}
				</div>
			</div>
			<div className="flex shrink-0 gap-2 sm:self-end">
				<PBtn
					tone="primary"
					disabled={!isModel && !note.trim()}
					onClick={() => void run.answer(item, "added")}
				>
					{isModel ? (
						<>
							<Plus className="size-3" /> Add it
						</>
					) : (
						"Save it"
					)}
				</PBtn>
				<PBtn tone="danger" onClick={() => void run.answer(item, "hidden")}>
					<EyeOff className="size-3" /> Hide
				</PBtn>
			</div>
		</div>
	);
}

function Framed({ children }: { children: ReactNode }) {
	return (
		<div className="divide-y divide-stroke-subtle border border-stroke-subtle">
			{children}
		</div>
	);
}

export function WholeList({ run }: { run: ReconcileRun }) {
	if (run.open.length === 0) return <EmptyState run={run} />;
	return (
		<Framed>
			{run.open.map((item) => (
				<OpenRow key={item.atomKey} run={run} item={item} />
			))}
		</Framed>
	);
}

export function AddedPane({ run }: { run: ReconcileRun }) {
	if (run.added.length === 0) {
		return (
			<p className="border border-stroke-subtle p-6 text-sm text-fg-secondary">
				Nothing added yet.
			</p>
		);
	}
	return (
		<Framed>
			{run.added.map((item) => (
				<div key={item.atomKey} className="flex items-center gap-3 px-4 py-3">
					<Check className="size-4 shrink-0 text-accent-lime" />
					<span className="flex-1 text-sm text-fg-primary">{item.label}</span>
					{item.note && (
						<span className="text-sm text-fg-secondary">
							&ldquo;{item.note}&rdquo;
						</span>
					)}
				</div>
			))}
		</Framed>
	);
}

/** Undoing is a view of its own, not a drawer - "Bring it back" (#39). */
export function HiddenPane({ run }: { run: ReconcileRun }) {
	if (run.hidden.length === 0) {
		return (
			<p className="border border-stroke-subtle p-6 text-sm text-fg-secondary">
				Nothing hidden. Anything you say is not yours ends up here, and you can
				always bring it back.
			</p>
		);
	}
	return (
		<Framed>
			{run.hidden.map((item: HiddenItem) => (
				<div key={item.atomKey} className="flex items-center gap-3 px-4 py-3">
					<span className="flex-1 text-sm text-fg-secondary">{item.label}</span>
					<span className="font-mono text-[11px] text-fg-muted">
						{item.hiddenAgo}
					</span>
					<PBtn tone="ghost" onClick={() => void run.bringBack(item)}>
						<RotateCcw className="size-3" /> Bring it back
					</PBtn>
				</div>
			))}
		</Framed>
	);
}
