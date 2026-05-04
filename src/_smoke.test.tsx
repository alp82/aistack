import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

test("jsdom + @testing-library smoke", () => {
	render(<button type="button">hello</button>);
	expect(screen.getByRole("button", { name: "hello" })).toBeInTheDocument();
});
