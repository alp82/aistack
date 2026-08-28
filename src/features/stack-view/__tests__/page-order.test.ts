/**
 * The locked stack-page order (#217, map #200).
 *
 * What these guard, rather than layout:
 *
 *   1. THE ORDER NEVER MOVES. Actual Usage, Projects, Tools, Workflow, Guide.
 *   2. THE NUMBERS DO. Tools renders only when it has content. Workflow keeps
 *      its place and shows an empty state without a published reading (#295).
 *   3. A NAV STAT IS A FIGURE THE SECTION ALREADY SHOWS. A section with no
 *      figure yet shows no stat rather than a zero.
 */
import { describe, expect, it } from "vitest";
import {
	buildPageSections,
	guideStat,
	projectsStat,
	SECTION_ORDER,
	sectionIndex,
	toolsStat,
	usageStat,
} from "../pageOrder";

const ALL_PRESENT = {
	usage: { present: true, stat: null },
	projects: { present: true, stat: null },
	tools: { present: true, stat: null },
	workflow: { present: true, stat: null },
	guide: { present: true, stat: null },
};

describe("the locked section order", () => {
	it("is Actual Usage 01, Projects 02, Tools 03, Workflow 04, Guide 05", () => {
		const sections = buildPageSections(ALL_PRESENT);
		expect(sections.map((section) => [section.index, section.title])).toEqual([
			[1, "Actual Usage"],
			[2, "Projects"],
			[3, "Tools"],
			[4, "Workflow"],
			[5, "Guide"],
		]);
	});

	it("keeps the key order fixed in SECTION_ORDER", () => {
		expect(SECTION_ORDER).toEqual([
			"usage",
			"projects",
			"tools",
			"workflow",
			"guide",
		]);
	});

	it("gives every rendered section its own anchor", () => {
		const anchors = buildPageSections(ALL_PRESENT).map(
			(section) => section.anchor,
		);
		expect(new Set(anchors).size).toBe(anchors.length);
		expect(anchors).toContain("section-measured");
		expect(anchors).toContain("section-workflow");
	});
});

describe("a section that does not render", () => {
	it("moves the sections after Tools up when Tools is absent", () => {
		const sections = buildPageSections({
			...ALL_PRESENT,
			tools: { present: false, stat: null },
		});
		expect(sections.map((section) => section.key)).toEqual([
			"usage",
			"projects",
			"workflow",
			"guide",
		]);
		expect(sectionIndex(sections, "workflow")).toBe(3);
		expect(sectionIndex(sections, "guide")).toBe(4);
	});
});

describe("the nav row stats", () => {
	it("shows tokens for a stack that synced, and nothing for one that did not", () => {
		expect(usageStat(148_000_000)).toBe("148.0M tokens");
		expect(usageStat(null)).toBeNull();
		expect(usageStat(0)).toBeNull();
	});

	it("counts projects, singular and plural, and hides an empty set", () => {
		expect(projectsStat(5)).toBe("5 projects");
		expect(projectsStat(1)).toBe("1 project");
		expect(projectsStat(0)).toBeNull();
	});

	it("prints the tool count with the monthly price when there is one", () => {
		expect(toolsStat(11, 220)).toBe("11 tools · $220/mo");
		expect(toolsStat(1, 0)).toBe("1 tool");
		expect(toolsStat(0, 220)).toBeNull();
	});

	it("reads the guide's minutes off the stored rich text", () => {
		const words = Array.from({ length: 400 }, () => "word").join(" ");
		expect(guideStat(`<p>${words}</p>`)).toBe("2 min read");
		expect(guideStat("<p>short</p>")).toBe("1 min read");
		expect(guideStat("<p></p>")).toBeNull();
		expect(guideStat(undefined)).toBeNull();
	});
});
