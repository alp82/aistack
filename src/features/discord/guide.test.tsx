// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";
import { DISCORD_INSTALL_URL } from "@/lib/discord";
import { DiscordGuidePage } from "./DiscordGuidePage";

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		...props
	}: {
		children: React.ReactNode;
		to: string;
	}) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));
afterEach(cleanup);

test("public guide renders complete setup and an example before hydration", () => {
	const html = renderToString(<DiscordGuidePage />);
	expect(html).toContain("<h1>");
	expect(html).toContain("Synthetic /tokens example");
	expect(html).toContain("Connect your stack (optional)");
	expect(html).not.toContain("Choose what to explore");
});

test("five example controls update images while install and account actions remain distinct", () => {
	render(<DiscordGuidePage />);
	for (const command of ["tokens", "cost", "context", "harness", "compare"]) {
		const button = screen.getByRole("button", { name: `/${command}` });
		fireEvent.click(button);
		expect(button).toHaveAttribute("aria-pressed", "true");
		const img = screen.getByRole("img");
		expect(img.getAttribute("alt")).toContain(`Synthetic /${command} example`);
		expect(
			screen.getByRole("link", { name: `Open full-size ${command} example` }),
		).toHaveAttribute("href", img.getAttribute("src"));
	}
	expect(screen.getByRole("link", { name: /Add to Discord/ })).toHaveAttribute(
		"href",
		DISCORD_INSTALL_URL,
	);
});
