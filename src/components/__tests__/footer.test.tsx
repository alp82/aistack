// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Footer } from "@/components/Footer";
import { DISCORD_INSTALL_URL } from "@/lib/discord";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children }: { children: React.ReactNode }) => (
		<a href="/">{children}</a>
	),
}));

afterEach(cleanup);

test("the footer links to the Discord bot install page in a new tab", () => {
	render(<Footer />);
	const link = screen.getByRole("link", { name: "Discord bot" });
	expect(link).toHaveAttribute("href", DISCORD_INSTALL_URL);
	expect(link).toHaveAttribute("target", "_blank");
	expect(link.getAttribute("rel")).toContain("noopener");
});
