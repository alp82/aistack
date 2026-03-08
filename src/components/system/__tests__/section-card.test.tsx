// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionCard } from "@/components/system/SectionCard";

describe("SectionCard", () => {
	it("renders heading copy and content", () => {
		render(
			<SectionCard
				title="Metadata"
				description="Update stack metadata before publishing."
			>
				<div>Inner content</div>
			</SectionCard>,
		);

		expect(
			screen.getByRole("heading", { level: 2, name: "Metadata" }),
		).toBeDefined();
		expect(
			screen.getByText("Update stack metadata before publishing."),
		).toBeDefined();
		expect(screen.getByText("Inner content")).toBeDefined();
	});

	it("renders optional eyebrow and actions", () => {
		render(
			<SectionCard
				eyebrow="Panel 01"
				title="Bundles"
				actions={<button type="button">Add</button>}
			>
				<div>content</div>
			</SectionCard>,
		);

		expect(screen.getByText("Panel 01")).toBeDefined();
		expect(screen.getByRole("button", { name: "Add" })).toBeDefined();
	});

	it("applies accent styles when tone is accent", () => {
		const { container } = render(
			<SectionCard title="Accent" tone="accent">
				<div>content</div>
			</SectionCard>,
		);

		const card = container.querySelector("[data-slot='section-card']");
		if (!card) {
			throw new Error("section card not rendered");
		}
		const className = card.getAttribute("class") ?? "";
		expect(className.includes("border-accent-lime/70")).toBe(true);
		expect(className.includes("bg-bg-panel-elevated")).toBe(true);
	});
});
