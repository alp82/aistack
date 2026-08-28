// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getLastUsedLoginMethod: vi.fn(),
	navigate: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
	authClient: {
		getLastUsedLoginMethod: mocks.getLastUsedLoginMethod,
		signIn: {
			email: vi.fn(),
			magicLink: vi.fn(),
			social: vi.fn(),
		},
		signUp: { email: vi.fn() },
	},
}));

vi.mock("convex/react", () => ({
	useConvexAuth: () => ({ isAuthenticated: false }),
}));

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: unknown) => ({ options }),
	Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
	useNavigate: () => mocks.navigate,
	useSearch: () => ({ redirect: undefined }),
}));

vi.mock("@/features/stack-editor/context/EditorContext", () => ({
	EditorProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/TiptapEditor", () => ({
	TiptapEditor: () => null,
}));

type TestRoute = {
	options: { component: ComponentType };
};

afterEach(() => {
	cleanup();
	localStorage.clear();
	vi.clearAllMocks();
});

test.each([
	["/signin", () => import("@/routes/signin")],
	["/signin-publish", () => import("@/routes/signin-publish")],
] as const)("%s renders the last-used tag", async (_path, loadRoute) => {
	mocks.getLastUsedLoginMethod.mockReturnValue("github");
	const routeModule = await loadRoute();
	const Page = (routeModule.Route as unknown as TestRoute).options.component;

	render(<Page />);

	const github = screen.getByRole("button", { name: /continue with github/i });
	expect(within(github).getByText("last used")).toBeInTheDocument();
});
