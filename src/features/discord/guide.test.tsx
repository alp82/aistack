// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";
import {
	DISCORD_INSTALL_URL,
	DISCORD_USER_REAUTHORIZE_URL,
} from "@/lib/discord";
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
	expect(html).toContain("Missing commands?");
	expect(html).toContain("/link/discord");
});

test("five example controls update images while install and account actions remain distinct", () => {
	render(<DiscordGuidePage />);
	for (const command of ["tokens", "cost", "context", "harness", "compare"]) {
		const button = screen.getByRole("button", {
			name: `/${command}`,
			exact: true,
		});
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
	expect(
		screen.getByRole("link", { name: "Manage your Discord account" }),
	).toHaveAttribute("href", "/link/discord");
	expect(
		screen.getByRole("link", {
			name: "Reauthorize your personal installation",
		}),
	).toHaveAttribute("href", DISCORD_USER_REAUTHORIZE_URL);
});
