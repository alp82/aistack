/**
 * The locked stack-page section order, and the stats its nav rows carry.
 *
 * Wayfinder ticket #217 (map #200) placed five sections; #307 (map #302)
 * merged the workflow rows into Stats. The settled order in
 * `docs/specs/workflow-surface.md`: Stats 01, Projects 02, Tools 03,
 * Guide 04.
 *
 * THE ORDER IS LOCKED, THE NUMBERS ARE NOT. Tools drops out of a stack with no
 * tools. The number is the position among the sections that render.
 * `SECTION_ORDER` is the part that never moves.
 *
 * This module is pure so the order and the numbering are testable without a
 * page: the route hands it presence and figures, and renders what it returns.
 */

import { fmtTokens, MEASURED_ANCHOR } from "@/features/measured/copy";
import { formatPriceDisplay } from "@/lib/pricing";

export const SECTION_ORDER = ["usage", "projects", "tools", "guide"] as const;

export type SectionKey = (typeof SECTION_ORDER)[number];

/** Where each section mounts. The nav needs every section addressable. */
export const SECTION_ANCHORS: Record<SectionKey, string> = {
	usage: MEASURED_ANCHOR,
	projects: "section-projects",
	tools: "section-tools",
	guide: "section-guide",
};

/**
 * The titles the page prints. The writeup section became `Guide` in #193, and
 * since #307 the word Workflow appears nowhere on the page.
 */
export const SECTION_TITLES: Record<SectionKey, string> = {
	usage: "Stats",
	projects: "Projects",
	tools: "Tools",
	guide: "Guide",
};

export type PageSection = {
	key: SectionKey;
	/** Position among the sections that render, 1-based. */
	index: number;
	title: string;
	anchor: string;
	/** The headline figure the nav row shows. Absent when there is none. */
	stat: string | null;
};

export type SectionState = {
	present: boolean;
	stat: string | null;
};

/**
 * The rendered sections, in the locked order, numbered from 1.
 *
 * An absent section takes no number, so the sections after it move up.
 */
export function buildPageSections(
	states: Record<SectionKey, SectionState>,
): PageSection[] {
	const sections: PageSection[] = [];
	for (const key of SECTION_ORDER) {
		const state = states[key];
		if (!state.present) continue;
		sections.push({
			key,
			index: sections.length + 1,
			title: SECTION_TITLES[key],
			anchor: SECTION_ANCHORS[key],
			stat: state.stat,
		});
	}
	return sections;
}

/** The number a section renders under, or null when it does not render. */
export function sectionIndex(
	sections: readonly PageSection[],
	key: SectionKey,
): number | null {
	return sections.find((section) => section.key === key)?.index ?? null;
}

// ---------------------------------------------------------------------------
// The nav row stats.
//
// Each one restates a figure the section itself already prints. Nothing here
// computes a new fact, and a section with no figure yet shows no stat rather
// than a zero.
// ---------------------------------------------------------------------------

export function usageStat(totalTokens: number | null): string | null {
	if (totalTokens === null || totalTokens <= 0) return null;
	return `${fmtTokens(totalTokens)} tokens`;
}

export function projectsStat(count: number): string | null {
	if (count <= 0) return null;
	return `${count} ${count === 1 ? "project" : "projects"}`;
}

export function toolsStat(count: number, monthlyAmount: number): string | null {
	if (count <= 0) return null;
	const label = `${count} ${count === 1 ? "tool" : "tools"}`;
	if (monthlyAmount <= 0) return label;
	const price = formatPriceDisplay(monthlyAmount, "month", "floor");
	return `${label} · $${price.amountText}${price.suffix}`;
}

const WORDS_PER_MINUTE = 200;

/** Whether stored Tiptap HTML contains something the read-only guide can show. */
export function hasGuideContent(description: string | undefined): boolean {
	if (!description) return false;
	const text = description
		.replace(/<!--[\s\S]*?-->/g, " ")
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;|&#160;|&#xa0;/gi, " ")
		.trim();
	if (text.length > 0) return true;
	return /<(?:img|video|audio|iframe|hr)\b/i.test(description);
}

/**
 * The guide's reading time, from the stored rich text.
 *
 * The description is Tiptap HTML, so the tags come out before the words are
 * counted. A guide too short to round up to a minute still reads as one.
 */
export function guideStat(description: string | undefined): string | null {
	if (!hasGuideContent(description)) return null;
	if (!description) return null;
	const words = description
		.replace(/<[^>]*>/g, " ")
		.replace(/&[a-z]+;|&#\d+;/gi, " ")
		.trim()
		.split(/\s+/)
		.filter(Boolean).length;
	if (words === 0) return null;
	return `${Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))} min read`;
}
