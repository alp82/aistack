/**
 * PROTOTYPE (#107) — three answers to "where does the freshness state sit,
 * and is it one element or two?".
 *
 * Throwaway. Delete this folder when #107 is decided.
 *
 * The three disagree about STRUCTURE, not about wording (every sentence comes
 * from `freshness.ts`):
 *
 *   A — ONE ELEMENT, TWO VOICES. A single line under the section header. The
 *       visitor reads the age. The owner reads the age plus one remedy clause,
 *       and the auto-sync switch below is highlighted as the control it names.
 *       Nothing new is added to the page for the owner.
 *
 *   B — A BAND ABOVE THE NUMBERS. A bordered callout between the header and
 *       the reading. The visitor gets one line. The owner gets the same line,
 *       the explainer and the command — two elements, since the switch below
 *       stays as it is.
 *
 *   C — A STAMP AT THE NUMBER, AND THE SWITCH DOES THE ASKING. The visitor
 *       gets a dated stamp under the headline and no sentence. For the owner
 *       the auto-sync box moves ABOVE the reading and leads with the prompt,
 *       so the remedy lives on the control and nowhere else.
 *
 * A stack under 48 hours old draws nothing extra in any variant. A stack that
 * never synced draws the empty box that already ships, and no age.
 */

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SWITCH_TITLE } from "../autoSync";
import { CommandBlock } from "../CommandLine";
import {
	KICKER,
	MONO_LABEL,
	NEVER_SYNCED_BODY,
	NEVER_SYNCED_TITLE,
	OWNER_NOT_MEASURED_BODY,
	OWNER_NOT_MEASURED_TITLE,
	PRIVACY_FOOTNOTE,
} from "../copy";
import {
	AUTO_ON_CMD,
	AUTO_SYNC_EXPLAINER,
	type Freshness,
	isOwner,
	NEVER_SYNCED_AUTO_NOTE,
	ownerOffLine,
	ownerOnLine,
	READING,
	SYNC_CMD,
	type ViewerKey,
	visitorLine,
} from "./freshness";

export const VARIANTS = ["A", "B", "C"] as const;
export type VariantKey = (typeof VARIANTS)[number];

export const VARIANT_LABELS: Record<VariantKey, string> = {
	A: "A · Header line",
	B: "B · Band above",
	C: "C · Stamp + switch",
};

type Props = {
	readonly variant: VariantKey;
	readonly viewer: ViewerKey;
	readonly f: Freshness;
};

/* -------------------------------------------------------------- the page -- */

export function FreshnessSection({ variant, viewer, f }: Props) {
	const owner = isOwner(viewer);
	const never = f.state === "never";
	const show = f.isStale;

	return (
		<section className="px-6 py-14 md:px-16">
			<div className="mx-auto max-w-content">
				<SectionHead
					meta={never ? undefined : `checked ${f.ago}`}
					flagged={show && variant === "A"}
				/>

				{variant === "A" && show && <HeaderLine viewer={viewer} f={f} />}

				{/* C promotes the control itself, so it stands before the reading. */}
				{variant === "C" && show && owner && (
					<AutoSyncBox viewer={viewer} f={f} mode="lead" />
				)}

				{variant === "B" && show && <Band viewer={viewer} f={f} />}

				{never ? (
					owner ? (
						<OwnerEmpty />
					) : (
						<VisitorEmpty />
					)
				) : (
					<Reading stamp={variant === "C" && show ? <Stamp f={f} /> : null} />
				)}

				{owner && !(variant === "C" && show) && (
					<AutoSyncBox
						viewer={viewer}
						f={f}
						mode={variant === "A" && show ? "remedy" : "plain"}
					/>
				)}
			</div>
		</section>
	);
}

/* ------------------------------------------------------------- variant A -- */

/**
 * One line, directly under the header rule. The voice changes with the reader
 * and the element does not: the visitor is told how old the number is, the
 * owner is told the same thing and what fixes it.
 */
function HeaderLine({ viewer, f }: { viewer: ViewerKey; f: Freshness }) {
	const line =
		viewer === "visitor"
			? visitorLine(f, READING.windowDays)
			: viewer === "owner-on"
				? ownerOnLine(f)
				: ownerOffLine(f);
	return (
		<p
			className={cn(
				"mb-8 max-w-prose text-sm leading-relaxed",
				viewer === "owner-off" ? "text-fg-primary" : "text-fg-muted",
			)}
		>
			{line}
			{viewer === "owner-off" && (
				<span className="text-fg-muted"> The switch is below.</span>
			)}
		</p>
	);
}

/* ------------------------------------------------------------- variant B -- */

/** A bordered band between the header and the reading. */
function Band({ viewer, f }: { viewer: ViewerKey; f: Freshness }) {
	if (viewer === "visitor") {
		return (
			<div className="mb-8 border-l-2 border-stroke-strong bg-bg-panel px-5 py-4">
				<p className="max-w-prose text-sm text-fg-secondary">
					{visitorLine(f, READING.windowDays)}
				</p>
			</div>
		);
	}
	if (viewer === "owner-on") {
		return (
			<div className="mb-8 border-l-2 border-stroke-strong bg-bg-panel px-5 py-4">
				<p className="max-w-prose text-sm text-fg-secondary">
					{ownerOnLine(f)}
				</p>
			</div>
		);
	}
	return (
		<div className="mb-8 border-l-2 border-accent-lime bg-bg-panel px-5 py-5">
			<p className={cn(MONO_LABEL, "text-accent-lime")}>
				{"// keep this current"}
			</p>
			<p className="mt-3 max-w-prose text-sm text-fg-primary">
				{ownerOffLine(f)}
			</p>
			<p className="mt-2 max-w-prose text-xs leading-relaxed text-fg-muted">
				{AUTO_SYNC_EXPLAINER}
			</p>
			<div className="mt-4 max-w-xl">
				<CommandBlock
					commands={[{ cmd: AUTO_ON_CMD, comment: "or the switch below" }]}
				/>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------- variant C -- */

/** The age, stamped on the number it qualifies. No sentence. */
function Stamp({ f }: { f: Freshness }) {
	return (
		<p className={cn(MONO_LABEL, "mt-3 px-3 text-fg-muted")}>
			as of {f.day} · {f.ago} · {READING.windowDays}-day window
		</p>
	);
}

/* ----------------------------------------------------------- the control -- */

/**
 * The auto-sync switch as #104 ships it, with two prototype modes on top:
 * `remedy` (variant A — the same box, marked as the thing the line above
 * names) and `lead` (variant C — promoted above the reading and leading with
 * the prompt).
 */
function AutoSyncBox({
	viewer,
	f,
	mode,
}: {
	viewer: ViewerKey;
	f: Freshness;
	mode: "plain" | "remedy" | "lead";
}) {
	const on = viewer === "owner-on";
	const highlight = mode !== "plain";

	return (
		<div
			className={cn(
				"border bg-bg-panel px-6 py-6 md:px-8",
				mode === "lead" ? "mb-10" : "mt-10",
				highlight ? "border-accent-lime" : "border-stroke-strong",
			)}
		>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<p
						className={cn(
							MONO_LABEL,
							highlight ? "text-accent-lime" : "text-fg-muted",
						)}
					>
						{SWITCH_TITLE}
					</p>
					<p className="mt-2 text-sm text-fg-primary">
						{on ? (
							<>
								On, every day at most.{" "}
								<span className="text-fg-muted">
									Last automatic sync {f.ago}.
								</span>
							</>
						) : mode === "lead" ? (
							ownerOffLine(f)
						) : (
							"Off. Only a sync you run yourself publishes."
						)}
					</p>
				</div>
				<div className="flex items-center gap-3">
					{on && (
						<span className="border border-stroke-strong px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-fg-secondary">
							every day
						</span>
					)}
					<span className="flex">
						<span
							className={cn(
								"border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em]",
								on
									? "border-stroke-strong text-fg-secondary"
									: "border-accent-lime bg-accent-lime text-accent-lime-contrast",
							)}
						>
							off
						</span>
						<span
							className={cn(
								"border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em]",
								on
									? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
									: "border-stroke-strong text-fg-secondary",
							)}
						>
							on
						</span>
					</span>
				</div>
			</div>

			<p className="mt-3 max-w-prose text-xs leading-relaxed text-fg-muted">
				{on
					? "A sync fires when a session starts on a linked machine, and at most once per interval. Turn this off and it stops everywhere."
					: highlight
						? AUTO_SYNC_EXPLAINER
						: "Machines that still have a hook keep firing on their own schedule. They publish nothing while this is off."}
			</p>

			{mode === "lead" && !on && (
				<div className="mt-4 max-w-xl">
					<CommandBlock
						commands={[
							{ cmd: AUTO_ON_CMD, comment: "same switch, from the CLI" },
						]}
					/>
				</div>
			)}
		</div>
	);
}

/* ------------------------------------------------------ the reading host -- */

function SectionHead({ meta, flagged }: { meta?: string; flagged?: boolean }) {
	return (
		<div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-stroke-strong pb-4">
			<div>
				<p className={cn(MONO_LABEL, "text-accent-lime")}>{KICKER}</p>
				<h2 className="mt-2 text-3xl font-black uppercase tracking-tighter text-fg-primary md:text-4xl">
					Actual Usage
				</h2>
			</div>
			{meta && (
				<p
					className={cn(
						MONO_LABEL,
						flagged ? "text-fg-secondary" : "text-fg-muted",
					)}
				>
					{meta}
				</p>
			)}
		</div>
	);
}

/** A stand-in for the live reading: same order, weight and density as #81. */
function Reading({ stamp }: { stamp: React.ReactNode }) {
	return (
		<div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
			<div>
				<div className="border border-stroke-subtle px-3 py-6">
					<p className="font-mono text-5xl font-black leading-none text-fg-primary">
						4.71B
					</p>
					<p className={cn(MONO_LABEL, "mt-2 text-fg-muted")}>
						tokens · last {READING.windowDays} days
					</p>
					<p className="mt-5 font-mono text-2xl font-black text-fg-primary">
						≥ ${READING.usd.toLocaleString("en-US")}
					</p>
					<p className={cn(MONO_LABEL, "mt-2 text-fg-muted")}>
						at least, at api list prices
					</p>
				</div>
				{stamp}
				<p className="mt-6 max-w-sm px-3 text-sm leading-relaxed text-fg-muted">
					This is a rolling {READING.windowDays}-day reading, not a running
					total. It moves every time it is checked, because the window moves
					with it.
				</p>
				<div className="mt-6 space-y-1 px-3">
					<p className={cn(MONO_LABEL, "text-fg-muted")}>
						{READING.readings} readings since {READING.firstDay}
					</p>
					<p className={cn(MONO_LABEL, "text-fg-muted")}>
						prices: {READING.pricingTable}
					</p>
				</div>
			</div>

			<div>
				<p className={cn(MONO_LABEL, "mb-4 text-accent-lime")}>
					where the tokens went
				</p>
				<div className="space-y-3">
					{READING.models.map((m) => (
						<div key={m.name}>
							<div className="flex items-baseline justify-between gap-4">
								<span className="text-sm text-fg-primary">{m.name}</span>
								<span className={cn(MONO_LABEL, "text-fg-muted")}>
									{(m.share * 100).toFixed(0)}%
								</span>
							</div>
							<div className="mt-1 h-2 bg-stroke-subtle">
								<div
									className="h-full bg-accent-lime"
									style={{ width: `${m.share * 100}%` }}
								/>
							</div>
						</div>
					))}
				</div>

				<div className="mt-8 grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle sm:grid-cols-4">
					<Stat label="sessions" value={String(READING.sessions)} />
					<Stat
						label="active days"
						value={`${READING.activeDays} of ${READING.windowDays}`}
					/>
					<Stat
						label="cache hits"
						value={`${Math.round(READING.cacheHits * 100)}%`}
					/>
					<Stat
						label="run by subagents"
						value={`${Math.round(READING.subagents * 100)}%`}
					/>
				</div>
			</div>
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-bg-canvas px-4 py-4">
			<p className="font-mono text-xl font-black text-fg-primary">{value}</p>
			<p className={cn(MONO_LABEL, "mt-1 text-fg-muted")}>{label}</p>
		</div>
	);
}

/* ----------------------------------------------------------- no sync ever -- */

/** The visitor's invitation, exactly as it ships. No age, no warning. */
function VisitorEmpty() {
	return (
		<div className="border border-dashed border-stroke-strong px-6 py-10 text-center">
			<p className="text-lg text-fg-primary">{NEVER_SYNCED_TITLE}</p>
			<p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
				{NEVER_SYNCED_BODY}
			</p>
			<p className={cn(MONO_LABEL, "mt-6 text-fg-muted")}>
				have a stack of your own? —{" "}
				<code className="text-fg-primary">{SYNC_CMD}</code>
			</p>
		</div>
	);
}

/**
 * The owner's empty box as it ships, plus one added line: auto-sync exists,
 * and it arrives after the first sync. It cannot be offered here — the CLI
 * refuses to enable it from an unlinked machine.
 */
function OwnerEmpty() {
	return (
		<div className="border border-stroke-strong px-6 py-10 md:px-10">
			<p className="text-lg text-fg-primary">{OWNER_NOT_MEASURED_TITLE}</p>
			<p className="mt-2 max-w-xl text-sm text-fg-muted">
				{OWNER_NOT_MEASURED_BODY}
			</p>
			<div className="mt-6 max-w-xl">
				<CommandBlock
					commands={[{ cmd: SYNC_CMD, comment: "link, scan, review, approve" }]}
				/>
			</div>
			<p className={cn(MONO_LABEL, "mt-4 text-fg-muted")}>{PRIVACY_FOOTNOTE}</p>
			<p className="mt-4 max-w-xl text-sm text-fg-muted">
				{NEVER_SYNCED_AUTO_NOTE}
			</p>
			<span className="mt-6 inline-flex items-center gap-2 bg-accent-lime px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-accent-lime-contrast">
				how syncing works <ArrowRight size={14} />
			</span>
		</div>
	);
}
