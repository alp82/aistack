/**
 * The stack page's section nav (#356, the v38 design locked in #352 round 12).
 *
 * One sticky bar directly under the hero, pinned under the 64px site header.
 * Two rows:
 *
 *   1. THE IDENTITY ROW: name, upvotes, price, and the token figure on the
 *      right. Folded until the bar sticks, then unfolds (grid rows 0fr to 1fr
 *      plus a fade). The whole row is a click-to-top button, and while it is
 *      folded it stays out of the tab order.
 *   2. THE TAB ROW: one link per rendered section, 136px wide, mono uppercase
 *      with the padded number. Under each tab a lime segment shows the share
 *      of the section on screen: its left edge is what scrolled past the bar,
 *      its right edge what is still under the fold. A tab is `aria-current`
 *      while half of its section, or half of the viewport, shows it. The bar
 *      carries no control: the measured range is set in the Stats section.
 *
 * The bar restates and never computes: every figure on it is handed in by
 * the route. The arithmetic lives in `navMath.ts`; this file only measures.
 *
 * Two measuring rules that matter:
 *
 *   - THE NATURAL TOP COMES FROM A SENTINEL. A stuck sticky element reports
 *     its stuck position, so `nav.offsetTop` cannot say where the bar sits in
 *     the flow (#352 round 11: with that floor no tab click could scroll up).
 *     A zero-height, non-sticky element rendered right before the bar can,
 *     and it is read on every update because the layout above the bar shifts
 *     after hydration as fonts, images, the owner drawer and live queries land.
 *   - NOTHING TOUCHES `window` DURING RENDER. The server and the client's
 *     first paint agree on one markup (not stuck, no segments); the first
 *     real measurement runs in an effect. Updates are coalesced to one per
 *     animation frame and state is set only when a value changed.
 */

import { ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { NavLayout, Segment } from "./navMath";
import {
	EMPTY_LAYOUT,
	isStuck,
	jumpTarget,
	sameLayout,
	visibleSegment,
} from "./navMath";
import type { PageSection } from "./pageOrder";
import { STACK_WIDTH } from "./ui";

const SITE_HEADER_HEIGHT_PX = 64;
/** How far under the bar a section lands after a tab click. */
const JUMP_OFFSET_PX = 88;

function documentTop(element: Element): number {
	return element.getBoundingClientRect().top + window.scrollY;
}

export function StackPageNav({
	sections,
	identity,
}: {
	sections: readonly PageSection[];
	identity: {
		name: string;
		priceText: string;
		upvotes: number;
		tokenText: string | null;
	};
}) {
	const sentinelRef = useRef<HTMLDivElement>(null);
	const navRef = useRef<HTMLElement>(null);
	const [layout, setLayout] = useState<NavLayout>(EMPTY_LAYOUT);

	useEffect(() => {
		let frame = 0;
		let pending = false;
		const measure = () => {
			const sentinel = sentinelRef.current;
			const nav = navRef.current;
			if (!sentinel || !nav) return;
			const scrollY = window.scrollY;
			const viewportTop = scrollY + SITE_HEADER_HEIGHT_PX + nav.offsetHeight;
			const viewportBottom = scrollY + window.innerHeight;
			const segments: Record<string, Segment> = {};
			for (const section of sections) {
				const element = document.getElementById(section.anchor);
				if (!element) continue;
				const rect = element.getBoundingClientRect();
				const segment = visibleSegment({
					sectionTop: rect.top + scrollY,
					sectionHeight: rect.height,
					viewportTop,
					viewportBottom,
				});
				if (segment) segments[section.anchor] = segment;
			}
			const next: NavLayout = {
				stuck: isStuck({
					naturalTop: documentTop(sentinel),
					scrollY,
					headerHeight: SITE_HEADER_HEIGHT_PX,
				}),
				segments,
			};
			setLayout((prev) => (sameLayout(prev, next) ? prev : next));
		};
		// One measurement per frame, however many scroll events land in it.
		const schedule = () => {
			if (pending) return;
			pending = true;
			frame = window.requestAnimationFrame(() => {
				pending = false;
				measure();
			});
		};
		measure();
		window.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("resize", schedule);
		return () => {
			if (pending) window.cancelAnimationFrame(frame);
			window.removeEventListener("scroll", schedule);
			window.removeEventListener("resize", schedule);
		};
	}, [sections]);

	if (sections.length === 0) return null;

	const { stuck, segments } = layout;

	const go =
		(section: PageSection) => (event: React.MouseEvent<HTMLAnchorElement>) => {
			event.preventDefault();
			const target = document.getElementById(section.anchor);
			const sentinel = sentinelRef.current;
			if (!target || !sentinel) return;
			window.scrollTo({
				top: jumpTarget({
					barTop: documentTop(sentinel),
					sectionTop: documentTop(target),
					headerHeight: SITE_HEADER_HEIGHT_PX,
					offset: JUMP_OFFSET_PX,
				}),
				behavior: "smooth",
			});
			window.history.replaceState(null, "", `#${section.anchor}`);
		};

	return (
		<>
			<div ref={sentinelRef} aria-hidden="true" data-testid="nav-sentinel" />
			<nav
				ref={navRef}
				aria-label="Stack sections"
				className="sticky top-16 z-40 border-b border-stroke-subtle bg-bg-canvas/95 backdrop-blur"
			>
				<div
					className={cn(
						"grid transition-[grid-template-rows,opacity] duration-200",
						stuck ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
					)}
					data-testid="identity-row"
					data-shown={stuck ? "true" : "false"}
					aria-hidden={stuck ? undefined : "true"}
				>
					<button
						type="button"
						title="Back to top"
						onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
						tabIndex={stuck ? 0 : -1}
						className="min-h-0 overflow-hidden border-b border-stroke-subtle text-left"
					>
						<span
							className={cn(
								"mx-auto flex items-center gap-5 px-6 py-2",
								STACK_WIDTH,
							)}
						>
							<b className="truncate text-xs font-black uppercase tracking-tight text-fg-primary">
								{identity.name}
							</b>
							<span className="hidden whitespace-nowrap font-mono text-[10px] text-fg-muted min-[700px]:inline">
								<ChevronUp className="inline size-3" />
								{identity.upvotes}
							</span>
							<span className="hidden whitespace-nowrap font-mono text-[10px] font-bold text-accent-lime min-[700px]:inline">
								{identity.priceText}
							</span>
							{identity.tokenText !== null && (
								<span className="ml-auto hidden whitespace-nowrap font-mono text-[10px] font-bold text-fg-primary min-[700px]:inline">
									{identity.tokenText}
								</span>
							)}
						</span>
					</button>
				</div>
				<div
					className={cn(
						"mx-auto flex items-stretch overflow-x-auto px-6",
						STACK_WIDTH,
					)}
					data-testid="tab-row"
				>
					{sections.map((section) => {
						const segment = segments[section.anchor];
						return (
							<a
								key={section.key}
								href={`#${section.anchor}`}
								onClick={go(section)}
								aria-current={segment?.active ? "location" : undefined}
								className={cn(
									"relative flex w-auto shrink-0 items-baseline gap-2.5 whitespace-nowrap pr-4 pt-3.5 pb-3 font-mono text-xs font-bold uppercase tracking-[0.1em] text-fg-muted hover:text-fg-primary min-[700px]:w-[136px] min-[700px]:pr-0",
									segment?.active && "text-accent-lime hover:text-accent-lime",
								)}
							>
								{/* Below 700px only the current tab keeps its number, so all
								    four tabs fit one 390px row. */}
								<span
									className={cn(
										segment?.active
											? "text-accent-lime"
											: "hidden text-stroke-strong min-[700px]:inline",
									)}
								>
									{String(section.index).padStart(2, "0")}
								</span>
								{section.title}
								<span
									aria-hidden="true"
									className="absolute bottom-0 h-[3px] bg-accent-lime transition-[left,width] duration-100 ease-linear"
									style={{
										left: `${segment?.left ?? 0}%`,
										width: segment?.seam
											? `calc(${segment.width}% + 1px)`
											: `${segment?.width ?? 0}%`,
									}}
								/>
							</a>
						);
					})}
				</div>
			</nav>
		</>
	);
}
