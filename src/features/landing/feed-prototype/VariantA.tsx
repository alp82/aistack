/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * A — TICKER. The pulse is ambient.
 *
 * One line under the hero, one event at a time, rotating. The landing page
 * keeps selling; the feed costs 48 pixels and never competes with the pitch.
 * A dedicated page is where the full list lives, so this variant is the
 * "both" answer: strip here, page there.
 *
 * The bet: at four stacks, movement matters more than volume. A strip that
 * cycles three events still MOVES. A list of three events sits still.
 * The risk: cycling three events is a loop, and a loop reads as fake.
 */

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { fmtAgo, fmtTokens, harnessList, MONO_LABEL } from "./format";
import type { DisplayRow } from "./useFeedPrototype";

const ROTATE_MS = 4500;
const WINDOW = 6;

function Phrase({ row }: { row: DisplayRow }) {
	const who = (
		<span className="text-fg-primary font-semibold">{row.stack.creator}</span>
	);
	const event = row.event;

	if (event.type === "sync.landed") {
		const total = event.harnesses.reduce((s, h) => s + h.totalTokens, 0);
		return (
			<>
				{who} synced{" "}
				<span className="text-accent-lime font-semibold">
					{fmtTokens(total)} tokens
				</span>{" "}
				from {harnessList(event.harnesses.map((h) => h.harness))}
			</>
		);
	}
	if (event.type === "stack.published") {
		return (
			<>
				{who} published{" "}
				<span className="text-fg-primary font-semibold">{row.stack.name}</span>{" "}
				— {event.toolCount} {event.toolCount === 1 ? "tool" : "tools"}
			</>
		);
	}
	const added = event.added.map((a) => a.name).join(", ");
	const removed = event.removed.map((a) => a.name).join(", ");
	return (
		<>
			{who}{" "}
			{added ? (
				<>
					added <span className="text-accent-lime">{added}</span>
				</>
			) : null}
			{added && removed ? " · " : null}
			{removed ? (
				<>
					dropped <span className="text-fg-secondary">{removed}</span>
				</>
			) : null}
		</>
	);
}

export function VariantA({ rows }: { rows: DisplayRow[] }) {
	const window = rows.slice(0, WINDOW);
	const [index, setIndex] = useState(0);
	const [paused, setPaused] = useState(false);

	useEffect(() => {
		if (paused || window.length < 2) return;
		const id = setInterval(
			() => setIndex((i) => (i + 1) % window.length),
			ROTATE_MS,
		);
		return () => clearInterval(id);
	}, [paused, window.length]);

	// A newly injected event jumps to the front rather than waiting its turn.
	useEffect(() => {
		if (window[0]?.isNew) setIndex(0);
	}, [window[0]?.isNew]);

	const row = window[index % Math.max(window.length, 1)];
	if (!row) return null;

	return (
		<section
			aria-label="Recent activity"
			className="border-b-2 border-stroke-strong bg-bg-panel"
			onFocus={() => setPaused(true)}
			onBlur={() => setPaused(false)}
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
		>
			<div className="mx-auto w-full max-w-content px-6">
				<div className="flex h-12 items-center gap-4 overflow-hidden">
					<span className="flex shrink-0 items-center gap-2">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping bg-accent-lime opacity-60" />
							<span className="relative inline-flex h-2 w-2 bg-accent-lime" />
						</span>
						<span className={`${MONO_LABEL} text-accent-lime hidden sm:inline`}>
							live
						</span>
					</span>

					<div className="relative h-12 flex-1 overflow-hidden">
						<AnimatePresence mode="popLayout" initial={false}>
							<motion.div
								key={row.id}
								initial={{ y: 18, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								exit={{ y: -18, opacity: 0 }}
								transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
								className="absolute inset-0 flex items-center gap-3 text-sm text-fg-muted"
							>
								<span className="truncate">
									<Phrase row={row} />
								</span>
								<span className="shrink-0 font-mono text-xs text-fg-muted/70">
									{fmtAgo(row.minutesAgo)}
								</span>
							</motion.div>
						</AnimatePresence>
					</div>

					<span className="hidden shrink-0 items-center gap-1 md:flex">
						{window.map((r, i) => (
							<button
								type="button"
								key={r.id}
								aria-label={`event ${i + 1}`}
								onClick={() => setIndex(i)}
								className={`h-1 w-4 transition-colors ${
									i === index ? "bg-accent-lime" : "bg-stroke-subtle"
								}`}
							/>
						))}
					</span>

					<a
						href="?variant=C"
						className={`${MONO_LABEL} hidden shrink-0 items-center gap-1 text-fg-muted hover:text-accent-lime lg:flex`}
					>
						all activity <ArrowRight className="h-3 w-3" />
					</a>
				</div>
			</div>
		</section>
	);
}

export const VARIANT_A_NAME = "Ticker — ambient, one line";
