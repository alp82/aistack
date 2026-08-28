// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { AuthForm } from "@/components/AuthForm";

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

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children }: { children: React.ReactNode }) => (
		<a href="/">{children}</a>
	),
	useNavigate: () => mocks.navigate,
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

test("the Google button carries the last-used tag when Google was used last", () => {
	mocks.getLastUsedLoginMethod.mockReturnValue("google");

	render(<AuthForm callbackURL="/" />);

	const google = screen.getByRole("button", { name: /continue with google/i });
	expect(within(google).getByText("last used")).toBeInTheDocument();
	expect(screen.getAllByText("last used")).toHaveLength(1);
});

test("the GitHub button carries the last-used tag when GitHub was used last", () => {
	mocks.getLastUsedLoginMethod.mockReturnValue("github");

	render(<AuthForm callbackURL="/" />);

	const github = screen.getByRole("button", { name: /continue with github/i });
	expect(within(github).getByText("last used")).toBeInTheDocument();
	expect(screen.getAllByText("last used")).toHaveLength(1);
});

test("the magic-link button carries the last-used tag when magic link was used last", () => {
	mocks.getLastUsedLoginMethod.mockReturnValue("magic-link");

	render(<AuthForm callbackURL="/" />);

	const magicLink = screen.getByRole("button", { name: /send magic link/i });
	expect(within(magicLink).getByText("last used")).toBeInTheDocument();
	expect(screen.getAllByText("last used")).toHaveLength(1);
});

test("the email button carries the last-used tag when email was used last", () => {
	mocks.getLastUsedLoginMethod.mockReturnValue("email");

	render(<AuthForm callbackURL="/" />);

	const email = screen.getByRole("button", { name: /^sign in/i });
	expect(within(email).getByText("last used")).toBeInTheDocument();
	expect(screen.getAllByText("last used")).toHaveLength(1);
});
