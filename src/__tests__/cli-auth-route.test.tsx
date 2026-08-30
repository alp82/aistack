// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	pending: {
		machineName: "build server",
		machineNameReadOnly: true,
	},
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: unknown) => ({ options }),
	useNavigate: () => vi.fn(),
	useSearch: () => ({ code: "ABC123" }),
}));

vi.mock("convex/react", () => ({
	useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
	useMutation: () => vi.fn(),
	useQuery: (_query: unknown, args: Record<string, unknown>) =>
		"userCode" in args ? mocks.pending : [],
}));

vi.mock("@/components/ui/Dialog", () => ({
	Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

type TestRoute = {
	options: { component: ComponentType };
};

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

test("an explicitly supplied machine label is read-only on confirmation", async () => {
	const routeModule = await import("@/routes/cli.auth");
	const Page = (routeModule.Route as unknown as TestRoute).options.component;

	render(<Page />);

	expect(await screen.findByDisplayValue("build server")).toHaveAttribute(
		"readonly",
	);
});
