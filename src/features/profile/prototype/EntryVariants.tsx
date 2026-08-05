/**
 * PROTOTYPE (#98) — where an owner enters the view numbers from.
 *
 * Throwaway. All three render inside the owner-only region of the real profile
 * page, which is the surface the risk lives on: the profile is PUBLIC, the
 * number is STRICTLY PRIVATE. Every variant has to read as private to the
 * owner, and a screenshot of a visitor's view of the same page must contain
 * none of it.
 *
 * E1 — Link only. A door, no number. Nothing private is ever painted here.
 * E2 — Summary. The total and the top pages, fenced and labeled private, with
 *      the full page one click away.
 * E3 — Inline. The whole thing lives here and `/settings/analytics` goes away.
 */

import { Link } from "@tanstack/react-router";
import { ArrowRight, Lock } from "lucide-react";
import { formatExact, Sparkline } from "@/features/charts";
import { REFERRER_LABELS, rangeLabel } from "@/features/settings/AnalyticsPage";
import type { AnalyticsData } from "@/features/settings/prototype/fixtures";

export const ENTRIES = ["E1", "E2", "E3"] as const;
export type EntryKey = (typeof ENTRIES)[number];

export const ENTRY_LABELS: Record<EntryKey, string> = {
	E1: "E1 · Link",
	E2: "E2 · Summary",
	E3: "E3 · Inline",
};

/**
 * The fence every variant that paints a number sits inside.
 *
 * A dashed edge and a lock, in the same treatment the draft-stack cards already
 * use for owner-only content, so "only you see this" is a shape the owner
 * already knows on this page and not a sentence they have to find.
 */
function PrivateFence({
	children,
	title,
}: {
	readonly children: React.ReactNode;
	readonly title: string;
}) {
	return (
		<section className="border border-dashed border-stroke-strong bg-bg-panel-muted p-5">
			<div className="flex items-center gap-1.5">
				<Lock aria-hidden="true" className="size-3 text-fg-muted" />
				<h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
					{title} — only you can see this
				</h2>
			</div>
			{children}
		</section>
	);
}

/* -------------------------------------------------------------------- E1 */

export function EntryE1() {
	return (
		<Link
			to="/settings/analytics"
			className="group flex items-center justify-between gap-4 border border-dashed border-stroke-strong px-4 py-3 transition-colors hover:border-accent-lime"
		>
			<span className="flex items-center gap-1.5">
				<Lock aria-hidden="true" className="size-3 text-fg-muted" />
				<span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted group-hover:text-accent-lime">
					Views — only you can see them
				</span>
			</span>
			<span className="flex items-center gap-1.5 font-mono text-xs text-fg-secondary group-hover:text-accent-lime">
				Open
				<ArrowRight aria-hidden="true" className="size-3" />
			</span>
		</Link>
	);
}

/* -------------------------------------------------------------------- E2 */

export function EntryE2({ data }: { readonly data: AnalyticsData }) {
	const range = rangeLabel(
		data.firstCountedDayMs,
		data.windowStartMs,
		data.windowDays,
	);
	const top = data.targets.filter((t) => t.openable).slice(0, 3);

	return (
		<PrivateFence title="Views">
			{data.total === 0 ? (
				<p className="mt-3 text-sm leading-relaxed text-fg-secondary">
					Nobody has opened your pages yet. Counting starts the first time
					somebody who is not you opens one. Your own visits never count while
					you are signed in.
				</p>
			) : (
				<>
					<p className="mt-3 font-mono text-3xl font-black text-accent">
						{formatExact(data.total)}
					</p>
					<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
						deduped daily visitors · {range}
					</p>
					<ul className="mt-4 space-y-2 border-t border-stroke-subtle pt-3">
						{top.map((t) => (
							<li
								key={t.targetId}
								className="flex items-center justify-between gap-3"
							>
								<span className="truncate font-mono text-xs text-fg-secondary">
									{t.label}
								</span>
								<span className="flex shrink-0 items-center gap-3">
									<Sparkline
										points={t.days}
										ariaLabel={`Daily visitors for ${t.label}`}
										width={64}
										height={18}
									/>
									<span className="font-mono text-sm font-bold text-fg-primary">
										{formatExact(t.total)}
									</span>
								</span>
							</li>
						))}
					</ul>
					<p className="mt-3 text-xs leading-relaxed text-fg-muted">
						One page counts one visitor once per day. A visitor is a browser on
						a network, not a person. Not page loads.
					</p>
				</>
			)}
			<Link
				to="/settings/analytics"
				className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-secondary hover:text-accent-lime"
			>
				All pages, day by day
				<ArrowRight aria-hidden="true" className="size-3" />
			</Link>
		</PrivateFence>
	);
}

/* -------------------------------------------------------------------- E3 */

/**
 * E3 — the whole surface inline, and no separate page.
 *
 * Every page, every number, the referrer split and the full labeling live in
 * the owner-only region. `/settings/analytics` is deleted and the account-menu
 * entry points at the profile instead.
 */
export function EntryE3({ data }: { readonly data: AnalyticsData }) {
	const range = rangeLabel(
		data.firstCountedDayMs,
		data.windowStartMs,
		data.windowDays,
	);
	const sentence =
		data.referrers.length > 0
			? `Most visits came from ${REFERRER_LABELS[
					data.referrers[0].bucket
				].toLowerCase()} (${data.referrers[0].count}).`
			: null;

	return (
		<PrivateFence title="Views">
			{data.total === 0 ? (
				<p className="mt-3 text-sm leading-relaxed text-fg-secondary">
					Nobody has opened your pages yet. Counting starts the first time
					somebody who is not you opens one.
				</p>
			) : (
				<p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-fg-muted">
					<span className="text-accent">{formatExact(data.total)}</span> deduped
					daily visitors · {range}
				</p>
			)}

			<ul className="mt-4 space-y-2">
				{data.targets.map((t) => (
					<li
						key={t.targetId}
						className="flex items-center justify-between gap-3 border border-stroke-subtle bg-bg-panel px-3 py-2"
					>
						<span className="min-w-0">
							<span className="block truncate font-mono text-xs font-bold text-fg-primary">
								{t.label}
							</span>
							<span className="mt-0.5 block font-mono text-[10px] text-fg-muted">
								{!t.openable
									? "Draft — nobody can open it yet"
									: t.total === 0
										? "Nobody has opened it yet"
										: "deduped daily visitors"}
							</span>
						</span>
						<span className="flex shrink-0 items-center gap-3">
							<Sparkline
								points={t.days}
								ariaLabel={`Daily visitors for ${t.label}`}
								width={72}
								height={20}
								area
							/>
							<span className="font-mono text-sm font-black text-fg-primary">
								{formatExact(t.total)}
							</span>
						</span>
					</li>
				))}
			</ul>

			{sentence && (
				<p className="mt-3 text-xs leading-relaxed text-fg-secondary">
					{sentence} A visitor who then clicks around your pages counts as a
					link on this site.
				</p>
			)}
			<p className="mt-3 max-w-prose text-xs leading-relaxed text-fg-muted">
				One page counts one visitor once per day. A visitor is a browser on a
				network, not a person — an office shares one number and one person on a
				phone and a laptop counts twice. Visits you make while signed in are
				left out. These are not page loads.
			</p>
		</PrivateFence>
	);
}
