// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	navigate: vi.fn(),
	token: "signed.token",
}));

vi.mock("@convex-dev/react-query", () => ({
	useConvexAuth: () => ({ isAuthenticated: false, isLoading: false }),
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: unknown) => ({ options }),
	useNavigate: () => mocks.navigate,
	useSearch: () => ({ token: mocks.token }),
}));

vi.mock("@/features/settings/DiscordLinkPage", () => ({
	DiscordLinkPage: () => null,
}));

type TestRoute = {
	options: { component: ComponentType };
};

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

test("a signed-out visitor keeps the Discord token through sign-in", async () => {
	const routeModule = await import("@/routes/link.discord");
	const Page = (routeModule.Route as unknown as TestRoute).options.component;

	render(<Page />);

	await waitFor(() =>
		expect(mocks.navigate).toHaveBeenCalledWith({
			to: "/signin",
			search: { redirect: "/link/discord?token=signed.token" },
		}),
	);
});
