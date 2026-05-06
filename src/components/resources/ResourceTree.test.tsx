// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResourceTree } from "./ResourceTree";

describe("ResourceTree", () => {
	it("renders the empty-state message when no stack or project items are provided", () => {
		render(<ResourceTree />);
		expect(
			screen.getByText(/no resource files available/i),
		).toBeInTheDocument();
	});

	it("renders multiple groups without crashing", () => {
		render(
			<ResourceTree
				stack={{
					sourceId: "stack_1",
					sourceLabel: "My Stack",
					resources: [
						{
							type: "rule",
							name: "CLAUDE.md",
							group: "claude-code",
							stableKey: "cc:rule:CLAUDE.md",
							files: [{ name: "CLAUDE.md", content: "" }],
						},
						{
							type: "rule",
							name: "rules.mdc",
							group: "cursor",
							stableKey: "cursor:rule:rules.mdc",
							files: [{ name: "rules.mdc", content: "" }],
						},
					],
				}}
			/>,
		);

		expect(screen.getByText(/Claude Code/i)).toBeInTheDocument();
		expect(screen.getByText(/Cursor/i)).toBeInTheDocument();
	});
});
