import { describe, expect, it } from "vitest";

import {
	filterPreviewStacks,
	getCategoryOptions,
	type LandingStackPreview,
} from "@/features/landing/sections/FeaturedStacksSection";

const stacks: LandingStackPreview[] = [
	{
		_id: "solo-automation",
		slug: "solo-automation",
		oneLiner: "Solo builder shipping through automation",
		hasUsageComponent: false,
		teamSize: null,
		fixedTotal: { amount: 45 },
		creator: { name: "Solo Auto", xHandle: null, avatarUrl: null },
		tools: [
			{ _id: "t1", name: "n8n", iconUrl: null, category: "automation" },
			{ _id: "t2", name: "Cursor", iconUrl: null, category: "coding" },
		],
	},
	{
		_id: "team-automation",
		slug: "team-automation",
		oneLiner: "Team workflow with automation layer",
		hasUsageComponent: true,
		teamSize: 4,
		fixedTotal: { amount: 220 },
		creator: { name: "Team Ops", xHandle: "teamops", avatarUrl: null },
		tools: [
			{ _id: "t3", name: "Zapier", iconUrl: null, category: "automation" },
			{ _id: "t4", name: "Notion", iconUrl: null, category: "notes" },
		],
	},
	{
		_id: "team-design",
		slug: "team-design",
		oneLiner: "Design-heavy team stack",
		hasUsageComponent: false,
		teamSize: 6,
		fixedTotal: { amount: 300 },
		creator: { name: "Design Crew", xHandle: null, avatarUrl: null },
		tools: [
			{ _id: "t5", name: "Figma", iconUrl: null, category: "design" },
			{ _id: "t6", name: "Framer", iconUrl: null, category: "design" },
		],
	},
];

describe("feed filters", () => {
	it("filters by audience and tool category", () => {
		const teamsOnly = filterPreviewStacks(stacks, "team", "all");
		expect(teamsOnly.map((stack) => stack.creator.name)).toEqual(["Team Ops", "Design Crew"]);

		const teamAutomation = filterPreviewStacks(stacks, "team", "automation");
		expect(teamAutomation.map((stack) => stack.creator.name)).toEqual(["Team Ops"]);
	});

	it("derives category options sorted by count", () => {
		const options = getCategoryOptions(stacks);
		expect(options[0]).toMatchObject({ id: "automation", count: 2 });
		expect(options.some((option) => option.id === "design")).toBe(true);
	});
});
