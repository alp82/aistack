/**
 * The skills the measured population calls most, in the form the stack Stats
 * inventory uses: one bar of call shares, then a chip per skill.
 *
 * THE BAR SPANS THE LISTED SKILLS, so it fills its width. A printed percentage
 * is still the skill's share of every skill call, withheld names and unlisted
 * skills included, and the note states how much of that whole the list covers.
 *
 * Chips shrink with rank. The stack count and the stack names live in the tip.
 * Hovering a chip or a segment frames the skill's segment, and hovering a
 * segment also dims the other chips. The bar never changes color.
 */

import { useState } from "react";
import { SegmentChart } from "@/features/charts";
import { Tip } from "@/features/workflow/parts";
import { cn } from "@/lib/utils";
import type { Board } from "./board";
import * as f from "./format";

type Skill = Board["skills"][number];

/** A segment narrower than this prints no label; its chip carries the name. */
const LABEL_MIN_WIDTH = 0.07;

// One call-count series, with the rank shading the Stats inventory bar uses.
const STEPS = [100, 78, 60, 46, 36, 28];
const paint = (i: number) =>
	`color-mix(in oklab, var(--accent-lime) ${STEPS[Math.min(i, STEPS.length - 1)]}%, var(--bg-panel))`;

function chipSize(i: number): string {
	if (i < 6) return "px-2 py-1 text-[13px]";
	if (i < 14) return "px-1.5 py-0.5 text-[11px]";
	return "px-1 py-px text-[10px]";
}

function SkillTip({ skill }: { readonly skill: Skill }) {
	const more = skill.stackCount - skill.stacks.length;
	return (
		<div className="space-y-2">
			<p className="break-all text-xs font-bold">{skill.name}</p>
			{skill.calls !== null && (
				<p>
					<b className="text-lg font-black">{f.count(skill.calls)}</b>{" "}
					<span className="text-fg-muted">calls</span>
				</p>
			)}
			{skill.callShare !== null && (
				<p className="text-fg-muted">
					{f.pct(skill.callShare, 1)} of all skill calls
				</p>
			)}
			<div>
				<p className="text-fg-muted">
					used by {skill.stackCount}{" "}
					{skill.stackCount === 1 ? "stack" : "stacks"}
				</p>
				<ul>
					{skill.stacks.map((name) => (
						<li key={name} className="truncate">
							{name}
						</li>
					))}
					{more > 0 && <li className="text-fg-muted">and {more} more</li>}
				</ul>
			</div>
		</div>
	);
}

export function TopSkills({ board }: { readonly board: Board }) {
	const [active, setActive] = useState<string | null>(null);
	const [from, setFrom] = useState<"bar" | "chip">("chip");
	if (board.skills.length === 0) return null;

	const hover = (name: string, source: "bar" | "chip") => ({
		onMouseEnter: () => {
			setActive(name);
			setFrom(source);
		},
		onMouseLeave: () => setActive(null),
	});
	// Only the bar dims the chips: among the chips the pointer already marks one.
	const dimmed = (name: string) =>
		from === "bar" && active !== null && active !== name;

	const measured = board.skills.filter(
		(s) => s.callShare !== null && s.callShare > 0,
	);
	const covered = measured.reduce((a, s) => a + (s.callShare ?? 0), 0);
	let at = 0;
	const segments = measured.map((s) => {
		const share = (s.callShare ?? 0) / covered;
		const left = at;
		at += share;
		return {
			key: s.name,
			label: s.name,
			share,
			left,
			skill: s,
			rank: board.skills.indexOf(s),
			paint: paint(board.skills.indexOf(s)),
		};
	});

	return (
		<section className="mt-12 lg:mt-16">
			<div className="flex items-baseline justify-between gap-4">
				<h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-fg-muted">
					Top skills
				</h2>
				<span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
					by calls · {board.skillPublishers} stacks
				</span>
			</div>

			<div className="mt-4 border-t border-stroke-subtle pt-5">
				{segments.length > 0 && (
					<div className="mb-4 hidden md:block">
						<div className="relative">
							<SegmentChart
								segments={segments}
								label="Top skills by share of calls"
								height={72}
							/>
							{/* Each overlay sits at its running share, like the SVG rect
							    under it, so a divider never drifts off its color boundary. */}
							<div className="absolute inset-0">
								{segments.map((s) => (
									<div
										key={s.key}
										{...hover(s.key, "bar")}
										style={{
											left: `${s.left * 100}%`,
											width: `${s.share * 100}%`,
										}}
										className="absolute inset-y-0"
									>
										<Tip
											className="h-full w-full"
											label={<SkillTip skill={s.skill} />}
										>
											<div className="h-full w-full overflow-hidden border-r-2 border-bg-canvas">
												{s.share >= LABEL_MIN_WIDTH && (
													<div
														className={cn(
															"flex h-full flex-col justify-between px-2 py-2",
															s.rank < 3
																? "text-accent-lime-contrast"
																: "text-fg-primary",
														)}
													>
														<p className="truncate text-xs font-semibold">
															{s.label}
														</p>
														<b className="font-mono text-lg">
															{f.pct(s.skill.callShare ?? 0)}
														</b>
													</div>
												)}
											</div>
										</Tip>
										{/* The colors stay put: the hovered skill gets a frame,
										    drawn inside the segment and clear of its divider. */}
										{active === s.key && (
											<span
												aria-hidden="true"
												className="pointer-events-none absolute inset-y-0 left-0 right-0.5 z-10 border-2 border-fg-primary"
											/>
										)}
									</div>
								))}
							</div>
						</div>
						<p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-fg-muted/70">
							share of all skill calls · these {measured.length} cover{" "}
							{f.pct(covered)}
						</p>
					</div>
				)}

				<ul className="flex flex-wrap items-center gap-1.5">
					{board.skills.map((s, i) => (
						<li
							key={s.name}
							{...hover(s.name, "chip")}
							className={cn(
								"max-w-full transition-opacity",
								dimmed(s.name) && "opacity-30",
							)}
						>
							<Tip label={<SkillTip skill={s} />}>
								<span
									className={cn(
										"inline-flex max-w-full items-baseline gap-x-2 font-bold",
										i < 3 ? "text-accent-lime-contrast" : "text-fg-primary",
										chipSize(i),
									)}
									style={{ background: paint(i) }}
								>
									<span className="min-w-0 truncate">{s.name}</span>
									{s.calls !== null && (
										<b className="font-mono">{f.count(s.calls)}</b>
									)}
								</span>
							</Tip>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
