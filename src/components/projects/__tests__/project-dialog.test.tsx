// @vitest-environment jsdom
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ProjectDialog } from "@/components/projects/ProjectDialog";

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

const repository = {
	name: "my-project",
	description: "A useful project",
	homepage: "https://example.com",
	html_url: "https://github.com/owner/my-project",
	topics: ["typescript", "ai"],
};

function setup() {
	const props = {
		state: { mode: "create" as const },
		onClose: vi.fn(),
		onCreate: vi.fn().mockResolvedValue(undefined),
		onUpdate: vi.fn(),
	};
	return { ...render(<ProjectDialog {...props} />), props };
}

function startImport(link = "github.com/owner/my-project.git") {
	fireEvent.change(screen.getByLabelText("GitHub repository"), {
		target: { value: link },
	});
	fireEvent.click(screen.getByRole("button", { name: "Fill from GitHub" }));
}

it("refreshes imported fields when filling from another repository", async () => {
	const nextRepository = {
		...repository,
		name: "another-project",
		description: null,
		homepage: null,
		html_url: "https://github.com/owner/another-project",
		topics: [],
	};
	const fetchMock = vi
		.fn()
		.mockResolvedValueOnce(new Response(JSON.stringify(repository)))
		.mockResolvedValueOnce(new Response(JSON.stringify(nextRepository)));
	vi.stubGlobal("fetch", fetchMock);
	const { props } = setup();
	startImport();
	await screen.findByRole("status");
	startImport(nextRepository.html_url);
	await screen.findByRole("status");
	expect(fetchMock).toHaveBeenLastCalledWith(
		"https://api.github.com/repos/owner/another-project",
		expect.anything(),
	);
	expect(screen.getByLabelText(/^Name/)).toHaveValue(nextRepository.name);
	expect(screen.getByLabelText("Description")).toHaveValue("");
	expect(screen.getByLabelText("URL")).toHaveValue(nextRepository.html_url);
	expect(screen.queryByText("typescript")).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Create" }));
	await waitFor(() =>
		expect(props.onCreate).toHaveBeenCalledWith({
			name: nextRepository.name,
			description: undefined,
			url: nextRepository.html_url,
			tags: undefined,
		}),
	);
});

it("keeps manual edits, including cleared fields, across repeat imports", async () => {
	vi.stubGlobal(
		"fetch",
		vi
			.fn()
			.mockImplementation(() =>
				Promise.resolve(new Response(JSON.stringify(repository))),
			),
	);
	setup();
	startImport();
	await screen.findByRole("status");
	fireEvent.change(screen.getByLabelText(/^Name/), {
		target: { value: "Custom name" },
	});
	fireEvent.change(screen.getByLabelText("Description"), {
		target: { value: "" },
	});
	fireEvent.change(screen.getByLabelText("URL"), {
		target: { value: "https://custom.example" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Remove typescript" }));
	fireEvent.click(screen.getByRole("button", { name: "Remove ai" }));
	startImport("github.com/owner/other");
	await screen.findByRole("status");
	expect(screen.getByLabelText(/^Name/)).toHaveValue("Custom name");
	expect(screen.getByLabelText("Description")).toHaveValue("");
	expect(screen.getByLabelText("URL")).toHaveValue("https://custom.example");
	expect(screen.queryByText("typescript")).not.toBeInTheDocument();
	expect(screen.queryByText("ai")).not.toBeInTheDocument();
});

it("resets manual edit tracking when starting a new project", async () => {
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue(new Response(JSON.stringify(repository))),
	);
	const { props, rerender } = setup();
	fireEvent.change(screen.getByLabelText(/^Name/), {
		target: { value: "Discarded" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
	rerender(<ProjectDialog {...props} state={null} />);
	rerender(<ProjectDialog {...props} />);
	startImport();
	await screen.findByRole("status");
	expect(screen.getByLabelText(/^Name/)).toHaveValue(repository.name);
});

it("fills editable project fields from GitHub and creates only after review", async () => {
	const fetchMock = vi
		.fn()
		.mockResolvedValue(new Response(JSON.stringify(repository)));
	vi.stubGlobal("fetch", fetchMock);
	const { props } = setup();
	startImport();
	await screen.findByRole("status");
	expect(fetchMock).toHaveBeenCalledWith(
		"https://api.github.com/repos/owner/my-project",
		expect.objectContaining({ credentials: "omit" }),
	);
	expect(screen.getByLabelText(/^Name/)).toHaveValue("my-project");
	expect(screen.getByLabelText("Description")).toHaveValue("A useful project");
	expect(screen.getByLabelText("URL")).toHaveValue("https://example.com/");
	expect(props.onCreate).not.toHaveBeenCalled();
	fireEvent.change(screen.getByLabelText(/^Name/), {
		target: { value: "My Project" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Create" }));
	await waitFor(() =>
		expect(props.onCreate).toHaveBeenCalledWith({
			name: "My Project",
			description: repository.description,
			url: "https://example.com/",
			tags: repository.topics,
		}),
	);
});

it("preserves fields edited while the lookup is pending", async () => {
	let resolve!: (response: Response) => void;
	vi.stubGlobal(
		"fetch",
		vi.fn(
			() =>
				new Promise<Response>((done) => {
					resolve = done;
				}),
		),
	);
	setup();
	startImport();
	fireEvent.change(screen.getByLabelText(/^Name/), {
		target: { value: "My name" },
	});
	fireEvent.change(screen.getByLabelText("Description"), {
		target: { value: "My description" },
	});
	fireEvent.change(screen.getByLabelText("URL"), {
		target: { value: "https://mine.example" },
	});
	fireEvent.change(screen.getByLabelText("Tags"), {
		target: { value: "custom" },
	});
	fireEvent.keyDown(screen.getByLabelText("Tags"), { key: "Enter" });
	resolve(new Response(JSON.stringify(repository)));
	await screen.findByRole("status");
	expect(screen.getByLabelText(/^Name/)).toHaveValue("My name");
	expect(screen.getByLabelText("Description")).toHaveValue("My description");
	expect(screen.getByLabelText("URL")).toHaveValue("https://mine.example");
	expect(screen.getByText("custom")).toBeInTheDocument();
	expect(screen.queryByText("typescript")).not.toBeInTheDocument();
});

it("falls back to the repository link when optional metadata is missing", async () => {
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					...repository,
					homepage: null,
					description: null,
					topics: [],
				}),
			),
		),
	);
	setup();
	startImport();
	await screen.findByRole("status");
	expect(screen.getByLabelText("URL")).toHaveValue(repository.html_url);
	expect(screen.getByLabelText("Description")).toHaveValue("");
});

it.each([404, 403, 500])(
	"keeps manual creation available after a GitHub %s response",
	async (status) => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response("", { status })),
		);
		const { props } = setup();
		startImport();
		await screen.findByRole("alert");
		fireEvent.change(screen.getByLabelText(/^Name/), {
			target: { value: "Manual project" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Create" }));
		await waitFor(() => expect(props.onCreate).toHaveBeenCalled());
	},
);

it("ignores a pending response after the link changes", async () => {
	let resolve!: (response: Response) => void;
	vi.stubGlobal(
		"fetch",
		vi.fn(
			() =>
				new Promise<Response>((done) => {
					resolve = done;
				}),
		),
	);
	setup();
	startImport();
	fireEvent.change(screen.getByLabelText("GitHub repository"), {
		target: { value: "github.com/owner/other" },
	});
	resolve(new Response(JSON.stringify(repository)));
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Fill from GitHub" }),
		).toBeEnabled(),
	);
	expect(screen.getByLabelText(/^Name/)).toHaveValue("");
	expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("rejects non-GitHub links without fetching", async () => {
	const fetchMock = vi.fn();
	vi.stubGlobal("fetch", fetchMock);
	setup();
	startImport("https://example.com/owner/repo");
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Enter a GitHub repository link",
	);
	expect(fetchMock).not.toHaveBeenCalled();
});
