// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileSection } from "@/features/stack-editor/sections/ProfileSection";
import { getEditorSectionStatuses } from "@/features/stack-editor/editor-status";

describe("editor status ui", () => {
	it("uses strict validation states for every section", () => {
		const statuses = getEditorSectionStatuses({
			oneLiner: "",
			isTeam: true,
			teamSize: 1,
			toolSubscriptions: [],
			bundleSubscriptions: [],
			description: "",
			stackUrl: "not-a-url",
			prompts: undefined,
			rules: undefined,
			skills: undefined,
			mcps: undefined,
			resources: [{ label: "Docs", url: "invalid" }],
		});

		expect(statuses.profile.state).toBe("error");
		expect(statuses.tools.state).toBe("error");
		expect(statuses.settings.state).toBe("error");
		expect(statuses.description.state).toBe("idle");
	});

	it("marks required profile controls with aria-invalid", () => {
		render(
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
				isTeam={true}
				onIsTeamChange={() => {}}
				teamSize={1}
				onTeamSizeChange={() => {}}
				status={{ state: "error", message: "One-liner summary is required" }}
				isActive={false}
			/>,
		);

		expect(
			screen
				.getByPlaceholderText(/What is this stack about/i)
				.getAttribute("aria-invalid"),
		).toBe("true");
		expect(screen.getByDisplayValue("1").getAttribute("aria-invalid")).toBe(
			"true",
		);
	});
});
