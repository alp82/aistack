// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Footer } from "@/components/Footer";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children }: { children: React.ReactNode }) => (
		<a href="/">{children}</a>
	),
}));

afterEach(cleanup);

test("the footer distinguishes the public bot guide from the community invite", () => {
	render(<Footer />);
	const link = screen.getByRole("link", { name: "Discord bot" });
	expect(link).toHaveAttribute("href", "/discord");
	expect(link).not.toHaveAttribute("target");
	const community = screen.getByRole("link", { name: "Join our community" });
	expect(community).toHaveAttribute("href", "https://discord.gg/5y4fpyahaF");
	expect(community).toHaveAttribute("target", "_blank");
});
