// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FieldShell } from "@/components/system/FieldShell";

describe("FieldShell", () => {
	it("wires label to child input via htmlFor", () => {
		render(
			<FieldShell label="Tool name" htmlFor="tool-name">
				<input id="tool-name" />
			</FieldShell>,
		);

		expect(screen.getByLabelText("Tool name")).toBeDefined();
	});

	it("renders helper copy when provided", () => {
		render(
			<FieldShell label="Website" helper="Use canonical homepage URL.">
				<input />
			</FieldShell>,
		);

		expect(screen.getByText("Use canonical homepage URL.")).toBeDefined();
	});

	it("renders error copy with alert semantics", () => {
		render(
			<FieldShell label="Slug" error="Slug already exists.">
				<input aria-invalid="true" />
			</FieldShell>,
		);

		expect(screen.getByRole("alert")).toBeDefined();
		expect(screen.getByText("Slug already exists.")).toBeDefined();
	});
});
