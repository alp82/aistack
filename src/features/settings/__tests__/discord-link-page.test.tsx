// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { afterEach, expect, it, vi } from "vitest";
import { DiscordLinkPage } from "@/features/settings/DiscordLinkPage";

const queryMock = vi.fn();
const actionMock = vi.fn();
const mutationMock = vi.fn();

vi.mock("convex/react", () => ({
	useQuery: (ref: unknown, args: unknown) => queryMock(ref, args),
	useAction: (ref: unknown) => actionMock(ref),
	useMutation: (ref: unknown) => mutationMock(ref),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

it("shows how to start when no Discord account is linked", () => {
	queryMock.mockImplementation((ref: never) =>
		getFunctionName(ref).endsWith("getMine") ? { linked: false } : undefined,
	);
	actionMock.mockReturnValue(vi.fn());
	mutationMock.mockReturnValue(vi.fn());

	render(<DiscordLinkPage />);

	expect(screen.getByText("No Discord account linked.")).toBeTruthy();
	expect(document.body.textContent).toContain("Run /link in Discord");
});

it("consumes a valid link and confirms the account is linked", async () => {
	queryMock.mockImplementation((ref: never) =>
		getFunctionName(ref).endsWith("getMine") ? { linked: false } : undefined,
	);
	actionMock.mockReturnValue(vi.fn());
	const link = vi.fn().mockResolvedValue({ status: "linked" });
	mutationMock.mockImplementation((ref: never) =>
		getFunctionName(ref).endsWith("linkAccount") ? link : vi.fn(),
	);

	render(<DiscordLinkPage token="signed-token" />);

	expect(await screen.findByText("Discord account linked.")).toBeTruthy();
	expect(link).toHaveBeenCalledWith({ token: "signed-token" });
});

it("explains that an invalid or used link needs a new /link command", async () => {
	queryMock.mockReturnValue({ linked: false });
	actionMock.mockReturnValue(vi.fn());
	const link = vi.fn().mockResolvedValue({ status: "invalid" });
	mutationMock.mockImplementation((ref: never) =>
		getFunctionName(ref).endsWith("linkAccount") ? link : vi.fn(),
	);

	render(<DiscordLinkPage token="bad-token" />);

	expect(
		await screen.findByText("That Discord link is not valid."),
	).toBeTruthy();
	expect(document.body.textContent).toContain("Run /link again in Discord");
});

it("asks for confirmation before removing the linked account", async () => {
	queryMock.mockReturnValue({ linked: true });
	actionMock.mockReturnValue(vi.fn());
	const remove = vi.fn().mockResolvedValue(null);
	mutationMock.mockImplementation((ref: never) =>
		getFunctionName(ref).endsWith("removeMine") ? remove : vi.fn(),
	);

	render(<DiscordLinkPage />);

	fireEvent.click(screen.getByRole("button", { name: "Remove" }));
	expect(screen.getByText("Remove the Discord link?")).toBeTruthy();
	expect(remove).not.toHaveBeenCalled();
	const confirm = screen
		.getAllByRole("button", { name: "Remove" })
		.at(-1) as HTMLElement;
	fireEvent.click(confirm);

	expect(await screen.findByText("No Discord account linked.")).toBeTruthy();
	expect(remove).toHaveBeenCalledWith({});
});

it("explains when the 10-minute link expired", async () => {
	queryMock.mockReturnValue({ linked: false });
	actionMock.mockReturnValue(vi.fn());
	const link = vi.fn().mockResolvedValue({ status: "expired" });
	mutationMock.mockImplementation((ref: never) =>
		getFunctionName(ref).endsWith("linkAccount") ? link : vi.fn(),
	);

	render(<DiscordLinkPage token="expired-token" />);

	expect(await screen.findByText("That Discord link expired.")).toBeTruthy();
	expect(document.body.textContent).toContain("Run /link again in Discord");
});
