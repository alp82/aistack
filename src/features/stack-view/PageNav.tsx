import { ArrowDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { PageSection } from "./pageOrder";

const SITE_HEADER_HEIGHT_PX = 64;

/**
 * The stack page's section navigation: a stat-row block under the hero, and a
 * fixed rail that takes over once the block scrolls away.
 *
 * Wayfinder ticket #217 (map #200), the shell fit from prototype #193.
 *
 * THE ROWS NAVIGATE, THEY DO NOT EXPAND. Thirteen prototype rounds ended on one
 * continuous page: a row is a link to a section further down, and the reader
 * never has to open anything to reach the content. The saved accordion
 * alternative is on record in the ticket and is not what shipped.
 *
 * THE NAV RESTATES, IT NEVER COMPUTES. Every number in a row is a figure its
 * section already prints, handed in through `sections`. A stat the nav derived
 * on its own could disagree with the section it points at.
 */
export function StackPageNav({
	sections,
	identity,
}: {
	sections: readonly PageSection[];
	identity: { name: string; priceText: string; upvotes: number };
}) {
	const linksRef = useRef<HTMLUListElement>(null);
	const [railShown, setRailShown] = useState(false);
	const [currentAnchor, setCurrentAnchor] = useState<string | null>(null);
	const anchorKey = sections.map((section) => section.anchor).join(",");

	// The rail arrives once half of the clickable rows have moved behind the site
	// header. Measuring the rows instead of the padded nav block makes the handoff
	// track the content the reader can still use.
	//
	// THIS READS THE POSITION, IT DOES NOT WATCH FOR A CROSSING. An
	// IntersectionObserver on the rows reports a CHANGE in whether the rows
	// overlap the viewport, and on a short screen the rows never overlap it:
	// it starts below the fold, and a tap on a nav row jumps the reader straight
	// past it to a section further down. The observer would see "not
	// intersecting" on both sides of that jump, report nothing, and leave the
	// rail undocked for the rest of the page.
	useEffect(() => {
		const links = linksRef.current;
		if (!links) return;
		const update = () => {
			const bounds = links.getBoundingClientRect();
			if (bounds.height === 0) return;
			setRailShown(bounds.top + bounds.height / 2 <= SITE_HEADER_HEIGHT_PX);
		};
		update();
		window.addEventListener("scroll", update, { passive: true });
		window.addEventListener("resize", update);
		return () => {
			window.removeEventListener("scroll", update);
			window.removeEventListener("resize", update);
		};
	}, []);

	// The scroll spy. The margins pick the band a third of the way down the
	// viewport, so the marked link is the section the reader is reading rather
	// than whichever one happens to touch the top edge.
	useEffect(() => {
		if (typeof IntersectionObserver === "undefined") return;
		const targets = anchorKey
			.split(",")
			.map((anchor) => document.getElementById(anchor))
			.filter((element): element is HTMLElement => element !== null);
		if (targets.length === 0) return;
		const spy = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) setCurrentAnchor(entry.target.id);
				}
			},
			{ rootMargin: "-30% 0px -60% 0px" },
		);
		for (const target of targets) spy.observe(target);
		return () => spy.disconnect();
	}, [anchorKey]);

	if (sections.length === 0) return null;

	return (
		<>
			<nav
				aria-label="Stack sections"
				className="mx-auto max-w-7xl px-6 pt-7 pb-10"
			>
				<ul ref={linksRef} className="border border-stroke-subtle">
					{sections.map((section) => (
						<li
							key={section.key}
							className="border-t border-stroke-subtle first:border-t-0"
						>
							<a
								href={`#${section.anchor}`}
								className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-bg-panel/50 motion-reduce:transition-none"
							>
								<span className="shrink-0 font-mono text-[15px] font-extrabold text-stroke-strong">
									{numberLabel(section.index)}
								</span>
								<span className="shrink-0 text-[15px] font-black uppercase tracking-tight text-fg-primary">
									{section.title}
								</span>
								<span className="ml-auto flex min-w-0 items-center gap-3">
									{section.stat && (
										<span className="truncate font-mono text-[11px] uppercase tracking-[0.18em] text-fg-muted">
											{section.stat}
										</span>
									)}
									<ArrowDown className="size-3.5 shrink-0 text-accent-lime" />
								</span>
							</a>
						</li>
					))}
				</ul>
			</nav>

			{/* Under the site header, which is 64px tall and holds z-50. Hidden, the
			    rail sits behind it rather than off the top of the document. */}
			<nav
				aria-label="Stack sections, pinned"
				aria-hidden={!railShown}
				className={cn(
					"fixed inset-x-0 top-16 z-40 border-b-2 border-stroke-strong bg-bg-panel/95 px-6 backdrop-blur transition-transform duration-200 motion-reduce:transition-none",
					railShown ? "translate-y-0" : "-translate-y-full",
				)}
				data-testid="section-rail"
				data-shown={railShown ? "true" : "false"}
			>
				<div
					className="mx-auto flex w-full max-w-content overflow-x-auto"
					data-testid="section-rail-content"
				>
					<span className="flex shrink-0 items-center gap-3 border-x-2 border-stroke-strong px-3.5 py-2">
						<span className="whitespace-nowrap text-xs font-black uppercase tracking-tight text-fg-primary">
							{identity.name}
						</span>
						<span className="whitespace-nowrap font-mono text-[10px] font-bold text-accent-lime">
							{identity.priceText}
						</span>
						<span className="flex items-center whitespace-nowrap font-mono text-[10px] text-fg-muted">
							<ChevronUp className="size-3" aria-hidden="true" />
							{identity.upvotes}
							<span className="sr-only"> upvotes</span>
						</span>
					</span>
					{sections.map((section) => {
						const on = currentAnchor === section.anchor;
						return (
							<a
								key={section.key}
								href={`#${section.anchor}`}
								tabIndex={railShown ? undefined : -1}
								aria-current={on ? "true" : undefined}
								className={cn(
									"shrink-0 whitespace-nowrap border-r border-stroke-subtle px-3.5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-colors motion-reduce:transition-none",
									on
										? "text-accent-lime shadow-[inset_0_-3px_0_var(--accent-lime)]"
										: "text-fg-muted hover:text-fg-primary",
								)}
							>
								<span
									className={cn(
										"mr-1.5",
										on ? "text-accent-lime" : "text-stroke-strong",
									)}
								>
									{numberLabel(section.index)}
								</span>
								{section.title}
							</a>
						);
					})}
				</div>
			</nav>
		</>
	);
}

function numberLabel(index: number): string {
	return String(index).padStart(2, "0");
}
