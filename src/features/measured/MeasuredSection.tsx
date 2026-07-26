import { useQuery } from "convex/react";
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { cn, timeAgo } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import {
	coverageCaveat,
	fmtShare,
	fmtTokens,
	fmtUSD,
	harnessLine,
	KICKER,
	keptPrivate,
	MEASURED_ANCHOR,
	type MeasuredModel,
	type MeasuredSnapshot,
	MONO_LABEL,
	modelLabel,
	NEVER_SYNCED_BODY,
	NEVER_SYNCED_TITLE,
	stalenessLine,
	TITLE,
	totalUSD,
	windowSentence,
} from "./copy";

/**
 * Journey section 02 — the public measured display.
 *
 * Wayfinder ticket #46 (map #29), building variant B locked by #40. It sits
 * ahead of Tools, because what ran outranks what is listed.
 *
 * Public and unauthenticated: `getCurrentByStackSlug` answers for any published
 * stack and returns null for one that has never synced. That null renders an
 * INVITATION addressed to the reader, never a demerit on the author — every
 * stack but one is in that state, and a page that scolded them for it would be
 * scolding almost everybody.
 */
export function MeasuredSection({
	index,
	slug,
}: {
	index: number;
	slug: string;
}) {
	const snapshot = useQuery(api.measured.getCurrentByStackSlug, { slug });

	return (
		<Section index={index} id={MEASURED_ANCHOR}>
			<SectionHeader
				index={String(index).padStart(2, "0")}
				kicker={KICKER}
				title={TITLE}
				meta={snapshot ? `checked ${timeAgo(snapshot.receivedAt)}` : undefined}
			/>
			{/* Undefined is "not answered yet", and it must not read as "never
			    measured" — the invitation waits until the query has spoken. */}
			{snapshot === undefined ? null : snapshot === null ? (
				<NeverMeasured />
			) : (
				<Reading snapshot={snapshot} />
			)}
		</Section>
	);
}

function Reading({ snapshot }: { snapshot: MeasuredSnapshot }) {
	const cost = totalUSD(snapshot);
	const caveat = coverageCaveat(snapshot);
	const privateCounts = keptPrivate(snapshot);

	return (
		<div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
			{/* The reading. The one place on the page a measured dollar appears. */}
			<div>
				<p className="font-mono text-5xl font-black leading-none text-fg-primary md:text-6xl">
					{cost !== null
						? `≈${fmtUSD(cost)}`
						: fmtTokens(snapshot.activity.totalTokens)}
				</p>
				<p className="mt-2 text-sm text-fg-muted">
					{cost !== null
						? `at API prices, over the last ${snapshot.window.days} days`
						: `tokens over the last ${snapshot.window.days} days`}
				</p>

				<p className="mt-6 max-w-sm text-sm leading-relaxed text-fg-muted">
					{windowSentence(snapshot.window.days)}
				</p>

				<div className="mt-6 space-y-1">
					<p className={cn(MONO_LABEL, "text-fg-muted")}>
						{snapshot.window.from} → {snapshot.window.to}
					</p>
					<p className={cn(MONO_LABEL, "text-fg-muted")}>
						{harnessLine(snapshot)}
					</p>
					{/* A price the reader cannot date is a price we do not print, so
					    this line is present whenever the figure above is. */}
					{cost !== null && snapshot.pricingTable && (
						<p className={cn(MONO_LABEL, "text-fg-muted")}>
							prices: {snapshot.pricingTable}
						</p>
					)}
				</div>
			</div>

			{/* The split, then the activity stats. */}
			<div>
				<div className="space-y-3">
					{snapshot.models.map((m) => (
						<ModelRow key={m.id} model={m} showCost={cost !== null} />
					))}
				</div>

				<div className="mt-8 grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle sm:grid-cols-4">
					<Stat
						label="sessions"
						value={snapshot.activity.sessions.toLocaleString("en-US")}
					/>
					<Stat
						label="active days"
						value={`${snapshot.activity.activeDays} of ${snapshot.window.days}`}
					/>
					<Stat
						label="cache hits"
						value={`${Math.round(snapshot.activity.cacheHitShare * 100)}%`}
					/>
					<Stat
						label="run by subagents"
						value={`${Math.round(snapshot.activity.subagentShare * 100)}%`}
					/>
				</div>

				<div className="mt-4 space-y-1">
					{privateCounts && (
						<p className={cn(MONO_LABEL, "text-fg-muted")}>
							kept private: {privateCounts}
						</p>
					)}
					{caveat && <p className="text-[11px] text-orange-400">{caveat}</p>}
					{!snapshot.isFresh && (
						<p className="text-[11px] text-orange-400">
							{stalenessLine(timeAgo(snapshot.receivedAt))}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

/**
 * One model's share of the window.
 *
 * `catalogName` is null for a model the catalog has never heard of, and its
 * tokens are as real as any other row's — on the owner's own window that row is
 * the biggest one. It renders as the raw vendor id, with no error state.
 */
function ModelRow({
	model,
	showCost,
}: {
	model: MeasuredModel;
	showCost: boolean;
}) {
	return (
		<div className="flex items-center gap-4">
			<span className="w-44 shrink-0 truncate font-mono text-xs text-fg-primary">
				{modelLabel(model)}
			</span>
			<span className="h-2 flex-1 bg-bg-panel">
				<span
					className="block h-full bg-accent-lime"
					style={{ width: `${Math.max(1, model.tokenShare * 100)}%` }}
				/>
			</span>
			<span className="w-14 shrink-0 text-right font-mono text-xs text-fg-muted">
				{fmtShare(model.tokenShare)}
			</span>
			{showCost && model.apiEquivalentUSD !== undefined && (
				<span className="w-20 shrink-0 text-right font-mono text-xs text-fg-primary">
					{fmtUSD(model.apiEquivalentUSD)}
				</span>
			)}
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

function NeverMeasured() {
	return (
		<div className="border border-dashed border-stroke-strong px-6 py-10 text-center">
			<p className="text-lg text-fg-primary">{NEVER_SYNCED_TITLE}</p>
			<p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
				{NEVER_SYNCED_BODY}
			</p>
		</div>
	);
}
