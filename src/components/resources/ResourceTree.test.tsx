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

	it("renders a file-less linked resource as a github-link singleton under its real group", () => {
		render(
			<ResourceTree
				stack={{
					sourceId: "project_1",
					sourceLabel: "My Project",
					resources: [
						{
							type: "rule",
							name: "AGENTS",
							group: "claude-code",
							stableKey: "linked:https://github.com/acme/repo:src/agents",
							storage: "linked",
							upstream: {
								repoUrl: "https://github.com/acme/repo",
								path: "src/agents",
							},
						},
						// A second group keeps the group wrappers (no flatten), so we can
						// assert the linked row lands under its REAL group (Claude Code).
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

		// The linked row flowed into the singletons path (a dropped row would
		// render nothing) and renders an external GitHub anchor, not a select button.
		const link = screen.getByRole("link", { name: /repo · src\/agents/i });
		expect(link).toHaveAttribute(
			"href",
			"https://github.com/acme/repo/tree/HEAD/src/agents",
		);
		expect(link).toHaveAttribute("target", "_blank");
		// Both real groups are present (linked row did not collapse the bucket).
		expect(screen.getByText(/Claude Code/i)).toBeInTheDocument();
		expect(screen.getByText(/Cursor/i)).toBeInTheDocument();
	});

	it("renders co-typed linked resources as GitHub anchors via TypeBlock (not invisible)", () => {
		// Two file-less linked resources sharing type="rule" and group="claude-code"
		// produce a TypeGroup with items.length=2, totalFiles=2, routing them into
		// typeGroups → TypeBlock instead of singletons. A third resource in a
		// different group ensures multiple GroupSections exist (flatten=false),
		// so the multi-group GroupBlock → TypeBlock code path is exercised.
		render(
			<ResourceTree
				stack={{
					sourceId: "project_2",
					sourceLabel: "My Project",
					resources: [
						{
							type: "rule",
							name: "AGENTS",
							group: "claude-code",
							stableKey: "linked:https://github.com/acme/repo-a:src/agents",
							storage: "linked",
							upstream: {
								repoUrl: "https://github.com/acme/repo-a",
								path: "src/agents",
							},
						},
						{
							type: "rule",
							name: "CLAUDE",
							group: "claude-code",
							stableKey: "linked:https://github.com/acme/repo-b:docs/claude",
							storage: "linked",
							upstream: {
								repoUrl: "https://github.com/acme/repo-b",
								path: "docs/claude",
							},
						},
						// Third resource in a different group keeps flatten=false so
						// GroupBlock → TypeBlock is the exercised code path.
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

		// Both co-typed linked rows must render as external GitHub anchors.
		// Without the TypeBlock pseudo-file branch they would be silently invisible,
		// making getAllByRole return fewer than 2 elements and failing this assertion.
		const links = screen.getAllByRole("link", { name: /repo-[ab] · /i });
		expect(links).toHaveLength(2);

		const hrefs = links.map((l) => l.getAttribute("href"));
		expect(hrefs).toContain(
			"https://github.com/acme/repo-a/tree/HEAD/src/agents",
		);
		expect(hrefs).toContain(
			"https://github.com/acme/repo-b/tree/HEAD/docs/claude",
		);

		for (const link of links) {
			expect(link).toHaveAttribute("target", "_blank");
		}

		// Group headings confirm both groups rendered correctly.
		expect(screen.getByText(/Claude Code/i)).toBeInTheDocument();
		expect(screen.getByText(/Cursor/i)).toBeInTheDocument();
	});
});
