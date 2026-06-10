// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BundlesSection } from "@/features/stack-editor/sections/BundlesSection";
import { DescriptionSection } from "@/features/stack-editor/sections/DescriptionSection";
import { ProfileSection } from "@/features/stack-editor/sections/ProfileSection";
import { ToolsSection } from "@/features/stack-editor/sections/ToolsSection";
import {
	canPublishStack,
	getSaveValidationError,
} from "@/features/stack-editor/editor-guards";
import type { EditorSectionStatus } from "@/features/stack-editor/editor-status";

vi.mock("@/components/ToolPicker", () => ({
	ToolPicker: () => <h2>Tools Stack</h2>,
}));

vi.mock("@/components/BundlePicker", () => ({
	BundlePicker: () => <h2>Bundles</h2>,
}));

describe("stack editor sections", () => {
	const completeStatus: EditorSectionStatus = { state: "complete" };

	it("renders section anchors in editor order", () => {
		render(
			<>
				<ProfileSection
					creator={{
						_id: "creator_1" as never,
						name: "Builder",
						slug: "builder",
					}}
					oneLiner=""
					onOneLinerChange={() => {}}
					xHandle=""
					onXHandleChange={() => {}}
					isTeam={false}
					onIsTeamChange={() => {}}
					teamSize={2}
					onTeamSizeChange={() => {}}
					status={completeStatus}
					isActive={false}
				/>
				<ToolsSection
					value={[]}
					onChange={() => {}}
					status={completeStatus}
					isActive={false}
				/>
				<BundlesSection
					value={[]}
					onChange={() => {}}
					status={completeStatus}
					isActive={false}
				/>
				<DescriptionSection
					value=""
					onChange={() => {}}
					status={completeStatus}
					isActive={false}
				/>
			</>,
		);

		const profile = document.getElementById("section-profile");
		const tools = document.getElementById("section-tools");
		const bundles = document.getElementById("section-bundles");
		const description = document.getElementById("section-description");

		expect(profile?.id).toBe("section-profile");
		expect(tools?.id).toBe("section-tools");
		expect(bundles?.id).toBe("section-bundles");
		expect(description?.id).toBe("section-description");

		if (!(profile && tools && bundles && description)) {
			throw new Error("expected all section anchors to render");
		}

		expect(profile.compareDocumentPosition(tools)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
		expect(tools.compareDocumentPosition(bundles)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
		expect(bundles.compareDocumentPosition(description)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
	});

	it("keeps save and publish guard behavior", () => {
		// Drafts (publish: false) skip validation entirely.
		expect(
			getSaveValidationError({ oneLiner: "", publish: false, toolCount: 0 }),
		).toBe(null);
		// Publishing requires a one-liner first...
		expect(
			getSaveValidationError({ oneLiner: "", publish: true, toolCount: 0 }),
		).toBe("One-liner summary is required to publish");
		// ...then at least one tool.
		expect(
			getSaveValidationError({
				oneLiner: "Valid one liner",
				publish: true,
				toolCount: 0,
			}),
		).toBe("Add at least one tool before publishing");
		expect(
			getSaveValidationError({
				oneLiner: "Valid one liner",
				publish: false,
				toolCount: 0,
			}),
		).toBe(null);

		expect(canPublishStack("", 1)).toBe(false);
		expect(canPublishStack("Valid one liner", 0)).toBe(false);
		expect(canPublishStack("Valid one liner", 1)).toBe(true);
	});
});
