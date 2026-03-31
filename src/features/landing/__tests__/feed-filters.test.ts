import { describe, expect, it } from "vitest";

import {
	filterPreviewStacks,
	getCategoryOptions,
	type LandingStackPreview,
} from "@/features/landing/sections/FeaturedStacksSection";

function tool(
	id: string,
	name: string,
	categories: string[],
): LandingStackPreview["tools"][number] {
	return {
		_id: id,
		name,
		iconUrl: null,
		categories,
		kind: "main",
		price: { pricingType: "fixed" },
		priceKind: "regular",
	};
}

const stacks: LandingStackPreview[] = [
	{
		_id: "solo-automation",
		_creationTime: 1000,
		name: "Solo Automation Stack",
		slug: "solo-automation",
		oneLiner: "Solo builder shipping through automation",
		hasUsageComponent: false,
		teamSize: null,
		fixedTotal: { amount: 45 },
		creator: { name: "Solo Auto", xHandle: null, avatarUrl: null },
		tools: [tool("t1", "n8n", ["automation"]), tool("t2", "Cursor", ["ide"])],
		upvoteCount: 0,
	},
	{
		_id: "team-automation",
		_creationTime: 2000,
		name: "Team Automation Stack",
		slug: "team-automation",
		oneLiner: "Team workflow with automation layer",
		hasUsageComponent: true,
		teamSize: 4,
		fixedTotal: { amount: 220 },
		creator: { name: "Team Ops", xHandle: "teamops", avatarUrl: null },
		tools: [
			tool("t3", "Zapier", ["automation"]),
			tool("t4", "Notion", ["notes"]),
		],
		upvoteCount: 5,
	},
	{
		_id: "team-design",
		_creationTime: 3000,
		name: "Team Design Stack",
		slug: "team-design",
		oneLiner: "Design-heavy team stack",
		hasUsageComponent: false,
		teamSize: 6,
		fixedTotal: { amount: 300 },
		creator: { name: "Design Crew", xHandle: null, avatarUrl: null },
		tools: [
			tool("t5", "Figma", ["design"]),
			tool("t6", "Framer", ["app-builder"]),
		],
		upvoteCount: 10,
	},
];

describe("feed filters", () => {
	it("filters by audience and tool category", () => {
		const teamsOnly = filterPreviewStacks(stacks, "team", "all");
		expect(teamsOnly.map((stack) => stack.creator.name)).toEqual([
			"Design Crew",
			"Team Ops",
		]);

		const teamAutomation = filterPreviewStacks(stacks, "team", "automation");
		expect(teamAutomation.map((stack) => stack.creator.name)).toEqual([
			"Team Ops",
		]);
	});

	it("derives category options sorted by count", () => {
		const options = getCategoryOptions(stacks);
		expect(options[0]).toMatchObject({ id: "automation", count: 2 });
		expect(options.some((option) => option.id === "design")).toBe(true);
	});
});
